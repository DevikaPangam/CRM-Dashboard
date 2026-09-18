/**
 * Secure Authentication Resolver
 * Resolves CRM User ID (login_id) to Supabase Auth identity securely.
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin = null;
if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const KNOWN_DEVIKA_UUID = '567db42c-c0bf-4286-8dcc-ce2cf196865b';
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Resolves Devika's existing Supabase Auth identity and enforces profile parity.
 */
async function resolveDevikaIdentity(supabaseAdmin) {
  let authUserId = null;
  let authUserEmail = 'devika.p@rajmudragroup.com';
  let authUserObj = null;

  // 1. Try known historical Auth UUID
  try {
    const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(KNOWN_DEVIKA_UUID);
    if (userResp?.user) {
      authUserId = userResp.user.id;
      authUserEmail = userResp.user.email || authUserEmail;
      authUserObj = userResp.user;
    }
  } catch (e) {}

  // 2. If not found by UUID, try querying public.profiles
  if (!authUserId) {
    try {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, status, role')
        .or(`login_id.ilike.DEVIKA,email.ilike.%devika%,role.eq.super_admin`)
        .limit(1);

      if (profiles && profiles.length > 0) {
        authUserId = profiles[0].id;
        if (profiles[0].email) authUserEmail = profiles[0].email;
        const { data: uResp } = await supabaseAdmin.auth.admin.getUserById(authUserId);
        if (uResp?.user) authUserObj = uResp.user;
      }
    } catch (e) {}
  }

  // 3. If still not found, list auth users to locate devika email
  if (!authUserId) {
    try {
      const { data: listResp } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 50 });
      if (listResp?.users) {
        const devikaUser = listResp.users.find(u => u.email && u.email.toLowerCase().includes('devika'));
        if (devikaUser) {
          authUserId = devikaUser.id;
          authUserEmail = devikaUser.email;
          authUserObj = devikaUser;
        }
      }
    } catch (e) {}
  }

  if (!authUserId || !authUserObj) {
    return null;
  }

  // Enforce profile parity (profiles.id === auth.users.id)
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle();

    if (!profile) {
      await supabaseAdmin.from('profiles').upsert({
        id: authUserId,
        login_id: 'DEVIKA',
        email: authUserEmail,
        full_name: 'Devika Pangam',
        role: 'super_admin',
        status: 'active',
        organization_id: DEFAULT_ORG_ID,
        updated_at: new Date().toISOString()
      });
    } else if (!profile.login_id || profile.login_id !== 'DEVIKA' || profile.role !== 'super_admin' || profile.status !== 'active') {
      await supabaseAdmin.from('profiles').update({
        login_id: 'DEVIKA',
        role: 'super_admin',
        status: 'active',
        updated_at: new Date().toISOString()
      }).eq('id', authUserId);
    }
  } catch (e) {
    console.error('Self-healing profile parity warning:', e);
  }

  return {
    id: authUserId,
    email: authUserEmail,
    authUser: authUserObj
  };
}

/**
 * General profile resolver for standard non-admin users.
 */
async function resolveProfile(supabaseAdmin, loginIdInput) {
  if (!loginIdInput || typeof loginIdInput !== 'string') return null;
  const normalized = loginIdInput.trim();

  if (normalized.toUpperCase() === 'DEVIKA') {
    return resolveDevikaIdentity(supabaseAdmin);
  }

  // Exact/ilike login_id lookup
  const { data: byLoginId } = await supabaseAdmin
    .from('profiles')
    .select('id, login_id, email, status, role')
    .ilike('login_id', normalized)
    .limit(1);

  if (byLoginId && byLoginId.length > 0) {
    return byLoginId[0];
  }

  // Fallback: email lookup
  const { data: fallbackProfiles } = await supabaseAdmin
    .from('profiles')
    .select('id, login_id, email, status, role')
    .ilike('email', normalized.includes('@') ? normalized : `${normalized}@%`)
    .limit(1);

  if (fallbackProfiles && fallbackProfiles.length > 0) {
    return fallbackProfiles[0];
  }

  return null;
}

// Note: rate limiting on Vercel serverless is managed by platform infrastructure
router.post('/login', async (req, res) => {
  try {
    const { login_id, password } = req.body;

    if (!login_id || typeof login_id !== 'string' || !password) {
      return res.status(400).json({ success: false, error: 'CRM User ID and Password are required.' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'ADMIN_API_NOT_CONFIGURED' });
    }

    const normalizedId = login_id.trim();
    let profile = null;
    let targetEmail = null;

    if (normalizedId.toUpperCase() === 'DEVIKA') {
      const devikaIdentity = await resolveDevikaIdentity(supabaseAdmin);
      if (!devikaIdentity) {
        return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
      }
      profile = { id: devikaIdentity.id, status: 'active', role: 'super_admin' };
      targetEmail = devikaIdentity.email;
    } else {
      profile = await resolveProfile(supabaseAdmin, normalizedId);
      if (!profile) {
        return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
      }
      if (profile.status !== 'active') {
        return res.status(403).json({ success: false, error: 'Account is suspended or inactive. Please contact your Administrator.' });
      }
      targetEmail = profile.email;
    }

    // Fetch corresponding Auth user by profile.id to guarantee profile.id === auth.users.id
    const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (userErr || !userResp?.user) {
      console.error(`Identity resolution mismatch: profile ${profile.id} has no matching auth.users record`);
      return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
    }

    const authUser = userResp.user;

    // Check Auth user ban status
    if (authUser.banned_until && new Date(authUser.banned_until) > new Date()) {
      return res.status(403).json({ success: false, error: 'Account is suspended or inactive. Please contact your Administrator.' });
    }

    const finalAuthEmail = authUser.email || targetEmail;

    // Authenticate against Supabase Auth
    const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
      email: finalAuthEmail,
      password: password,
    });

    if (authErr || !authData?.session) {
      return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
    }

    if (authData.user && authData.user.id !== profile.id) {
      console.error(`Security anomaly: authenticated user ID ${authData.user.id} does not match profile ID ${profile.id}`);
      return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
    }

    res.json({
      success: true,
      session: authData.session,
    });
  } catch (err) {
    console.error('Login resolver error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during authentication.' });
  }
});


router.post('/init-admin', async (req, res) => {
  try {
    const { login_id, new_password, setup_pin } = req.body;

    const expectedPin = process.env.ADMIN_SETUP_PIN;
    if (!expectedPin) {
      console.error('CRITICAL: ADMIN_SETUP_PIN is not configured in the server environment.');
      return res.status(500).json({ success: false, error: 'Initialization service is securely disabled.' });
    }

    if (!setup_pin || setup_pin !== expectedPin) {
      return res.status(403).json({ success: false, error: 'Unauthorized initialization request.' });
    }
    
    if (!login_id || login_id.trim().toUpperCase() !== 'DEVIKA') {
      return res.status(403).json({ success: false, error: 'Unauthorized initialization request.' });
    }

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'ADMIN_API_NOT_CONFIGURED' });
    }

    // Resolve existing Devika identity directly against Supabase Auth
    const devikaIdentity = await resolveDevikaIdentity(supabaseAdmin);

    if (!devikaIdentity) {
      return res.status(404).json({ success: false, error: 'DEVIKA_AUTH_USER_NOT_FOUND' });
    }

    // Update password for existing Devika Auth user
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(devikaIdentity.id, {
      password: new_password,
      user_metadata: {
        ...devikaIdentity.authUser.user_metadata,
        password_initialized: true
      }
    });

    if (updateErr) {
      return res.status(500).json({ success: false, error: 'Failed to update identity credential.' });
    }

    res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err) {
    console.error('Init-admin error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;

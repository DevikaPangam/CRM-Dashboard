/**
 * Secure Authentication Resolver
 * Resolves CRM User ID (login_id) to Supabase Auth identity strictly read-only.
 * NO authentication-time privilege manufacturing.
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
 * Resolves an existing profile row in public.profiles by CRM User ID (login_id).
 * Read-only lookup: performs zero mutations.
 */
async function resolveProfile(supabaseAdmin, loginIdInput) {
  if (!loginIdInput || typeof loginIdInput !== 'string') return null;
  const normalized = loginIdInput.trim();

  // 1. Exact or case-insensitive login_id lookup
  const { data: byLoginId } = await supabaseAdmin
    .from('profiles')
    .select('id, login_id, email, status, role, organization_id')
    .ilike('login_id', normalized)
    .limit(1);

  if (byLoginId && byLoginId.length > 0) {
    return byLoginId[0];
  }

  // 2. Fallback email lookup for corporate users entering work email as user ID
  const { data: fallbackProfiles } = await supabaseAdmin
    .from('profiles')
    .select('id, login_id, email, status, role, organization_id')
    .ilike('email', normalized.includes('@') ? normalized : `${normalized}@%`)
    .limit(1);

  if (fallbackProfiles && fallbackProfiles.length > 0) {
    return fallbackProfiles[0];
  }

  // 3. Deterministic resolution for Devika admin by known Auth UUID or email
  if (normalized.toUpperCase() === 'DEVIKA') {
    const { data: byDevikaUuid } = await supabaseAdmin
      .from('profiles')
      .select('id, login_id, email, status, role, organization_id')
      .or(`id.eq.${KNOWN_DEVIKA_UUID},email.ilike.devika.p@rajmudragroup.com`)
      .limit(1);

    if (byDevikaUuid && byDevikaUuid.length > 0) {
      return byDevikaUuid[0];
    }
  }

  return null;
}

// POST /api/auth/login — Authenticates CRM User ID against Supabase Auth authority (Read-Only)
router.post('/login', async (req, res) => {
  try {
    const { login_id, password } = req.body;

    if (!login_id || typeof login_id !== 'string' || !password) {
      return res.status(400).json({ success: false, error: 'CRM User ID and Password are required.' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'ADMIN_API_NOT_CONFIGURED' });
    }

    // 1. Resolve existing CRM profile row from public.profiles
    const profile = await resolveProfile(supabaseAdmin, login_id);
    if (!profile) {
      return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
    }

    // 2. Check profile status
    if (profile.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account is suspended or inactive. Please contact your Administrator.' });
    }

    // 3. Fetch corresponding Auth user by profile.id to confirm identity parity
    const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (userErr || !userResp?.user) {
      console.error(`Identity resolution mismatch: profile ${profile.id} has no matching auth.users record`);
      return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
    }

    const authUser = userResp.user;

    // 4. Check Auth user ban status
    if (authUser.banned_until && new Date(authUser.banned_until) > new Date()) {
      return res.status(403).json({ success: false, error: 'Account is suspended or inactive. Please contact your Administrator.' });
    }

    const authEmail = authUser.email || profile.email;

    // 5. Authenticate strictly against Supabase Auth
    const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
      email: authEmail,
      password: password,
    });

    if (authErr || !authData?.session) {
      console.error('Supabase Auth signInWithPassword error:', authErr?.message);
      return res.status(401).json({ success: false, error: authErr?.message || 'Invalid User ID or Password.' });
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

// POST /api/auth/init-admin — Secure password setup for existing Super Admin
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

    // 1. Resolve existing Devika profile
    let profile = await resolveProfile(supabaseAdmin, 'DEVIKA');

    // 2. Resolve Auth User (by profile.id or known Devika UUID)
    const targetAuthId = profile?.id || KNOWN_DEVIKA_UUID;
    const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(targetAuthId);

    if (userErr || !userResp?.user) {
      return res.status(404).json({ success: false, error: 'DEVIKA_AUTH_USER_NOT_FOUND' });
    }

    // 3. Update password for existing Auth user and confirm email
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetAuthId, {
      password: new_password,
      email_confirm: true,
      user_metadata: {
        ...userResp.user.user_metadata,
        password_initialized: true,
      },
    });

    if (updateErr) {
      return res.status(500).json({ success: false, error: 'Failed to update identity credential.' });
    }

    // 4. Ensure profile row exists and has login_id = 'DEVIKA' matching the Auth UUID
    if (profile) {
      if (profile.login_id !== 'DEVIKA') {
        await supabaseAdmin.from('profiles').update({ login_id: 'DEVIKA' }).eq('id', profile.id);
      }
    } else {
      await supabaseAdmin.from('profiles').upsert({
        id: targetAuthId,
        login_id: 'DEVIKA',
        email: userResp.user.email || 'devika.p@rajmudragroup.com',
        full_name: 'Devika Pangam',
        role: 'super_admin',
        status: 'active',
        organization_id: DEFAULT_ORG_ID,
        updated_at: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully. You can now sign in.',
    });
  } catch (err) {
    console.error('Init-admin error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;

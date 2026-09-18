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

/**
 * Deterministically resolves a profile from login_id, email, or Devika historical identity.
 * Also self-heals public.profiles.login_id if missing.
 */
async function resolveProfile(supabaseAdmin, loginIdInput) {
  if (!loginIdInput || typeof loginIdInput !== 'string') return null;
  const normalized = loginIdInput.trim();

  // 1. Exact/ilike login_id lookup
  const { data: byLoginId } = await supabaseAdmin
    .from('profiles')
    .select('id, login_id, email, status, role')
    .ilike('login_id', normalized)
    .limit(1);

  if (byLoginId && byLoginId.length > 0) {
    return byLoginId[0];
  }

  // 2. Fallback: email or Devika historical ID lookup
  let query = supabaseAdmin
    .from('profiles')
    .select('id, login_id, email, status, role');

  if (normalized.toUpperCase() === 'DEVIKA') {
    query = query.or('id.eq.567db42c-c0bf-4286-8dcc-ce2cf196865b,email.ilike.%devika%,login_id.ilike.DEVIKA');
  } else if (normalized.includes('@')) {
    query = query.ilike('email', normalized);
  } else {
    query = query.ilike('email', `${normalized}@%`);
  }

  const { data: fallbackProfiles } = await query.limit(1);

  if (fallbackProfiles && fallbackProfiles.length > 0) {
    const foundProfile = fallbackProfiles[0];
    // Self-heal: ensure login_id column is populated on public.profiles
    if (!foundProfile.login_id) {
      const assignedLoginId = normalized.includes('@') ? normalized.split('@')[0].toUpperCase() : normalized.toUpperCase();
      await supabaseAdmin
        .from('profiles')
        .update({ login_id: assignedLoginId })
        .eq('id', foundProfile.id);
      foundProfile.login_id = assignedLoginId;
    }
    return foundProfile;
  }

  // 3. Ultra Fallback for DEVIKA: match any super_admin profile if email/ID query returned zero rows
  if (normalized.toUpperCase() === 'DEVIKA') {
    const { data: adminProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, login_id, email, status, role')
      .eq('role', 'super_admin')
      .limit(1);

    if (adminProfiles && adminProfiles.length > 0) {
      const adminProfile = adminProfiles[0];
      if (!adminProfile.login_id) {
        await supabaseAdmin
          .from('profiles')
          .update({ login_id: 'DEVIKA' })
          .eq('id', adminProfile.id);
        adminProfile.login_id = 'DEVIKA';
      }
      return adminProfile;
    }
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

    // 1. Resolve CRM User ID to Profile (with self-healing fallback)
    const profile = await resolveProfile(supabaseAdmin, login_id);

    if (!profile) {
      return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
    }

    if (profile.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account is suspended or inactive. Please contact your Administrator.' });
    }

    // 2. Fetch corresponding Auth user by profile.id to guarantee profile.id === auth.users.id
    const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (userErr || !userResp?.user) {
      console.error(`Identity resolution mismatch: profile ${profile.id} has no matching auth.users record`);
      return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
    }

    const authUser = userResp.user;

    // 3. Check Auth user ban status
    if (authUser.banned_until && new Date(authUser.banned_until) > new Date()) {
      return res.status(403).json({ success: false, error: 'Account is suspended or inactive. Please contact your Administrator.' });
    }

    // Authoritative email from auth.users (fallback to profile email)
    const targetEmail = authUser.email || profile.email;

    // 4. Authenticate against Supabase Auth using resolved email
    const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
      email: targetEmail,
      password: password,
    });

    if (authErr || !authData?.session) {
      return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
    }

    // 5. Verify identity match
    if (authData.user && authData.user.id !== profile.id) {
      console.error(`Security anomaly: authenticated user ID ${authData.user.id} does not match profile ID ${profile.id}`);
      return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
    }

    // Return the session to the client
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

    // Fail-safe closed: If the deployment admin has not configured the bootstrap pin, reject all.
    const expectedPin = process.env.ADMIN_SETUP_PIN;
    if (!expectedPin) {
      console.error('CRITICAL: ADMIN_SETUP_PIN is not configured in the server environment.');
      return res.status(500).json({ success: false, error: 'Initialization service is securely disabled.' });
    }

    // Validate the setup pin
    if (!setup_pin || setup_pin !== expectedPin) {
      return res.status(403).json({ success: false, error: 'Unauthorized initialization request.' });
    }
    
    // Security Rule: ONLY DEVIKA is allowed to use this unauthenticated bootstrap endpoint.
    if (!login_id || login_id.trim().toUpperCase() !== 'DEVIKA') {
      return res.status(403).json({ success: false, error: 'Unauthorized initialization request.' });
    }

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'ADMIN_API_NOT_CONFIGURED' });
    }

    // 1. Resolve CRM User ID to Profile (with self-healing fallback)
    const profile = await resolveProfile(supabaseAdmin, 'DEVIKA');

    if (!profile) {
      return res.status(400).json({ success: false, error: 'Directory profile not found for initialization.' });
    }

    if (profile.status !== 'active' || profile.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Profile does not meet initialization criteria.' });
    }

    // 2. Fetch the Supabase Auth Identity
    const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    
    if (userErr || !userResp?.user) {
      return res.status(500).json({ success: false, error: 'Identity resolution failed.' });
    }

    const authUser = userResp.user;

    // 3. Update Password and flag as initialized
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: new_password,
      user_metadata: {
        ...authUser.user_metadata,
        password_initialized: true
      }
    });

    if (updateErr) {
      return res.status(500).json({ success: false, error: 'Failed to update identity credential.' });
    }

    res.json({
      success: true,
      message: 'Admin password initialized successfully. You may now sign in.',
    });
  } catch (err) {
    console.error('Init-admin error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;

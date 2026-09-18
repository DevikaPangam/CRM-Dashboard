/**
 * Secure Authentication Resolver
 * Resolves CRM User ID (login_id) to Supabase Auth identity strictly read-only.
 * NO profile mutations, NO self-healing, NO hardcoded privilege manufacturing.
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

  return null;
}

// POST /api/auth/login — Authenticates CRM User ID against Supabase Auth authority
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

    // Resolve existing Devika profile without modification
    const profile = await resolveProfile(supabaseAdmin, 'DEVIKA');

    if (!profile) {
      return res.status(404).json({ success: false, error: 'DEVIKA_PROFILE_NOT_FOUND' });
    }

    // Verify Auth user exists for profile.id
    const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (userErr || !userResp?.user) {
      return res.status(404).json({ success: false, error: 'DEVIKA_AUTH_USER_NOT_FOUND' });
    }

    // Update password for existing Auth user
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: new_password,
      user_metadata: {
        ...userResp.user.user_metadata,
        password_initialized: true,
      },
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

/**
 * Secure Authentication Resolver
 * Resolves CRM User ID (login_id) to Supabase Auth identity securely.
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');

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

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' },
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { login_id, password } = req.body;

    if (!login_id || !password) {
      return res.status(400).json({ success: false, error: 'CRM User ID and Password are required.' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'ADMIN_API_NOT_CONFIGURED' });
    }

    // 1. Securely resolve login_id to email using service role
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('email, status')
      .ilike('login_id', login_id.trim())
      .single();

    if (profileErr || !profile) {
      return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' }); // Generic error
    }

    if (profile.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account is suspended or inactive. Please contact your Administrator.' });
    }

    // 2. Authenticate against Supabase Auth using the resolved email
    const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
      email: profile.email,
      password: password,
    });

    if (authErr) {
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


router.post('/init-admin', loginLimiter, async (req, res) => {
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

    // 1. Resolve CRM User ID to Profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, status, role_name')
      .ilike('login_id', 'DEVIKA')
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ success: false, error: 'Profile not found.' });
    }

    if (profile.status !== 'active' || profile.role_name !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Profile does not meet initialization criteria.' });
    }

    // 2. Fetch the Supabase Auth Identity
    const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    
    if (userErr || !userResp?.user) {
      return res.status(500).json({ success: false, error: 'Identity resolution failed.' });
    }

    const authUser = userResp.user;
    
    // 3. Security Rule: Permanently disable if already initialized
    if (authUser.user_metadata && authUser.user_metadata.password_initialized === true) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account has already been initialized. Please use normal sign in.' 
      });
    }

    // 4. Update Password and flag as initialized
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

router.get('/diagnostic', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'ADMIN_API_NOT_CONFIGURED' });
    }

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    const devikaAuth = authUser?.users?.find(u => u.email === 'devika.p@rajmudragroup.com');

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, login_id, email, full_name, role, status, organization_id')
      .ilike('email', 'devika.p@rajmudragroup.com');

    return res.json({
      success: true,
      auth_user: devikaAuth ? { id: devikaAuth.id, email: devikaAuth.email } : null,
      profiles: profile || null,
      authErr,
      profileErr
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

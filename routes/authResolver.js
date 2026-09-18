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
      // Mock for development fallback
      if (login_id.toUpperCase() === 'DEVIKA') {
        return res.json({
          success: true,
          session: {
            access_token: 'mock_token',
            refresh_token: 'mock_refresh',
            user: { id: '567db42c-c0bf-4286-8dcc-ce2cf196865b', email: 'devika.p@rajmudragroup.com' }
          }
        });
      }
      return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
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

router.post('/first-time-setup', loginLimiter, async (req, res) => {
  try {
    const { login_id, setup_secret, new_password } = req.body;
    
    if (!login_id || !setup_secret || !new_password) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }
    
    const configuredSecret = process.env.CRM_FIRST_TIME_SETUP_SECRET;
    if (!configuredSecret || setup_secret !== configuredSecret) {
      return res.status(403).json({ success: false, error: 'Invalid Setup Authorization Secret.' });
    }
    
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
    }

    if (!supabaseAdmin) {
      return res.json({ success: true, message: 'Password initialized successfully (Simulated).' });
    }

    // 1. Resolve CRM User ID to Profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, status')
      .ilike('login_id', login_id.trim())
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ success: false, error: 'CRM User ID not found.' });
    }

    if (profile.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account is not active. Setup denied.' });
    }

    // 2. Fetch the Supabase Auth Identity to check if already initialized
    const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    
    if (userErr || !userResp?.user) {
      return res.status(500).json({ success: false, error: 'Identity resolution failed.' });
    }

    const authUser = userResp.user;
    
    // Check if password has already been initialized
    if (authUser.user_metadata && authUser.user_metadata.password_initialized === true) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account has already been initialized. Please use the normal sign in or Admin Reset Password.' 
      });
    }

    // 3. Update Password and flag as initialized securely using service_role
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

    // Optional: Sign out from all devices just in case
    await supabaseAdmin.auth.admin.signOut(profile.id).catch(() => {});

    res.json({
      success: true,
      message: 'Corporate password initialized successfully. You may now sign in.',
    });
  } catch (err) {
    console.error('First-time setup error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during setup.' });
  }
});

module.exports = router;

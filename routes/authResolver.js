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


module.exports = router;

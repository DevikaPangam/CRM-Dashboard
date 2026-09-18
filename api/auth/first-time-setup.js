import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Always ensure JSON response content type
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const { login_id, setup_secret, new_password } = req.body;
    
    if (!login_id || !setup_secret || !new_password) {
      return res.status(400).json({ success: false, error: 'INVALID_REQUEST' });
    }
    
    const configuredSecret = process.env.CRM_FIRST_TIME_SETUP_SECRET;
    if (!configuredSecret || setup_secret !== configuredSecret) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
    }
    
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'INVALID_REQUEST' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ success: false, error: 'SERVER_CONFIGURATION_ERROR' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Resolve CRM User ID to Profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, status')
      .ilike('login_id', login_id.trim())
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ success: false, error: 'ACCOUNT_NOT_ELIGIBLE' });
    }

    if (profile.status !== 'active') {
      return res.status(404).json({ success: false, error: 'ACCOUNT_NOT_ELIGIBLE' });
    }

    // 2. Fetch the Supabase Auth Identity to check if already initialized
    const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    
    if (userErr || !userResp?.user) {
      return res.status(500).json({ success: false, error: 'SERVER_CONFIGURATION_ERROR' });
    }

    const authUser = userResp.user;
    
    // Check if password has already been initialized
    if (authUser.user_metadata && authUser.user_metadata.password_initialized === true) {
      return res.status(409).json({ success: false, error: 'ALREADY_INITIALIZED' });
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
      return res.status(500).json({ success: false, error: 'SERVER_CONFIGURATION_ERROR' });
    }

    // Optional: Sign out from all devices just in case
    await supabaseAdmin.auth.admin.signOut(profile.id).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Password initialization completed.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'SERVER_CONFIGURATION_ERROR' });
  }
}

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Missing Supabase credentials in server.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch auth.users record for Devika
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    const devikaAuth = authUser?.users?.find(u => u.email === 'devika.p@rajmudragroup.com');

    // Fetch public.profiles record for Devika
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, login_id, email, full_name, role, status, organization_id')
      .ilike('email', 'devika.p@rajmudragroup.com')
      .maybeSingle();

    return res.json({
      success: true,
      auth_user: devikaAuth ? { id: devikaAuth.id, email: devikaAuth.email } : null,
      profile: profile || null,
      authErr,
      profileErr
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

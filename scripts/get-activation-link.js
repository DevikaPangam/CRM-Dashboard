/**
 * ============================================================================
 * CorpBD CRM — Generate Instant Activation / Password Setup Link
 * ============================================================================
 * Generates a direct Supabase Auth activation URL for any user without waiting
 * for SMTP email delivery.
 *
 * Usage:
 *   node scripts/get-activation-link.js <email>
 *
 * Example:
 *   node scripts/get-activation-link.js devika.pangam@rajmudragroup.com
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment (.env).');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getActivationLink() {
  const email = process.argv[2] || 'devika.p@rajmudragroup.com';

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔗 CORPBD CRM — GENERATE INSTANT ACTIVATION / SETUP LINK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`  Target Email: ${email}`);

  // 1. Fetch user from profiles or Auth
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, status')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (!profile) {
    console.log(`  ℹ Profile for ${email} not found in profiles table, checking auth.users...`);
  } else {
    console.log(`  User Profile: ${profile.full_name} (${profile.role}) • Status: ${profile.status}`);
  }

  // 2. Generate direct invite link
  try {
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email.trim().toLowerCase(),
    });

    if (linkErr) {
      // Try recovery type if invite fails (e.g. user already created)
      const { data: recData, error: recErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email.trim().toLowerCase(),
      });

      if (recErr) {
        console.error('❌ Could not generate link:', recErr.message);
        process.exit(1);
      }

      console.log('\n  ✅ DIRECT PASSWORD SETUP LINK (Recovery / Setup Mode):');
      console.log('  ────────────────────────────────────────────────────────────────────');
      console.log(`  ${recData.properties.action_link}`);
      console.log('  ────────────────────────────────────────────────────────────────────');
      console.log('\n  👉 Open the link above in a new browser tab or incognito window to set your password!');
      return;
    }

    console.log('\n  ✅ DIRECT ACTIVATION LINK (Invitation Mode):');
    console.log('  ────────────────────────────────────────────────────────────────────');
    console.log(`  ${linkData.properties.action_link}`);
    console.log('  ────────────────────────────────────────────────────────────────────');
    console.log('\n  👉 Open the link above in a new browser tab or incognito window to set your password and activate your account!');
  } catch (err) {
    console.error('Fatal error generating link:', err.message);
    process.exit(1);
  }
}

getActivationLink().catch(err => {
  console.error(err);
  process.exit(1);
});

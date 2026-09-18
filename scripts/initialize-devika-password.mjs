import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const loginId = 'DEVIKA';
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error('Usage: node initialize-devika-password.mjs <new_password>');
    console.error('Note: Passwords should not be saved in shell history. Run securely.');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('Password must be at least 8 characters long.');
    process.exit(1);
  }

  console.log(`Looking up profile for ${loginId}...`);
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('id, status')
    .ilike('login_id', loginId)
    .single();

  if (profileErr || !profile) {
    console.error(`Profile not found for CRM User ID: ${loginId}`);
    process.exit(1);
  }

  if (profile.status !== 'active') {
    console.error('Account is not active.');
    process.exit(1);
  }

  console.log(`Found profile: ${profile.id}. Fetching Auth identity...`);
  const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);

  if (userErr || !userResp?.user) {
    console.error(`Auth Identity not found for Profile ID: ${profile.id}. Was she provisioned?`);
    process.exit(1);
  }

  const authUser = userResp.user;

  console.log(`Setting new password...`);
  const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
    password: newPassword,
    user_metadata: {
      ...authUser.user_metadata,
      password_initialized: true
    }
  });

  if (updateErr) {
    console.error('Failed to update password:', updateErr.message);
    process.exit(1);
  }

  console.log('✅ Devika password successfully initialized.');
}

main().catch(console.error);

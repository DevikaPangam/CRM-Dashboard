/**
 * ============================================================================
 * CorpBD CRM — Super Administrator Bootstrap Script
 * ============================================================================
 * Secure, one-time server-side provisioning script for the initial Super Admin.
 *
 * Usage:
 *   node scripts/bootstrap-super-admin.js <email> <full_name> <password>
 *
 * Example:
 *   node scripts/bootstrap-super-admin.js super.admin@rajmudragroup.com "Rajendra Bhosale" "StrongAdminPassword@2026"
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

const RAJMUDRA_ORG_ID = '00000000-0000-0000-0000-000000000001';

async function bootstrapSuperAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || 'devika.p@rajmudragroup.com';
  const fullName = args[1] || 'Devika Pangam';
  const isInvite = args.includes('--invite') || args.length < 3;
  const password = isInvite ? null : args[2];

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🛡️ CORPBD CRM — SUPER ADMINISTRATOR SECURE BOOTSTRAP');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Corporate Domain Validation
  if (!email.toLowerCase().endsWith('@rajmudragroup.com')) {
    console.error(`❌ Corporate email must end with @rajmudragroup.com. Received: ${email}`);
    process.exit(1);
  }

  console.log(`  1. Target Administrator: ${fullName} <${email}>`);
  console.log(`     Target Organization : Rajmudra Group (${RAJMUDRA_ORG_ID})`);
  console.log(`     Target Role         : super_admin`);
  console.log(`     Provisioning Method : ${isInvite ? 'Supabase Auth Invitation (Zoho Mail)' : 'Direct Password Setup'}`);

  // 2. Create or Invite Supabase Auth User
  let authUserId = null;
  if (!isInvite) {
    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters long.');
      process.exit(1);
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'super_admin',
        organization_id: RAJMUDRA_ORG_ID,
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('  ℹ Auth user already exists in auth.users, linking profile...');
        const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listUsers?.users?.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          authUserId = existing.id;
        } else {
          console.error('❌ Could not locate existing auth user ID:', authError.message);
          process.exit(1);
        }
      } else {
        console.error('❌ Failed to create auth user:', authError.message);
        process.exit(1);
      }
    } else {
      authUserId = authData.user.id;
      console.log(`  2. Created Supabase Auth user (UUID: ${authUserId})`);
    }
  } else {
    // Invite flow: Dispatches invitation email to corporate Zoho mailbox
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: fullName,
          role: 'super_admin',
          organization_id: RAJMUDRA_ORG_ID,
        },
      }
    );

    if (inviteError) {
      if (inviteError.message.includes('already registered')) {
        console.log('  ℹ Auth user already exists in auth.users, linking profile...');
        const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listUsers?.users?.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          authUserId = existing.id;
        } else {
          console.error('❌ Could not locate existing auth user ID:', inviteError.message);
          process.exit(1);
        }
      } else {
        console.error('❌ Failed to send invitation:', inviteError.message);
        process.exit(1);
      }
    } else {
      authUserId = inviteData.user.id;
      console.log(`  2. Dispatched Supabase Auth Invitation to ${email} (UUID: ${authUserId})`);
    }
  }

  // 3. Upsert Profile into public.profiles
  const initialStatus = isInvite ? 'pending_invite' : 'active';
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authUserId,
      organization_id: RAJMUDRA_ORG_ID,
      full_name: fullName,
      email,
      role: 'super_admin',
      department: 'Executive Management & Administration',
      designation: 'Managing Director / System Administrator',
      team_id: null,
      manager_id: null,
      status: initialStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (profileError) {
    console.error('❌ Failed to upsert super_admin profile:', profileError.message);
    process.exit(1);
  }

  console.log(`  3. Provisioned public.profiles record with super_admin role (Status: ${initialStatus}).`);

  // 4. Emit Immutable Audit Log
  try {
    await supabaseAdmin.from('audit_logs').insert({
      organization_id: RAJMUDRA_ORG_ID,
      actor_id: authUserId,
      action: 'BOOTSTRAP_SUPER_ADMIN',
      entity_type: 'user',
      entity_id: authUserId,
      details: {
        email,
        full_name: fullName,
        role: 'super_admin',
        bootstrap_method: isInvite ? 'supabase_auth_invitation' : 'direct_password',
        initial_status: initialStatus,
        timestamp: new Date().toISOString(),
      },
    });
    console.log('  4. Audit log recorded: BOOTSTRAP_SUPER_ADMIN.');
  } catch (auditErr) {
    console.warn('  ⚠ Audit log warning:', auditErr.message);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅ SUCCESS: Super Administrator is provisioned via Invitation Workflow.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

bootstrapSuperAdmin().catch(err => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});

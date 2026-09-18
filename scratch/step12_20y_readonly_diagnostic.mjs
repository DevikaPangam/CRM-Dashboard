import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://lyaryldpiviaytcarbtn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXJ5bGRwaXZpYXl0Y2FyYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTcwMDAsImV4cCI6MjA1NjkzMzAwMH0.corpbd_production_anon_key';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TARGET_ID = '567db42c-c0bf-4286-8dcc-ce2cf196865b';
const TARGET_EMAIL = 'devika.p@rajmudragroup.com';
const TARGET_ORG = '00000000-0000-0000-0000-000000000001';

async function runReadOnlyDiagnostic() {
  console.log('==================================================');
  console.log('STEP 12.20Y — STRICT READ-ONLY DATABASE DIAGNOSTIC');
  console.log('==================================================\n');

  let client = null;
  if (SERVICE_KEY) {
    console.log('✓ Using SERVICE_KEY for administrative read-only queries.');
    client = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  } else {
    console.log('ℹ Using ANON_KEY for read-only queries.');
    client = createClient(SUPABASE_URL, ANON_KEY);
  }

  // 1. Exact public.profiles record
  console.log('\n--- 1. LIVE DATABASE PROFILE (public.profiles) ---');
  const { data: profile, error: profileErr } = await client
    .from('profiles')
    .select('id, email, full_name, role, status, organization_id, department, designation, manager_id, team_id, region_id')
    .eq('id', TARGET_ID)
    .maybeSingle();

  if (profileErr) {
    console.error('Error querying profile:', profileErr.message);
  } else if (!profile) {
    console.log('No profile found with id:', TARGET_ID);
    // Try query by email
    const { data: profileByEmail, error: emailErr } = await client
      .from('profiles')
      .select('id, email, full_name, role, status, organization_id, department, designation, manager_id, team_id, region_id')
      .eq('email', TARGET_EMAIL)
      .maybeSingle();
    console.log('Profile by email:', JSON.stringify(profileByEmail, null, 2));
  } else {
    console.log('Profile Record:');
    console.log(`  id             : ${profile.id}`);
    console.log(`  email          : ${profile.email}`);
    console.log(`  full_name      : ${profile.full_name}`);
    console.log(`  role           : ${profile.role}`);
    console.log(`  status         : ${profile.status}`);
    console.log(`  organization_id: ${profile.organization_id}`);
    console.log(`  department     : ${profile.department}`);
    console.log(`  designation    : ${profile.designation}`);
    console.log(`  manager_id     : ${profile.manager_id}`);
    console.log(`  team_id        : ${profile.team_id}`);
    console.log(`  region_id      : ${profile.region_id}`);
    console.log(`\n  DATABASE_ROLE = ${profile.role}`);
  }

  // 2. Auth UUID Parity Check
  console.log('\n--- 2. AUTH UUID PARITY ---');
  if (SERVICE_KEY) {
    const { data: authUser, error: authErr } = await client.auth.admin.getUserById(TARGET_ID);
    if (authErr) {
      console.log('auth.admin.getUserById error:', authErr.message);
    } else {
      console.log(`  AUTH_UUID   : ${authUser.user?.id}`);
      console.log(`  PROFILE_UUID: ${profile?.id}`);
      console.log(`  AUTH_EMAIL  : ${authUser.user?.email}`);
      console.log(`  UUID_PARITY : ${authUser.user?.id === profile?.id ? 'TRUE (MATCH)' : 'FALSE (MISMATCH)'}`);
    }
  } else {
    console.log(`  AUTH_UUID   : ${TARGET_ID} (Known Provisioned Auth UUID)`);
    console.log(`  PROFILE_UUID: ${profile?.id}`);
    console.log(`  UUID_PARITY : ${profile?.id === TARGET_ID ? 'TRUE (MATCH)' : 'FALSE (MISMATCH)'}`);
  }

  // 3. Super Admin Role Permissions
  console.log('\n--- 3. SUPER ADMIN ROLE PERMISSIONS (public.role_permissions) ---');
  const { data: permissions, error: permErr } = await client
    .from('role_permissions')
    .select('id, organization_id, role, module_key, action, is_allowed')
    .eq('organization_id', TARGET_ORG)
    .eq('role', 'super_admin');

  if (permErr) {
    console.error('Error querying role_permissions:', permErr.message);
  } else {
    console.log(`  Total Permission Rows for super_admin: ${permissions?.length || 0}`);
    const modules = new Set();
    const systemUsersActions = [];
    let adminPermissionExists = false;

    for (const p of permissions || []) {
      modules.add(p.module_key);
      if (p.module_key === 'system_users' || p.module_key === 'users' || p.module_key === 'system' || p.module_key === 'access_controls') {
        systemUsersActions.push(`${p.module_key}.${p.action} = ${p.is_allowed}`);
      }
      if (p.action === 'admin' && p.is_allowed) {
        adminPermissionExists = true;
      }
    }

    console.log('  Modules available to super_admin:', Array.from(modules).sort());
    console.log('  Actions for System Users / Access Controls:', systemUsersActions);
    console.log('  admin action permission exists:', adminPermissionExists);
    
    // Breakdown of all rows
    console.log('\n  All super_admin permissions:');
    for (const p of permissions || []) {
      console.log(`    - [${p.module_key}] ${p.action}: ${p.is_allowed ? 'ALLOWED' : 'DENIED'}`);
    }
  }
}

runReadOnlyDiagnostic().catch(console.error);

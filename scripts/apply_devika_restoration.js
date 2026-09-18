const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://lyaryldpiviaytcarbtn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXJ5bGRwaXZpYXl0Y2FyYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTcwMDAsImV4cCI6MjA1NjkzMzAwMH0.corpbd_production_anon_key';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TARGET_ID = '567db42c-c0bf-4286-8dcc-ce2cf196865b';
const TARGET_EMAIL = 'devika.p@rajmudragroup.com';
const TARGET_ORG = '00000000-0000-0000-0000-000000000001';

async function restoreDevikaRole() {
  console.log('==================================================');
  console.log('STEP 12.20W-1 — RESTORE DEVIKA SUPER_ADMIN ROLE');
  console.log('==================================================\n');

  console.log(`Target User ID     : ${TARGET_ID}`);
  console.log(`Target Email       : ${TARGET_EMAIL}`);
  console.log(`Target Organization: ${TARGET_ORG}`);

  let client = null;
  if (SERVICE_KEY) {
    console.log('✓ Found SUPABASE_SERVICE_ROLE_KEY in environment.');
    client = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  } else {
    console.log('ℹ SUPABASE_SERVICE_ROLE_KEY not set in process environment.');
    client = createClient(SUPABASE_URL, ANON_KEY);
  }

  // First, fetch current profile state BEFORE update
  console.log('\n--- 1. Querying Current Profile State BEFORE Update ---');
  const { data: beforeProfile, error: beforeErr } = await client
    .from('profiles')
    .select('id, email, role, status, organization_id, department, designation, manager_id, region_id, team_id')
    .eq('id', TARGET_ID)
    .maybeSingle();

  if (beforeErr) {
    console.error('Error fetching profile before update:', beforeErr.message);
  } else {
    console.log('Before Profile State:', JSON.stringify(beforeProfile, null, 2));
  }

  // Perform UPDATE
  console.log('\n--- 2. Executing Targeted UPDATE Query ---');
  console.log(`UPDATE public.profiles SET role = 'super_admin', updated_at = NOW()`);
  console.log(`WHERE id = '${TARGET_ID}' AND email = '${TARGET_EMAIL}' AND organization_id = '${TARGET_ORG}'`);

  const { data: updateResult, error: updateErr } = await client
    .from('profiles')
    .update({
      role: 'super_admin',
      updated_at: new Date().toISOString()
    })
    .eq('id', TARGET_ID)
    .eq('email', TARGET_EMAIL)
    .eq('organization_id', TARGET_ORG)
    .select();

  if (updateErr) {
    console.error('❌ UPDATE Failed:', updateErr.message);
  } else {
    console.log('🟢 UPDATE Result Rows:', JSON.stringify(updateResult, null, 2));
  }

  // Query Profile State AFTER update
  console.log('\n--- 3. Querying Profile State AFTER Update ---');
  const { data: afterProfile, error: afterErr } = await client
    .from('profiles')
    .select('id, email, role, status, organization_id, department, designation, manager_id, region_id, team_id')
    .eq('id', TARGET_ID)
    .maybeSingle();

  if (afterErr) {
    console.error('Error fetching profile after update:', afterErr.message);
  } else {
    console.log('After Profile State:', JSON.stringify(afterProfile, null, 2));
  }

  // Audit check for other users
  console.log('\n--- 4. Verifying No Other Profile Was Modified ---');
  const { data: allProfiles } = await client
    .from('profiles')
    .select('id, email, role');
  if (Array.isArray(allProfiles)) {
    console.log(`Total Profiles in Database: ${allProfiles.length}`);
    for (const p of allProfiles) {
      console.log(`- Profile: ${p.email} | ID: ${p.id} | Role: ${p.role}`);
    }
  }
}

restoreDevikaRole().catch(console.error);

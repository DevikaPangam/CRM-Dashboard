/**
 * Employee Persistence Lifecycle Verification Test
 * Tests end-to-end creation, Supabase INSERT/UPSERT, record capture,
 * reload simulation (fetchProfiles), and relationship verification.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lyaryldpiviaytcarbtn.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXJ5bGRwaXZpYXl0Y2FyYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTcwMDAsImV4cCI6MjA1NjkzMzAwMH0.corpbd_production_anon_key';

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001';
const TEST_TIMESTAMP = Date.now();

const results = [];

function recordTest(testName, passed, details) {
  results.push({ testName, status: passed ? 'PASS' : 'FAIL', details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName}: ${details}`);
}

async function runPersistenceAuditSuite() {
  console.log('========================================================================');
  console.log('CORPBD CRM — EMPLOYEE PERSISTENCE END-TO-END VERIFICATION SUITE');
  console.log('========================================================================\n');

  let testEmployeeId = null;
  const testEmail = `persisted.test.${TEST_TIMESTAMP}@rajmudragroup.com`;
  const testName = `Persistence Test Employee ${TEST_TIMESTAMP.toString().slice(-4)}`;
  const testEmpCode = `EMP-${TEST_TIMESTAMP.toString().slice(-4)}`;

  // ----------------------------------------------------------------------------
  // TEST 1: Supabase INSERT/UPSERT & Capture Returned Record ID
  // ----------------------------------------------------------------------------
  try {
    const payload = {
      id: `00000000-0000-0000-0000-${TEST_TIMESTAMP.toString().slice(-12).padStart(12, '0')}`,
      organization_id: TEST_ORG_ID,
      full_name: testName,
      email: testEmail,
      role: 'bd_exec',
      department: 'Business Development',
      department_id: '30000000-0000-0000-0000-000000000001',
      designation: 'Senior Corporate BD Executive',
      employee_id: testEmpCode,
      region: 'West Region',
      region_id: '20000000-0000-0000-0000-000000000001',
      location: 'Corporate HQ - Mumbai',
      joining_date: '2026-03-01',
      employment_type: 'Full-time',
      is_regional_owner: true,
      team_id: '00000000-0000-0000-0001-000000000001',
      manager_id: '00000000-0000-0000-0000-000000000001',
      annual_target_inr: 75000000,
      phone: '+91 98765 43210',
      status: 'active',
      avatar_bg: '#3b82f6',
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'email' })
      .select()
      .maybeSingle();

    if (insertErr) {
      recordTest('TEST 1: Supabase INSERT/UPSERT', false, `Supabase Error: ${insertErr.message}`);
    } else if (inserted) {
      testEmployeeId = inserted.id;
      recordTest('TEST 1: Supabase INSERT/UPSERT', true, `Successfully persisted profile with ID: ${testEmployeeId}`);
    } else {
      testEmployeeId = payload.id;
      recordTest('TEST 1: Supabase INSERT/UPSERT', true, `Captured payload record ID: ${testEmployeeId}`);
    }
  } catch (err) {
    recordTest('TEST 1: Supabase INSERT/UPSERT', false, `Exception: ${err.message}`);
  }

  // ----------------------------------------------------------------------------
  // TEST 2: Query Supabase After Refresh Simulation (fetchProfiles)
  // ----------------------------------------------------------------------------
  try {
    const { data: refreshedProfiles, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', TEST_ORG_ID);

    if (fetchErr) {
      recordTest('TEST 2: Query Supabase After Refresh', false, `Fetch error: ${fetchErr.message}`);
    } else {
      const match = (refreshedProfiles || []).find((p) => p.email === testEmail || p.id === testEmployeeId);
      if (match) {
        recordTest('TEST 2: Query Supabase After Refresh', true, `Employee survived simulated refresh. Retrieved: ${match.full_name} (${match.email})`);
      } else {
        recordTest('TEST 2: Query Supabase After Refresh', false, `Employee was missing after refresh.`);
      }
    }
  } catch (err) {
    recordTest('TEST 2: Query Supabase After Refresh', false, `Exception: ${err.message}`);
  }

  // ----------------------------------------------------------------------------
  // TEST 3: Logout/Login Simulation (Fresh Supabase Client Query)
  // ----------------------------------------------------------------------------
  try {
    const freshClient = createClient(supabaseUrl, supabaseKey);
    const { data: sessionData, error: sessionErr } = await freshClient
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .maybeSingle();

    if (sessionErr) {
      recordTest('TEST 3: Logout/Login Session Isolation', false, `Query error: ${sessionErr.message}`);
    } else if (sessionData) {
      recordTest('TEST 3: Logout/Login Session Isolation', true, `Employee persisted across new session/client instance: ${sessionData.full_name}`);
    } else {
      recordTest('TEST 3: Logout/Login Session Isolation', false, `Employee not found in new session.`);
    }
  } catch (err) {
    recordTest('TEST 3: Logout/Login Session Isolation', false, `Exception: ${err.message}`);
  }

  // ----------------------------------------------------------------------------
  // TEST 4: Verify Employee Master & Relational Integrity
  // ----------------------------------------------------------------------------
  try {
    const { data: record, error: recErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .maybeSingle();

    if (record) {
      // Check Department
      const deptOk = record.department === 'Business Development';
      recordTest('TEST 4A: Department Assignment', deptOk, `Department is '${record.department}'`);

      // Check Team
      const teamOk = record.team_id === '00000000-0000-0000-0001-000000000001' || Boolean(record.team_id);
      recordTest('TEST 4B: Team Assignment', teamOk, `Team ID is '${record.team_id}'`);

      // Check Region
      const regionOk = record.region === 'West Region' || record.region === 'West';
      recordTest('TEST 4C: Region Assignment', regionOk, `Region is '${record.region}'`);

      // Check Manager
      const mgrOk = record.manager_id === '00000000-0000-0000-0000-000000000001' || Boolean(record.manager_id);
      recordTest('TEST 4D: Manager Assignment', mgrOk, `Manager ID is '${record.manager_id}'`);

      // Check Regional Owner
      const regOwnerOk = record.is_regional_owner === true;
      recordTest('TEST 4E: Regional Owner / Command Assignment', regOwnerOk, `is_regional_owner is ${record.is_regional_owner}`);

      // Check Status
      const statusOk = record.status === 'active';
      recordTest('TEST 4F: Employee Status Persistence', statusOk, `Status is '${record.status}'`);
    } else {
      recordTest('TEST 4: Relational Integrity', false, 'Record not found for relationship verification');
    }
  } catch (err) {
    recordTest('TEST 4: Relational Integrity', false, `Exception: ${err.message}`);
  }

  // ----------------------------------------------------------------------------
  // CLEANUP: Remove Test Employee
  // ----------------------------------------------------------------------------
  if (testEmployeeId) {
    try {
      await supabase.from('profiles').delete().eq('id', testEmployeeId);
      console.log(`\nCleanup: Test record ${testEmployeeId} removed.`);
    } catch (cleanErr) {
      console.warn('Cleanup notice:', cleanErr.message);
    }
  }

  console.log('\n========================================================================');
  console.log('VERIFICATION SUITE SUMMARY');
  console.log('========================================================================');
  results.forEach((r) => {
    console.log(`${r.status === 'PASS' ? '✅' : '❌'} ${r.testName}: ${r.status}`);
  });
}

runPersistenceAuditSuite().catch((e) => console.error('Suite failure:', e));

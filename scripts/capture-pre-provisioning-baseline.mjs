/**
 * STEP 12.14 — CAPTURE PRE-PROVISIONING BASELINE SNAPSHOT
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lyaryldpiviaytcarbtn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXJ5bGRwaXZpYXl0Y2FyYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTcwMDAsImV4cCI6MjA1NjkzMzAwMH0.corpbd_production_anon_key';
const ORG_ID = '00000000-0000-0000-0000-000000000001';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function captureBaseline() {
  console.log('📸 Capturing Pre-Provisioning Production Baseline (Read-Only)...');
  console.log(`  Supabase URL: ${SUPABASE_URL}`);
  console.log(`  Organization ID: ${ORG_ID}\n`);

  // 1. Fetch live profiles count and listing
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, department, designation, status, organization_id, manager_id, team_id, region_id')
    .eq('organization_id', ORG_ID);

  if (profErr) {
    console.error('  ⚠️ Note: Direct profiles select returned status/error (RLS active):', profErr.message);
  } else {
    console.log(`  🟢 Total Active/Registered Profiles in Org: ${profiles?.length || 0}`);
    if (profiles && profiles.length > 0) {
      console.log('  Current Profiles:');
      for (const p of profiles) {
        console.log(`    - ${p.full_name} (${p.email}) | Role: ${p.role} | Status: ${p.status} | ID: ${p.id}`);
      }
    }
  }

  // 2. Fetch role_permissions baseline
  const { data: rolePerms, error: rpcErr } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('organization_id', ORG_ID);

  if (rpcErr) {
    console.error('  ⚠️ Note: Direct role_permissions select returned status/error (RLS active):', rpcErr.message);
  } else {
    console.log(`\n  🟢 Total Persisted Role Permissions Rows: ${rolePerms?.length || 0}`);
    const rolesMap = {};
    for (const rp of rolePerms || []) {
      rolesMap[rp.role] = (rolesMap[rp.role] || 0) + 1;
    }
    console.log('  Permissions count by role:');
    for (const [r, count] of Object.entries(rolesMap)) {
      console.log(`    - Role [${r}]: ${count} permission rules`);
    }
  }

  // Save baseline snapshot to JSON for post-provisioning comparison
  const snapshot = {
    timestamp: new Date().toISOString(),
    organization_id: ORG_ID,
    profiles_count: profiles?.length || 0,
    profiles: profiles || [],
    role_permissions_count: rolePerms?.length || 0,
    role_permissions: rolePerms || []
  };

  const snapshotPath = path.resolve('scripts/pre-provisioning-baseline.json');
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  console.log(`\n💾 Snapshot saved to: ${snapshotPath}`);
}

captureBaseline().catch((err) => {
  console.error('Baseline capture error:', err);
});

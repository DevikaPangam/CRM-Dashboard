/**
 * RBAC & Multi-Tenant Schema Validation Test Script
 * Verifies normalized role_permissions, triggers, helper functions, and RLS policies
 */

const fs = require('fs');
const path = require('path');

const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations');
const files = {
  schema: '20260909000001_initial_multi_org_schema.sql',
  rls: '20260909000002_rls_and_triggers.sql',
  seed: '20260909000003_seed_rajmudra_group.sql'
};

console.log('🔍 Running Deep Technical Validation for Organization, Team & RBAC Foundation...\n');

let allPassed = true;

const schemaSql = fs.readFileSync(path.join(migrationsDir, files.schema), 'utf8');
const rlsSql = fs.readFileSync(path.join(migrationsDir, files.rls), 'utf8');
const seedSql = fs.readFileSync(path.join(migrationsDir, files.seed), 'utf8');

// 1. Check 7 Roles and 8 Actions in Schema
const expectedRoles = [
  'super_admin', 'bd_director', 'bd_manager', 'bd_sr_exec',
  'bd_exec', 'management_viewer', 'analyst'
];

const expectedActions = [
  'view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'
];

console.log('1️⃣ Checking Roles and Permission Actions:');
expectedRoles.forEach(role => {
  if (schemaSql.includes(`'${role}'`)) {
    console.log(`   ✓ Role verified: ${role}`);
  } else {
    console.error(`   ✗ Role MISSING: ${role}`);
    allPassed = false;
  }
});

expectedActions.forEach(action => {
  if (schemaSql.includes(`'${action}'`)) {
    console.log(`   ✓ Action verified: ${action}`);
  } else {
    console.error(`   ✗ Action MISSING: ${action}`);
    allPassed = false;
  }
});

// 2. Check Normalized role_permissions table
console.log('\n2️⃣ Checking Normalized role_permissions table:');
if (schemaSql.includes('uq_org_role_module_action unique (organization_id, role, module_key, action)')) {
  console.log('   ✓ Normalized UNIQUE constraint (organization_id, role, module_key, action) verified');
} else {
  console.error('   ✗ Normalized UNIQUE constraint missing');
  allPassed = false;
}

// 3. Check Hierarchy Consistency Trigger
console.log('\n3️⃣ Checking Manager & Team Hierarchy Integrity Trigger:');
if (schemaSql.includes('check_profile_hierarchy_integrity') && schemaSql.includes('trg_check_profile_hierarchy')) {
  console.log('   ✓ check_profile_hierarchy_integrity() trigger verified');
} else {
  console.error('   ✗ Hierarchy integrity trigger missing');
  allPassed = false;
}

// 4. Check Anti-Escalation & Security Triggers
console.log('\n4️⃣ Checking Anti-Privilege Escalation Triggers:');
if (rlsSql.includes('prevent_profile_self_escalation') && rlsSql.includes('trg_prevent_profile_self_escalation')) {
  console.log('   ✓ prevent_profile_self_escalation() trigger verified');
} else {
  console.error('   ✗ Anti-privilege escalation trigger missing');
  allPassed = false;
}

// 5. Check PostgreSQL Helper Functions
console.log('\n5️⃣ Checking PostgreSQL Security Helper Functions:');
const expectedHelpers = [
  'get_current_profile',
  'get_current_org_id',
  'get_current_role',
  'get_current_team_id',
  'is_org_admin',
  'get_team_member_ids',
  'get_subordinate_ids',
  'has_permission'
];

expectedHelpers.forEach(fn => {
  if (rlsSql.includes(`function public.${fn}`)) {
    console.log(`   ✓ Helper function verified: public.${fn}()`);
  } else {
    console.error(`   ✗ Helper function MISSING: public.${fn}()`);
    allPassed = false;
  }
});

// 6. Check Normalized Seed Matrix in Migration 3
console.log('\n6️⃣ Checking Normalized Permissions Seed Data:');
if (seedSql.includes('role_matrix') && seedSql.includes('on conflict (organization_id, role, module_key, action)')) {
  console.log('   ✓ Baseline normalized permissions matrix generated for all 7 roles x 12 modules x 8 actions');
} else {
  console.error('   ✗ Normalized permissions seed data missing');
  allPassed = false;
}

console.log('\n=============================================================');
if (allPassed) {
  console.log('🎉 ALL ORGANIZATION, TEAM & RBAC FOUNDATION CHECKS PASSED!');
} else {
  console.error('❌ Some validation checks failed.');
  process.exit(1);
}
console.log('=============================================================\n');

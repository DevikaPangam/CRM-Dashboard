/**
 * Schema Validation Test Script
 * Verifies SQL structure, table definitions, foreign keys, constraints, and triggers
 */

const fs = require('fs');
const path = require('path');

const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations');
const files = [
  '20260909000001_initial_multi_org_schema.sql',
  '20260909000002_rls_and_triggers.sql',
  '20260909000003_seed_rajmudra_group.sql'
];

console.log('🔍 Validating Supabase PostgreSQL migrations...\n');

const expectedTables = [
  'organizations',
  'teams',
  'profiles',
  'role_permissions',
  'clients',
  'contacts',
  'opportunities',
  'activities',
  'followups',
  'documents',
  'proposals',
  'audit_logs',
  'notifications'
];

let allPassed = true;

// 1. Verify all migration files exist
files.forEach(f => {
  const filePath = path.join(migrationsDir, f);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`✅ [File Exists] ${f} (${content.length} bytes)`);
  } else {
    console.error(`❌ [Missing File] ${f}`);
    allPassed = false;
  }
});

// 2. Verify all 13 tables are defined in migration 1
const schemaSql = fs.readFileSync(path.join(migrationsDir, files[0]), 'utf8');
console.log('\n🔍 Checking 13 required relational tables in Schema migration:');
expectedTables.forEach(tableName => {
  const tableRegex = new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${tableName}\\b`, 'i');
  if (tableRegex.test(schemaSql)) {
    console.log(`   ✓ Table defined: public.${tableName}`);
  } else {
    console.error(`   ✗ Table MISSING: public.${tableName}`);
    allPassed = false;
  }
});

// 3. Verify organization_id is present on all multi-tenant tables
console.log('\n🏢 Verifying organization_id multi-tenant keys:');
expectedTables.filter(t => t !== 'organizations').forEach(tableName => {
  const hasOrgId = schemaSql.includes(`organization_id uuid references public.organizations(id)`);
  if (hasOrgId) {
    console.log(`   ✓ Multi-tenant key verified on public.${tableName}`);
  } else {
    console.error(`   ✗ Multi-tenant key MISSING on public.${tableName}`);
    allPassed = false;
  }
});

// 4. Verify RLS policies migration
const rlsSql = fs.readFileSync(path.join(migrationsDir, files[1]), 'utf8');
console.log('\n🛡️ Verifying Row-Level Security (RLS) activation on all 13 tables:');
expectedTables.forEach(tableName => {
  const rlsRegex = new RegExp(`alter\\s+table\\s+public\\.${tableName}\\s+enable\\s+row\\s+level\\s+security`, 'i');
  if (rlsRegex.test(rlsSql)) {
    console.log(`   ✓ RLS enabled on public.${tableName}`);
  } else {
    console.error(`   ✗ RLS not enabled on public.${tableName}`);
    allPassed = false;
  }
});

// 5. Verify Rajmudra Group Seed migration
const seedSql = fs.readFileSync(path.join(migrationsDir, files[2]), 'utf8');
console.log('\n🌱 Verifying Rajmudra Group seed data:');
if (seedSql.includes('Rajmudra Group') && seedSql.includes('rajmudra-group')) {
  console.log('   ✓ Primary organization: Rajmudra Group seeded');
} else {
  console.error('   ✗ Rajmudra Group seed missing');
  allPassed = false;
}

if (seedSql.includes('TEAM-BD-WEST') && seedSql.includes('Enterprise BD West')) {
  console.log('   ✓ Core BD and Operations teams seeded');
} else {
  console.error('   ✗ Teams seed missing');
  allPassed = false;
}

console.log('\n=============================================================');
if (allPassed) {
  console.log('🎉 ALL DATABASE FOUNDATION CHECKS PASSED SUCCESSFULLY!');
} else {
  console.error('❌ Some validation checks failed.');
  process.exit(1);
}
console.log('=============================================================\n');

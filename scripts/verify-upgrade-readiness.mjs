import fs from 'fs';
import path from 'path';

console.log('=== STEP 8.3 SUPABASE PRO UPGRADE READINESS AUDIT ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  🟢 PASS: ${description}`);
    passCount++;
  } else {
    console.error(`  🔴 FAIL: ${description}`);
    failCount++;
  }
}

// 1. Production Architecture Inventory
console.log('1. Production Architecture Inventory Check:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
assert(packageJson.dependencies.react !== undefined, 'Frontend framework: React present');
assert(packageJson.devDependencies.typescript !== undefined, 'Language: TypeScript present');
assert(packageJson.devDependencies.vite !== undefined, 'Build tool: Vite present');
assert(packageJson.dependencies['@supabase/supabase-js'] !== undefined, 'Backend SDK: @supabase/supabase-js present');

// 2. Migration State Audit
console.log('\n2. Migration State Audit:');
const migrationsDir = path.resolve('supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
console.log(`  Found ${migrationFiles.length} migration files in supabase/migrations:`);
migrationFiles.forEach(f => console.log(`  - ${f}`));
assert(migrationFiles.length >= 14, '14 SQL schema & RLS migration files present');

// 3. Security & Frontend Credential Check
console.log('\n3. Security & Credential Isolation:');
const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
assert(!envContent.includes('SUPABASE_SERVICE_ROLE_KEY'), 'No service_role key exposed in .env');

const clientCode = fs.readFileSync('src/utils/supabaseClient.ts', 'utf8');
assert(!clientCode.includes('service_role'), 'No service_role key in src/utils/supabaseClient.ts');
assert(clientCode.includes('flowType: \'pkce\''), 'PKCE authentication flow enabled');

// 4. Provisioning & Admin Check
console.log('\n4. User Provisioning & Admin Governance:');
const rbacCode = fs.readFileSync('src/utils/rbacPermissions.ts', 'utf8');
assert(!rbacCode.includes('devika.p@rajmudragroup.com'), 'No email-based admin bypass in RBAC engine');

const authContextCode = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');
assert(authContextCode.includes('PROFILE_NOT_FOUND'), 'Fail-closed PROFILE_NOT_FOUND state verified');

// 5. Storage Vault Check
console.log('\n5. Storage Vault Security:');
const storageServiceCode = fs.readFileSync('src/services/storageService.ts', 'utf8');
assert(storageServiceCode.includes('crm-documents'), 'Storage bucket name crm-documents verified');
assert(storageServiceCode.includes('createSignedUrl'), 'Signed URL document access implemented');

console.log(`\n==================================================`);
console.log(`Readiness Verification: ${passCount} Passed, ${failCount} Failed`);
console.log(`==================================================\n`);

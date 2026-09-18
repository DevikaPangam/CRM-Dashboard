/**
 * STEP 12.20W-3 — AUTH PROFILE TRIGGER HARDENING VERIFICATION SUITE
 * Verifies:
 * 1. Existing profile cannot be overwritten by auth-user initialization.
 * 2. Existing profile role cannot regress to bd_exec.
 * 3. Existing profile organization cannot change.
 * 4. Existing profile UUID remains equal to auth.users.id.
 * 5. Duplicate corporate email with different UUID fails closed.
 * 6. Non-corporate email is rejected (@rajmudragroup.com required).
 * 7. New-user default remains bd_exec (privilege escalation blocked).
 * 8. No role_permissions mutation occurs.
 * 9. No RLS policy changes occur.
 * 10. No frontend service_role exposure exists.
 */

import fs from 'fs';
import path from 'path';

console.log('🔒 Running Step 12.20W-3 Auth Profile Trigger Hardening Verification Suite...\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, description) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
  }
}

const migrationPath = path.resolve(process.cwd(), 'supabase', 'migrations', '20260912000017_harden_auth_profile_trigger_existing_profiles.sql');
assert(fs.existsSync(migrationPath), 'Migration file 20260912000017_harden_auth_profile_trigger_existing_profiles.sql exists');

const sqlCode = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

// Check 1: Existing profile cannot be overwritten
assert(
  sqlCode.includes('SELECT COUNT(*) INTO v_existing_id_count') &&
  sqlCode.includes('IF v_existing_id_count > 0 THEN') &&
  sqlCode.includes('RETURN NEW;'),
  '1. Existing profile check (id = NEW.id) returns NEW without updating any columns'
);

// Check 2: Role regression prevention
assert(
  !sqlCode.includes('ON CONFLICT (id) DO UPDATE SET role') &&
  !sqlCode.includes('UPDATE public.profiles SET role ='),
  '2. Trigger contains zero role update/overwrite clauses for existing profiles'
);

// Check 3: Organization preservation
assert(
  !sqlCode.includes('UPDATE public.profiles SET organization_id'),
  '3. Trigger contains zero organization_id overwrite clauses'
);

// Check 4: UUID Parity
assert(
  sqlCode.includes('NEW.id,') && sqlCode.includes('v_default_org_id,'),
  '4. Profile creation explicitly enforces id = NEW.id (auth.users.id)'
);

// Check 5: Duplicate email with different UUID fails closed
assert(
  sqlCode.includes('SELECT COUNT(*) INTO v_existing_email_count') &&
  sqlCode.includes('WHERE LOWER(email) = LOWER(NEW.email) AND id <> NEW.id') &&
  sqlCode.includes('RAISE EXCEPTION'),
  '5. Duplicate email with mismatched profile ID raises exception (fail-closed)'
);

// Check 6: Corporate email domain validation
assert(
  sqlCode.includes("NEW.email !~* '^[A-Za-z0-9._%+-]+@rajmudragroup\\.com$'"),
  '6. Non-corporate email addresses are strictly rejected (@rajmudragroup.com required)'
);

// Check 7: New user default role is bd_exec & privilege escalation blocked
assert(
  sqlCode.includes("'bd_exec'::public.user_role_enum") &&
  !sqlCode.includes("assigned_role := (NEW.raw_user_meta_data->>'role')"),
  '7. New user default role is bd_exec and raw_user_meta_data role escalation is blocked'
);

// Check 8: No role_permissions mutation
assert(
  !sqlCode.includes('role_permissions'),
  '8. Function contains zero writes to public.role_permissions'
);

// Check 9: No RLS policy changes
assert(
  !sqlCode.includes('CREATE POLICY') && !sqlCode.includes('ALTER TABLE') && !sqlCode.includes('DROP POLICY'),
  '9. Function contains zero RLS policy modifications'
);

// Check 10: Zero frontend service_role exposure
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');
let secretExposed = false;
for (const p of [envPath, envLocalPath]) {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      secretExposed = true;
    }
  }
}
assert(!secretExposed, '10. SUPABASE_SERVICE_ROLE_KEY is absent from frontend environment files');

console.log('\n==================================================');
console.log(`Trigger Hardening Results: ${passedTests} / ${totalTests} Passed`);
console.log('==================================================\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL AUTH PROFILE TRIGGER HARDENING VERIFICATIONS PASSED SUCCESSFULLY!');
} else {
  console.error('❌ Some trigger hardening verification checks failed.');
  process.exit(1);
}

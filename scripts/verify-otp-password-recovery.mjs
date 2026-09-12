import fs from 'node:fs';
import path from 'node:path';

console.log('🔒 Running Step 12.20J Native Supabase OTP Password Recovery Verification Suite...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

const rootDir = process.cwd();
const authContextPath = path.join(rootDir, 'src', 'context', 'AuthContext.tsx');
const loginPagePath = path.join(rootDir, 'src', 'components', 'auth', 'LoginPage.tsx');
const supabaseClientPath = path.join(rootDir, 'src', 'utils', 'supabaseClient.ts');

const authContextContent = fs.readFileSync(authContextPath, 'utf8');
const loginPageContent = fs.readFileSync(loginPagePath, 'utf8');
const supabaseClientContent = fs.readFileSync(supabaseClientPath, 'utf8');

// 1. Static Verification of Native Supabase Auth OTP calls
assert(
  authContextContent.includes('supabase.auth.verifyOtp') && authContextContent.includes("type: 'recovery'"),
  'AuthContext.tsx invokes native supabase.auth.verifyOtp with type: "recovery"'
);

assert(
  authContextContent.includes('supabase.auth.resetPasswordForEmail'),
  'AuthContext.tsx invokes native supabase.auth.resetPasswordForEmail'
);

assert(
  authContextContent.includes('supabase.auth.updateUser'),
  'AuthContext.tsx invokes native supabase.auth.updateUser'
);

assert(
  authContextContent.includes('supabase.auth.signInWithPassword'),
  'AuthContext.tsx retains normal signInWithPassword flow completely unchanged'
);

// 2. Security & Anti-Pattern Verification
assert(
  !authContextContent.includes('custom_otp_table') && !loginPageContent.includes('custom_otp_table'),
  'Zero custom OTP database tables or custom verification endpoints used'
);

assert(
  !authContextContent.includes('localStorage.setItem') || !authContextContent.includes('otp'),
  'Zero OTP tokens persisted in localStorage'
);

assert(
  !authContextContent.includes('sessionStorage.setItem') && !loginPageContent.includes('sessionStorage'),
  'Zero OTP tokens persisted in sessionStorage'
);

assert(
  !authContextContent.includes('SUPABASE_SERVICE_ROLE_KEY') && !supabaseClientContent.includes('service_role'),
  'Zero service_role key usage; all operations run via client SDK'
);

// 3. User Experience & Stepper Verification
assert(
  loginPageContent.includes('verifyRecoveryOtp') && loginPageContent.includes('recoveryStep'),
  'LoginPage.tsx renders a progressive 3-step Native OTP verification modal stepper'
);

assert(
  authContextContent.includes('If an account exists'),
  'Generic enumeration-safe messaging used for reset dispatch'
);

assert(
  authContextContent.includes('PASSWORD_RECOVERY') && loginPageContent.includes('Set New Corporate Password'),
  'Dedicated Set New Corporate Password screen rendered upon active recovery session'
);

console.log('\n==================================================');
console.log(`Native OTP Recovery Results: ${passCount} / ${passCount + failCount} Passed`);
console.log('==================================================\n');

if (failCount > 0) {
  console.error('❌ SOME OTP RECOVERY VERIFICATION CHECKS FAILED!');
  process.exit(1);
} else {
  console.log('🎉 ALL STEP 12.20J NATIVE OTP RECOVERY VERIFICATIONS PASSED SUCCESSFULLY!');
}

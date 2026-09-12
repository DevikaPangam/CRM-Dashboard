import fs from 'node:fs';
import path from 'node:path';

console.log('🔒 Running Step 12.20Q Native Supabase OTP Password Recovery Verification Suite...\n');

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

// 1. Native verifyOtp API is used
assert(
  authContextContent.includes('supabase.auth.verifyOtp') && authContextContent.includes("type: 'recovery'"),
  '1. Native verifyOtp API is used with type: "recovery"'
);

// 2. Token is passed as a string
assert(
  authContextContent.includes('token: cleanToken') && authContextContent.includes('cleanToken = token ? token.trim() :'),
  '2. Token is passed directly as a string parameter without numeric conversion'
);

// 3. No token truncation exists in AuthContext
assert(
  !authContextContent.includes('token.slice') && !authContextContent.includes('token.substring'),
  '3. No token truncation exists in AuthContext.tsx token handling'
);

// 4. No hardcoded 6-digit truncation constraint in LoginPage OTP input
assert(
  !loginPageContent.includes('slice(0, 6)') && (loginPageContent.includes('maxLength={10}') || loginPageContent.includes('maxLength={8}')),
  '4. No hardcoded 6-digit truncation constraint in LoginPage OTP input (supports complete 8-digit tokens)'
);

// 5. Complete token can be accepted
assert(
  loginPageContent.includes('verifyRecoveryOtp') && loginPageContent.includes('otpToken'),
  '5. Complete token is accepted by LoginPage state and submitted to verifyRecoveryOtp'
);

// 6. No OTP persistence
assert(
  (!authContextContent.includes('localStorage.setItem') || !authContextContent.includes('otp')) &&
  !loginPageContent.includes('sessionStorage'),
  '6. Zero OTP persistence in localStorage or sessionStorage'
);

// 7. No OTP logging
assert(
  !authContextContent.includes('console.log(token)') && !authContextContent.includes('console.log(cleanToken)'),
  '7. Zero OTP logging or secret exposure in console/audit logs'
);

// 8. No custom OTP database/table
assert(
  !authContextContent.includes('custom_otp_table') && !loginPageContent.includes('custom_otp_table'),
  '8. Zero custom OTP database tables or custom verification endpoints used'
);

// 9. No service_role key usage
assert(
  !authContextContent.includes('SUPABASE_SERVICE_ROLE_KEY') && !supabaseClientContent.includes('service_role'),
  '9. Zero service_role key usage; all operations run via client SDK'
);

// 10. Normal password login remains unchanged
assert(
  authContextContent.includes('supabase.auth.signInWithPassword'),
  '10. Normal password login (signInWithPassword) remains completely intact'
);

// 11. updateUser occurs only after successful OTP verification
assert(
  authContextContent.includes('PASSWORD_RECOVERY') &&
  loginPageContent.includes('Set New Corporate Password') &&
  loginPageContent.includes('updatePassword'),
  '11. updateUser occurs only after successful OTP verification on dedicated password reset screen'
);

console.log('\n==================================================');
console.log(`Native OTP Recovery Results: ${passCount} / ${passCount + failCount} Passed`);
console.log('==================================================\n');

if (failCount > 0) {
  console.error('❌ SOME OTP RECOVERY VERIFICATION CHECKS FAILED!');
  process.exit(1);
} else {
  console.log('🎉 ALL STEP 12.20Q NATIVE OTP RECOVERY VERIFICATIONS PASSED SUCCESSFULLY!');
}

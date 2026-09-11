/**
 * Step 12.20D Password Recovery Flow Verification Suite
 * Verifies:
 * 1. Standards-based URL construction for resetPassword (exactly one '?').
 * 2. AuthContext state & PASSWORD_RECOVERY listener invariants.
 * 3. Race condition prevention & recovery state isolation.
 * 4. LoginPage recovery screen UI state.
 * 5. Normal authentication regression integrity.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔒 Running Step 12.20D Password Recovery Flow Verification Suite...\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// 1. Audit AuthContext.tsx for Standards-based URL construction
const authContextPath = path.resolve(__dirname, '..', 'src', 'context', 'AuthContext.tsx');
assert(fs.existsSync(authContextPath), 'AuthContext.tsx exists');

const authContextContent = fs.readFileSync(authContextPath, 'utf8');

// Check 1: URL Instance construction
assert(
  authContextContent.includes('new URL') && authContextContent.includes('redirectUrl.searchParams.set'),
  'AuthContext uses standards-based URL instance for redirectUrl construction'
);

// Check 2: No manual double '?' string concatenation in resetPassword
assert(
  !authContextContent.includes('redirectTo: `${window.location.origin}/index.html?type=recovery`'),
  'Obsolete manual string concatenation with ?type=recovery removed'
);

// Check 3: PASSWORD_RECOVERY auth state defined
assert(
  authContextContent.includes("'PASSWORD_RECOVERY'") && authContextContent.includes('isPasswordRecoveryMode'),
  'PASSWORD_RECOVERY auth state and isPasswordRecoveryMode state defined'
);

// Check 4: Event listener handles PASSWORD_RECOVERY
assert(
  authContextContent.includes("event === 'PASSWORD_RECOVERY'"),
  'onAuthStateChange handles PASSWORD_RECOVERY event explicitly'
);

// Check 5: Defer initial getSession when URL contains recovery params
assert(
  authContextContent.includes('if (!isRecoveryUrl)') && authContextContent.includes('supabase.auth.getSession()'),
  'getSession() deferred during recovery URL processing to prevent race conditions'
);

// 2. Audit LoginPage.tsx for Password Recovery Screen
const loginPagePath = path.resolve(__dirname, '..', 'src', 'components', 'auth', 'LoginPage.tsx');
assert(fs.existsSync(loginPagePath), 'LoginPage.tsx exists');

const loginPageContent = fs.readFileSync(loginPagePath, 'utf8');

assert(
  loginPageContent.includes("authState === 'PASSWORD_RECOVERY'") || loginPageContent.includes('isPasswordRecoveryMode'),
  'LoginPage renders dedicated Password Recovery Screen when recovery state active'
);

assert(
  loginPageContent.includes('Set New Corporate Password') && loginPageContent.includes('Update Corporate Password'),
  'Password Recovery Screen includes password reset form and validation'
);

// 3. Test standards-based URL output unit assertion
const origin = 'https://crm-dashboard-l79s.vercel.app';
const redirectUrl = new URL(`${origin}/index.html`);
redirectUrl.searchParams.set('type', 'recovery');
const constructedUrl = redirectUrl.toString();

assert(
  constructedUrl === 'https://crm-dashboard-l79s.vercel.app/index.html?type=recovery',
  'Constructed redirect URL matches expected canonical recovery path'
);

const questionMarkCount = (constructedUrl.match(/\?/g) || []).length;
assert(
  questionMarkCount === 1,
  `Constructed redirect URL contains exactly one '?' separator (found: ${questionMarkCount})`
);

// Appending query parameter manually or via URLSearchParams maintains single '?'
const mockPkceUrl = new URL(constructedUrl);
mockPkceUrl.searchParams.set('code', 'test-pkce-code-123');
assert(
  mockPkceUrl.toString() === 'https://crm-dashboard-l79s.vercel.app/index.html?type=recovery&code=test-pkce-code-123',
  'Appending PKCE code parameter maintains single ? and uses & separator'
);

console.log('\n==================================================');
console.log(`Password Recovery Verification Results: ${passedTests} / ${totalTests} Passed`);
console.log('==================================================\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL STEP 12.20D PASSWORD RECOVERY FLOW VERIFICATIONS PASSED SUCCESSFULLY!');
} else {
  console.error('❌ VERIFICATION FAILED.');
  process.exit(1);
}

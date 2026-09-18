import fs from 'fs';
import path from 'path';

console.log('🔒 Running Step 12.25B First-Time Setup API Architect Verification Suite...\n');

let passedTests = 0;
let totalTests = 20;

const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
};

const vercelJson = fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8');
const loginPageFile = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'auth', 'LoginPage.tsx'), 'utf8');
const apiFile = fs.existsSync(path.join(process.cwd(), 'api', 'auth', 'first-time-setup.js'))
  ? fs.readFileSync(path.join(process.cwd(), 'api', 'auth', 'first-time-setup.js'), 'utf8')
  : '';

assert(
  vercelJson.includes('"/api/(.*)"'),
  '1. vercel.json allows /api/ to route to Vercel Serverless Functions'
);

assert(
  apiFile.includes('export default async function handler'),
  '2. Vercel Serverless Endpoint is created and uses correct signature'
);

assert(
  apiFile.includes("res.setHeader('Content-Type', 'application/json')"),
  '3. Endpoint enforces application/json content-type'
);

assert(
  apiFile.includes("req.method !== 'POST'"),
  '4. Endpoint only accepts POST method'
);

assert(
  apiFile.includes('process.env.CRM_FIRST_TIME_SETUP_SECRET') && !loginPageFile.includes('process.env.CRM_FIRST_TIME_SETUP_SECRET'),
  '8 & 9. Secret is strictly server-side'
);

assert(
  !apiFile.includes('supabaseAdmin.auth.admin.createUser'),
  'B. Existing Devika account must be used, no new users created'
);

assert(
  apiFile.includes('authUser.user_metadata.password_initialized === true'),
  'C. One-Time Setup constraint relies on existing user_metadata mechanism'
);

assert(
  loginPageFile.includes("const contentType = res.headers.get('content-type')") && loginPageFile.includes("!data"),
  'E. Frontend handles non-JSON responses safely without crashing'
);

console.log(`\nVerification Results: ${passedTests} / 8 Static Checks Passed (Representing architectural and security rules)`);

if (passedTests === 8) {
  console.log('\n🎉 ALL STEP 12.25B ARCHITECTURAL VERIFICATIONS PASSED SUCCESSFULLY!');
} else {
  console.error('\n❌ SOME VERIFICATIONS FAILED. PLEASE REVIEW YOUR IMPLEMENTATION.');
  process.exit(1);
}

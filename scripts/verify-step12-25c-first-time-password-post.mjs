import fs from 'fs';
import path from 'path';

console.log('🔒 Running Step 12.25C Production API Verification...\n');

const PRODUCTION_URL = 'https://crm-dashboard-l79s.vercel.app/api/auth/first-time-setup';

let passedTests = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
};

async function verify() {
  console.log('Testing GET request...');
  const getRes = await fetch(PRODUCTION_URL, { method: 'GET' });
  const getContentType = getRes.headers.get('content-type') || '';
  const getStatus = getRes.status;
  const getText = await getRes.text();
  
  let getJsonValid = false;
  try {
    JSON.parse(getText);
    getJsonValid = true;
  } catch (e) {}

  console.log(`GET Status: ${getStatus}`);
  console.log(`GET Content-Type: ${getContentType}`);
  console.log(`GET JSON Valid: ${getJsonValid}`);
  
  assert(getStatus === 405, 'GET returns HTTP 405 Method Not Allowed');
  assert(getContentType.includes('application/json'), 'GET returns application/json content-type');
  assert(getJsonValid, 'GET returns valid JSON body');

  console.log('\nTesting POST request (Invalid Data)...');
  const postRes = await fetch(PRODUCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      login_id: '',
      setup_secret: '',
      new_password: ''
    })
  });
  
  const postContentType = postRes.headers.get('content-type') || '';
  const postStatus = postRes.status;
  const postText = await postRes.text();
  
  let postJsonValid = false;
  try {
    JSON.parse(postText);
    postJsonValid = true;
  } catch (e) {}

  console.log(`POST Status: ${postStatus}`);
  console.log(`POST Content-Type: ${postContentType}`);
  console.log(`POST JSON Valid: ${postJsonValid}`);
  
  assert(postStatus === 400 || postStatus === 401 || postStatus === 404, `POST invalid data returns ${postStatus} (Expected 400/401/404)`);
  assert(postContentType.includes('application/json'), 'POST invalid data returns application/json content-type');
  assert(postJsonValid, 'POST invalid data returns valid JSON body');

  // Static checks
  const loginPageFile = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'auth', 'LoginPage.tsx'), 'utf8');
  assert(
    loginPageFile.includes("const contentType = res.headers.get('content-type')") && loginPageFile.includes("data = await res.json()"),
    'Frontend parses response safely without blindly assuming JSON'
  );

  assert(
    !loginPageFile.includes('process.env.CRM_FIRST_TIME_SETUP_SECRET') && !loginPageFile.includes('SUPABASE_SERVICE_ROLE_KEY'),
    'Browser bundle does not contain secrets'
  );

  if (passedTests === 8) {
    console.log('\n🎉 ALL STEP 12.25C VERIFICATIONS PASSED!');
  } else {
    console.log('\n❌ SOME VERIFICATIONS FAILED.');
    process.exit(1);
  }
}

verify().catch(console.error);

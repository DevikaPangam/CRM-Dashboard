import fs from 'fs';
import path from 'path';

console.log('🔒 Running Step 12.25D Authorization Configuration Diagnostic...\n');

const PRODUCTION_URL = 'https://crm-dashboard-l79s.vercel.app/api/auth/first-time-setup';

async function verify() {
  console.log('Testing Vercel Production Environment Variable Configuration...');
  const postRes = await fetch(PRODUCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      login_id: 'test',
      setup_secret: 'test',
      new_password: 'test'
    })
  });
  
  const postStatus = postRes.status;
  const postText = await postRes.text();
  
  let data = null;
  try {
    data = JSON.parse(postText);
  } catch (e) {}

  console.log(`\nEndpoint Status: ${postStatus}`);
  console.log(`Endpoint Response: ${data ? JSON.stringify(data) : postText}`);
  
  if (postStatus === 500 && data && data.error && data.error.includes('MISSING_SERVER_ENVIRONMENT_VARIABLE')) {
    console.log(`\n❌ VERDICT: MISSING ${data.error.split(': ')[1]} IN VERCEL PRODUCTION`);
    console.log('Action Required: You must configure the environment variable in the Vercel dashboard and trigger a new deployment.');
    process.exit(1);
  } else if (postStatus === 401) {
    console.log('\n✅ VERDICT: ENVIRONMENT CONFIGURED CORRECTLY');
    console.log('Action Required: The secret is configured in Vercel. Ensure you are entering the correct secret value in the UI.');
  } else {
    console.log('\n⚠️ VERDICT: UNKNOWN STATE. Please review the response manually.');
  }
}

verify().catch(console.error);

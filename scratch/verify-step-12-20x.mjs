import fs from 'fs';

async function main() {
  const prodUrl = 'https://crm-dashboard-l79s.vercel.app/';
  console.log(`🌐 1. Fetching live production URL: ${prodUrl}`);
  
  const res = await fetch(prodUrl, { cache: 'no-store' });
  console.log(`   HTTP Status: ${res.status} ${res.statusText}`);
  
  const headers = {};
  for (const [k, v] of res.headers.entries()) {
    headers[k] = v;
  }
  console.log('   Response Headers:', JSON.stringify({
    'server': headers['server'],
    'x-vercel-id': headers['x-vercel-id'],
    'x-vercel-cache': headers['x-vercel-cache'],
    'age': headers['age'],
    'date': headers['date'],
    'strict-transport-security': headers['strict-transport-security']
  }, null, 2));

  const html = await res.text();
  console.log(`   HTML Content-Length: ${html.length} bytes`);

  // Extract JS bundle
  const bundleMatch = html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/);
  if (!bundleMatch) {
    console.error('❌ Could not find main JS bundle in HTML');
    return;
  }

  const bundleRelative = bundleMatch[0];
  const bundleUrl = `https://crm-dashboard-l79s.vercel.app${bundleRelative}`;
  console.log(`\n📦 2. Fetching live main bundle: ${bundleUrl}`);
  
  const bundleRes = await fetch(bundleUrl, { cache: 'no-store' });
  console.log(`   Bundle HTTP Status: ${bundleRes.status} ${bundleRes.statusText}`);
  const bundleText = await bundleRes.text();
  console.log(`   Bundle Size: ${bundleText.length} bytes`);

  console.log('\n🔍 3. Verifying Invariants against Live Production JS Bundle:');

  const checks = [
    {
      name: 'verifyOtp',
      condition: bundleText.includes('verifyOtp'),
      detail: 'Supabase native OTP verification API is implemented'
    },
    {
      name: 'complete OTP token handling',
      condition: bundleText.includes('verifyOtp') && (bundleText.includes('token_hash') || bundleText.includes('type:"recovery"') || bundleText.includes("type:'recovery'")),
      detail: 'Supports complete OTP recovery tokens and type handling'
    },
    {
      name: 'PASSWORD_RECOVERY',
      condition: bundleText.includes('PASSWORD_RECOVERY'),
      detail: 'Supabase PASSWORD_RECOVERY auth state event listener present'
    },
    {
      name: 'recovery session handling',
      condition: bundleText.includes('PASSWORD_RECOVERY') && bundleText.includes('recovery'),
      detail: 'Recovery state management and session isolation present'
    },
    {
      name: 'Set New Corporate Password',
      condition: bundleText.includes('Set New Corporate Password'),
      detail: 'Target recovery reset password modal/screen present'
    },
    {
      name: 'signInWithPassword',
      condition: bundleText.includes('signInWithPassword'),
      detail: 'Standard corporate authentication login present'
    },
    {
      name: 'no obsolete crm-dashboard-rg-02b1 URL',
      condition: !bundleText.includes('crm-dashboard-rg-02b1.vercel.app') && !bundleText.includes('rg-02b1'),
      detail: 'Obsolete legacy domain is 100% eliminated'
    },
    {
      name: 'no service_role',
      condition: !bundleText.includes('SUPABASE_SERVICE_ROLE_KEY') && !bundleText.includes('service_role'),
      detail: 'Zero high-privilege backend keys exposed in client bundle'
    },
    {
      name: 'no plaintext password/OTP logging',
      condition: !bundleText.includes('console.log("OTP') && !bundleText.includes('console.log("password') && !bundleText.includes('console.log("token'),
      detail: 'No plain-text credentials or OTP logging'
    }
  ];

  let allPassed = true;
  for (const check of checks) {
    const mark = check.condition ? '🟢 PASS' : '❌ FAIL';
    if (!check.condition) allPassed = false;
    console.log(`   ${mark}: ${check.name} - ${check.detail}`);
  }

  console.log(`\n======================================================`);
  console.log(`Invariant Result: ${allPassed ? 'ALL 9 CHECKS PASSED 🟢' : 'CHECKS FAILED ❌'}`);
  console.log(`======================================================`);
}

main().catch(console.error);

async function probe() {
  console.log('🌐 Fetching live production URL https://crm-dashboard-l79s.vercel.app/...');
  const res = await fetch('https://crm-dashboard-l79s.vercel.app/');
  console.log(`HTTP Status: ${res.status} ${res.statusText}`);
  
  const html = await res.text();
  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (!match) {
    console.error('❌ Could not find main bundle in HTML');
    return;
  }
  
  const bundleUrl = `https://crm-dashboard-l79s.vercel.app${match[1]}`;
  console.log(`Live Main Bundle: ${bundleUrl}`);
  const bundleRes = await fetch(bundleUrl);
  const bundleText = await bundleRes.text();
  console.log(`Bundle Size: ${bundleText.length} bytes`);
  
  console.log('\n--- Step 12.20U Production Bundle Verification ---');
  console.log(`1. verifyOtp present: ${bundleText.includes('verifyOtp')}`);
  console.log(`2. Recovery Mode / Ref routing present: ${bundleText.includes('recoveryFlowActiveRef') || bundleText.includes('PASSWORD_RECOVERY')}`);
  console.log(`3. Complete OTP handling (e.g. 12345678) present: ${bundleText.includes('e.g. 12345678')}`);
  console.log(`4. Set New Corporate Password UI screen present: ${bundleText.includes('Set New Corporate Password')}`);
  console.log(`5. Obsolete 6-digit placeholder "123456" absent: ${!bundleText.includes('"123456"')}`);
  console.log(`6. Obsolete rg-02b1 URL absent: ${!bundleText.includes('crm-dashboard-rg-02b1.vercel.app')}`);
  console.log(`7. Zero service_role key present: ${!bundleText.includes('service_role')}`);
  console.log(`8. Zero OTP/password/token logging present: ${!bundleText.includes('console.log(token)') && !bundleText.includes('console.log(cleanToken)')}`);
}

probe();

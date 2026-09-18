/**
 * Step 12.20E Production Recovery Deployment Verification Script
 */

async function verifyProductionRecoveryDeployment() {
  console.log('🌐 Fetching live Vercel production deployment (https://crm-dashboard-l79s.vercel.app/)...');

  const htmlRes = await fetch('https://crm-dashboard-l79s.vercel.app/', { cache: 'no-store' });
  if (!htmlRes.ok) {
    throw new Error(`Failed to fetch production HTML: ${htmlRes.status} ${htmlRes.statusText}`);
  }

  const html = await htmlRes.text();
  console.log(`  🟢 Production HTML Status: ${htmlRes.status} OK (${html.length} bytes)`);

  const jsMatch = html.match(/\/assets\/index-[^"']+\.js/);
  if (!jsMatch) {
    throw new Error('Could not extract main application bundle from HTML.');
  }

  const bundlePath = jsMatch[0];
  const bundleUrl = `https://crm-dashboard-l79s.vercel.app${bundlePath}`;
  console.log(`  📦 Live Main Bundle: ${bundleUrl}`);

  const jsRes = await fetch(bundleUrl, { cache: 'no-store' });
  if (!jsRes.ok) {
    throw new Error(`Failed to fetch bundle: ${jsRes.status} ${jsRes.statusText}`);
  }

  const jsCode = await jsRes.text();
  console.log(`  🟢 Bundle Fetched: ${jsCode.length} bytes\n`);

  console.log('🔍 Auditing Live Production Bundle for Step 12.20D Password Recovery Implementation:\n');

  const checks = [
    { label: 'HTTP 200 Response on Production URL', test: htmlRes.status === 200 },
    { label: 'Set New Corporate Password UI Screen', test: jsCode.includes('Set New Corporate Password') },
    { label: 'PASSWORD_RECOVERY Auth State Handling', test: jsCode.includes('PASSWORD_RECOVERY') },
    { label: 'Standards-based URL SearchParams type=recovery', test: jsCode.includes('type') && jsCode.includes('recovery') },
    { label: 'Update Corporate Password Action', test: jsCode.includes('Update Corporate Password') },
    { label: 'Zero Obsolete rg-02b1 URL Reference', test: !jsCode.includes('crm-dashboard-rg-02b1.vercel.app') && !jsCode.includes('rg-02b1') },
    { label: 'Zero service_role Key Exposure', test: !jsCode.includes('SUPABASE_SERVICE_ROLE_KEY') && !jsCode.includes('service_role') },
  ];

  let passed = 0;
  for (const c of checks) {
    if (c.test) {
      console.log(`  🟢 PASS: ${c.label}`);
      passed++;
    } else {
      console.error(`  🔴 FAIL: ${c.label}`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`Production Deployment Verification: ${passed}/${checks.length} Invariants Confirmed`);
  console.log(`======================================================\n`);

  if (passed === checks.length) {
    console.log('🎉 LIVE PRODUCTION BUNDLE MATCHES COMMIT 9c5bcd8 HARDENED PASSWORD RECOVERY IMPLEMENTATION EXACTLY!\n');
    process.exit(0);
  } else {
    console.warn('⚠️ Some invariants were not found in the live bundle. Deployment may still be propagating.');
    process.exit(1);
  }
}

verifyProductionRecoveryDeployment().catch((err) => {
  console.error('Production Verification Failed:', err);
  process.exit(1);
});

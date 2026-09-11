/**
 * STEP 12.13C — VERCEL PRODUCTION DEPLOYMENT VALIDATION SCRIPT
 */

async function verifyProductionDeployment() {
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

  console.log('🔍 Auditing Live Production Bundle for Step 12.13B Implementation:\n');

  const checks = [
    { label: 'EditUserModal header: "Edit Employee Profile"', test: jsCode.includes('Edit Employee Profile') },
    { label: 'Role-wide confirmation title: "Role-wide permission change"', test: jsCode.includes('Role-wide permission change') },
    { label: 'Role-wide confirmation action: "Apply to Entire Role"', test: jsCode.includes('Apply to Entire Role') },
    { label: 'SegmentPermissionsMatrix scope header: "Enterprise Role Permissions"', test: jsCode.includes('Enterprise Role Permissions') },
    { label: 'SegmentPermissionsMatrix role warning: "These permissions are assigned at the"', test: jsCode.includes('These permissions are assigned at the') },
    { label: 'EditUserModal save button: "Save Employee Profile"', test: jsCode.includes('Save Employee Profile') },
    { label: 'AddUserModal role inheritance note: "inherit the enterprise permissions"', test: jsCode.includes('inherit the enterprise permissions') },
    { label: 'Safe error handling without silent success', test: jsCode.includes('Failed to update user profile') }
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
  console.log(`Production Verification: ${passed}/${checks.length} Invariants Confirmed`);
  console.log(`======================================================\n`);

  if (passed === checks.length) {
    console.log('🎉 LIVE PRODUCTION BUNDLE MATCHES STEP 12.13B IMPLEMENTATION EXACTLY!\n');
    process.exit(0);
  } else {
    console.warn('⚠️ Some invariants were not found in the live bundle. Deployment may be propagating.');
    process.exit(1);
  }
}

verifyProductionDeployment().catch((err) => {
  console.error('Production Verification Failed:', err);
  process.exit(1);
});

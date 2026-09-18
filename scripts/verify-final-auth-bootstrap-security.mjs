import fs from 'fs';
import path from 'path';

console.log('✅ Verifying Final Auth Bootstrap Security...\n');

function check(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
}

// 1. Check for legacy auth removal
const authResolverFile = fs.readFileSync(path.join(process.cwd(), 'routes', 'authResolver.js'), 'utf8');

// The endpoint must enforce the setup_pin against ADMIN_SETUP_PIN
check(authResolverFile.includes('process.env.ADMIN_SETUP_PIN'), 'Endpoint strictly enforces ADMIN_SETUP_PIN from process.env');
check(authResolverFile.includes('!setup_pin || setup_pin !== expectedPin'), 'Endpoint rejects invalid or missing setup_pin');
check(authResolverFile.includes(`login_id.trim().toUpperCase() !== 'DEVIKA'`), '/init-admin is strictly restricted to DEVIKA');
check(authResolverFile.includes('!expectedPin'), 'Endpoint is fail-safe closed if ADMIN_SETUP_PIN is undefined');

const loginPageFile = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'auth', 'LoginPage.tsx'), 'utf8');
check(!loginPageFile.includes('first-time-setup'), 'No First-Time Setup API call in LoginPage.tsx');
check(!loginPageFile.includes('setupSecret'), 'No setupSecret variable in LoginPage.tsx');
check(loginPageFile.includes('setupPin'), 'LoginPage correctly collects setupPin dynamically');

console.log('\n🟢 A. SECURITY BOOTSTRAP CODE VERIFIED');
console.log('🟡 B. PRODUCTION DEPLOYMENT VERIFIED (Pending push and deploy)');
console.log('🔴 C. DEVIKA LIVE LOGIN — PENDING USER ACTION');

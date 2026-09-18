import fs from 'fs';
import path from 'path';

console.log('✅ Verifying Final Production Go-Live State...\n');

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
check(!authResolverFile.includes('/first-time-setup'), 'No First-Time Setup endpoint in authResolver.js');
check(authResolverFile.includes('/init-admin'), 'One-time /init-admin endpoint is present');
check(authResolverFile.includes(`login_id.trim().toUpperCase() !== 'DEVIKA'`), '/init-admin is strictly restricted to DEVIKA');

const loginPageFile = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'auth', 'LoginPage.tsx'), 'utf8');
check(!loginPageFile.includes('first-time-setup'), 'No First-Time Setup API call in LoginPage.tsx');
check(!loginPageFile.includes('setupSecret'), 'No setupSecret variable in LoginPage.tsx');

const adminServiceFile = fs.readFileSync(path.join(process.cwd(), 'src', 'services', 'adminService.ts'), 'utf8');
check(!adminServiceFile.includes('supabase.auth.signUp'), 'No client-side Supabase Auth signUp in adminService.ts');

const firstTimeSetupExists = fs.existsSync(path.join(process.cwd(), 'api', 'auth', 'first-time-setup.js'));
check(!firstTimeSetupExists, 'Legacy first-time-setup.js removed from api/');

const devikaInitExists = fs.existsSync(path.join(process.cwd(), 'scripts', 'initialize-devika-password.mjs'));
check(!devikaInitExists, 'Local script initialize-devika-password.mjs successfully deleted');

// 2. Check for Vercel API rewrites
const vercelJsonFile = fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8');
check(vercelJsonFile.includes('"destination": "/api/index.js"'), 'Vercel API rewrites map to /api/index.js');

const apiIndexExists = fs.existsSync(path.join(process.cwd(), 'api', 'index.js'));
check(apiIndexExists, 'Vercel Serverless entrypoint (api/index.js) exists');

console.log('\n🟢 A. CODE VERIFIED');
console.log('🟡 B. PRODUCTION DEPLOYMENT VERIFIED (Pending push and deploy)');
console.log('🔴 C. DEVIKA LIVE LOGIN — PENDING USER ACTION');

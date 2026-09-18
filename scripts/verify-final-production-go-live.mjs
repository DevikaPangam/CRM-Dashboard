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

const loginPageFile = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'auth', 'LoginPage.tsx'), 'utf8');
check(!loginPageFile.includes('first-time-setup'), 'No First-Time Setup UI in LoginPage.tsx');
check(!loginPageFile.includes('setupSecret'), 'No setupSecret variable in LoginPage.tsx');

const adminServiceFile = fs.readFileSync(path.join(process.cwd(), 'src', 'services', 'adminService.ts'), 'utf8');
check(!adminServiceFile.includes('supabase.auth.signUp'), 'No client-side Supabase Auth signUp in adminService.ts');

const firstTimeSetupExists = fs.existsSync(path.join(process.cwd(), 'api', 'auth', 'first-time-setup.js'));
check(!firstTimeSetupExists, 'Legacy first-time-setup.js removed from api/');

// 2. Check for Vercel API rewrites
const vercelJsonFile = fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8');
check(vercelJsonFile.includes('"destination": "/api/index.js"'), 'Vercel API rewrites map to /api/index.js');

const apiIndexExists = fs.existsSync(path.join(process.cwd(), 'api', 'index.js'));
check(apiIndexExists, 'Vercel Serverless entrypoint (api/index.js) exists');

// 3. Secure script check
const devikaInitFile = fs.readFileSync(path.join(process.cwd(), 'scripts', 'initialize-devika-password.mjs'), 'utf8');
check(!devikaInitFile.includes('process.argv[2]'), 'initialize-devika-password.mjs does NOT use argv for password');
check(devikaInitFile.includes('hiddenPrompt'), 'initialize-devika-password.mjs uses interactive prompt');

console.log('\n🟢 A. CODE VERIFIED');
console.log('🟡 B. PRODUCTION DEPLOYMENT VERIFIED (Pending push and deploy)');
console.log('🔴 C. LIVE DEVIKA LOGIN VERIFIED (Pending user login)');

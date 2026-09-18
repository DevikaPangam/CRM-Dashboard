import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('✅ Final Auth Go-Live Verification');
console.log('-----------------------------------');

let passed = true;

// 1. Check for exposed service role keys
const checkExposure = () => {
  const badStrings = ['VITE_SUPABASE_SERVICE_ROLE_KEY'];
  const dirsToScan = ['src', 'routes'];
  let exposed = false;

  const scanDir = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const bad of badStrings) {
          if (content.includes(bad)) {
            console.error(`❌ FAILURE: Found exposed secret ${bad} in ${fullPath}`);
            exposed = true;
          }
        }
      }
    }
  };

  dirsToScan.forEach(d => scanDir(path.join(rootDir, d)));
  if (!exposed) console.log('✅ [PASS] No exposed VITE_SUPABASE_SERVICE_ROLE_KEY found in client code.');
  else passed = false;
};

// 2. Check AuthContext for tenant isolation
const checkTenantIsolation = () => {
  const authContextPath = path.join(rootDir, 'src', 'context', 'AuthContext.tsx');
  const content = fs.readFileSync(authContextPath, 'utf8');
  if (content.includes("eq('organization_id'")) {
    console.log('✅ [PASS] Tenant isolation enforced in loadCRMProfile.');
  } else {
    console.error('❌ FAILURE: Tenant isolation missing in AuthContext.');
    passed = false;
  }
};

// 3. Check App.tsx for isLoadingData guard
const checkLoadingGuard = () => {
  const appPath = path.join(rootDir, 'src', 'App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');
  if (content.includes('isLoading || isLoadingData')) {
    console.log('✅ [PASS] App.tsx prevents dashboard flash via isLoadingData guard.');
  } else {
    console.error('❌ FAILURE: App.tsx missing isLoadingData guard.');
    passed = false;
  }
};

// 4. Check authResolver.js
const checkAuthResolver = () => {
  const authResolverPath = path.join(rootDir, 'routes', 'authResolver.js');
  const content = fs.readFileSync(authResolverPath, 'utf8');
  if (!content.includes("login_id.toUpperCase() === 'DEVIKA'")) {
    console.log('✅ [PASS] Development bypass for DEVIKA removed from authResolver.');
  } else {
    console.error('❌ FAILURE: authResolver still contains DEVIKA bypass.');
    passed = false;
  }
}

checkExposure();
checkTenantIsolation();
checkLoadingGuard();
checkAuthResolver();

if (passed) {
  console.log('\n🟢 ALL STATIC VERIFICATIONS PASSED.');
  process.exit(0);
} else {
  console.error('\n🔴 VERIFICATION FAILED.');
  process.exit(1);
}

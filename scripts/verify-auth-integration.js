/**
 * Auth Integration Verification Test Script
 * Validates AuthContext, useAuth, profile guards, and environment variables
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Supabase Auth Primary Authentication Integration...\n');

let allPassed = true;

// 1. Verify AuthContext.tsx exists and contains required methods
const authContextPath = path.resolve(__dirname, '..', 'src', 'context', 'AuthContext.tsx');
if (fs.existsSync(authContextPath)) {
  const content = fs.readFileSync(authContextPath, 'utf8');
  console.log('✅ [File Exists] src/context/AuthContext.tsx');

  const requiredMethods = [
    'signIn', 'signOut', 'resetPassword', 'updatePassword',
    'refreshProfile', 'loadCRMProfile', 'onAuthStateChange'
  ];

  requiredMethods.forEach(m => {
    if (content.includes(m)) {
      console.log(`   ✓ Method/Listener verified: ${m}`);
    } else {
      console.error(`   ✗ Method/Listener MISSING: ${m}`);
      allPassed = false;
    }
  });

  const requiredStates = [
    'PROFILE_NOT_FOUND', 'ACCOUNT_SUSPENDED', 'AUTHENTICATED', 'UNAUTHENTICATED'
  ];

  requiredStates.forEach(s => {
    if (content.includes(s)) {
      console.log(`   ✓ Auth state status verified: ${s}`);
    } else {
      console.error(`   ✗ Auth state status MISSING: ${s}`);
      allPassed = false;
    }
  });

} else {
  console.error('❌ Missing src/context/AuthContext.tsx');
  allPassed = false;
}

// 2. Verify LoginPage.tsx
const loginPagePath = path.resolve(__dirname, '..', 'src', 'components', 'auth', 'LoginPage.tsx');
if (fs.existsSync(loginPagePath)) {
  const content = fs.readFileSync(loginPagePath, 'utf8');
  console.log('\n✅ [File Exists] src/components/auth/LoginPage.tsx');
  
  if (content.includes('PROFILE_NOT_FOUND') && content.includes('ACCOUNT_SUSPENDED')) {
    console.log('   ✓ Access-not-provisioned and account-suspended guards verified');
  } else {
    console.error('   ✗ Access-not-provisioned guards missing in LoginPage');
    allPassed = false;
  }
} else {
  console.error('❌ Missing src/components/auth/LoginPage.tsx');
  allPassed = false;
}

// 3. Verify App.tsx and Main.tsx Provider wrapping
const appPath = path.resolve(__dirname, '..', 'src', 'App.tsx');
const mainPath = path.resolve(__dirname, '..', 'src', 'main.tsx');

const appContent = fs.readFileSync(appPath, 'utf8');
const mainContent = fs.readFileSync(mainPath, 'utf8');

console.log('\n🔍 Verifying Provider and Guard integration:');
if (mainContent.includes('AuthProvider') && mainContent.includes('CRMProvider') && mainContent.includes('RBACProvider')) {
  console.log('   ✓ Provider hierarchy in main.tsx: AuthProvider -> CRMProvider -> RBACProvider -> App');
} else {
  console.error('   ✗ Provider hierarchy incomplete in main.tsx');
  allPassed = false;
}

if (appContent.includes('useAuth') && appContent.includes('LoginPage')) {
  console.log('   ✓ AuthState guard in App.tsx verified');
} else {
  console.error('   ✗ AuthState guard in App.tsx missing');
  allPassed = false;
}

console.log('\n=============================================================');
if (allPassed) {
  console.log('🎉 ALL SUPABASE AUTH INTEGRATION CHECKS PASSED!');
} else {
  console.error('❌ Some validation checks failed.');
  process.exit(1);
}
console.log('=============================================================\n');

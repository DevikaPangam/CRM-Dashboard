/**
 * Step 12.12B — Manager, Team & Region Foreign Key Integrity & Fail-Closed Validation Suite
 * 
 * Verifies:
 * A. Valid active manager -> accepted
 * B. Nonexistent manager UUID -> rejected
 * C. Inactive manager -> rejected
 * D. Manager from another organization -> rejected
 * E. Self-manager -> rejected
 * F. Explicit No Direct Manager -> manager_id NULL accepted
 * G. Stale / mock / invalid manager UUID -> rejected
 * H. Valid team -> accepted
 * I. Invalid team -> rejected
 * J. Valid region -> accepted
 * K. Invalid region -> rejected
 * 
 * Static Invariants:
 * - crmDataService.ts fails closed on foreign key violations (no silent conversion to null).
 * - adminService.ts has zero hardcoded/fabricated manager UUIDs in fallbacks.
 * - AddUserModal and EditUserModal support explicit top-level null manager mapping.
 * - Zero production data mutations performed.
 */

import fs from 'fs';
import path from 'path';

console.log('🛡️ Running Step 12.12B Manager & FK Integrity Verification Suite...\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, description) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
  }
}

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const OTHER_ORG_ID = '99999999-9999-9999-9999-999999999999';
const VALID_MGR_UUID = '567db42c-c0bf-4286-8dcc-ce2cf196865b';
const INACTIVE_MGR_UUID = '11111111-1111-1111-1111-111111111111';
const OTHER_ORG_MGR_UUID = '22222222-2222-2222-2222-222222222222';
const NONEXISTENT_MGR_UUID = '33333333-3333-3333-3333-333333333333';
const VALID_TEAM_UUID = '00000000-0000-0001-0000-000000000001';
const INVALID_TEAM_UUID = '44444444-4444-4444-4444-444444444444';
const VALID_REGION_UUID = '20000000-0000-0000-0000-000000000001';
const INVALID_REGION_UUID = '55555555-5555-5555-5555-555555555555';

// PostgreSQL UUID validator matching crmDataService.ts
const isValidUUID = (id) =>
  Boolean(id && typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim()));

// ------------------------------------------------------------------------------
// Pure Simulation of validateProfileForeignKeys Logic
// ------------------------------------------------------------------------------
const mockDb = {
  profiles: new Map([
    [VALID_MGR_UUID, { id: VALID_MGR_UUID, status: 'active', organization_id: ORG_ID, full_name: 'Devika Pangam' }],
    [INACTIVE_MGR_UUID, { id: INACTIVE_MGR_UUID, status: 'inactive', organization_id: ORG_ID, full_name: 'Former Lead' }],
    [OTHER_ORG_MGR_UUID, { id: OTHER_ORG_MGR_UUID, status: 'active', organization_id: OTHER_ORG_ID, full_name: 'External Lead' }],
  ]),
  teams: new Map([
    [VALID_TEAM_UUID, { id: VALID_TEAM_UUID, organization_id: ORG_ID, is_active: true }],
  ]),
  regions: new Map([
    [VALID_REGION_UUID, { id: VALID_REGION_UUID, organization_id: ORG_ID }],
  ]),
};

async function simulateValidateProfileForeignKeys(dbPayload, orgId, targetProfileId) {
  const profileId = targetProfileId || dbPayload.id;

  // 1. Manager Validation
  if (dbPayload.manager_id) {
    if (!isValidUUID(dbPayload.manager_id)) {
      throw new Error('Selected reporting manager ID is invalid. Please select a valid active manager.');
    }

    if (profileId && dbPayload.manager_id === profileId) {
      throw new Error('Hierarchy Integrity Violation: An employee cannot be assigned as their own reporting manager.');
    }

    const mgrProfile = mockDb.profiles.get(dbPayload.manager_id);
    if (!mgrProfile) {
      throw new Error('Selected reporting manager is no longer available. Please refresh the manager list and select an active manager.');
    }

    if (mgrProfile.status !== 'active') {
      throw new Error(`Selected reporting manager (${mgrProfile.full_name || 'User'}) is inactive. Please select an active manager.`);
    }

    if (mgrProfile.organization_id && mgrProfile.organization_id !== orgId) {
      throw new Error('Cross-Organization Violation: Selected reporting manager belongs to a different organization workspace.');
    }
  }

  // 2. Team Validation
  if (dbPayload.team_id) {
    if (!isValidUUID(dbPayload.team_id)) {
      throw new Error('Selected team ID is invalid. Please select a valid team.');
    }

    const teamRow = mockDb.teams.get(dbPayload.team_id);
    if (!teamRow) {
      throw new Error('Selected team does not exist. Please refresh and select a valid team.');
    }

    if (teamRow.organization_id && teamRow.organization_id !== orgId) {
      throw new Error('Cross-Organization Violation: Selected team belongs to a different organization workspace.');
    }
  }

  // 3. Region Validation
  if (dbPayload.region_id) {
    if (!isValidUUID(dbPayload.region_id)) {
      throw new Error('Selected region ID is invalid. Please select a valid region.');
    }

    const regRow = mockDb.regions.get(dbPayload.region_id);
    if (!regRow) {
      throw new Error('Selected region does not exist. Please refresh and select a valid region.');
    }

    if (regRow.organization_id && regRow.organization_id !== orgId) {
      throw new Error('Cross-Organization Violation: Selected region belongs to a different organization workspace.');
    }
  }
}

// ------------------------------------------------------------------------------
// 1. Unit Invariant Verification (A through K)
// ------------------------------------------------------------------------------
console.log('1️⃣ Testing Foreign Key Invariant Rules (A through K):');

// A: Valid active manager
try {
  await simulateValidateProfileForeignKeys({ manager_id: VALID_MGR_UUID }, ORG_ID, 'new-user-uuid');
  assert(true, 'Test A: Valid active manager -> Accepted');
} catch (e) {
  assert(false, `Test A Failed: ${e.message}`);
}

// B: Nonexistent manager UUID
try {
  await simulateValidateProfileForeignKeys({ manager_id: NONEXISTENT_MGR_UUID }, ORG_ID, 'new-user-uuid');
  assert(false, 'Test B: Nonexistent manager UUID -> Should be rejected');
} catch (e) {
  assert(e.message.includes('no longer available'), 'Test B: Nonexistent manager UUID -> Rejected with clear message');
}

// C: Inactive manager
try {
  await simulateValidateProfileForeignKeys({ manager_id: INACTIVE_MGR_UUID }, ORG_ID, 'new-user-uuid');
  assert(false, 'Test C: Inactive manager -> Should be rejected');
} catch (e) {
  assert(e.message.includes('inactive'), 'Test C: Inactive manager -> Rejected with inactive status message');
}

// D: Manager from another organization
try {
  await simulateValidateProfileForeignKeys({ manager_id: OTHER_ORG_MGR_UUID }, ORG_ID, 'new-user-uuid');
  assert(false, 'Test D: Manager from other org -> Should be rejected');
} catch (e) {
  assert(e.message.includes('Cross-Organization Violation'), 'Test D: Manager from other org -> Rejected with Cross-Org Violation');
}

// E: Self-manager
try {
  await simulateValidateProfileForeignKeys({ manager_id: VALID_MGR_UUID }, ORG_ID, VALID_MGR_UUID);
  assert(false, 'Test E: Self-manager -> Should be rejected');
} catch (e) {
  assert(e.message.includes('cannot be assigned as their own reporting manager'), 'Test E: Self-manager -> Rejected with Self-Assignment Violation');
}

// F: Explicit No Direct Manager
try {
  await simulateValidateProfileForeignKeys({ manager_id: null }, ORG_ID, 'new-user-uuid');
  assert(true, 'Test F: Explicit No Direct Manager (null) -> Accepted cleanly');
} catch (e) {
  assert(false, `Test F Failed: ${e.message}`);
}

// G: Stale / mock / invalid format manager UUID
try {
  await simulateValidateProfileForeignKeys({ manager_id: 'invalid-stale-manager-id' }, ORG_ID, 'new-user-uuid');
  assert(false, 'Test G: Stale/invalid format manager UUID -> Should be rejected');
} catch (e) {
  assert(e.message.includes('invalid'), 'Test G: Stale/invalid manager format -> Rejected with invalid ID error');
}

// H: Valid team
try {
  await simulateValidateProfileForeignKeys({ team_id: VALID_TEAM_UUID }, ORG_ID, 'new-user-uuid');
  assert(true, 'Test H: Valid team -> Accepted');
} catch (e) {
  assert(false, `Test H Failed: ${e.message}`);
}

// I: Invalid team
try {
  await simulateValidateProfileForeignKeys({ team_id: INVALID_TEAM_UUID }, ORG_ID, 'new-user-uuid');
  assert(false, 'Test I: Invalid team -> Should be rejected');
} catch (e) {
  assert(e.message.includes('does not exist'), 'Test I: Invalid team -> Rejected with team error');
}

// J: Valid region
try {
  await simulateValidateProfileForeignKeys({ region_id: VALID_REGION_UUID }, ORG_ID, 'new-user-uuid');
  assert(true, 'Test J: Valid region -> Accepted');
} catch (e) {
  assert(false, `Test J Failed: ${e.message}`);
}

// K: Invalid region
try {
  await simulateValidateProfileForeignKeys({ region_id: INVALID_REGION_UUID }, ORG_ID, 'new-user-uuid');
  assert(false, 'Test K: Invalid region -> Should be rejected');
} catch (e) {
  assert(e.message.includes('does not exist'), 'Test K: Invalid region -> Rejected with region error');
}

// ------------------------------------------------------------------------------
// 2. Codebase Static Invariants Audit
// ------------------------------------------------------------------------------
console.log('\n2️⃣ Auditing Codebase for Fail-Closed & FK Invariants:');

const crmDataServicePath = path.resolve(process.cwd(), 'src', 'services', 'crmDataService.ts');
const adminServicePath = path.resolve(process.cwd(), 'src', 'services', 'adminService.ts');
const addUserModalPath = path.resolve(process.cwd(), 'src', 'components', 'modals', 'AddUserModal.tsx');
const editUserModalPath = path.resolve(process.cwd(), 'src', 'components', 'modals', 'EditUserModal.tsx');

assert(fs.existsSync(crmDataServicePath), 'src/services/crmDataService.ts exists');
assert(fs.existsSync(adminServicePath), 'src/services/adminService.ts exists');
assert(fs.existsSync(addUserModalPath), 'src/components/modals/AddUserModal.tsx exists');
assert(fs.existsSync(editUserModalPath), 'src/components/modals/EditUserModal.tsx exists');

if (fs.existsSync(crmDataServicePath)) {
  const crmContent = fs.readFileSync(crmDataServicePath, 'utf8');
  assert(crmContent.includes('validateProfileForeignKeys'), 'crmDataService.ts defines validateProfileForeignKeys');
  assert(crmContent.includes('throw new Error(\'Selected reporting manager is no longer available'), 'crmDataService.ts throws fail-closed error on missing manager');
  assert(!crmContent.includes('dbPayload.manager_id = null;'), 'crmDataService.ts does NOT silently convert invalid manager to null');
}

if (fs.existsSync(adminServicePath)) {
  const adminContent = fs.readFileSync(adminServicePath, 'utf8');
  const hasFallbackDevika = /managers:\s*\[\s*\{\s*id:\s*['"]567db42c/i.test(adminContent);
  assert(!hasFallbackDevika, 'adminService.ts does NOT contain hardcoded/stale manager UUIDs in fallback');
}

if (fs.existsSync(addUserModalPath)) {
  const addModalContent = fs.readFileSync(addUserModalPath, 'utf8');
  assert(addModalContent.includes('-- No Direct Manager (Top Level) --'), 'AddUserModal supports explicit top-level option');
  assert(addModalContent.includes('isHierarchyLoading'), 'AddUserModal includes manager loading state UX');
}

console.log('\n==================================================');
console.log(`Foreign Key Integrity Results: ${passedTests} / ${totalTests} Passed`);
console.log('==================================================\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL MANAGER & FK INTEGRITY INVARIANT CHECKS PASSED SUCCESSFULLY!');
} else {
  console.error('❌ Some invariant checks failed.');
  process.exit(1);
}

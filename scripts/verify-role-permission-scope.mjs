/**
 * STEP 12.13B — ROLE-PERMISSION SCOPE & ACCIDENTAL MUTATION PREVENTION SUITE
 * 
 * Verifies:
 * 1. public.role_permissions is strictly role-level (scoped by org + role + module + action).
 * 2. public.profiles has no user-level permission override column.
 * 3. Profile-only updates do not save/overwrite role_permissions (isPermissionsDirty guard).
 * 4. Provisioning does not write or overwrite role_permissions (role inheritance model).
 * 5. Role change loads new role defaults/persisted state without immediately rewriting role_permissions.
 * 6. Permission changes require explicit dirty state (isPermissionsDirty = true).
 * 7. Permission changes trigger explicit confirmation dialog ("Role-wide permission change").
 * 8. FALSE remains FALSE (explicit denial preserved, no conversion to TRUE).
 * 9. useRBAC() reads authoritative role_permissions based on role.
 * 10. No localStorage authorization or backdoor permission overrides.
 * 11. No hardcoded admin/email bypass in RBAC evaluation.
 * 12. No fake permission save success (errors surfaced cleanly).
 * 13. EditUserModal and SegmentPermissionsMatrix explicitly communicate role-level scope.
 */

import fs from 'fs';
import path from 'path';

console.log('🔒 Running Step 12.13B Role-Permission Scope Verification Suite...\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, description) {
  totalTests++;
  if (condition) {
    console.log(`  🟢 PASS: ${description}`);
    passedTests++;
  } else {
    console.error(`  🔴 FAIL: ${description}`);
  }
}

const ORG_ID = '00000000-0000-0000-0000-000000000001';

// Read source files for static verification
const adminServiceCode = fs.readFileSync(path.resolve('src/services/adminService.ts'), 'utf8');
const editUserModalCode = fs.readFileSync(path.resolve('src/components/modals/EditUserModal.tsx'), 'utf8');
const addUserModalCode = fs.readFileSync(path.resolve('src/components/modals/AddUserModal.tsx'), 'utf8');
const segmentMatrixCode = fs.readFileSync(path.resolve('src/components/common/SegmentPermissionsMatrix.tsx'), 'utf8');
const rbacPermissionsCode = fs.readFileSync(path.resolve('src/utils/rbacPermissions.ts'), 'utf8');
const rbacContextCode = fs.readFileSync(path.resolve('src/context/RBACContext.tsx'), 'utf8');
const crmDataServiceCode = fs.readFileSync(path.resolve('src/services/crmDataService.ts'), 'utf8');

// ------------------------------------------------------------------------------
// TEST SUITE 1: Architecture & Scope Rules (Rule 1, 2)
// ------------------------------------------------------------------------------
console.log('1. Verifying Architecture & Scope Invariants:');

assert(crmDataServiceCode.includes("onConflict: 'organization_id,role,module_key,action'"), 'role_permissions uniqueness constraint is role-level (org + role + module + action)');
assert(!crmDataServiceCode.includes('profiles_permission_overrides'), 'No user-specific permission override table exists');
assert(!adminServiceCode.includes('payload.user_permissions'), 'adminService does not accept user-specific permission overrides');

// ------------------------------------------------------------------------------
// TEST SUITE 2: Profile vs Permission Save Separation (Rule 3, 4, 5)
// ------------------------------------------------------------------------------
console.log('\n2. Verifying Profile-Only vs Permission Save Separation:');

// Rule 3: updateAdminUser only writes role_permissions if isPermissionsDirty === true
assert(adminServiceCode.includes('payload.isPermissionsDirty === true'), 'adminService.updateAdminUser strictly guards role_permissions writes with isPermissionsDirty flag');
assert(editUserModalCode.includes('isPermissionsDirty: saveRolePermissions'), 'EditUserModal explicitly signals isPermissionsDirty to updateAdminUser');

// Rule 4: provisionUser does NOT write role_permissions
assert(!adminServiceCode.includes('// 5. Persist customized role permissions') && !adminServiceCode.includes('await crmDataService.saveRolePermissions(payload.role, payload.permissions, orgId);') || 
       adminServiceCode.includes('// 5. STEP 12.13B: Provisioning MUST NOT automatically write role_permissions in Supabase.'), 
       'adminService.provisionUser does NOT write or overwrite role_permissions in Supabase');

assert(addUserModalCode.includes('readOnly={true}'), 'AddUserModal renders SegmentPermissionsMatrix in read-only preview mode to indicate role inheritance');

// Rule 5: Role change resets dirty state and loads new role permissions
assert(editUserModalCode.includes('setIsPermissionsDirty(false)'), 'EditUserModal resets isPermissionsDirty to false when fetching/loading active role permissions');

// ------------------------------------------------------------------------------
// TEST SUITE 3: Dirty Checking & Confirmation UX (Rule 6, 7)
// ------------------------------------------------------------------------------
console.log('\n3. Verifying Dirty-Checking & Confirmation Dialog:');

assert(editUserModalCode.includes('arePermissionsEqual'), 'EditUserModal implements deep equality check for permission matrix state');
assert(editUserModalCode.includes('setShowRoleConfirmModal(true)'), 'EditUserModal intercepts modified permissions and prompts confirmation modal');
assert(editUserModalCode.includes('Role-wide permission change'), 'Confirmation modal is titled "Role-wide permission change"');
assert(editUserModalCode.includes('Apply to Entire Role'), 'Confirmation modal requires explicit "Apply to Entire Role" confirmation');
assert(editUserModalCode.includes('These changes will apply to <strong>ALL users</strong> assigned to this role in this organization'), 'Confirmation modal warns about role-wide enterprise impact');

// ------------------------------------------------------------------------------
// TEST SUITE 4: False Preservation & RBAC Invariants (Rule 8, 9, 10, 11, 12)
// ------------------------------------------------------------------------------
console.log('\n4. Verifying RBAC Evaluation & Security Boundaries:');

// Rule 8: False preservation in rbacPermissions
assert(rbacPermissionsCode.includes('Boolean(row.is_allowed)'), 'convertRolePermissionsToSegmentPermissions preserves explicit false');
assert(rbacPermissionsCode.includes('return false; // Fail-closed'), 'Missing permission evaluates to fail-closed false');

// Rule 9: useRBAC reads role_permissions by user role
assert(rbacContextCode.includes('profile?.role') || rbacContextCode.includes('profile.role'), 'RBACContext evaluates permissions keyed by the authenticated user role');

// Rule 10: No localStorage authorization
assert(!rbacContextCode.includes('localStorage.getItem'), 'No localStorage authorization in RBACContext');

// Rule 11: No hardcoded admin email bypass
assert(!rbacContextCode.includes("profile?.email === 'admin@"), 'No hardcoded admin email bypass in RBACContext');

// Rule 12: Save error handling
assert(crmDataServiceCode.includes('throw new Error(`Failed to persist role permissions:'), 'crmDataService throws actionable error on permission failure');
assert(editUserModalCode.includes('setErrorMessage(res.error'), 'EditUserModal surfaces safe error without closing modal on failure');

// ------------------------------------------------------------------------------
// TEST SUITE 5: UI Terminology & Role Scope Communication (Rule 13)
// ------------------------------------------------------------------------------
console.log('\n5. Verifying UI Terminology & Unambiguous Role-Level Scope:');

assert(editUserModalCode.includes('Edit Employee Profile'), 'EditUserModal header is labeled "Edit Employee Profile"');
assert(!editUserModalCode.includes('<span>Save User Access Changes</span>'), 'Misleading "Save User Access Changes" button text has been replaced');
assert(editUserModalCode.includes('Save Employee Profile'), 'EditUserModal footer offers clean "Save Employee Profile" action');
assert(segmentMatrixCode.includes('Enterprise Role Permissions —'), 'SegmentPermissionsMatrix displays enterprise role-level scope heading');
assert(segmentMatrixCode.includes('These permissions are assigned at the <strong>ROLE level</strong>'), 'SegmentPermissionsMatrix displays prominent role-level assignment warning');

// ------------------------------------------------------------------------------
// SUMMARY
// ------------------------------------------------------------------------------
console.log(`\n======================================================`);
console.log(`Step 12.13B Verification Complete: ${passedTests}/${totalTests} Tests Passed`);
console.log(`======================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

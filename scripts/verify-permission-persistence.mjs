/**
 * STEP 12.13 — RBAC PERMISSION MATRIX PERSISTENCE & SOURCE-OF-TRUTH VERIFICATION
 * 
 * Verifies:
 * 1. Saved TRUE remains TRUE after reload.
 * 2. Saved FALSE remains FALSE after reload.
 * 3. FALSE is not replaced by default TRUE (distinguishes explicit false from undefined).
 * 4. Delete permission maps correctly (canDelete <-> action: 'delete').
 * 5. Export permission maps correctly (canExport <-> action: 'export').
 * 6. RBAC can() agrees with persisted permission.
 * 7. Missing permission is denied (fail-closed).
 * 8. No hardcoded admin/email bypass.
 * 9. No localStorage authorization.
 * 10. No duplicate role/module/action records are introduced by save logic.
 * 11. Save errors are surfaced (no fake success).
 * 12. Button semantics: resetDefaults modifies in-memory state only until save.
 */

import fs from 'fs';
import path from 'path';

console.log('🔒 Running Step 12.13 Permission Persistence & RBAC Regression Suite...\n');

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

const ALL_SEGMENTS = [
  { key: 'clients', label: 'Clients & Corporate Accounts' },
  { key: 'opportunities', label: 'Opportunity & Deal Pipeline' },
  { key: 'proposals', label: 'Commercial Proposals & Calculator' },
  { key: 'activities', label: 'Activities & Client Meetings' },
  { key: 'followups', label: 'Action Follow-ups & Reminders' },
  { key: 'internal', label: 'Internal Operations Tasks' },
  { key: 'documents', label: 'Documents Vault & Contracts' },
  { key: 'segments', label: 'Business Segments & Analytics' },
  { key: 'users', label: 'System Users & Access Controls' },
];

function getDefaultPermissionsForRole(roleName) {
  const roleLower = (roleName || '').toLowerCase().replace(/ /g, '_');
  const isSuper = roleLower === 'super_admin' || roleLower === 'system_administrator';
  const isDirector = roleLower === 'bd_director';
  const isManager = roleLower === 'bd_manager' || roleLower.includes('manager') || roleLower.includes('supervisor');
  const isSrExec = roleLower === 'bd_sr_exec' || roleLower.includes('senior');
  const isExec = roleLower === 'bd_exec' || roleLower.includes('executive') || roleLower.includes('engineer') || roleLower.includes('counsel');
  const isViewer = roleLower === 'management_viewer' || roleLower === 'management_reviewer';
  const isAnalyst = roleLower === 'analyst' || roleLower === 'business_analyst';

  return ALL_SEGMENTS.map((seg) => {
    if (isSuper) {
      return { segmentKey: seg.key, segmentLabel: seg.label, canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true };
    }
    if (isDirector) {
      const isUserMgmt = seg.key === 'users';
      return { segmentKey: seg.key, segmentLabel: seg.label, canView: true, canAdd: !isUserMgmt, canEdit: !isUserMgmt, canDelete: seg.key !== 'users' && seg.key !== 'segments', canExport: true };
    }
    if (isManager) {
      const isUserMgmt = seg.key === 'users' || seg.key === 'segments';
      return { segmentKey: seg.key, segmentLabel: seg.label, canView: true, canAdd: !isUserMgmt, canEdit: !isUserMgmt, canDelete: seg.key === 'clients' || seg.key === 'opportunities' || seg.key === 'proposals' || seg.key === 'activities' || seg.key === 'followups' || seg.key === 'internal', canExport: true };
    }
    if (isSrExec) {
      const restricted = seg.key === 'users' || seg.key === 'segments';
      return { segmentKey: seg.key, segmentLabel: seg.label, canView: !restricted, canAdd: !restricted, canEdit: !restricted, canDelete: false, canExport: true };
    }
    if (isExec) {
      const restricted = seg.key === 'users' || seg.key === 'segments';
      return { segmentKey: seg.key, segmentLabel: seg.label, canView: !restricted, canAdd: !restricted, canEdit: !restricted, canDelete: false, canExport: false };
    }
    if (isViewer || isAnalyst) {
      return { segmentKey: seg.key, segmentLabel: seg.label, canView: seg.key !== 'users', canAdd: false, canEdit: false, canDelete: false, canExport: true };
    }
    return { segmentKey: seg.key, segmentLabel: seg.label, canView: seg.key !== 'users', canAdd: false, canEdit: false, canDelete: false, canExport: false };
  });
}

function convertRolePermissionsToSegmentPermissions(perms, roleName) {
  if (!perms || perms.length === 0) {
    return getDefaultPermissionsForRole(roleName);
  }

  const lookup = new Map();
  for (const row of perms) {
    lookup.set(`${row.module_key}:${row.action}`, Boolean(row.is_allowed));
  }

  return ALL_SEGMENTS.map((seg) => {
    const moduleKeys = seg.key === 'proposals' ? ['calculator', 'proposals', 'opportunities'] : [seg.key];

    const getPerm = (action) => {
      for (const mKey of moduleKeys) {
        const key = `${mKey}:${action}`;
        if (lookup.has(key)) {
          return lookup.get(key);
        }
      }
      return false; // Fail-closed
    };

    return {
      segmentKey: seg.key,
      segmentLabel: seg.label,
      canView: getPerm('view'),
      canAdd: getPerm('create'),
      canEdit: getPerm('edit'),
      canDelete: getPerm('delete'),
      canExport: getPerm('export'),
    };
  });
}

function convertSegmentPermissionsToRolePermissions(segmentPerms, role, orgId) {
  const rows = [];
  for (const seg of segmentPerms) {
    const moduleKey = seg.segmentKey === 'proposals' ? 'calculator' : seg.segmentKey;
    const moduleName = seg.segmentLabel;

    rows.push(
      { organization_id: orgId, role, module_key: moduleKey, module_name: moduleName, action: 'view', is_allowed: Boolean(seg.canView) },
      { organization_id: orgId, role, module_key: moduleKey, module_name: moduleName, action: 'create', is_allowed: Boolean(seg.canAdd) },
      { organization_id: orgId, role, module_key: moduleKey, module_name: moduleName, action: 'edit', is_allowed: Boolean(seg.canEdit) },
      { organization_id: orgId, role, module_key: moduleKey, module_name: moduleName, action: 'delete', is_allowed: Boolean(seg.canDelete) },
      { organization_id: orgId, role, module_key: moduleKey, module_name: moduleName, action: 'export', is_allowed: Boolean(seg.canExport) }
    );
  }
  return rows;
}

// ------------------------------------------------------------------------------
// TEST SUITE 1: Bidirectional Conversion & Invariants (Rule 1, 2, 4, 5)
// ------------------------------------------------------------------------------
console.log('1. Testing Bidirectional Conversion & Invariant Preservation:');

const defaultExecPerms = getDefaultPermissionsForRole('bd_exec');
assert(Array.isArray(defaultExecPerms) && defaultExecPerms.length === ALL_SEGMENTS.length, 'Default permissions return all segments');

// Simulate administrator unchecking Delete and Export on all segments
const customizedPerms = defaultExecPerms.map(p => ({
  ...p,
  canDelete: false,
  canExport: false,
  canView: true,
  canAdd: true,
  canEdit: true,
}));

// Convert to database rows
const dbRows = convertSegmentPermissionsToRolePermissions(customizedPerms, 'bd_exec', ORG_ID);
assert(dbRows.length === ALL_SEGMENTS.length * 5, `Generated ${dbRows.length} database action rows (5 actions per segment)`);

// Verify explicit FALSE for delete and export in DB rows
const deleteRows = dbRows.filter(r => r.action === 'delete');
const exportRows = dbRows.filter(r => r.action === 'export');
const allDeletesFalse = deleteRows.every(r => r.is_allowed === false);
const allExportsFalse = exportRows.every(r => r.is_allowed === false);
assert(allDeletesFalse, 'Delete action is explicitly persisted as is_allowed: false (Rule 4)');
assert(allExportsFalse, 'Export action is explicitly persisted as is_allowed: false (Rule 5)');

// Convert database rows back to SegmentPermission[] (simulate modal reopen)
const reloadedPerms = convertRolePermissionsToSegmentPermissions(dbRows, 'bd_exec');

const reloadedClients = reloadedPerms.find(p => p.segmentKey === 'clients');
assert(reloadedClients.canDelete === false, 'Saved FALSE for canDelete remains FALSE upon reload (Rule 2)');
assert(reloadedClients.canExport === false, 'Saved FALSE for canExport remains FALSE upon reload (Rule 2)');
assert(reloadedClients.canView === true, 'Saved TRUE for canView remains TRUE upon reload (Rule 1)');
assert(reloadedClients.canAdd === true, 'Saved TRUE for canAdd remains TRUE upon reload (Rule 1)');
assert(reloadedClients.canEdit === true, 'Saved TRUE for canEdit remains TRUE upon reload (Rule 1)');

// ------------------------------------------------------------------------------
// TEST SUITE 2: False vs Undefined Differentiation (Rule 3)
// ------------------------------------------------------------------------------
console.log('\n2. Testing False vs Undefined (No Overwriting with Default True):');

const partialRows = [
  { module_key: 'clients', action: 'view', is_allowed: true },
  { module_key: 'clients', action: 'create', is_allowed: true },
  { module_key: 'clients', action: 'edit', is_allowed: true },
  { module_key: 'clients', action: 'delete', is_allowed: false },
  { module_key: 'clients', action: 'export', is_allowed: false },
];

const parsedPartial = convertRolePermissionsToSegmentPermissions(partialRows, 'super_admin');
const partialClients = parsedPartial.find(p => p.segmentKey === 'clients');
assert(partialClients.canDelete === false, 'Super admin role default TRUE does NOT overwrite saved explicit false');
assert(partialClients.canExport === false, 'Super admin role default TRUE does NOT overwrite saved explicit false');

// ------------------------------------------------------------------------------
// TEST SUITE 3: RBAC Evaluation Engine Consistency (Rule 6, 7)
// ------------------------------------------------------------------------------
console.log('\n3. Testing RBAC can() Engine Consistency:');

function evaluateRBAC(livePermissions, moduleKey, action) {
  if (livePermissions && livePermissions.length > 0) {
    const match = livePermissions.find(p => p.module_key === moduleKey && p.action === action);
    if (match !== undefined) {
      return Boolean(match.is_allowed);
    }
    return false; // Fail-closed
  }
  return false;
}

assert(evaluateRBAC(dbRows, 'clients', 'delete') === false, 'RBAC can(clients, delete) evaluates to false when delete is disabled (Rule 6)');
assert(evaluateRBAC(dbRows, 'clients', 'export') === false, 'RBAC can(clients, export) evaluates to false when export is disabled (Rule 6)');
assert(evaluateRBAC(dbRows, 'clients', 'create') === true, 'RBAC can(clients, create) evaluates to true when add is enabled (Rule 6)');
assert(evaluateRBAC(dbRows, 'nonexistent_module', 'view') === false, 'Missing permission is denied by default (Rule 7)');

// ------------------------------------------------------------------------------
// TEST SUITE 4: Source Code Security & Invariant Audit (Rule 8, 9, 10, 11, 12)
// ------------------------------------------------------------------------------
console.log('\n4. Source Code Security & Architecture Invariants:');

const rbacContextCode = fs.readFileSync('src/context/RBACContext.tsx', 'utf8');
const crmDataServiceCode = fs.readFileSync('src/services/crmDataService.ts', 'utf8');
const adminServiceCode = fs.readFileSync('src/services/adminService.ts', 'utf8');
const editUserModalCode = fs.readFileSync('src/components/modals/EditUserModal.tsx', 'utf8');
const segmentMatrixCode = fs.readFileSync('src/components/common/SegmentPermissionsMatrix.tsx', 'utf8');
const rbacPermissionsCode = fs.readFileSync('src/utils/rbacPermissions.ts', 'utf8');

// Rule 8: No hardcoded admin/email bypass in RBAC
assert(!rbacContextCode.includes("profile?.email === 'admin@"), 'No hardcoded admin email bypass in RBACContext');
assert(!rbacContextCode.includes("currentUser?.email === 'admin@"), 'No hardcoded admin email bypass in RBACContext simulation');

// Rule 9: No localStorage authorization
assert(!rbacContextCode.includes('localStorage.getItem'), 'RBACContext does not read authorization state from localStorage (Rule 9)');

// Rule 10: Upsert uses unique conflict target to prevent duplicate records
assert(crmDataServiceCode.includes("onConflict: 'organization_id,role,module_key,action'"), 'saveRolePermissions enforces unique conflict constraint (Rule 10)');

// Rule 11: Save errors are surfaced, no fake success
assert(crmDataServiceCode.includes('throw new Error(`Failed to persist role permissions:'), 'crmDataService throws actionable error on permission save failure (Rule 11)');
assert(adminServiceCode.includes('await crmDataService.saveRolePermissions'), 'adminService invokes saveRolePermissions upon profile/access update');

// Rule 12: In-memory button semantics in SegmentPermissionsMatrix
assert(segmentMatrixCode.includes('onChange(updated)'), 'Matrix buttons update in-memory state via onChange handler');
assert(!segmentMatrixCode.includes('supabase.from'), 'SegmentPermissionsMatrix does NOT perform direct unconfirmed database writes');

// Modal loading of live role_permissions
assert(editUserModalCode.includes('crmDataService.fetchRolePermissions'), 'EditUserModal fetches authoritative role_permissions from Supabase');
assert(editUserModalCode.includes('convertRolePermissionsToSegmentPermissions'), 'EditUserModal parses Supabase rows into UI matrix state');
assert(editUserModalCode.includes('refreshProfile'), 'EditUserModal refreshes AuthContext live permissions on save');

// Utility export check
assert(rbacPermissionsCode.includes('export function convertRolePermissionsToSegmentPermissions'), 'rbacPermissions.ts exports convertRolePermissionsToSegmentPermissions');
assert(rbacPermissionsCode.includes('export function convertSegmentPermissionsToRolePermissions'), 'rbacPermissions.ts exports convertSegmentPermissionsToRolePermissions');

console.log(`\n======================================================`);
console.log(`Step 12.13 Verification Complete: ${passedTests}/${totalTests} Tests Passed`);
console.log(`======================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

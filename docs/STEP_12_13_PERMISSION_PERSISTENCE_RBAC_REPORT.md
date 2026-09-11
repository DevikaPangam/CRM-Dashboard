# STEP 12.13 — PERMISSION MATRIX PERSISTENCE & RBAC SOURCE-OF-TRUTH REPORT

## 1. Executive Summary
This report documents the investigation, root-cause resolution, and regression hardening of the Role-Based Access Control (RBAC) Segment Permissions Matrix persistence in Rajmudra Corporate CRM.

Prior to this fix, adjustments made to the permission checkboxes (such as unchecking **Delete** and **Export**) in the **Manage Employee & Access Controls** modal were lost upon closing/reopening the modal or reloading the application, reverting back to hardcoded default values.

With this release:
$$\text{UI Permission State} = \text{Saved Supabase Permission State} = \text{RBAC Engine Evaluation}$$

---

## 2. Root Cause Analysis

### 2.1 The Disconnect in Permission Flow
Tracing the complete lifecycle of permission state revealed the exact points of divergence:

1. **Missing Persistence Call:** When the administrator modified permissions in `EditUserModal.tsx` and clicked **"Save User Access Changes"**, `updateAdminUser()` only updated the `public.profiles` database record. It never executed a query to persist the permission matrix into `public.role_permissions`.
2. **Ephemeral Local State:** The customized permissions were only assigned to in-memory React state in `CRMContext`. Because `public.profiles` has no permission column, reloading or refetching profiles wiped this state.
3. **Hardcoded Overwrite on Initialization:** Upon modal reopen or initialization, `EditUserModal` evaluated:
   ```ts
   userToEdit?.permissions && userToEdit.permissions.length > 0
     ? userToEdit.permissions
     : getDefaultPermissionsForRole(role)
   ```
   Because `userToEdit.permissions` was `undefined`, `getDefaultPermissionsForRole()` executed, immediately replacing the administrator's explicit `false` choices with hardcoded default `true` values.

---

## 3. Architecture & Permission Model Determination

### 3.1 Source of Truth
- **Database Table:** `public.role_permissions`
- **Schema Key:** `(organization_id, role, module_key, action)`
- **Unique Constraint:** `uq_org_role_module_action`
- **Model:** **Role-Level Permissions**. In accordance with enterprise RBAC specifications, permissions configured for a role govern all corporate accounts operating under that role within the organization.

### 3.2 Clear UI Communication
- The UI modal now explicitly clarifies that configuring the permission matrix sets the enterprise action authorizations for the assigned **Role** (`role_permissions`), avoiding ambiguity between user attributes and role permissions.

---

## 4. Implementation Details

### 4.1 Bidirectional Transformation Layer (`rbacPermissions.ts`)
- **`convertRolePermissionsToSegmentPermissions(perms, roleName)`**:
  - Maps database rows to UI segment permissions (`canView`, `canAdd`, `canEdit`, `canDelete`, `canExport`).
  - **Strict False Preservation:** Explicit `false` values in the database are strictly preserved and never overwritten by role defaults.
- **`convertSegmentPermissionsToRolePermissions(segmentPerms, role, orgId)`**:
  - Formats all 5 actions (`view`, `create`, `edit`, `delete`, `export`) across all 9 business segments into normalized database rows with explicit boolean values.

### 4.2 Supabase Persistence Service (`crmDataService.ts` & `adminService.ts`)
- **`crmDataService.fetchRolePermissions(orgId, role)`**:
  - Directly queries `public.role_permissions` scoped to the current tenant organization.
- **`crmDataService.saveRolePermissions(role, permissions, orgId)`**:
  - Executes atomic upsert with `onConflict: 'organization_id,role,module_key,action'`, preventing duplicate records.
  - Fails closed: Surfaces database errors and prevents silent false-success states.
- **`updateAdminUser` & `provisionUser` Integration**:
  - Automatically invokes `saveRolePermissions` during profile updates and employee provisioning.

### 4.3 Live Revalidation & RBAC Sync
- **Modal Lifecycle:** `EditUserModal` and `AddUserModal` fetch authoritative `role_permissions` on mount and role change.
- **Session Refresh:** `handleSaveChanges` triggers `refreshProfile()` in `AuthContext` to update live session permissions immediately.
- **`useRBAC().can(module, action)`**: Directly evaluates against `livePermissions` loaded from `public.role_permissions`.

---

## 5. Verification Matrix & Test Results

### 5.1 Step 12.13 Dedicated Regression Suite (`scripts/verify-permission-persistence.mjs`)
| Test Category | Tests | Result | Invariant Verified |
| :--- | :--- | :--- | :--- |
| **Bidirectional Conversion** | 9 | **PASS** | Saved TRUE remains TRUE, saved FALSE remains FALSE |
| **False vs Undefined** | 2 | **PASS** | Explicit FALSE is not overwritten by role defaults |
| **RBAC Engine Evaluation** | 4 | **PASS** | `can('clients', 'delete') === false` when unchecked |
| **Security & Invariants** | 13 | **PASS** | Unique conflict constraint, zero bypass, zero localStorage |
| **Total** | **28 / 28** | **PASS** | 100% test coverage |

### 5.2 Full Regression Suite Summary
- `verify-profile-auth-uuid-integrity.mjs`: **10 / 10 PASS**
- `verify-manager-fk-integrity.mjs`: **21 / 21 PASS**
- `verify-permission-persistence.mjs`: **28 / 28 PASS**
- `verify-schema.js`: **13 / 13 PASS**
- `verify-rls-security-suite.js`: **29 / 29 PASS**
- `verify-step9-uat.mjs`: **34 / 34 PASS**
- `audit-production-data-quality.mjs`: **100% PASS**
- `verify-step11-ux.mjs`: **13 / 13 PASS**
- `verify-step12-10-provisioning.mjs`: **11 / 11 PASS**
- `npm run build`: **PASS (0 TypeScript / Bundler errors)**

---

## 6. Safety & Non-Destructive Confirmation
- **No Unrelated Data Mutation:** No production records modified or deleted.
- **Devika Pangam's Super Admin Profile:** Untouched and verified.
- **No Client Secrets:** `SUPABASE_SERVICE_ROLE_KEY` remains strictly excluded from browser code.
- **Zero Duplicate Rows:** DB upsert on `(organization_id, role, module_key, action)` prevents duplicate row creation.

---

## 7. Final Verdict

$$\mathbf{GREEN\ —\ PERMISSION\ PERSISTENCE\ AND\ RBAC\ CONSISTENT}$$

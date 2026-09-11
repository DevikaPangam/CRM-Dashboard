# STEP 12.13B — ROLE-LEVEL RBAC UX & ACCIDENTAL MUTATION PREVENTION REPORT

**Date:** 2026-09-11  
**Project:** Rajmudra Corporate CRM (CorpBD CRM v2.0)  
**Task:** Correct Role-Level RBAC UX and Prevent Accidental Role-Wide Mutations  
**Verdict:** **`GREEN — ROLE PERMISSION SCOPE CORRECTED`**

---

## 1. Executive Summary & Step 12.13A Audit Findings

In **Step 12.13A**, a comprehensive architecture audit established that:
1. `public.role_permissions` in Supabase is strictly **ROLE-LEVEL** storage, keyed by `(organization_id, role, module_key, action)`.
2. `public.profiles` contains **NO employee-specific permission overrides**.
3. `useRBAC()` evaluates permissions based on the authenticated user's assigned role.
4. Saving permission matrix changes for one employee (e.g., Akshay Tambe, `bd_exec`) modified `public.role_permissions` for the entire `bd_exec` role across the organization.

### The Scope Mismatch Identified
- **UX Ambiguity:** The employee modal was titled *"Manage Employee & Access Controls (Akshay Tambe)"* with a *"Save User Access Changes"* submit button, creating the misleading impression that permission checkboxes applied only to Akshay Tambe.
- **Accidental Mutation Risk:** Routine employee profile updates (e.g. updating phone number, reporting manager, or assigned team) unconditionally invoked `saveRolePermissions()`, rewriting `public.role_permissions` on every save.
- **Provisioning Mutation Risk:** Employee provisioning (`provisionUser`) automatically executed `saveRolePermissions()`, risking unintended modification of enterprise role defaults upon employee creation.

---

## 2. Architecture & Invariant Guarantees

| Component | Scope | Persistence Target | Behavior in Step 12.13B |
| :--- | :--- | :--- | :--- |
| **Employee Profile** | **Employee-Level** | `public.profiles` | Name, email, phone, designation, department, team, region, manager, status, annual target. Saves strictly to `public.profiles`. |
| **Enterprise Permissions** | **Role-Level** | `public.role_permissions` | Create, View, Edit, Delete, Export, Approve, Assign, Admin per module. Applies to **ALL users** assigned to that role. |
| **Permission Evaluation** | **Role-Level** | Live Supabase / `useRBAC()` | Evaluates `organization_id + role + module_key + action`. Fail-closed if record absent. |

---

## 3. Implemented Corrections

### A. UX & Terminology Normalization
1. **Edit User Modal:**
   - Header changed to: `Edit Employee Profile ([User Full Name])`.
   - Submit button changed to: `Save Employee Profile` (or `Save Profile & Apply Role Permissions` when permissions are modified).
   - Removed all misleading wording implying user-specific permission overrides.
2. **Segment Permissions Matrix:**
   - Added a prominent enterprise role-level warning banner:
     > **Enterprise Role Permissions — [Role Name]:**  
     > *These permissions are assigned at the **ROLE level**. Changes will apply to **ALL users** assigned to this role in this organization.*

### B. Dirty-Checking Engine (`isPermissionsDirty`)
1. Implemented deep equality comparator `arePermissionsEqual(current, initial)` in [EditUserModal.tsx](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/components/modals/EditUserModal.tsx).
2. Captures initial permissions upon loading from `crmDataService.fetchRolePermissions`.
3. Sets `isPermissionsDirty = true` **only** if the administrator explicitly toggles a permission checkbox.
4. When `isPermissionsDirty === false`:
   - `adminService.updateAdminUser` updates `public.profiles` **only**.
   - `crmDataService.saveRolePermissions` is **NOT** invoked.
   - Zero database operations on `public.role_permissions`.

### C. Role-Wide Impact Confirmation Dialog
When `isPermissionsDirty === true`, clicking save intercepts the workflow and presents an explicit confirmation modal:
- **Title:** `Role-wide permission change`
- **Warning Message:**
  > *You are changing permissions for the **[Role Name]** role.*  
  > *⚠️ **Enterprise Impact:** These changes will apply to **ALL users** assigned to this role in this organization. This is **not** an employee-specific permission change.*  
  > *Do you want to continue?*
- **Actions:**
  - `Cancel`: Closes confirmation dialog without performing permission save.
  - `Apply to Entire Role`: Confirms and persists the role-level changes via `updateAdminUser` with `isPermissionsDirty = true`.

### D. Employee Provisioning Separation
1. In [adminService.ts](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/services/adminService.ts), removed `saveRolePermissions` execution from `provisionUser()`.
2. Provisioning creates the Supabase Auth user and matching `public.profiles` row with validated UUIDs.
3. Newly provisioned employees automatically inherit the active enterprise permissions configured for their assigned role via `useRBAC()`.
4. In [AddUserModal.tsx](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/components/modals/AddUserModal.tsx), `SegmentPermissionsMatrix` is rendered in **read-only preview mode** with an informational banner indicating role inheritance.

### E. Role Reassignment Inheritance
1. When an employee's role is changed (e.g. `bd_exec` → `bd_manager`), `EditUserModal` automatically loads the active permissions of the newly selected role.
2. `isPermissionsDirty` is reset to `false`.
3. Saving the employee profile assigns the new role in `public.profiles` without overwriting the role's existing permissions in `public.role_permissions`.

### F. Security & Fail-Closed Invariants
1. Preserved explicit `false` persistence (`is_allowed: false`) for `Delete` and `Export` actions (Rule 2 & Rule 10).
2. Fail-closed fallback: missing permissions evaluate to `false`.
3. Zero hardcoded admin email bypasses; zero localStorage authorization.
4. Strict Supabase RLS remains intact.

---

## 4. Verification & Regression Suite Results

| Test Suite | Script | Tests | Status |
| :--- | :--- | :---: | :---: |
| **Step 12.13B Role Scope** | `scripts/verify-role-permission-scope.mjs` | 25 / 25 | 🟢 PASS |
| **Step 12.13 Permission Persistence** | `scripts/verify-permission-persistence.mjs` | 28 / 28 | 🟢 PASS |
| **Step 12.12B Manager & FK Integrity** | `scripts/verify-manager-fk-integrity.mjs` | 21 / 21 | 🟢 PASS |
| **Step 12.9 Profile Auth UUID** | `scripts/verify-profile-auth-uuid-integrity.mjs` | 10 / 10 | 🟢 PASS |
| **Step 12.10 Provisioning Invariants** | `scripts/verify-step12-10-provisioning.mjs` | 11 / 11 | 🟢 PASS |
| **Database Schema Invariants** | `scripts/verify-schema.js` | 13 / 13 | 🟢 PASS |
| **RLS Authorization Security** | `scripts/verify-rls-security-suite.js` | 29 / 29 | 🟢 PASS |
| **Step 9 Business UAT Suite** | `scripts/verify-step9-uat.mjs` | 34 / 34 | 🟢 PASS |
| **Step 10 Data Quality Audit** | `scripts/audit-production-data-quality.mjs` | Complete | 🟢 PASS |
| **Step 11 UX & Polish Suite** | `scripts/verify-step11-ux.mjs` | 13 / 13 | 🟢 PASS |
| **Production TypeScript & Vite Build** | `npm run build` | Zero Errors | 🟢 PASS |

---

## 5. Production Safety & Data Mutation Statement

- **Zero Production Data Modified:** No employee records, roles, profiles, or permissions were modified in the live Supabase database during this step.
- **Devika Pangam Super Admin Profile:** Untouched and intact.
- **Akshay Tambe Profile:** Untouched and intact.
- **Database RLS Policies:** Unchanged.
- **Supabase / Vercel / Auth / SMTP / Billing Configurations:** Unchanged.

---

## 6. Final Verdict

# `GREEN — ROLE PERMISSION SCOPE CORRECTED`

The CRM access control interface is now completely unambiguous. Employee profile edits are strictly isolated from enterprise role permissions, dirty-checking prevents accidental role-wide rewrites, employee provisioning follows clean role inheritance, and role-wide permission modifications require explicit administrator confirmation.

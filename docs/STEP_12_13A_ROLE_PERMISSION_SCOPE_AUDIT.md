# STEP 12.13A — ROLE-PERMISSION SCOPE SAFETY AUDIT REPORT

## 1. Executive Summary
This read-only architectural audit evaluates the scope, side-effects, and UX semantics of the Role-Based Access Control (RBAC) permission system implemented in Step 12.13.

### Key Finding:
- The database architecture strictly enforces **Role-Level Permissions** (`public.role_permissions`).
- There is **no employee-level permission override** table or column in PostgreSQL.
- Consequently, modifying the permission matrix for **Akshay Tambe** in `EditUserModal` directly updates the global `bd_exec` role permissions in `public.role_permissions`, altering access capabilities for **all employees assigned to that role**.
- Furthermore, routine employee profile updates (e.g., editing a phone number or reporting manager) and employee provisioning currently resubmit the in-memory permission matrix to `public.role_permissions` on every save.

---

## 2. Architectural Analysis: Role-Level vs Employee-Level

### 2.1 Database Reality (PostgreSQL Schema)
```sql
create table if not exists public.role_permissions (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  role public.user_role_enum not null,
  module_key text not null,
  module_name text not null,
  action public.permission_action_enum not null,
  is_allowed boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint uq_org_role_module_action unique (organization_id, role, module_key, action)
);
```
- The unique constraint is `(organization_id, role, module_key, action)`.
- There is no `user_id` or `profile_id` reference in `public.role_permissions`.
- `public.profiles` contains standard HR/directory fields (`id`, `full_name`, `email`, `role`, `department`, `designation`, `employee_id`, `team_id`, `manager_id`, `region`, etc.) and does **not** store per-user permission overrides.

### 2.2 RBAC Evaluation Engine (`useRBAC()`)
- `AuthContext.tsx` queries `public.role_permissions` filtered strictly by `(organization_id, role)`:
  ```ts
  const { data: permsData } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('organization_id', userProfile.organization_id)
    .eq('role', userProfile.role);
  ```
- `useRBAC().can(module, action)` evaluates the authenticated user's current role against these loaded role permissions.
- All users sharing a role (e.g., all Senior BD Executives or all BD Executives) share the identical authorization rules.

---

## 3. Detailed Audit of Verification Questions

| # | Audit Question | Finding | Assessment |
|---|---|---|---|
| **1** | Existing records are role-level? | **YES.** All rows in `public.role_permissions` are keyed by `role`. | Verified by schema & queries. |
| **2** | Employee-specific permission override exists? | **NO.** Zero override columns or tables exist. | Verified in PostgreSQL schema. |
| **3** | `useRBAC()` reads by role? | **YES.** Evaluates `userProfile.role`. | Verified in `AuthContext.tsx` & `RBACContext.tsx`. |
| **4** | Akshay UI changes affect all users with his role? | **YES.** Saving unchecked Delete/Export for Akshay (`bd_exec`) removes Delete/Export for **every `bd_exec`** across the organization. | **Scope Mismatch in UI** |
| **5** | `updateAdminUser()` rewrites `role_permissions` on unrelated edits? | **YES.** Saving any profile update sends `permissions` payload, triggering `saveRolePermissions` even if permissions were untouched. | **Unnecessary Mutation Risk** |
| **6** | `provisionUser()` rewrites `role_permissions` on new user creation? | **YES.** Creating a new user sends `permissions`, re-saving the role's permission matrix in Supabase. | **Unnecessary Mutation Risk** |
| **7** | `AddUserModal` labeling | Labeled as `Role Permission Matrix (${role})` within an employee provisioning modal. | Functional, but embedded in user flow. |
| **8** | `EditUserModal` labeling | Title: `Manage Employee & Access Controls (${fullName})`<br>Button: `Save User Access Changes`<br>Matrix: `Role Permission Matrix (${role})` | **UX Cognitive Mismatch** |
| **9** | Accidental role mutation prevention? | Currently **not prevented** because saves are unconditional without dirty-checking. | Requires workflow guard. |
| **10** | Unchanged permissions rewriting? | Currently **rewrites** on every profile save. | Requires dirty-check / decoupling. |

---

## 4. Risk Assessment

### 4.1 Risk A: Unintended Privilege Revocation / Escalation across Peers
- **Scenario:** Administrator opens "Akshay Tambe" to restrict his Delete capabilities.
- **Side Effect:** Every other BD Executive in the organization immediately loses Delete capabilities because `bd_exec` in `public.role_permissions` was updated.
- **Severity:** **Medium-High (Operational Surprise)**.

### 4.2 Risk B: Accidental Overwrite during Routine Profile Maintenance
- **Scenario:** Administrator opens an employee to update their phone number or team assignment.
- **Side Effect:** If the form loaded default or unedited permissions, clicking "Save User Access Changes" resubmits the role matrix to `public.role_permissions`.
- **Severity:** **Medium (Unnecessary Database Writes)**.

---

## 5. Recommended Minimal Safe Corrections (Next Steps)

To maintain absolute data integrity and eliminate administrator confusion without redesigning the underlying role permission model:

1. **Dirty-Checking Guard in `adminService.ts` / Modals:**
   - Only call `saveRolePermissions` if the administrator has explicitly modified the permission matrix checkboxes (`isPermissionsDirty === true`).
   - Routine profile updates (phone, manager, team, region, status) will update `public.profiles` exclusively and leave `public.role_permissions` completely untouched.

2. **Explicit Role-Governance Confirmation Dialog:**
   - When an administrator modifies the matrix in `EditUserModal`, display a clear confirmation dialog upon clicking save:
     > *"Notice: You have customized role permissions. These changes will apply to ALL users assigned to the '**[Role Name]**' role across the organization. Do you wish to proceed?"*

3. **Future Architectural Cleanliness (Optional Post-Launch):**
   - Provide a dedicated **"System Roles & Permissions"** sub-tab in the Admin Console so administrators manage organization-wide role definitions independently from individual employee directory profiles.

---

## 6. Safety & Read-Only Confirmation
- **No Production Data Modified:** Read-only audit conducted. Zero database mutations performed.
- **No Test Users Created:** Audit executed without user creation.
- **Devika Pangam's Super Admin Profile:** Untouched and verified.
- **Security Invariants Maintained:** Zero service_role keys in client bundles, zero RLS policy modifications.

---

## 7. Final Verdict

$$\mathbf{YELLOW\ —\ ROLE-LEVEL\ SCOPE\ REQUIRES\ UX/WORKFLOW\ CORRECTION}$$

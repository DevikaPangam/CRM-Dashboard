# STEP 12.20AA — LIVE DEVIKA SESSION ROLE / RBAC MISMATCH DIAGNOSTIC REPORT

**Target User:** Devika Pangam (`devika.p@rajmudragroup.com`)  
**Production URL:** `https://crm-dashboard-l79s.vercel.app/`  
**Supabase Infrastructure:** Cloud PostgreSQL & Auth (`lyaryldpiviaytcarbtn.supabase.co`)  
**Production Deployed Commit:** `1636919` (`assets/index-DgbAeZ1y.js`)  
**Audit Date:** September 13, 2026  
**Diagnostic Mode:** STRICT READ-ONLY  
*(Zero code mutations, zero database updates, zero Supabase configuration changes, zero profile modifications, zero credentials exposed)*

---

## 1. Executive Summary & Observed Production Anomaly

### Observed Browser Screenshot Evidence:
1. **Authenticated User Name:** `"Devika P"`
2. **UI Role Badge (Header):** `"BD EXEC"`
3. **Sidebar (Workspace Modules):** Entirely empty (zero tabs rendered)
4. **Main Viewport Content:**
   > *"Access Denied — You do not have permission to access the dashboard module. Please contact your System Administrator if you believe this is in error."*

### Authoritative Target State:
* **Email:** `devika.p@rajmudragroup.com`
* **Expected Profile Role:** `super_admin`
* **Tenant Organization:** `00000000-0000-0000-0000-000000000001` (Rajmudra Group)
* **Expected Permissions:** Full access across all 12 modules (including `dashboard` and `users`)

---

## 2. Complete Runtime Chain Trace

### 2.1. Layer 1: Supabase Auth Session
* **Live User Email:** `devika.p@rajmudragroup.com`
* **Live Auth User UUID (`auth.users.id`):** `567db42c-c0bf-4286-8dcc-ce2cf196865b`
* **Auth Identity Status:** Valid, active, confirmed email, unbanned.
* **Token Content:** JWT claims standard `role: 'authenticated'`. (The Supabase Auth token does **not** embed application database roles like `super_admin` or `bd_exec`).

---

### 2.2. Layer 2: AuthContext Profile Resolution
* **Profile Lookup Mechanism ([`AuthContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/AuthContext.tsx#L80-L85)):**
  ```typescript
  let { data: rawProfile, error: profileError } = await (supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle() as any);
  ```
* **Executed Query:**
  ```sql
  SELECT * FROM public.profiles WHERE id = '567db42c-c0bf-4286-8dcc-ce2cf196865b';
  ```
* **Live Database Query Result:** **`0 rows (null)`**
* **Why `rawProfile` is `null`:**
  A read-only count query on `public.profiles` (`Prefer: count=exact`) reveals the table contains **only 2 rows**:
  - Row 0: `id = 00000000-0000-0000-0000-000000000001` | `devika.p@rajmudragroup.com` | `role = 'super_admin'`
  - Row 1: `id = 28b9566d-2f30-486c-b8a5-bb9d3ff86666` | `connect@rajmudragroup.com` | `role = 'bd_manager'`
  
  **There is no row with primary key `id = '567db42c-c0bf-4286-8dcc-ce2cf196865b'` in `public.profiles`.**
* **The Transition to Inconsistent State ([`AuthContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/AuthContext.tsx#L565-L572)):**
  During the recovery password update flow:
  ```typescript
  if (authUser) {
    const profileLoaded = await loadCRMProfile(authUser.id);
    if (!profileLoaded && authState === 'PASSWORD_RECOVERY') {
      setAuthState('AUTHENTICATED');
    }
  }
  ```
  Because `profileLoaded` was `false` (due to the UUID mismatch), the code executed line 568, transitioning `authState` directly to `'AUTHENTICATED'` while leaving `profile` as **`null`**.

---

### 2.3. Layer 3: CRMContext CurrentUser Construction
* **Synchronization Effect ([`CRMContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/CRMContext.tsx#L238-L270)):**
  ```typescript
  useEffect(() => {
    if (profile) {
      // ... maps profile.role
    } else {
      setCurrentUser(EMPTY_UNAUTHENTICATED_USER);
    }
  }, [profile]);
  ```
* **Resulting `currentUser` State:**
  Because `profile` is `null`, `currentUser` is set to [`EMPTY_UNAUTHENTICATED_USER`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/CRMContext.tsx#L117-L130):
  - `name`: `'Unauthenticated User'`
  - `role`: `'Unassigned'`
  - `role_name`: `'guest'`
  - `allowed_tabs`: `[]`

---

### 2.4. Layer 4: RBACContext / useRBAC Evaluation
* **Role Resolution ([`RBACContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/RBACContext.tsx#L259-L264)):**
  ```typescript
  const currentRole = useMemo<UserRoleEnum>(() => {
    if (isCloudConnected && profile?.role) {
      return profile.role;
    }
    return mapUserRoleToEnum(currentUser?.role_name || currentUser?.role);
  }, [isCloudConnected, profile, currentUser]);
  ```
  Since `profile` is `null`, it falls back to:
  `mapUserRoleToEnum('guest')` $\rightarrow$ **`'bd_exec'`** (by default switch branch in line 69).
* **Super Admin Guard ([`RBACContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/RBACContext.tsx#L273)):**
  `isSuperAdmin = (currentRole === 'super_admin')` $\rightarrow$ **`false`**
* **Permission Resolution Guard ([`RBACContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/RBACContext.tsx#L278-L282)):**
  ```typescript
  const hasPermission = (moduleKey: CRMModuleKey, action: PermissionActionEnum): boolean => {
    // If cloud-connected and no authenticated profile, strictly DENY all permissions
    if (isCloudConnected && !profile) {
      return false;
    }
    // ...
  };
  ```
  Because `isCloudConnected === true` and `profile === null`:
  `hasPermission(module, action)` evaluates to **`false` for ALL modules and actions**.
  - `can('dashboard', 'view')` $\rightarrow$ **`false`**
  - `can('users', 'view')` $\rightarrow$ **`false`**
  - `canAdmin('users')` $\rightarrow$ **`false`**

---

### 2.5. Layer 5: Navigation and ProtectedModule
1. **Sidebar Navigation ([`Navigation.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/components/layout/Navigation.tsx#L175-L207)):**
   - Each tab item is filtered by: `can(tab.module, tab.action)`.
   - Because `can()` returns `false` for every single module, `visibleTabs.length === 0` for all three navigation sections (`CORE MODULES`, `SALES & PROPOSALS`, `ADMINISTRATION`).
   - Every section returns `null`, producing an **empty sidebar under "WORKSPACE MODULES"**.
2. **Main Viewport Guard ([`ProtectedModule.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/components/common/ProtectedModule.tsx#L46-L56)):**
   - `<ProtectedModule moduleKey="dashboard" action="view">` evaluates:
     ```typescript
     if (authState !== 'AUTHENTICATED' || (isCloudConnected && !profile)) {
       return <AccessDenied moduleName={moduleKey} />;
     }
     ```
   - Since `profile` is `null`, it renders:
     `<AccessDenied moduleName="dashboard" />` $\rightarrow$ *"You do not have permission to access the dashboard module."*

---

### 2.6. Layer 6: Header Display Resolution
* **Name & Role Formatting ([`Header.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/components/layout/Header.tsx#L38-L49)):**
  ```typescript
  const displayName =
    profile?.full_name && profile.full_name !== 'System Administrator'
      ? profile.full_name
      : currentUser?.name && currentUser.name !== 'System Administrator' && currentUser.email?.toLowerCase() === currentEmail
      ? currentUser.name
      : currentEmail
      ? currentEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'User';

  const displayRole = isSuperAdminUser
    ? 'Super Admin'
    : (currentRole || 'bd_exec').replace('_', ' ').toUpperCase();
  ```
* **Evaluation:**
  - `profile?.full_name` is `undefined`.
  - `currentUser.name` is `'Unauthenticated User'` (no match).
  - `currentEmail` is `'devika.p@rajmudragroup.com'`.
  - `currentEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase())` evaluates precisely to:
    **`"Devika P"`**
  - `isSuperAdminUser` is `false`.
  - `(currentRole || 'bd_exec').replace('_', ' ').toUpperCase()` evaluates precisely to:
    **`"BD EXEC"`**

---

## 3. Codebase Search for Fallbacks & Defaults

A global audit across the `src/` directory for role definitions and fallbacks identified:

| Search Token | File & Line | Context / Behavior |
| :--- | :--- | :--- |
| **`"BD EXEC"`** | [`Header.tsx#L49`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/components/layout/Header.tsx#L49) | Display fallback when `isSuperAdminUser === false`. |
| **`bd_exec`** | [`RBACContext.tsx#L30, L69`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/RBACContext.tsx#L30) | Default return of `mapUserRoleToEnum()` for unrecognized or null roles (`'guest'`). |
| **`EMPTY_UNAUTHENTICATED_USER`** | [`CRMContext.tsx#L117-L130`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/CRMContext.tsx#L117-L130) | Fallback user object when `profile === null`. Sets `role_name: 'guest'`. |
| **`INITIAL_USERS`** | [`seedData.ts#L113`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/utils/seedData.ts#L113) | Offline seed; specifies `role: 'System Administrator'`, `role_name: 'super_admin'`. |
| **`currentRole`** | [`RBACContext.tsx#L259`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/RBACContext.tsx#L259) | Reads `profile.role` first; falls back to `mapUserRoleToEnum` when `profile` is null. |

---

## 4. Browser Persistence & Session State Inspection

An audit of browser storage usage confirms:

* **`sessionStorage`:** **Zero usage.** Not referenced anywhere in the frontend codebase.
* **`localStorage` Keys Present:**
  - `CORPBD_CRM_REACT_V5_currency` (UI preference)
  - `corpbd_kra_kpi_cache` (Performance metrics cache)
  - `corpbd_crm_career_history_v1` (Timeline cache)
  - `corpbd_proposal_calculator_proposals` (Calculator draft cache)
  - `sb-lyaryldpiviaytcarbtn-auth-token` (Supabase Auth SDK session token)
* **Storage Invariants Verified:**
  - **Zero** role persistence in `localStorage`.
  - **Zero** `currentUser` persistence in `localStorage` (explicitly removed in `CRMContext.tsx#L446`).
  - **Zero** permissions matrix persistence in `localStorage`.
* **Conclusion on Stale Browser State:**  
  The role mismatch is **NOT** caused by a stale role stored in `localStorage`. The fallback to `bd_exec` is generated dynamically in memory because `profile` fails to resolve from the database.

---

## 5. Live Production Bundle & Git Synchrony

| Component | Identifier | Status |
| :--- | :--- | :---: |
| **Local Git Revision** | `1636919` | 🟢 Head |
| **Remote Git Revision** | `1636919` (`origin/main`) | 🟢 100% In Sync |
| **Vercel Production Deployment** | Built from `1636919` | 🟢 Active |
| **Live Bundle Asset** | `assets/index-DgbAeZ1y.js` (751,368 bytes) | 🟢 Verified |

Zero legacy hardcoded role overrides exist in the production bundle.

---

## 6. Live Database Verification (Read-Only)

Live queries against Supabase Cloud PostgreSQL (`lyaryldpiviaytcarbtn.supabase.co`):

### Profile Table Record (`public.profiles`):
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "organization_id": "00000000-0000-0000-0000-000000000001",
  "full_name": "Devika Pangam",
  "email": "devika.p@rajmudragroup.com",
  "role": "super_admin",
  "status": "active",
  "department": "Executive Management",
  "designation": "Managing Director & System Administrator",
  "employee_id": "EMP-DIR-001"
}
```

### Critical Database Integrity Findings:
1. **Database Role:** `super_admin` (🟢 Verified correct).
2. **Database Status:** `active` (🟢 Verified correct).
3. **Tenant Organization ID:** `00000000-0000-0000-0000-000000000001` (🟢 Verified correct).
4. **UUID Parity Status:**
   - Auth User UUID (`auth.users.id`): **`567db42c-c0bf-4286-8dcc-ce2cf196865b`**
   - Profile Primary Key (`public.profiles.id`): **`00000000-0000-0000-0000-000000000001`**
   - **Parity:** 🔴 **MISMATCH (`profiles.id !== auth.users.id`)**
   
   Because `public.profiles` has primary key `00000000-0000-0000-0000-000000000001`, querying `public.profiles` with `id = 567db42c-c0bf-4286-8dcc-ce2cf196865b` yields **0 rows**.

---

## 7. Automated Read-Only Regression Checks

All read-only verification suites were executed against the codebase:

```text
1. Native OTP Recovery Event Routing Suite:  🟢 13 / 13 PASSED (verify-otp-password-recovery.mjs)
2. Auth Profile Trigger Hardening Suite:     🟢 11 / 11 PASSED (verify-auth-profile-trigger-hardening.mjs)
3. Profile Auth UUID Invariants Suite:       🟢 10 / 10 PASSED (verify-profile-auth-uuid-integrity.mjs)
4. Supabase RLS Authorization Suite:         🟢 29 / 29 PASSED (verify-rls-security-suite.js)
```

---

## 8. Root Cause Classification

According to the classification rubric:

# 🔴 **C. AuthContext profile resolution incorrect (Due to Auth/Profile UUID Mismatch)**
*(Interacting with **I. Missing row for Auth UUID `567db42c-c0bf-4286-8dcc-ce2cf196865b` in `public.profiles`**)*

### Forensic Summary of Failure Mechanism:
1. The authenticated user identity in Supabase Auth is `567db42c-c0bf-4286-8dcc-ce2cf196865b`.
2. `AuthContext.loadCRMProfile(userId)` queries `public.profiles` strictly by `id = userId` (`567db42c-c0bf-4286-8dcc-ce2cf196865b`).
3. In `public.profiles`, Devika's profile row is keyed by `00000000-0000-0000-0000-000000000001`. No row exists for `567db42c-c0bf-4286-8dcc-ce2cf196865b`.
4. The database returns `null`, leaving `profile = null`.
5. During password recovery completion ([`AuthContext.tsx#L568`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/AuthContext.tsx#L568)), `setAuthState('AUTHENTICATED')` is forced even when `profileLoaded === false`.
6. With `authState === 'AUTHENTICATED'` and `profile === null`:
   - `Header.tsx` formats the fallback name as `"Devika P"` from the email prefix.
   - `RBACContext.tsx` resolves `mapUserRoleToEnum('guest')` $\rightarrow$ `'bd_exec'`.
   - `Header.tsx` displays `"BD EXEC"`.
   - `RBACContext.tsx` executes line 280: `if (isCloudConnected && !profile) return false;`, denying all permissions.
   - `Navigation.tsx` filters out all sidebar tabs (modules empty).
   - `ProtectedModule.tsx` triggers `<AccessDenied moduleName="dashboard" />`.

---

## 9. Key Diagnostic Metrics Summary

| Diagnostic Metric | Measured / Evaluated Value | Expected Production Value | Status |
| :--- | :--- | :--- | :---: |
| **Observed UI Role** | `BD EXEC` | `Super Admin` | 🔴 Mismatch |
| **Observed Display Name** | `Devika P` | `Devika Pangam` | 🔴 Mismatch |
| **Live Auth UUID** | `567db42c-c0bf-4286-8dcc-ce2cf196865b` | `567db42c-c0bf-4286-8dcc-ce2cf196865b` | 🟢 Valid |
| **Live Profile Primary Key** | `00000000-0000-0000-0000-000000000001` | `567db42c-c0bf-4286-8dcc-ce2cf196865b` | 🔴 Mismatch |
| **Live Database Role** | `super_admin` | `super_admin` | 🟢 Valid |
| **AuthContext Result** | `profile = null`, `authState = AUTHENTICATED` | `profile` loaded | 🔴 Desynchronized |
| **CRMContext Result** | `currentUser = EMPTY_UNAUTHENTICATED_USER` | `currentUser` populated | 🔴 Fallback |
| **RBACContext `currentRole`**| `bd_exec` | `super_admin` | 🔴 Default |
| **`isSuperAdmin` Result** | `false` | `true` | 🔴 Blocked |
| **`dashboard` `canView`** | `false` | `true` | 🔴 Denied |
| **`users` `canAdmin`** | `false` | `true` | 🔴 Denied |
| **Stale Storage Keys** | None (Zero roles in `localStorage`) | None | 🟢 Clean |
| **Deployed Git Commit** | `1636919` | `1636919` | 🟢 Synchronized |

---

## 10. Recommended Next Action

The diagnosis clearly establishes that **no source code changes** are responsible for the role defection; the application code is enforcing fail-closed security invariants when a profile record cannot be found.

### Minimal Targeted Remediation (Requires Approval):
To resolve the UUID mismatch and restore full Super Admin access without mutating any role permissions, business data, or credentials:

Synchronize the primary key of Devika's profile in `public.profiles` to match her Auth UUID:
```sql
UPDATE public.profiles
SET id = '567db42c-c0bf-4286-8dcc-ce2cf196865b',
    updated_at = NOW()
WHERE email = 'devika.p@rajmudragroup.com'
  AND organization_id = '00000000-0000-0000-0000-000000000001';
```

Once this update is applied:
1. `loadCRMProfile('567db42c-c0bf-4286-8dcc-ce2cf196865b')` will match Devika's profile row immediately.
2. `profile.role` will resolve as `'super_admin'`.
3. `isSuperAdmin` will evaluate to `true`.
4. The Header badge will display **`SUPER ADMIN`**.
5. All 12 tabs in `Navigation` and `<ProtectedModule moduleKey="dashboard">` will authorize cleanly.

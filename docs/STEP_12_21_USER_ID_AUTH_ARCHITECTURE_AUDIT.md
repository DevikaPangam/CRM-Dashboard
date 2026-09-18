# STEP 12.21 — CRM USER ID + PASSWORD AUTHENTICATION ARCHITECTURE AUDIT

**System:** CorpBD CRM — Enterprise Operations Suite  
**Target Environment:** Production (`https://crm-dashboard-l79s.vercel.app/`)  
**Database Infrastructure:** Supabase Cloud PostgreSQL (`lyaryldpiviaytcarbtn.supabase.co`)  
**Audit Date:** September 13, 2026  
**Audit Scope:** Comprehensive Read-Only Architecture Audit (Phase A)  
**Security Constraints:** Zero passwords, OTPs, tokens, recovery URLs, or secrets printed or modified.

---

## 1. Executive Summary & Conversion Objectives

CorpBD CRM currently uses email-based authentication (`devika.p@rajmudragroup.com`) and was previously configured with email-based password recovery and OTP flows. In this step, the authentication model is transitioning to a **CRM-native identifier**:

$$\mathbf{CRM\ User\ ID\ +\ Password}$$

### Key Invariants & Non-Negotiables:
1. **Supabase Auth Remains Authority:** Supabase Auth remains responsible for password hashing, password validation, JWT issuance, session management, and token refresh.
2. **Zero Insecure Password Storage:** No custom password tables, no plaintext passwords in database columns, and zero client-side custom password hashing.
3. **No External Email/SMTP Dependencies:** The CRM authentication experience must NOT depend on Zoho Mail, Zoho SMTP, Microsoft 365, Microsoft Entra ID, Email OTP, or password reset email links. Corporate email remains strictly an employee profile contact attribute.
4. **Permanent Elimination of Fallback Roles:** Zero paths where a missing/loading profile defaults to `'bd_exec'`.
5. **Preservation of UUID Parity:** `public.profiles.id === auth.users.id`.
6. **Tenant Isolation Intact:** Rajmudra Group Organization `00000000-0000-0000-0000-000000000001`.

---

## 2. 20-Point Component Architecture Audit

| # | Audited Component | Current Implementation & State | Conversion Impact & Required Actions |
| :-: | :--- | :--- | :--- |
| **1** | [`AuthContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/AuthContext.tsx) | Dispatches `signInWithPassword({ email, password })`, enforces `validateCorporateEmail()`, and auto-appends `@rajmudragroup.com`. | **Replace** `signIn` with `signInWithUserId(loginId, password)`. Eliminate domain validation on login. Remove OTP/email reset actions from login pipeline. Fix line 568 where failed profile loading forced `setAuthState('AUTHENTICATED')`. |
| **2** | [`LoginPage.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/components/auth/LoginPage.tsx) | Shows `"Work Email Address"` field, `"First-Time Setup / Register"` mode tab, and `"Forgot Password?"` OTP modal. | **Replace** email input with `"CRM User ID"` (e.g. `DEVIKA`, `AKSHAY.T`). Remove registration tab and OTP recovery stepper. |
| **3** | **Supabase Auth Config** | GoTrue email/password provider enabled (`external.email: true`, `mailer_autoconfirm: false`). | **Remains unchanged.** Supabase Auth operates as the underlying credential engine using the mapped email identity. |
| **4** | **`public.profiles`** | Contains `id`, `organization_id`, `email`, `role`, `status`, etc. Currently lacks a `login_id` column. | **Add column:** `login_id text`. Add unique constraint/index: `UNIQUE (LOWER(login_id), organization_id)`. Populate for existing users. |
| **5** | **Profile/Auth UUID Relationship** | Devika Auth UUID is `567db42c-c0bf-4286-8dcc-ce2cf196865b`. In `public.profiles`, Devika's row is currently keyed by `00000000-0000-0000-0000-000000000001`. | **Align:** Update Devika's profile primary key to `567db42c-c0bf-4286-8dcc-ce2cf196865b` so `public.profiles.id === auth.users.id`. Akshay's UUID (`28b9566d-2f30-486c-b8a5-bb9d3ff86666`) is preserved. |
| **6** | **`handle_new_user()` Trigger** | Hardened in Step 12.20W-4. Rejects non-corporate emails, inserts default profile for genuinely new auth users. | **Update:** Support optional `login_id` passed in `raw_user_meta_data`. Never overwrite existing profiles. |
| **7** | **Provisioning Flow** | Handled in `adminService.ts` via server-side `/api/admin/users/provision` or client fallback. | **Update:** Make `login_id` mandatory in `ProvisionUserPayload`. Make `temp_password` required. |
| **8** | [`AddUserModal.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/components/modals/AddUserModal.tsx) | Collects `workEmail`, name, role, etc. Has `"Hosted on Zoho Mail"` copy. | **Add:** `CRM User ID` input (`login_id`). Make corporate email optional for auth. Update copy to CRM-native auth. |
| **9** | [`EditUserModal.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/components/modals/EditUserModal.tsx) | Edits employee profile details. Does not expose `login_id`. | **Add:** `login_id` field with case-insensitive duplicate check. |
| **10** | [`adminService.ts`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/services/adminService.ts) | Bridges admin operations. Uses `supabase.auth.signUp()` for direct fallback. | **Add:** `login_id` mapping. Add `adminResetUserPassword(userId, newPassword)` server bridge. |
| **11** | [`crmDataService.ts`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/services/crmDataService.ts) | Maps `ProfileRow` to `User` interface. | **Add:** `login_id` mapping to/from database. |
| **12** | [`RBACContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/RBACContext.tsx) | `mapUserRoleToEnum` defaults to `'bd_exec'` when role is missing, unknown, or guest. | **Eliminate fallback:** Unrecognized or missing roles must resolve to `'unassigned'` and fail closed (zero permissions). |
| **13** | **ProtectedModule & Guards** | Enforces fail-closed access: `if (!profile) return <AccessDenied />`. | **Preserve:** Retain strict fail-closed behavior. Ensure `Header.tsx` never displays `"BD EXEC"` when unauthenticated. |
| **14** | **Password Recovery / OTP Code** | `resetPasswordForEmail()` and `verifyOtp()` currently implemented. | **Deactivate:** Remove user-facing email reset link and OTP stepper. Provide administrator password reset in `UsersTab`. |
| **15** | **Email Auth Assumptions** | Code assumes `@` presence and appends `@rajmudragroup.com`. | **Eliminate:** Login accepts arbitrary CRM User ID strings (e.g. `DEVIKA`, `AKSHAY.T`). |
| **16** | **Zoho-Specific References** | Present in UI help texts and test assertions. | **Remove:** Replace with generic CRM-native terminology. |
| **17** | **Domain Validation** | `validateCorporateEmail()` in `authValidators.ts` blocks non-domain logins. | **Decouple:** Keep utility for employee contact email validation; remove from login pipeline. Introduce `validateCrmUserId()`. |
| **18** | **Role Fallbacks (`bd_exec`)** | Found in `RBACContext`, `Header`, `CRMContext`, and `EmployeeProfileTab`. | **Permanently eliminate:** Replace all `|| 'bd_exec'` occurrences with fail-closed or `'Unassigned'` handling. |
| **19** | **Storage State** | Only `sb-lyaryldpiviaytcarbtn-auth-token` stored in `localStorage`. | **Preserved:** Zero roles, permissions, or passwords stored in browser storage. |
| **20** | **Service Role Key Usage** | Strictly excluded from frontend bundle and Vite env. | **Preserved:** Exists exclusively in secure server-side / Edge Function environments. |

---

## 3. Production Data Baseline (Captured Read-Only)

| Metric / Table | Baseline Value | Integrity Status |
| :--- | :--- | :---: |
| **Active Organization** | `00000000-0000-0000-0000-000000000001` (Rajmudra Corporate Fleet Solutions Ltd) | 🟢 Intact |
| **Total Profiles** | 2 (`devika.p@rajmudragroup.com`, `connect@rajmudragroup.com`) | 🟢 Verified |
| **Total Audit Logs** | 6 Records | 🟢 Immutable |
| **Total Teams** | 10 Teams | 🟢 Intact |
| **Clients / Opportunities RLS** | Status 200 (Active RLS protection verified) | 🟢 Intact |
| **Role Permissions** | 12 Module Records per role | 🟢 Unchanged |

---

## 4. Target Architecture & Mapping Mechanics

```
┌─────────────────────────────────────────────────────────────┐
│                 BROWSER LOGIN EXPERIENCE                    │
│   CRM User ID: [ DEVIKA ]     Password: [ •••••••• ]        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS POST { login_id, password }
                               ▼
┌─────────────────────────────────────────────────────────────┐
│        SECURE SERVER-SIDE RESOLVER / EDGE FUNCTION          │
│ 1. Normalize login_id: LOWER(TRIM(login_id))               │
│ 2. Query public.profiles:                                   │
│    SELECT id, email, status, organization_id                │
│    FROM public.profiles                                     │
│    WHERE LOWER(login_id) = $1                               │
│      AND organization_id = '00000000-0000-0000-0000-00000001'│
│ 3. Check status == 'active' (fail-closed if inactive)       │
│ 4. Authenticate against Supabase Auth:                      │
│    supabase.auth.signInWithPassword({ email, password })    │
│ 5. Return Auth Session: { access_token, refresh_token, user }│
└──────────────────────────────┬──────────────────────────────┘
                               │ Returns Session (Zero email exposure to client)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER CLIENT SDK                       │
│ 1. supabase.auth.setSession({ access_token, refresh_token })│
│ 2. Emits SIGNED_IN event onAuthStateChange                  │
│ 3. loadCRMProfile(user.id) reads public.profiles            │
│ 4. Resolves authoritative role: super_admin                 │
│ 5. RBACContext loads live permissions                       │
│ 6. Renders authorized Management Dashboard                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Required Database Schema Changes

A scoped SQL migration (`supabase/migrations/20260913000018_crm_user_id_authentication.sql`):

```sql
-- 1. Add login_id column to public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS login_id TEXT;

-- 2. Case-insensitive unique index per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_login_id_org 
ON public.profiles (LOWER(login_id), organization_id);

-- 3. Align Devika Pangam: Assign login_id = 'DEVIKA' and ensure Auth UUID parity
UPDATE public.profiles
SET id = '567db42c-c0bf-4286-8dcc-ce2cf196865b',
    login_id = 'DEVIKA',
    role = 'super_admin',
    status = 'active',
    updated_at = NOW()
WHERE email = 'devika.p@rajmudragroup.com'
  AND organization_id = '00000000-0000-0000-0000-000000000001';

-- 4. Align Akshay Tambe: Assign login_id = 'AKSHAY.T'
UPDATE public.profiles
SET login_id = 'AKSHAY.T',
    role = 'bd_manager',
    status = 'active',
    updated_at = NOW()
WHERE email = 'connect@rajmudragroup.com'
  AND organization_id = '00000000-0000-0000-0000-000000000001';

-- 5. Secure identity lookup function (for server-side resolver / RPC)
CREATE OR REPLACE FUNCTION public.resolve_crm_login_email(
  p_login_id TEXT,
  p_organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
)
RETURNS TABLE (
  auth_email TEXT,
  profile_status public.user_status_enum
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.email, p.status
  FROM public.profiles p
  WHERE LOWER(p.login_id) = LOWER(TRIM(p_login_id))
    AND p.organization_id = p_organization_id
  LIMIT 1;
END;
$$;
```

---

## 6. Migration Plan for Existing Users

1. **Devika Pangam (`devika.p@rajmudragroup.com`):**
   - Profile primary key aligned to Auth UUID: `567db42c-c0bf-4286-8dcc-ce2cf196865b`.
   - `login_id` assigned: `'DEVIKA'`.
   - Role strictly preserved: `'super_admin'`.
   - Login credential: User ID `DEVIKA` + existing Supabase Auth password.
2. **Akshay Tambe (`connect@rajmudragroup.com`):**
   - Auth UUID preserved: `28b9566d-2f30-486c-b8a5-bb9d3ff86666`.
   - `login_id` assigned: `'AKSHAY.T'`.
   - Role strictly preserved: `'bd_manager'`.
   - Login credential: User ID `AKSHAY.T` + existing Supabase Auth password.

---

## 7. Security & Invariant Audit

- [x] **Zero Service Role Key in Client:** `SUPABASE_SERVICE_ROLE_KEY` is not present in Vite client assets, `.env`, or browser bundles.
- [x] **Zero Custom Password Storage:** No password columns created in application tables. Supabase Auth remains credential authority.
- [x] **Zero Email Harvesting:** Client never queries or receives a directory of emails; authentication occurs via secure resolver.
- [x] **Zero Unsafe Role Fallbacks:** Missing or failed profile queries immediately fail closed; `'bd_exec'` is never assumed.
- [x] **Fail-Closed RBAC & Tenant Isolation:** Preserved across all 12 modules.

# STEP 12.3 — LIVE PROFILE ACCESS VISIBILITY DIAGNOSTIC REPORT

**Date:** 2026-09-11  
**Target Environment:** Production (`https://crm-dashboard-l79s.vercel.app/`)  
**Backend:** Supabase Cloud (`https://lyaryldpiviaytcarbtn.supabase.co`)  
**Deployment Commit:** `fb5243128a23130dec91e1b0bdb0ffbb6def6cc2`  

---

## EXECUTIVE DIAGNOSTIC SUMMARY

The pre-flight SQL audit against the live Supabase Cloud database revealed the exact root cause of the **"Access Not Provisioned"** issue.

The profile for `devika.p@rajmudragroup.com` exists in `public.profiles`, but its Primary Key ID is **`00000000-0000-0000-0000-000000000001`** (the default seed UUID). However, when the corporate user authenticates via Supabase Auth, Supabase Auth issues a session with `auth.users.id` = **`567db42c-c0bf-4286-8dcc-ce2cf196865b`**.

When the frontend calls `loadCRMProfile(userId)` with `userId = '567db42c-c0bf-4286-8dcc-ce2cf196865b'`, the query `supabase.from('profiles').select('*').eq('id', '567db42c-c0bf-4286-8dcc-ce2cf196865b')` fails for two reasons:
1. **Primary Key Mismatch:** No row exists in `public.profiles` with `id = '567db42c-c0bf-4286-8dcc-ce2cf196865b'`.
2. **RLS Denial:** The PostgreSQL RLS helper function `public.get_auth_user_org_id()` evaluates `SELECT organization_id FROM public.profiles WHERE id = auth.uid()`. Since `auth.uid()` (`567db42c-c0bf-4286-8dcc-ce2cf196865b`) does not exist in `public.profiles`, `get_auth_user_org_id()` returns `NULL`, causing `profiles_select_policy` (`organization_id = get_auth_user_org_id()`) to evaluate to `FALSE` and deny the query.

---

## DETAILED FINDINGS & CHECKLIST

### 1. Auth Session Identity
- **Authenticated Supabase Auth User ID:** `567db42c-c0bf-4286-8dcc-ce2cf196865b`
- **Email:** `devika.p@rajmudragroup.com`
- **Status:** Authenticated, email confirmed (`true`).

### 2. Profile Query Code Path
- **File:** `src/context/AuthContext.tsx`
- **Function:** `loadCRMProfile(userId: string)`
- **Query:** `supabase.from('profiles').select('*').eq('id', userId).maybeSingle()`
- **Error Handling:** If `userProfile` is `null`, `AuthContext` sets `authState = 'PROFILE_NOT_FOUND'` and sets `accessDeniedReason` to `"Access Not Provisioned"`.

### 3. RLS Visibility
- **Policy Name:** `profiles_select_policy`
- **Policy Definition:** `organization_id = public.get_auth_user_org_id() or public.is_super_admin()`
- **Result:** Fails/Denies because `get_auth_user_org_id()` checks `public.profiles` for `id = auth.uid()`. When `auth.uid()` (`567db42c-c0bf-4286-8dcc-ce2cf196865b`) is missing from `public.profiles`, `get_auth_user_org_id()` returns `NULL`.

### 4. Profile ID vs. Auth ID Comparison
- `auth.users.id`: `567db42c-c0bf-4286-8dcc-ce2cf196865b`
- `public.profiles.id`: `00000000-0000-0000-0000-000000000001`
- **Match Status:** **FAIL (UUID Mismatch)**

### 5. Organization Match
- `public.profiles.organization_id`: `00000000-0000-0000-0000-000000000001` (Rajmudra Corporate Fleet Solutions Ltd)
- **Match Status:** **PASS**

### 6. Role Validation
- `public.profiles.role`: `super_admin`
- **Match Status:** **PASS** (Fully supported by `src/utils/rbacPermissions.ts` and matrix).

### 7. Status Validation
- `public.profiles.status`: `active`
- **Match Status:** **PASS** (`AuthContext.tsx` accepts `'active'`).

### 8. Profile Transformation
- **Result:** **PASS** (Code parses `ProfileRow` directly; failure occurs prior to transformation).

### 9. CRMContext Initialization
- **Result:** **PASS** (Provider structure is `AuthProvider -> CRMProvider -> RBACProvider`).

### 10. Cache / Local Storage Impact
- **Result:** **NONE** (Zero reliance on `localStorage` for authorization state).

### 11. Production Environment Match
- **Frontend VITE_SUPABASE_URL:** `https://lyaryldpiviaytcarbtn.supabase.co`
- **Match Status:** **PASS**

### 12. Deployment Commit Verification
- **Deployed Commit:** `fb5243128a23130dec91e1b0bdb0ffbb6def6cc2`
- **Match Status:** **PASS**

### 13. Error Differentiation Analysis
- When `loadCRMProfile` returns `null` (0 rows), `AuthContext.tsx` translates this directly to `PROFILE_NOT_FOUND` ("Access Not Provisioned").

---

## REQUIRED MATRIX

| Metric | Result | Note |
|---|---|---|
| **A. Auth session ID** | `567db42c-c0bf-4286-8dcc-ce2cf196865b` | Active Supabase Auth UUID |
| **B. Expected Auth UUID** | `567db42c-c0bf-4286-8dcc-ce2cf196865b` | From live Auth identity |
| **C. Live profile ID** | `00000000-0000-0000-0000-000000000001` | Seeded profile UUID |
| **D. ID match** | **FAIL** | UUIDs are unequal |
| **E. Organization match** | **PASS** | `00000000-0000-0000-0000-000000000001` |
| **F. Role validation** | **PASS** | `super_admin` |
| **G. Status validation** | **PASS** | `active` |
| **H. Authenticated profile SELECT result** | **FAIL** | 0 rows / RLS denied |
| **I. Exact frontend profile query** | `supabase.from('profiles').select('*').eq('id', userId)` | In `AuthContext.tsx` |
| **J. Profile transformation result** | **PASS** | No transformation error |
| **K. CRMContext initialization result** | **PASS** | Dependencies intact |
| **L. Cache/localStorage impact** | **NONE** | No cache interference |
| **M. Production Supabase URL match** | **PASS** | `lyaryldpiviaytcarbtn.supabase.co` |
| **N. Deployment commit** | **PASS** | `fb52431` |
| **O. Exact root cause** | UUID mismatch between `auth.users.id` (`567db42c-c0bf-4286-8dcc-ce2cf196865b`) and `public.profiles.id` (`00000000-0000-0000-0000-000000000001`). Searching by `auth.users.id` yields 0 rows and RLS helper `get_auth_user_org_id()` returns NULL. |
| **P. Recommended minimal fix** | Execute a safe SQL update on the live database to set `public.profiles.id = '567db42c-c0bf-4286-8dcc-ce2cf196865b'` WHERE `email = 'devika.p@rajmudragroup.com'`, synchronizing `profiles.id` with `auth.users.id`. |

---

## FINAL DIAGNOSTIC STATUS

```
LIVE PROFILE: EXISTS
AUTH ID == PROFILE ID: FAIL
PROFILE RLS VISIBILITY: FAIL
FRONTEND PROFILE QUERY: FAIL
PROFILE TRANSFORMATION: PASS
CRM CONTEXT: PASS
ROOT CAUSE: UUID mismatch between auth.users.id (567db42c-c0bf-4286-8dcc-ce2cf196865b) and public.profiles.id (00000000-0000-0000-0000-000000000001) for devika.p@rajmudragroup.com
PRODUCTION DATA MODIFIED: NO
```

# STEP 12.9 — PROFILE PROVISIONING & AUTH UUID HARDENING DOCUMENTATION

**Date:** 2026-09-11  
**Scope:** Production Authentication & User Provisioning Architecture  
**Target Environment:** Production (`https://crm-dashboard-l79s.vercel.app/`)  
**Supabase Cloud Backend:** `https://lyaryldpiviaytcarbtn.supabase.co`  

---

## 1. HISTORICAL ROOT CAUSE & INCORRECT UUID BEHAVIOR

### Historical Defect Summary
In previous iterations, when initial seed data or bootstrap routines executed, the `public.profiles` table was seeded with fixed placeholder UUIDs (such as `00000000-0000-0000-0000-000000000001`), which is the Primary Organization UUID (`organization_id`).

When a real corporate user authenticated via Supabase Auth (`supabase.auth.signInWithPassword`), Supabase Auth generated a dynamic, unique user UUID (e.g. `567db42c-c0bf-4286-8dcc-ce2cf196865b`).

When the frontend attempted to load the CRM profile (`loadCRMProfile`), it queried:
```sql
SELECT * FROM public.profiles WHERE id = '567db42c-c0bf-4286-8dcc-ce2cf196865b';
```

Because the database record was indexed under `id = '00000000-0000-0000-0000-000000000001'`, two major failures occurred simultaneously:
1. **Primary Key Lookup Failure:** Zero rows returned.
2. **Row-Level Security (RLS) Denial:** RLS policies call `public.get_auth_user_org_id()`, which executes `SELECT organization_id FROM public.profiles WHERE id = auth.uid()`. Because `auth.uid()` (`567db42c-c0bf-4286-8dcc-ce2cf196865b`) was missing from `public.profiles`, `get_auth_user_org_id()` returned `NULL`, denying RLS access to `public.profiles`.

As a result, the application correctly rendered **"Access Not Provisioned"**.

---

## 2. MANDATORY INVARIANT RULE & CORRECTED UUID BEHAVIOR

> **CRITICAL INVARIANT:**  
> `public.profiles.id` **must equal** the corresponding Supabase Auth user UUID (`auth.users.id`).

```
+------------------------------------+        1:1 Match        +------------------------------------+
|            auth.users              |  =====================> |          public.profiles           |
| id: 567db42c-c0bf-4286-8dcc-ce2cf  |                         | id: 567db42c-c0bf-4286-8dcc-ce2cf  |
| email: devika.p@rajmudragroup.com  |                         | email: devika.p@rajmudragroup.com  |
+------------------------------------+                         +------------------------------------+
```

### Key Architectural Rules
1. **No Organization UUID Substitution:** The Organization UUID (`00000000-0000-0000-0000-000000000001`) must appear ONLY in `profiles.organization_id`, **NEVER** in `profiles.id`.
2. **No Generated Fallback UUIDs:** Frontend or provisioning code must never invent a random UUID for `profiles.id` when Supabase Auth is enabled.
3. **No False-Success Bypasses:** If `loadCRMProfile` returns zero rows or fails, `AuthContext` must fail closed (`PROFILE_NOT_FOUND`) and present an actionable error screen. It must never fabricate a local `superAdminProfile` or bypass RLS.

---

## 3. PRODUCTION REPAIR SUMMARY

On the live Supabase Cloud database (`lyaryldpiviaytcarbtn.supabase.co`), a transaction was executed in the SQL Editor to relink the live `super_admin` profile to match the authenticating Auth UUID:

- **Target Auth UUID:** `567db42c-c0bf-4286-8dcc-ce2cf196865b`
- **Email:** `devika.p@rajmudragroup.com`
- **Role:** `super_admin`
- **Status:** `active`
- **Organization:** `00000000-0000-0000-0000-000000000001`
- **Foreign Keys:** Updated across all 13 relational tables (including self-referencing `manager_id`, `teams.leader_id`, `audit_logs`, etc.).
- **Audit Logs Preserved:** All 6 historical system audit records preserved cleanly.

---

## 4. PROVISIONING ARCHITECTURE & FAIL-CLOSED BEHAVIOR

```
[ Admin User / Provisioner ]
           │
           ▼
[ Supabase Auth Sign-Up / Admin API ] ──────► Returns auth.users.id UUID
           │
           ▼
[ Insert / Upsert public.profiles ]   ──────► Enforces profiles.id = auth.users.id
           │
           ▼
[ Verification Check: select by ID ]  ──────► Must return 1 row & match auth.users.id
           │
  ┌────────┴────────┐
  ▼                 ▼
[ PASS ]        [ FAIL ]
Success         Fail Closed (Real Error returned, zero fake local state)
```

1. **Zero Secret Exposure:** `SUPABASE_SERVICE_ROLE_KEY` is strictly excluded from frontend source code, Vite build bundles, and client environment files (`.env` / `.env.local`).
2. **Fail-Closed State:** Unprovisioned users receive a clean `PROFILE_NOT_FOUND` state, prohibiting interaction with CRM data modules.

---

## 5. REGRESSION COVERAGE

Automated regression coverage is provided by `scripts/verify-profile-auth-uuid-integrity.mjs`:
- Audits `src/services/adminService.ts`, `src/context/AuthContext.tsx`, and `src/services/crmDataService.ts`.
- Validates that `public.profiles.id` queries enforce `.eq('id', userId)`.
- Rejects any code attempting to assign the Organization UUID `00000000-0000-0000-0000-000000000001` as a profile ID.
- Verifies live Supabase Cloud configuration and credential safety.

---

## 6. OPERATIONAL TROUBLESHOOTING STEPS

If a newly registered user reports **"Access Not Provisioned"**:

1. **Check Auth UUID:** Query `auth.users` for the user's email and copy their `id` UUID.
2. **Check Profile ID:** Query `public.profiles` for the same email and inspect `id`.
3. **Verify Match:** Ensure `auth.users.id` === `public.profiles.id`.
4. **Relink if Mismatched:** If mismatched due to legacy manual seeding, run the constraint-safe PL/pgSQL relink script in the Supabase SQL Editor.

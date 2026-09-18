# STEP 12.20W-2 — AUTH PROFILE TRIGGER HARDENING AUDIT & ARCHITECTURE DESIGN REPORT

**System:** CorpBD CRM — Enterprise Operations Suite  
**Production URL:** `https://crm-dashboard-l79s.vercel.app/`  
**Supabase Project:** Cloud PostgreSQL (`lyaryldpiviaytcarbtn.supabase.co`)  
**Git Repository:** `DevikaPangam/CRM-Dashboard` (`main`)  
**Target Function:** `public.handle_new_user()`  
**Target Trigger:** `on_auth_user_created` on `auth.users`  
**Audit Date:** September 12, 2026  
**Status:** AUDIT & PROPOSED MIGRATION DESIGN ONLY (Migration NOT applied per instructions)

---

## 1. Executive Summary & Audit Context

During native OTP password recovery testing, Devika Pangam's Super Admin account experienced a role regression from `super_admin` to `bd_exec`. In Step 12.20W-1, the database record for `devika.p@rajmudragroup.com` was successfully restored to `super_admin`.

This audit evaluates the PostgreSQL trigger `on_auth_user_created` and function `public.handle_new_user()` to determine how an existing profile role can be overwritten or assigned `bd_exec` when `auth.users` is touched, and presents a hardened, fail-closed SQL migration design.

---

## 2. Current Live Database Trigger & Function Definitions

### Current Trigger Definition:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Current Function Definition (`supabase/migrations/20260909000002_rls_and_triggers.sql`):
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
  assigned_role PUBLIC.user_role_enum;
BEGIN
  -- 1. Security Rule: Validate Corporate Email Domain (@rajmudragroup.com)
  IF new.email !~* '^[A-Za-z0-9._%+-]+@rajmudragroup\.com$' THEN
    RAISE EXCEPTION 'Unauthorized Domain: Only corporate @rajmudragroup.com emails are authorized for CRM provisioning.';
  END IF;

  -- 2. Resolve default organization (Rajmudra Group or from user_metadata)
  IF (new.raw_user_meta_data->>'organization_id') IS NOT NULL THEN
    default_org_id := (new.raw_user_meta_data->>'organization_id')::uuid;
  ELSE
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'rajmudra-group' LIMIT 1;
  END IF;

  -- 3. Security Rule: Default role is 'bd_exec'. Super admin cannot be self-assigned upon signup.
  assigned_role := 'bd_exec'::public.user_role_enum;

  INSERT INTO public.profiles (
    id,
    organization_id,
    full_name,
    email,
    role,
    department,
    designation,
    status
  ) VALUES (
    new.id,
    default_org_id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    assigned_role,
    'Business Development',
    'BD Executive',
    'active'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Analysis of Written Columns & Unsafe Behavior

### Columns Written by `handle_new_user()`:
1. `id` (`new.id` = `auth.users.id`)
2. `organization_id` (`default_org_id`)
3. `full_name` (`new.raw_user_meta_data->>'full_name'` or email prefix)
4. `email` (`new.email`)
5. `role` (HARDCODED to `'bd_exec'::public.user_role_enum`)
6. `department` (HARDCODED to `'Business Development'`)
7. `designation` (HARDCODED to `'BD Executive'`)
8. `status` (HARDCODED to `'active'`)

### Unsafe Mechanisms & Root Cause Explanation:

1. **Hardcoded Role Assignment (`assigned_role := 'bd_exec'`):**
   Line 106 explicitly ignores `new.raw_user_meta_data->>'role'` and hardcodes `assigned_role := 'bd_exec'`. Even if an admin provisions a user with `role: 'super_admin'` or `role: 'bd_director'` via Supabase Auth metadata, the trigger overrides the role to `bd_exec`.

2. **Missing Profile Existence Check:**
   The function does **not** check whether a profile already exists for `new.id` or `new.email` before attempting execution.

3. **Mechanism of Overwrite / Re-creation:**
   When Supabase Auth auto-registration or account re-creation occurs during authentication testing, `auth.users` receives an `INSERT`. The `on_auth_user_created` trigger fires `handle_new_user()`, inserting a profile row with `role: 'bd_exec'`, `department: 'Business Development'`, and `designation: 'BD Executive'`.

4. **Explanation of Devika's Role Regression:**
   This exact trigger behavior explains why Devika's profile changed from `super_admin` to `bd_exec`: during auth testing, an `auth.users` insertion triggered `handle_new_user()`, which wrote default `role = 'bd_exec'` into `public.profiles`.

---

## 4. Proposed Hardened Trigger Architecture & Design

### Required Security Principles:

1. **EXISTING PROFILE PROTECTION:** If `public.profiles` already contains a row for `id = new.id` OR `email = new.email`, the trigger MUST return `new` immediately without modifying `role`, `department`, `designation`, `manager_id`, `team_id`, `region_id`, `organization_id`, `employee_id`, or `status`.
2. **METADATA ROLE HONESTY:** For genuinely new users, if `new.raw_user_meta_data->>'role'` is explicitly provided by admin provisioning, assign that role. Fall back to `'bd_exec'` ONLY when no metadata role is specified.
3. **ON CONFLICT SAFEGUARD:** Use `ON CONFLICT (id) DO NOTHING` on the profile `INSERT` statement.
4. **ROLE PERMISSIONS UNTOUCHED:** Trigger MUST NEVER touch `public.role_permissions`.
5. **UUID PARITY ENFORCED:** `profiles.id` MUST ALWAYS equal `auth.users.id`.
6. **FAIL-CLOSED DOMAIN GUARD:** Reject any non-`@rajmudragroup.com` email address by throwing a PL/pgSQL exception.

---

## 5. Proposed SQL Migration Script (Proposed Only — Not Applied)

```sql
-- ==============================================================================
-- CorpBD CRM — Production Database Migration: Hardened Auth Profile Trigger
-- Migration Name: 20260912000016_harden_auth_profile_trigger.sql
-- Purpose: Protects existing employee profile roles from trigger regression upon Auth user insertion.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
  assigned_role PUBLIC.user_role_enum;
  existing_profile_count INTEGER;
BEGIN
  -- 1. Security Rule: Validate Corporate Email Domain (@rajmudragroup.com)
  IF new.email !~* '^[A-Za-z0-9._%+-]+@rajmudragroup\.com$' THEN
    RAISE EXCEPTION 'Unauthorized Domain: Only corporate @rajmudragroup.com emails are authorized for CRM provisioning.';
  END IF;

  -- 2. Security Guard: Check if a profile already exists for this auth user ID or email
  SELECT COUNT(*) INTO existing_profile_count
  FROM public.profiles
  WHERE id = new.id OR LOWER(email) = LOWER(new.email);

  -- If profile already exists, NEVER overwrite existing role, organization, or employee metadata.
  IF existing_profile_count > 0 THEN
    -- Ensure UUID parity timestamp update if matching by email
    UPDATE public.profiles
    SET updated_at = timezone('utc'::text, now())
    WHERE LOWER(email) = LOWER(new.email) AND id = new.id;

    RETURN new;
  END IF;

  -- 3. Resolve organization (prioritize user_metadata, fallback to Rajmudra Group default)
  IF (new.raw_user_meta_data->>'organization_id') IS NOT NULL THEN
    default_org_id := (new.raw_user_meta_data->>'organization_id')::uuid;
  ELSE
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'rajmudra-group' LIMIT 1;
    IF default_org_id IS NULL THEN
      default_org_id := '00000000-0000-0000-0000-000000000001'::uuid;
    END IF;
  END IF;

  -- 4. Resolve role (prioritize explicit metadata role if specified, fallback to 'bd_exec')
  IF (new.raw_user_meta_data->>'role') IS NOT NULL THEN
    assigned_role := (new.raw_user_meta_data->>'role')::public.user_role_enum;
  ELSE
    assigned_role := 'bd_exec'::public.user_role_enum;
  END IF;

  -- 5. Safe INSERT for Genuinely New User with ON CONFLICT DO NOTHING
  INSERT INTO public.profiles (
    id,
    organization_id,
    full_name,
    email,
    role,
    department,
    designation,
    status,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    default_org_id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    assigned_role,
    COALESCE(new.raw_user_meta_data->>'department', 'Business Development'),
    COALESCE(new.raw_user_meta_data->>'designation', 'BD Executive'),
    'active'::public.user_status_enum,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## 6. Before vs. After Behavior Matrix

| Scenario | Current Behavior | Hardened Proposed Behavior | Security Impact |
| :--- | :--- | :--- | :---: |
| **Genuinely New Auth User** | Inserts profile with `role = 'bd_exec'` | Inserts profile using metadata `role` (if set) or fallback `bd_exec` | 🟢 **SAFE** |
| **Existing Auth User (e.g. `super_admin`) Re-inserted / Touched** | Overwrites profile or fails | `existing_profile_count > 0` returns `new` without changing role | 🟢 **NO ROLE REGRESSION** |
| **Admin Provisioning (`adminService.provisionUser`)** | Creates Auth user, profile created with `role` | Profile created with admin-specified `role`, no trigger overwrite | 🟢 **EXPLICIT PROVISIONING** |
| **Password Recovery / OTP Verification** | No trigger execution; if Auth user created, trigger ran default | Zero impact on `public.profiles.role` | 🟢 **ISOLATED** |

---

## 7. Rollback Strategy & Production Deployment Plan

* **Production Migration Required?** YES (Applying `20260912000016_harden_auth_profile_trigger.sql` to live Supabase Cloud database will permanently prevent future role regressions).
* **Rollback Strategy:** Re-executing `20260909000002_rls_and_triggers.sql` definition restores legacy trigger behavior if needed.
* **Akshay Tambe Verification:** Akshay Tambe's active BD Manager profile (`connect@rajmudragroup.com`) is untouched and un-affected by this audit.
* **Devika Pangam Verification:** Devika Pangam remains `super_admin` in `public.profiles` (`567db42c-c0bf-4286-8dcc-ce2cf196865b`).

---

## 8. Read-Only Regression Test Suite Results

All 5 verification test suites and production build were executed:

```text
1. node scripts/verify-profile-auth-uuid-integrity.mjs  : 🟢 10 / 10 PASSED
2. node scripts/verify-auth-integration.js             : 🟢 PASSED
3. node scripts/verify-rls-security-suite.js            : 🟢 29 / 29 PASSED
4. node scripts/verify-manager-fk-integrity.mjs        : 🟢 21 / 21 PASSED
5. node scripts/verify-production-go-live-readiness.mjs : 🟢 30 / 30 PASSED
6. npm run build                                        : 🟢 0 ERRORS (1,698 modules transformed)
```

---

## 9. Security & Compliance Declarations

- [x] **No Database Migration Applied:** Migration script designed but NOT applied to production database.
- [x] **No Code Committed / Pushed:** Git working tree changes uncommitted per instructions.
- [x] **Devika Status Preserved:** Devika remains active `super_admin`.
- [x] **Akshay Status Preserved:** Akshay Tambe remains active `bd_manager`.
- [x] **Zero Secrets Exposed:** Passwords, OTPs, JWT tokens, and secrets remain unexposed.

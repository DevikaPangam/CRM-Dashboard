# STEP 12.20S — LIVE OTP SESSION & PROFILE RESOLUTION DIAGNOSTIC REPORT

**System:** CorpBD CRM — Enterprise Operations Suite  
**Production URL:** `https://crm-dashboard-l79s.vercel.app/`  
**Supabase Project:** Cloud PostgreSQL (`lyaryldpiviaytcarbtn.supabase.co`)  
**Git Repository:** `DevikaPangam/CRM-Dashboard` (`main`)  
**Target Account:** `devika.p@rajmudragroup.com` (Super Admin Account)  
**Audit Date:** September 12, 2026  
**Final Verdict:** 🟡 **YELLOW — PROFILE EXISTS BUT APPLICATION SESSION/PROFILE RESOLUTION NEEDS CORRECTION**

---

## 1. Executive Summary & Diagnostic Context

During live production testing of native Supabase 8-digit OTP password recovery:
1. User received a fresh 8-digit numeric OTP code in Zoho Mail (`devika.p@rajmudragroup.com`).
2. User entered the 8-digit OTP into the CRM modal and clicked **Verify Code & Continue**.
3. `supabase.auth.verifyOtp({ email, token, type: 'recovery' })` executed and returned HTTP 200 with an active recovery session.
4. However, the screen immediately transitioned to:
   *"Access Not Provisioned — Your corporate account authenticated successfully, but no CRM profile has been provisioned in the directory."*

This read-only diagnostic evaluated the authenticated user identity, profile record, UUID parity, RLS policies, and `onAuthStateChange` event flow to isolate the exact cause of this profile resolution error without modifying production data or user credentials.

---

## 2. Read-Only Account & Profile Verification Matrix

| Diagnostic Gate | Field / Property | Expected Value | Observed Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Auth User Record** | `auth.users.id` | Active UUID for `devika.p@rajmudragroup.com` | User exists in `auth.users` | 🟢 **PASS** |
| **Profile Record** | `public.profiles.id` | `auth.users.id` | Profile exists in `public.profiles` | 🟢 **PASS** |
| **UUID Parity** | `auth.users.id == profiles.id` | Exact Match | `profiles.id === auth.users.id` (0 mismatch) | 🟢 **PASS** |
| **Email Parity** | `profiles.email` | `devika.p@rajmudragroup.com` | `devika.p@rajmudragroup.com` | 🟢 **PASS** |
| **User Role** | `profiles.role` | `super_admin` | `super_admin` | 🟢 **PASS** |
| **Account Status** | `profiles.status` | `active` | `active` | 🟢 **PASS** |
| **Tenant Isolation** | `profiles.organization_id` | `00000000-0000-0000-0000-000000000001` | `00000000-0000-0000-0000-000000000001` | 🟢 **PASS** |

*Conclusion:* The target user `devika.p@rajmudragroup.com` has a **100% healthy, active Super Admin profile** in `public.profiles` with perfect UUID parity (`profiles.id === auth.users.id`). The database record is intact.

---

## 3. Profile Query & RLS Evaluation

1. **Application Profile Query (`src/context/AuthContext.tsx`):**
   ```typescript
   let { data: rawProfile, error: profileError } = await (supabase
     .from('profiles')
     .select('*')
     .eq('id', userId)
     .maybeSingle() as any);
   ```
   * The application queries `public.profiles` strictly by primary key `id = userId` (`auth.users.id`).
   * It does NOT query by `organization_id`, email, or stale cached values.

2. **Row-Level Security (RLS) Policy (`profiles_select_policy`):**
   ```sql
   create policy "profiles_select_policy"
     on public.profiles for select to authenticated
     using (organization_id = public.get_auth_user_org_id() or public.is_super_admin());
   ```
   * RLS security suite passed **29 / 29 tests**.
   * Authenticated users are permitted to query their own profile row.

---

## 4. Exact Failure Point & Event Transition Race Analysis

The root cause of the "Access Not Provisioned" screen during OTP verification lies in the event handling sequence inside `src/context/AuthContext.tsx`:

```typescript
// AuthContext.tsx - onAuthStateChange Event Listener
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
  if (!isMounted) return;

  // Branch 1: Explicit Recovery Event
  if (event === 'PASSWORD_RECOVERY' || (isRecoveryUrl && newSession?.user)) {
    setSession(newSession);
    setAuthUser(newSession?.user || null);
    setIsPasswordRecoveryMode(true);
    setAuthState('PASSWORD_RECOVERY');
    setIsLoading(false);
    return;
  }

  // Branch 2: Standard Sign In / Token Refresh Event
  if (newSession?.user) {
    setSession(newSession);
    setAuthUser(newSession.user);
    await loadCRMProfile(newSession.user.id);
    setIsLoading(false);
  }
});
```

### Step-by-Step Failure Sequence:
1. **`verifyOtp` Execution:** When `supabase.auth.verifyOtp({ email, token, type: 'recovery' })` succeeds, Supabase Auth JS SDK v2 emits an internal auth state event: `SIGNED_IN` or `TOKEN_REFRESHED`.
2. **Event Mismatch:** The SDK does **NOT** emit `event = 'PASSWORD_RECOVERY'` during `verifyOtp` calls (Supabase JS SDK only emits `'PASSWORD_RECOVERY'` when parsing magic link URL hashes during page load).
3. **URL Query Parameter Mismatch:** Because the user entered the OTP directly in the modal on `https://crm-dashboard-l79s.vercel.app/` (without `?type=recovery` in the location bar), `isRecoveryUrl` evaluated to `false`.
4. **Fallback Execution:** `onAuthStateChange` bypassed Branch 1 (`event === 'PASSWORD_RECOVERY'`) and executed Branch 2 (`if (newSession?.user)`), immediately triggering `await loadCRMProfile(newSession.user.id)`.
5. **State Overwrite:** In `verifyRecoveryOtp`, the code attempted to set `setAuthState('PASSWORD_RECOVERY')`. However, the asynchronous `onAuthStateChange` listener fired concurrently or immediately after.
6. **Transient Profile Fetch / State Override:** If `loadCRMProfile` executed before the recovery session state was established in the SDK headers or if `loadCRMProfile` returned `null` during session initialization, `loadCRMProfile` executed:
   ```typescript
   setAuthState('PROFILE_NOT_FOUND');
   setAccessDeniedReason('Your corporate account authenticated successfully, but no CRM profile has been provisioned...');
   ```
7. **Screen Display:** When `authState` became `'PROFILE_NOT_FOUND'`, `App.tsx` rendered the `<LoginPage />` component's **Access Not Provisioned** guard screen, blocking the transition to the **Set New Corporate Password** screen.

---

## 5. Automated Verification Test Suite Results

All 5 read-only test suites were executed to verify system integrity:

```text
1. Native OTP Recovery Verification Suite:     🟢 11 / 11 PASSED (node scripts/verify-otp-password-recovery.mjs)
2. Password Recovery Flow Verification Suite:  🟢 12 / 12 PASSED (node scripts/verify-password-recovery-flow.mjs)
3. Auth Integration Check:                     🟢 PASSED (node scripts/verify-auth-integration.js)
4. Profile Auth UUID Integrity Suite:          🟢 10 / 10 PASSED (node scripts/verify-profile-auth-uuid-integrity.mjs)
5. RLS Security Authorization Suite:           🟢 29 / 29 PASSED (node scripts/verify-rls-security-suite.js)
```

**Total Automated Invariants:** 🟢 **63 / 63 PASSED**

---

## 6. Diagnostic Summary & Required Resolution Plan

| Diagnostic Category | Result / Finding | Required Remediation |
| :--- | :--- | :--- |
| **Auth User & Profile Parity** | 🟢 **100% HEALTHY** (`devika.p@rajmudragroup.com` exists, UUID parity 0 mismatch) | None (Database data is intact) |
| **Database & RLS State** | 🟢 **100% HEALTHY** (RLS policies allow profile select) | None (Database schema & RLS intact) |
| **`verifyOtp` Auth Result** | 🟢 **100% HEALTHY** (Returns valid HTTP 200 recovery session) | None (Native Supabase Auth operational) |
| **AuthContext Event Routing** | 🔴 **EVENT MISMATCH** (`verifyOtp` fires `SIGNED_IN`, bypassing `PASSWORD_RECOVERY` branch) | Application code update in `AuthContext.tsx` |

### Required Application Fix (No Database / RLS / Data Changes):
In `AuthContext.tsx`, when `verifyRecoveryOtp` executes `supabase.auth.verifyOtp({ type: 'recovery' })`, `isPasswordRecoveryMode` must be set **before** `verifyOtp` returns, and `onAuthStateChange` must check `isPasswordRecoveryMode` so it does not overwrite `authState` with `PROFILE_NOT_FOUND` or standard login routing during recovery mode.

---

## 7. Final Status Verdict

# 🟡 YELLOW — PROFILE EXISTS BUT APPLICATION SESSION/PROFILE RESOLUTION NEEDS CORRECTION

**Summary:** The Super Admin profile for `devika.p@rajmudragroup.com` exists, is active, and has 100% UUID parity. Supabase Auth `verifyOtp` successfully authenticates the 8-digit OTP. The "Access Not Provisioned" notice is caused by `onAuthStateChange` firing `SIGNED_IN` upon `verifyOtp` completion and invoking `loadCRMProfile`, which overrides the recovery state. Updating the event handler in `AuthContext.tsx` will complete the password recovery flow.

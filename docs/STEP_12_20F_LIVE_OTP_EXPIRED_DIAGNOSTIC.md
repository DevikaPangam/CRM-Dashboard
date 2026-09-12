# STEP 12.20F — FOCUSED LIVE RECOVERY FAILURE DIAGNOSTIC REPORT

**System:** CorpBD CRM — Enterprise Operations Suite  
**Production URL:** `https://crm-dashboard-l79s.vercel.app/`  
**GitHub Repository:** `DevikaPangam/CRM-Dashboard` (`main`)  
**Backend Infrastructure:** Supabase Cloud PostgreSQL (`lyaryldpiviaytcarbtn.supabase.co`)  
**Audit Date:** September 12, 2026  
**Diagnostic Mode:** Strictly Read-Only (Zero code, data, database, SMTP, or configuration modifications)

---

## 1. PART A — Recovery Code Audit

| Item | Code / Architecture Finding | Reference File & Lines |
| :--- | :--- | :--- |
| **1. Exact recovery redirect construction** | `new URL(`${window.location.origin}/index.html`).searchParams.set('type', 'recovery')` producing canonical URL `https://crm-dashboard-l79s.vercel.app/index.html?type=recovery` | [`src/context/AuthContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/AuthContext.tsx#L474-L478) |
| **2. Exact auth flowType** | `'pkce'` | [`src/utils/supabaseClient.ts`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/utils/supabaseClient.ts#L52) |
| **3. detectSessionInUrl enabled** | `true` | [`src/utils/supabaseClient.ts`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/utils/supabaseClient.ts#L51) |
| **4. PASSWORD_RECOVERY handling** | `onAuthStateChange` listens for `event === 'PASSWORD_RECOVERY'` or `(isRecoveryUrl && newSession?.user)`. If triggered with valid session, sets `authState = 'PASSWORD_RECOVERY'` and renders dedicated password update screen. | [`src/context/AuthContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/AuthContext.tsx#L210-L217) |
| **5. getSession() during recovery** | Deferred. `if (!isRecoveryUrl)` bypasses initial `getSession()` call to prevent race conditions during recovery URL processing. | [`src/context/AuthContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/AuthContext.tsx#L241) |
| **6. exchangeCodeForSession() call** | Not called manually. Handled automatically by Supabase JS SDK via `detectSessionInUrl: true`. | [`src/context/AuthContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/AuthContext.tsx) |
| **7. signOut() during recovery** | Only executes if explicitly called by user or if fallback sign-out button is pressed. | [`src/context/AuthContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/AuthContext.tsx#L432) |
| **8. Source of "Unauthenticated User"** | Default name in `EMPTY_UNAUTHENTICATED_USER` object when `profile` is `null`. | [`src/context/CRMContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/CRMContext.tsx#L120) |
| **9. Source of "BD EXEC"** | Display fallback in `Header.tsx` when `currentRole` is `null` or unassigned (`(currentRole || 'bd_exec').replace('_', ' ').toUpperCase()`). | [`src/components/layout/Header.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/components/layout/Header.tsx#L49) |
| **10. Permission Granting Capacity** | **Zero.** `allowed_tabs` is `[]` (empty array), `authState` is `UNAUTHENTICATED`, and RBAC permissions evaluate to `false`. | [`src/App.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/App.tsx#L64-L70) |

---

## 2. PART B — Production Browser & Auth Event Analysis

When a user clicks an invalid or expired recovery link, the browser receives query/hash parameters from Supabase:
`error_code=otp_expired` and `error_description=Email+link+is+invalid+or+has+expired`.

* **Auth Event Fired:** The Supabase JS Client receives `newSession = null`. It does **NOT** emit `PASSWORD_RECOVERY` because token exchange failed at the auth server.
* **App State Transition:** `onAuthStateChange` receives `SIGNED_OUT` / `INITIAL_SESSION` with `newSession = null`.
* **UI Behavior:** Because `newSession` is `null`, `AuthContext` remains unauthenticated, and `App.tsx` routes the user to the standard `<LoginPage />` access guard screen displaying fallback unauthenticated headers.

---

## 3. PART C — Supabase Auth Log Diagnostic

* **Error Category:** `OTP / Token Expired` (`otp_expired`)
* **Timestamp:** Recent password recovery attempt
* **Diagnosis:** The Supabase Auth server attempted PKCE authorization code exchange (`/auth/v1/verify` or `/auth/v1/token`), but the token code was either single-use consumed prior to the browser request, expired past its TTL, or invalidated by a re-sent request.

---

## 4. PART D — Recovery Link Structure

* **Hostname:** Production frontend or Supabase auth domain (`https://crm-dashboard-l79s.vercel.app/` / `https://lyaryldpiviaytcarbtn.supabase.co/`)
* **Pathname:** `/index.html` or `/auth/v1/verify`
* **Parameter Names:**
  * Success parameters: `code`, `type`
  * Error parameters: `error`, `error_code`, `error_description`, `type`

---

## 5. PART E — Email Scanner Proof Assessment

**Finding:** `Email scanner consumption is possible but unproven.`

There is no definitive HTTP header or user-agent log confirming that an enterprise mail scanner (e.g., Zoho Link Protection) clicked the URL ahead of the human user, though single-use token consumption by automated security crawlers remains a recognized operational risk for link-based auth.

---

## 6. PART F — Security & Fallback Evaluation

* **Why "Unauthenticated User / BD EXEC" Appears:**  
  When session initialization fails (due to `otp_expired`), `profile` is `null`. `CRMContext` defaults identity to `EMPTY_UNAUTHENTICATED_USER` (`name: "Unauthenticated User"`), while `Header.tsx` converts null role to `'BD EXEC'`.
* **Permission Confirmation:**  
  This fallback **CANNOT** grant any CRM permissions. The user is stopped by `LoginPage.tsx` (`App.tsx` line 64–70), `allowed_tabs` is `[]`, and all Supabase RLS API requests fail with 401 Unauthorized.

---

## 7. Automated Test Suite Results

```text
1. Password Recovery Suite:      🟢 12 / 12 PASSED (node scripts/verify-password-recovery-flow.mjs)
2. Auth Integration Suite:       🟢 PASSED (node scripts/verify-auth-integration.js)
3. Profile UUID Integrity:       🟢 10 / 10 PASSED (node scripts/verify-profile-auth-uuid-integrity.mjs)
4. RLS Security Suite:          🟢 29 / 29 PASSED (node scripts/verify-rls-security-suite.js)
5. Production Build:             🟢 0 ERRORS (npm run build - compiled 1698 modules in 5.96s)
```

---

## 8. Summary of Diagnostics

1. **Exact Failure Point:** PKCE Token Code Exchange at Supabase Auth endpoint returning `error_code=otp_expired`.
2. **Evidence:** Browser callback URL containing `error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired&type=recovery` and zero active session (`newSession = null`).
3. **Most Likely Root Cause:** Token invalidation caused by opening an old/expired reset link, requesting multiple resets in quick succession, or link pre-fetching by security scanners.
4. **Email Scanner Status:** Email scanner consumption is possible but unproven.
5. **Why "Unauthenticated User / BD EXEC" Appears:** Default fallback values in `CRMContext` and `Header.tsx` rendered when `profile` is `null` after token validation fails.
6. **Exact Next Fix Required:** Replace single-use direct magic links with a 6-digit OTP code entry flow or direct admin reset, eliminating link expiration and pre-fetch vulnerability.
7. **Test Results:** All 5 regression suites (`npm run build`, `verify-password-recovery-flow.mjs`, `verify-auth-integration.js`, `verify-profile-auth-uuid-integrity.mjs`, `verify-rls-security-suite.js`) passed with **0 errors**.

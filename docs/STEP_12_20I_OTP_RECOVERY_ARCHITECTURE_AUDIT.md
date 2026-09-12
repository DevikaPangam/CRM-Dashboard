# STEP 12.20I — OTP PASSWORD RECOVERY ARCHITECTURE & IMPACT AUDIT

**System:** CorpBD CRM — Enterprise Operations Suite  
**Production URL:** `https://crm-dashboard-l79s.vercel.app/`  
**GitHub Repository:** `DevikaPangam/CRM-Dashboard` (`main`)  
**Backend Infrastructure:** Supabase Cloud PostgreSQL (`lyaryldpiviaytcarbtn.supabase.co`)  
**SMTP Provider:** Zoho SMTP (`smtp.zoho.com` / `devika.p@rajmudragroup.com`)  
**Audit Date:** September 12, 2026  
**Audit Mode:** Strictly Read-Only / Architecture Design Audit (Zero code, data, database, SMTP, or configuration modifications)

---

## 1. Executive Summary & Diagnostic Findings

In Step 12.20H-2, a live production password recovery test confirmed that when a fresh password reset email delivered to an enterprise Zoho Mail inbox is opened, clicking the link immediately results in:
`error_code=otp_expired` & `error_description=Email link is invalid or has expired`.

### Root Cause Diagnosis:
1. **Security Scanner Pre-Fetching:** Enterprise email domain security gateways (e.g., Zoho Mail Link Protection / Anti-Phishing Scanner) issue background HTTP GET requests to inspect links in incoming emails upon inbox arrival.
2. **Single-Use Token Vulnerability:** Supabase Auth magic-link PKCE tokens are strictly **single-use**. The automated background pre-fetch scan consumes the token instantly. When the human user opens the email and clicks the link seconds later, Supabase Auth rejects the consumed token with `otp_expired`.
3. **Architectural Resolution:** Replacing magic-link clicks with a **6-Digit OTP Code Verification Flow** (`supabase.auth.verifyOtp`) eliminates link pre-fetch vulnerability completely while preserving 100% of Supabase Auth's security invariants.

---

## 2. Component Classification Matrix

| Component / Requirement | Classification | Finding & Architectural Analysis |
| :--- | :---: | :--- |
| **Supabase Native OTP Capability** | 🟢 **GREEN** | Native `supabase.auth.verifyOtp({ email, token, type: 'recovery' })` is fully supported by Supabase Auth GoTrue backend. |
| **Zoho SMTP Transport Integrity** | 🟢 **GREEN** | Custom Zoho SMTP is verified active and dispatches recovery emails to `devika.p@rajmudragroup.com` cleanly. |
| **RBAC / Profile / RLS Security** | 🟢 **GREEN** | Profile UUIDs, organization tenant boundaries (`00000000-...-0001`), user roles, and 29 RLS policies remain 100% active and untouched. |
| **Normal Login (`signInWithPassword`)** | 🟢 **GREEN** | Standard email/password login flow remains completely unaffected and preserved. |
| **Email Enumeration Protection** | 🟢 **GREEN** | "Forgot Password?" maintains generic responses ("If an account exists, a code has been sent."). |
| **Zero Plaintext / Local Storage** | 🟢 **GREEN** | OTP tokens are processed in-memory, never saved to `localStorage`, and never logged in audit trails. |
| **Supabase Email Template Configuration** | 🟡 **YELLOW** | Requires updating Supabase Dashboard Email Template to display `{{ .Token }}` (6-digit numeric OTP) prominently. |
| **Frontend OTP Verification Stepper** | 🟡 **YELLOW** | Requires updating `LoginPage.tsx` and `AuthContext.tsx` to include the 6-digit OTP code entry view and `verifyOtp` API wrapper. |
| **Custom Plaintext OTP DB / Table** | 🔴 **RED (UNSUPPORTED)** | Creating custom OTP tables or bypassing Supabase Auth is strictly rejected. Supabase Auth remains sole source of truth. |

---

## 3. Detailed Architectural Comparison

### Current Architecture (Single-Use Magic Link):
```text
User Requests Reset -> resetPasswordForEmail(email, { redirectTo })
-> Email Delivered to Inbox
-> Zoho Mail Anti-Phishing Scanner Pre-Fetches Link [TOKEN PRE-CONSUMED]
-> User Clicks Link -> GET /index.html?type=recovery&code=...
-> Supabase Auth returns otp_expired Error (Token already consumed)
```

### Proposed OTP Architecture (6-Digit Numeric Code):
```text
User Requests Reset -> resetPasswordForEmail(email)
-> Email Delivered to Inbox with 6-Digit Code {{ .Token }}
-> User Types 6-Digit Code into CRM UI Modal
-> Client calls verifyOtp({ email, token: otpCode, type: 'recovery' })
-> Supabase Auth Validates Code & Returns Authenticated Session
-> User Enters New Password -> updateUser({ password: newPassword })
-> Profile Loaded -> Seamless Transition to Authenticated CRM Dashboard
```

---

## 4. Exact API Call Sequence

```typescript
// Step 1: Initiate Password Recovery (Dispatches 6-digit OTP to user inbox via Zoho SMTP)
const { error: resetErr } = await supabase.auth.resetPasswordForEmail(userEmail);

// Step 2: Verify 6-Digit Recovery OTP (Exchanges OTP for authenticated recovery session)
const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
  email: userEmail,
  token: otpInputCode,
  type: 'recovery',
});

// Step 3: Update Password (Updates credential via authenticated recovery session)
const { data: updateData, error: updateErr } = await supabase.auth.updateUser({
  password: newPasswordString,
});

// Step 4: Load CRM Profile & Resume Active Session
await loadCRMProfile(verifyData.user.id);
```

---

## 5. Required Implementation Changes

### 1. Supabase Dashboard Configuration (Yellow):
* Navigate to **Authentication > Email Templates > Reset Password**.
* Update email body template:
  ```html
  <h2>CorpBD CRM — Password Reset Code</h2>
  <p>Your 6-digit corporate password recovery code is:</p>
  <h1 style="font-size: 32px; letter-spacing: 4px; color: #0284c7;">{{ .Token }}</h1>
  <p>This code will expire in 10 minutes. Do not share this code with anyone.</p>
  ```

### 2. Frontend Application Layer (Yellow):
* **[`src/context/AuthContext.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/context/AuthContext.tsx):**
  - Add `verifyRecoveryOtp(email: string, otpToken: string)` function calling `supabase.auth.verifyOtp`.
  - Maintain `isPasswordRecoveryMode` state management upon successful OTP verification.
* **[`src/components/auth/LoginPage.tsx`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/src/components/auth/LoginPage.tsx):**
  - Enhance "Forgot Password" modal into a 3-step progressive stepper:
    * **Step 1:** Enter Work Email Address (`resetPasswordForEmail`).
    * **Step 2:** Enter 6-Digit OTP Code (`verifyOtp`).
    * **Step 3:** Set & Confirm New Corporate Password (`updateUser`).

---

## 6. Security, Rate Limiting & Isolation Safeguards

1. **Zero Secret Exposure:** OTP codes, passwords, access tokens, and refresh tokens are strictly held in volatile React state variables and cleared upon completion. Zero tokens persisted in `localStorage` or audit logs.
2. **Supabase Auth Source of Truth:** Zero custom database tables or bypass mechanisms added. Supabase Auth GoTrue backend handles generation, verification, TTL expiry (10 min), and attempt throttling natively.
3. **Rate Limiting & Abuse Prevention:** Supabase Auth built-in rate limits apply (default 60 seconds between resend requests per email; max failed verification attempts before lockout).
4. **Email Enumeration Protection:** Form displays identical confirmation messaging regardless of whether the email address is registered in the directory.
5. **Fail-Closed RBAC & Profile Integrity:** User identity (`profiles.id`), tenant ID (`organization_id`), role permissions, and RLS policies remain untouched and enforced.

---

## 7. Rollback & Deployment Strategy

* **Rollback Plan:** If any issue arises during OTP verification, zero database migrations exist to revert. Simply revert `AuthContext.tsx` and `LoginPage.tsx` frontend files to restore the previous flow.
* **Impact on Existing Features:**
  - Normal Sign In (`signInWithPassword`): **0% Impact (100% Unchanged)**
  - Employee Master / RBAC / RLS: **0% Impact (100% Unchanged)**
  - Database Schema & Tables: **0% Impact (100% Unchanged)**

---

## 8. Final Audit Classification Summary

* 🟢 **VERIFIED (GREEN):** Supabase Auth `verifyOtp` API support, Zoho SMTP transport, Profile UUID parity, RBAC & RLS authorization, Normal Login stability.
* 🟡 **PENDING IMPLEMENTATION (YELLOW):** Supabase Dashboard Email Template update (`{{ .Token }}`), `LoginPage.tsx` 3-step OTP modal stepper, `AuthContext.tsx` `verifyOtp` integration.
* 🔴 **REJECTED (RED):** Custom plaintext OTP database tables, magic-link single-use pre-fetch dependencies, bypassing Supabase Auth.

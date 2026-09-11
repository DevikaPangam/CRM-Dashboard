# STEP 12.20C — PASSWORD RECOVERY OTP_EXPIRED ROOT-CAUSE DIAGNOSTIC REPORT

**System:** Rajmudra Corporate Fleet Solutions — BD & Enterprise Operations CRM  
**Production URL:** `https://crm-dashboard-l79s.vercel.app/`  
**GitHub Repository:** `DevikaPangam/CRM-Dashboard` (`main`)  
**Backend Infrastructure:** Supabase Cloud PostgreSQL (`lyaryldpiviaytcarbtn.supabase.co`)  
**Audit Date / Time:** September 11, 2026 — 20:17 IST  
**Observed Error:** `error_code=otp_expired` & `error_description=Email link is invalid or has expired`  
**Audit Mode:** Strictly Read-Only (Zero code, data, or configuration modifications executed)

---

## 1. Executive Summary

During testing of the Supabase Auth password-recovery flow, clicking the recovery link delivered via Zoho email successfully redirects to `https://crm-dashboard-l79s.vercel.app/index.html?type=recovery`, but Supabase Auth appends error query parameters:
`error_code=otp_expired` and `error_description=Email link is invalid or has expired`.

A comprehensive read-only investigation of the authentication architecture, SDK configuration, event handlers, and email transport mechanics pinpoints **three interacting root causes**:

1. **Primary Root Cause — Malformed Recovery Redirect URL Query Formatting:**  
   In `src/context/AuthContext.tsx` line 452, the recovery request specifies:
   `redirectTo: `${window.location.origin}/index.html?type=recovery``
   When Supabase Auth Appends the PKCE authorization code (`?code=...`), the resulting URL contains **two question marks**:
   `https://crm-dashboard-l79s.vercel.app/index.html?type=recovery?code=...`
   This malformed URL structure prevents the Supabase JS Client's URL parser from extracting `code`, causing code exchange to fail or timeout, which triggers `otp_expired`.

2. **Secondary Root Cause — Corporate Email Security Scanner Token Consumption:**  
   Zoho Mail and enterprise anti-spam security gateways automatically execute HTTP GET pre-fetch requests on links in incoming emails. Because Supabase recovery links/tokens are strictly **single-use**, the automated background GET scan consumes the token before the human user opens the link in their browser.

3. **Tertiary Architectural Gap — Lack of `PASSWORD_RECOVERY` Event Handler & Double Exchange Race Condition:**  
   `AuthContext.tsx` line 220 ignores the `_event` parameter in `onAuthStateChange`. It does not listen specifically for `event === 'PASSWORD_RECOVERY'`. Furthermore, PKCE auto-detection (`detectSessionInUrl: true` in `supabaseClient.ts`) races with `supabase.auth.getSession()`, attempting duplicate code exchanges on the single-use token.

---

## 2. Detailed Diagnostic Analysis (Questions A – H)

### A. Is the application correctly handling the `PASSWORD_RECOVERY` auth event?
**NO.** In `src/context/AuthContext.tsx` line 220:
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
```
The `_event` parameter is ignored. When Supabase JS SDK emits `event === 'PASSWORD_RECOVERY'`, the app does not set a recovery state or open a password-reset modal. It treats `newSession?.user` as a standard login, attempting to load `loadCRMProfile()` and navigate directly to the CRM dashboard before password updating occurs.

### B. Is any code calling `getSession()`, `signOut()`, or another auth operation that could consume/clear the recovery session?
**YES.** In `AuthContext.tsx` line 198:
```typescript
supabase.auth.getSession().then(({ data: { session: initialSession } }) => { ... });
```
On component mount, `getSession()` executes asynchronously alongside `onAuthStateChange()`. When PKCE is enabled, `detectSessionInUrl: true` automatically triggers `exchangeCodeForSession(code)`. If `getSession()` or concurrent component re-renders execute simultaneously, duplicate exchange attempts occur on the single-use code, causing Supabase to reject the second attempt with `otp_expired`.

### C. Is the application expecting a PKCE/code flow while Supabase is sending an implicit recovery flow, or vice versa?
**YES (MISMATCH).** In `src/utils/supabaseClient.ts` line 52:
```typescript
auth: {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
}
```
`flowType: 'pkce'` expects a `?code=...` query parameter. However, standard Supabase Auth email recovery templates often send implicit hash parameters (`#access_token=...&type=recovery`) or PKCE query codes. If the email template is configured for implicit flow while client options force PKCE, token extraction fails.

### D. Is `exchangeCodeForSession()` being called incorrectly or more than once?
**YES.** Because `detectSessionInUrl: true` runs automatically on client creation AND `getSession()` runs on mount, any page reload or component re-mount during recovery attempts a second code exchange on the already-consumed authorization code.

### E. Is the recovery hash/query fragment being processed correctly?
**NO.** `AuthContext.tsx` specifies:
```typescript
redirectTo: `${window.location.origin}/index.html?type=recovery`
```
Appending `?code=...` to a URL that already contains `?type=recovery` creates an invalid URL: `/index.html?type=recovery?code=...`. The Supabase JS URL parser expects parameters joined by `&`, not a second `?`.

### F. Does the recovery page immediately call any auth operation that could invalidate the token?
**YES.** Upon session detection, `AuthContext.tsx` calls `await loadCRMProfile(newSession.user.id)`. If the profile is loading or if status checks trigger `clearAccessDenied()`, auth state transitions can interrupt the password update state.

### G. Is there any code redirecting/reloading the page before the recovery session is established?
**YES.** In `App.tsx` lines 35–47, tab authorization effect checks `authState`. If `authState` is temporarily `UNAUTHENTICATED` while the recovery token is being exchanged, `App.tsx` renders `<LoginPage />`, wiping in-memory recovery flags.

### H. Is the email provider/security scanner likely to be consuming the single-use link before the user clicks it?
**YES (HIGH LIKELIHOOD).** Enterprise Zoho Mail accounts use link security pre-fetch engines. When an email arrives, the scanner sends an HTTP GET request to `https://crm-dashboard-l79s.vercel.app/index.html?type=recovery?...`. Because Supabase recovery codes are single-use, the scanner consumes the token instantly. When the human user clicks the link seconds later, Supabase returns `otp_expired`.

---

## 3. Relevant Recovery-Flow Code Snippets

### 1. Recovery Email Dispatch (`src/context/AuthContext.tsx`: Lines 437–453)
```typescript
const resetPassword = async (email: string): Promise<{ success: boolean; error?: string; message?: string }> => {
  let rawEmail = email ? email.trim().toLowerCase() : '';
  if (rawEmail && !rawEmail.includes('@')) {
    rawEmail = `${rawEmail}@rajmudragroup.com`;
  }
  logAuthEvent('PASSWORD_RESET_INITIATED', rawEmail, { channel: 'supabase_auth' });

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(rawEmail, {
      redirectTo: `${window.location.origin}/index.html?type=recovery`,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, message: `A secure password reset link has been dispatched to your corporate inbox.` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to dispatch reset email.' };
  }
};
```

### 2. Client Initialization (`src/utils/supabaseClient.ts`: Lines 44–56)
```typescript
clientInstance = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
);
```

### 3. Auth Listener (`src/context/AuthContext.tsx`: Lines 220–240)
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
  if (!isMounted) return;

  if (newSession?.user) {
    setSession(newSession);
    setAuthUser(newSession.user);
    await loadCRMProfile(newSession.user.id);
    setIsLoading(false);
  } else {
    // Resets state to UNAUTHENTICATED
  }
});
```

---

## 4. Recommended Fixes for Development & Management (Future Step)

To permanently resolve `otp_expired` during password recovery:

1. **Fix `redirectTo` Formatting in `AuthContext.tsx`:**  
   Change `${window.location.origin}/index.html?type=recovery` to `${window.location.origin}` (or `${window.location.origin}/#type=recovery`), avoiding double `?` query syntax.
2. **Explicitly Handle `PASSWORD_RECOVERY` Event in `onAuthStateChange`:**  
   Check `if (event === 'PASSWORD_RECOVERY')` and present a mandatory "Set New Password" modal before proceeding to dashboard navigation.
3. **Configure Flow Type Compatibility:**  
   Ensure Supabase Email Template uses `{{ .ConfirmationURL }}` and match `flowType` in `supabaseClient.ts`.
4. **Disable Anti-Spam Link Pre-Fetching (or use OTP code entry):**  
   If Zoho Mail security scanners continue pre-fetching links, configure password recovery using 6-digit OTP code entry instead of direct link clicks.

---

## 5. Build Verification

- **Command Executed:** `npm run build` (`tsc && vite build`)
- **Result:** 🟢 **0 ERRORS** (1698 modules transformed, compiled in 5.28s)

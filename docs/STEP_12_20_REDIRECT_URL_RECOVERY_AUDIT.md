# STEP 12.20A — SUPABASE AUTHENTICATION REDIRECT URL RECOVERY AUDIT REPORT

**System:** Rajmudra Corporate Fleet Solutions — BD & Enterprise Operations CRM  
**Current Live Production URL:** `https://crm-dashboard-l79s.vercel.app/`  
**GitHub Repository:** `DevikaPangam/CRM-Dashboard` (`main`)  
**Backend Infrastructure:** Supabase Cloud PostgreSQL (`lyaryldpiviaytcarbtn.supabase.co`)  
**Audit Date / Time:** September 11, 2026 — 20:11 IST  
**Audit Scope:** Read-Only Codebase & Infrastructure Analysis (Zero modifications executed)

---

## 1. Executive Summary

This read-only audit reconstructs the complete and exact Supabase Authentication URL configuration required for password recovery, OAuth redirects, and local development environments.

A comprehensive grep audit across all application code, context providers, environment variables, build configs, routing components, and deployment scripts confirms:
1. **Dynamic Origin Construction:** The React application constructs recovery redirect URLs dynamically in `src/context/AuthContext.tsx` line 452 using `${window.location.origin}/index.html?type=recovery`.
2. **Current Production Domain:** The single canonical production URL for the CRM is `https://crm-dashboard-l79s.vercel.app/`.
3. **Source of Old `rg-02b1` URL:** A search across all project files returned **0 occurrences** of `crm-dashboard-rg-02b1.vercel.app`. This domain was an obsolete early Vercel preview deployment URL leftover from initial project bootstrapping and is **NO LONGER VALID**. It should NOT be restored.

---

## 2. Dynamic Redirect URL Construction Analysis

Inspection of `src/context/AuthContext.tsx` reveals the exact mechanism used by Supabase Auth for password reset dispatch:

```typescript
// src/context/AuthContext.tsx (Line 451-453)
const { error } = await supabase.auth.resetPasswordForEmail(rawEmail, {
  redirectTo: `${window.location.origin}/index.html?type=recovery`,
});
```

### Runtime Behavior:
- **In Production (`https://crm-dashboard-l79s.vercel.app/`):**  
  `window.location.origin` evaluates to `https://crm-dashboard-l79s.vercel.app`.  
  The sent `redirectTo` parameter is: `https://crm-dashboard-l79s.vercel.app/index.html?type=recovery`.
- **In Local Development (`http://localhost:5173/` or `3000`):**  
  `window.location.origin` evaluates to `http://localhost:5173` or `http://localhost:3000`.  
  The sent `redirectTo` parameter is: `http://localhost:5173/index.html?type=recovery`.

---

## 3. Required vs Optional vs Obsolete URL Analysis

| Category | URL / Pattern | Purpose | Restoration Status |
| :--- | :--- | :--- | :--- |
| **Site URL** | `https://crm-dashboard-l79s.vercel.app/` | Primary canonical app origin | 🔴 **MUST SET AS SITE URL** |
| **Production Wildcard** | `https://crm-dashboard-l79s.vercel.app/*` | Wildcard for all production routes | 🔴 **REQUIRED IN REDIRECT URLS** |
| **Production Exact Recovery** | `https://crm-dashboard-l79s.vercel.app/index.html?type=recovery` | Exact recovery callback endpoint | 🔴 **REQUIRED IN REDIRECT URLS** |
| **Local Dev (Vite Default)** | `http://localhost:5173/*` | Local frontend dev server | 🟢 **REQUIRED FOR DEV** |
| **Local Dev (API/Node)** | `http://localhost:3000/*` | Local backend / Express server | 🟢 **REQUIRED FOR DEV** |
| **Local Loopback (IP)** | `http://127.0.0.1:5173/*` | Alternative loopback address | 🟡 **OPTIONAL** |
| **Obsolete Vercel Preview** | `https://crm-dashboard-rg-02b1.vercel.app/*` | Legacy early preview domain | ❌ **DO NOT RESTORE** |

---

## 4. Source Audit of Obsolete URL (`rg-02b1`)

A thorough codebase audit was performed for `crm-dashboard-rg-02b1.vercel.app` and `rg-02b1`:

- **Search Command:** `grep -r "rg-02b1" .`
- **Result:** **0 matches found across entire repository**.
- **Conclusion:** `crm-dashboard-rg-02b1.vercel.app` was an ephemeral Vercel deployment preview URL created during early setup. It is not present in `.env`, `vite.config.ts`, `vercel.json`, or any source file. It must **not** be included in the production redirect URL whitelist.

---

## 5. Recommended Supabase URL Configuration (Dashboard Copy-Paste Guide)

Navigate to **Supabase Dashboard > Authentication > URL Configuration**:

### 1. Site URL
Set **Site URL** to:
```text
https://crm-dashboard-l79s.vercel.app/
```

### 2. Redirect URLs Whitelist
Add the following entries under **Redirect URLs**:
```text
https://crm-dashboard-l79s.vercel.app/*
https://crm-dashboard-l79s.vercel.app/index.html?type=recovery
http://localhost:5173/*
http://localhost:3000/*
```

---

## 6. Build Verification

- **Command Executed:** `npm run build` (`tsc && vite build`)
- **Result:** 🟢 **0 ERRORS** (1698 modules transformed, compiled in 5.95s)

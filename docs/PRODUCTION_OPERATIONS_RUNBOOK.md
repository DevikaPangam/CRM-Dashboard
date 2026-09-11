# PRODUCTION OPERATIONS & DISASTER RECOVERY RUNBOOK
**CorpBD CRM / Rajmudra Corporate Fleet Solutions**

---

## 1. System Architecture Overview

```text
       ┌─────────────────────────────────────────────────────────┐
       │                   Vercel Global CDN                     │
       │           (Vite + React 18 + TypeScript UI)             │
       └────────────────────────────┬────────────────────────────┘
                                    │ HTTPS (TLS 1.3 / PKCE)
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │                    Supabase Cloud                       │
       │  ┌──────────────────┐  ┌─────────────────────────────┐  │
       │  │ Supabase Auth    │  │ PostgreSQL 15 Database      │  │
       │  │ (JWT / Auto-Link)│  │ (18 Core Tables + RLS)      │  │
       │  └──────────────────┘  └─────────────────────────────┘  │
       │  ┌──────────────────┐  ┌─────────────────────────────┐  │
       │  │ Storage Vault    │  │ Supabase Realtime           │  │
       │  │ (crm-documents)  │  │ (Postgres Changes Engine)   │  │
       │  └──────────────────┘  └─────────────────────────────┘  │
       └────────────────────────────┬────────────────────────────┘
                                    │ SMTP Relay (TLS)
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             Zoho Corporate Mail Service                 │
       │         (Transactional & Password Resets)               │
       └─────────────────────────────────────────────────────────┘
```

---

## 2. Production Environment & Credential Isolation

* **`VITE_SUPABASE_URL`**: Public Supabase Project API Endpoint (e.g. `https://lyaryldpiviaytcarbtn.supabase.co`).
* **`VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_ANON_KEY`**: Client publishable key.
* **Security Rule:** **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY`, DB passwords, or SMTP secrets in Vite client environment variables or source files.
* **Profile Linking:** `devika.p@rajmudragroup.com` and all users derive System Administrator or BD roles strictly from `public.profiles.role` in PostgreSQL, never from hardcoded frontend checks.

---

## 3. Disaster Recovery Protocols (Scenarios A – J)

### Scenario A: Accidental Record Deletion
* **Detection:** User reports missing client or opportunity record.
* **Containment:** System Administrator reviews `audit_logs` for `DOCUMENT_DELETED` or entity deletion entries.
* **Recovery:** Restore record from latest JSON backup or point-in-time database snapshot.
* **Verification:** Run record query in CRM; verify ownership and associated contacts.

### Scenario B: Incorrect Bulk Update
* **Detection:** Inconsistent record fields (e.g. bulk stage or owner change error).
* **Containment:** Identify affected records using timestamps in `audit_logs`.
* **Recovery:** Revert field values using pre-update audit snapshots or backup restore.
* **Verification:** Execute `verify-step6-data-scope-security.ts` and inspect record values.

### Scenario C: Database Corruption
* **Detection:** Database returns continuous 500 errors or unhandled SQL exceptions.
* **Containment:** Notify Lead DBA and set CRM UI to maintenance fallback banner.
* **Recovery:** Execute Supabase point-in-time recovery to the timestamp preceding corruption.
* **Verification:** Run `scripts/verify-live-supabase-rls.mjs` database probe.

### Scenario D: Deployment Failure
* **Detection:** Vercel deployment build fails or UI shows JS bundle errors.
* **Containment:** Instantly promote previous successful deployment commit hash in Vercel.
* **Recovery:** Fix TypeScript / build errors locally and run `npm run build` prior to re-pushing.
* **Verification:** Perform production site health check.

### Scenario E: Supabase Outage
* **Detection:** API calls return HTTP 502/503/504 errors.
* **Containment:** Application seamlessly enters offline fallback mode; UI displays banner notifying user of degraded status.
* **Recovery:** Monitor Supabase Status Page; system automatically reconnects upon recovery.

### Scenario F: Vercel Outage
* **Detection:** Site returns HTTP 502 Bad Gateway or DNS resolution failure.
* **Containment:** Re-route DNS to secondary static hosting provider (e.g. Cloudflare Pages).
* **Recovery:** Re-verify Vercel status and restore primary DNS routing.

### Scenario G: Storage / Document Vault Failure
* **Detection:** Document upload returns 500 or signed URLs fail to download.
* **Containment:** Inspect Supabase Storage bucket quotas and permission policies.
* **Recovery:** Re-issue time-limited signed URLs or clear orphaned files via `storageService.ts`.

### Scenario H: Authentication Outage
* **Detection:** Users cannot log in or receive 401 Unauthorized errors continuously.
* **Containment:** Session refresh auto-retries via PKCE flow; fallback to local active session.
* **Recovery:** Re-sync Supabase Auth service; prompt users to re-authenticate.

### Scenario I: Zoho SMTP Email Relay Failure
* **Detection:** Password reset emails or activation links fail to deliver.
* **Containment:** Administrator generates direct activation link via `scripts/get-activation-link.js`.
* **Recovery:** Verify Zoho SMTP TLS port 587 / 465 credentials and re-send pending links.

### Scenario J: Security Incident / Compromised Account
* **Detection:** Suspicious login or unauthorized access attempt detected in `audit_logs`.
* **Containment:** Immediately update user profile status to `status = 'suspended'` via database trigger.
* **Recovery:** Revoke all JWT refresh tokens, rotate credentials, and perform security log audit.

---

## 4. Operational Incident Response Matrix

| Severity | Description | Response Time SLA | Escalation Target |
| :--- | :--- | :--- | :--- |
| **P1 — Critical** | Security breach, data leak, total system down | `< 15 Minutes` | Security Lead & Lead DBA |
| **P2 — High** | Major feature unavailable (Auth, Storage down) | `< 1 Hour` | DevOps Lead |
| **P3 — Medium** | Degraded performance, non-blocking bug | `< 4 Hours` | Frontend Lead |
| **P4 — Low** | Minor UI alignment or documentation update | `< 24 Hours` | Maintenance Team |

---

## 5. Go-Live Administrator & Security Checklist

- [x] Step 2 Frontend RBAC Permission Engine verified and active.
- [x] Step 3 Supabase RLS policies enabled across 18 core tables.
- [x] Step 4 Module Navigation Guards and fallback sanitization active.
- [x] Step 5 Action-Level CRUD & Storage permission checks enforced.
- [x] Step 6 Data Scoping & Ownership boundaries active for all 7 roles.
- [x] Step 7 Production Security Validation completed with 0 leaks.
- [x] Step 8 Operational Readiness & Runbook established.
- [x] Zero `service_role` keys in client bundle.
- [x] Production build passes cleanly with 0 TypeScript/Vite errors.

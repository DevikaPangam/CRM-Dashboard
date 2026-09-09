# CorpBD CRM — Production Deployment Checklist & Guide

This document defines the production readiness standards, deployment procedures, security parameters, and monitoring configurations for **CorpBD CRM (Rajmudra Group)**.

---

## 1. Environment & Infrastructure Checklist

### 1.1 Supabase Project Provisioning
- [ ] **Production Project Created**: Hosted in the closest region to users (e.g., `ap-south-1` Mumbai for Rajmudra Group).
- [ ] **Compute & Scaling Tier**: Provisioned on Pro/Team tier with automated disk scaling and PITR (Point-in-Time Recovery).
- [ ] **Database Connection Pooler**: Transaction mode pooler (`Supavisor`) enabled on port `6543` for scalable serverless/Express pooling.

### 1.2 Production Auth Configuration
- [ ] **Email Provider**: SMTP custom server configured (Amazon SES / SendGrid / Postmark) with SPF, DKIM, and DMARC records aligned to `rajmudragroup.com`.
- [ ] **Redirect URLs**:
  - `Site URL`: `https://crm.rajmudragroup.com`
  - `Additional Redirect URLs`:
    - `https://crm.rajmudragroup.com/`
    - `https://crm.rajmudragroup.com/reset-password`
    - `https://crm.rajmudragroup.com/auth/callback`
- [ ] **Token Expiration**:
  - Access Token (JWT): 3600 seconds (1 hour)
  - Refresh Token: 30 days with rolling refresh enabled
- [ ] **Security Defenses**:
  - Captcha enabled on password reset and registration endpoints (hCaptcha / Turnstile).
  - Rate limiting on Auth endpoints set to standard (e.g. 30 requests / 5 minutes per IP).

### 1.3 Environment Variables & Secrets Matrix
| Variable | Environment | Sensitivity | Purpose |
|---|:---:|:---:|---|
| `VITE_SUPABASE_URL` | Frontend (`dist/`) | **Public** | Supabase REST/Realtime gateway |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend (`dist/`) | **Public** | Supabase Anon Key for client RLS operations |
| `VITE_DEFAULT_ORG_ID` | Frontend (`dist/`) | **Public** | Primary organization UUID (`Rajmudra Group`) |
| `VITE_DEFAULT_ORG_SLUG` | Frontend (`dist/`) | **Public** | Organization identifier slug (`rajmudra-group`) |
| `PORT` | Backend (`server.js`) | Private | HTTP application listening port (e.g., `3000`) |
| `NODE_ENV` | Backend (`server.js`) | Private | Set strictly to `production` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend (`server.js`) | **CRITICAL SECRET** | Privileged server-side bridge only |
| `DATABASE_URL` | Backend/CI/CD | **CRITICAL SECRET** | Direct connection string for migration pipelines |

---

## 2. Authentication Standards

- [ ] **Corporate Email Domain Enforcement**:
  - Only `@rajmudragroup.com` email addresses are allowed.
  - Enforced across frontend validation, backend proxy `/api/admin/users`, and PostgreSQL triggers.
- [ ] **Password Policy**:
  - Minimum 8 characters with at least one uppercase letter, one number, and one symbol.
- [ ] **Self-Service Password Recovery**:
  - Initiates password recovery email with 15-minute token TTL.
- [ ] **Inactive Account Denial**:
  - Any account with `status = 'inactive'` in `public.profiles` has session invalidated and queries blocked at database RLS level.

---

## 3. Database & Migration Standards

### 3.1 Migration Sequence
Execute migrations in strict numerical order via Supabase CLI (`supabase db push`) or direct SQL runner:
1. `20260909000001_initial_multi_org_schema.sql` (Tables, constraints, enums)
2. `20260909000002_rls_and_triggers.sql` (Row Level Security & tenant helper functions)
3. `20260909000003_seed_rajmudra_group.sql` (Rajmudra Group org, 4 teams, 7-role permissions matrix)
4. `20260909000004_storage_setup.sql` (Private storage bucket & storage RLS)
5. `20260909000005_proposal_governance.sql` (Separation of Duties & proposal versioning)
6. `20260909000006_reporting_and_dashboard_metrics.sql` (PostgreSQL KPI aggregation RPCs)
7. `20260909000007_audit_logging_engine.sql` (Entity change triggers & immutable audit store)

### 3.2 Database Integrity Controls
- [ ] **Row Level Security (RLS)** active on all 13 PostgreSQL tables.
- [ ] **Multi-Tenant Composite Indexes** active on `(organization_id, id)` and foreign key lookups.
- [ ] **Automated Backups**: Point-in-Time Recovery (PITR) with daily physical snapshots retained for 30 days.

---

## 4. Security & Network Hardening

- [ ] **Zero Secrets in Frontend**: `SUPABASE_SERVICE_ROLE_KEY` is not present in client builds or `VITE_` variables.
- [ ] **Strict HTTPS / TLS 1.3**: All traffic routed through SSL with HSTS enabled (`max-age=31536000; includeSubDomains; preload`).
- [ ] **Security Headers**:
  - `Content-Security-Policy`: Restricts scripts, frames, and connects to Supabase domain.
  - `X-Frame-Options`: `DENY` (prevents clickjacking).
  - `X-Content-Type-Options`: `nosniff`.
  - `Referrer-Policy`: `strict-origin-when-cross-origin`.
- [ ] **CORS Configuration**: Server accepts origin `https://crm.rajmudragroup.com` only.
- [ ] **Admin Endpoint Protection**: `/api/admin/users` requires valid JWT bearing `super_admin` or `admin` role.

---

## 5. Storage Vault Hardening

- [ ] **Private Bucket**: `crm-documents` bucket set to `public = false`.
- [ ] **Path Structure**: `<organization_id>/<client_id>/<opportunity_id>/<document_id>/<filename>`.
- [ ] **Access Control**: Storage RLS validates top-level path segment against `get_current_org_id()`.
- [ ] **Signed URLs**: All file downloads generated on-demand with 300-second (5-minute) expiration.
- [ ] **Validation**: 25MB file size limit and MIME allowlists (`pdf`, `docx`, `xlsx`, `png`, `jpg`).

---

## 6. Monitoring & Alerting Plan

| Metric / Event | Threshold | Alert Destination | Action Required |
|---|:---:|---|---|
| **Failed Logins** | > 10 / 5 min | Security Slack (`#crm-sec-alerts`) | Investigate potential brute-force / IP block |
| **5xx Server Errors** | > 1% in 5 min | DevOps PagerDuty / Email | Inspect Express & Supabase error logs |
| **Database Latency** | > 100ms p95 | Supabase Dashboard Alert | Review active queries and pool saturation |
| **Storage Upload Failures** | > 3 / hour | Engineering Slack (`#crm-ops`) | Check bucket policies and storage quotas |
| **Admin Privilege Changes** | Any occurrence | Audit Channel (`#crm-audit-log`) | Compliance verification of role grant |

---

## 7. Pre-Flight Deployment Command Checklist

```bash
# 1. Verify TypeScript compilation
npx tsc --noEmit

# 2. Run complete test suites
node tests/e2e-acceptance.test.js
node tests/final-production-security-audit.test.js

# 3. Create production bundle
npm run build

# 4. Start production server
NODE_ENV=production node server.js
```

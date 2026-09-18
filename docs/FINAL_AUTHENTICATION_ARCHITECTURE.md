# FINAL AUTHENTICATION ARCHITECTURE

## Core Principles
1. **Supabase Auth is the absolute authority** for all passwords and sessions.
2. **PostgreSQL Row-Level Security (RLS)** is the primary line of defense.
3. **No plaintext secrets or passwords** exist in source, Git, logs, or local storage.
4. **No public registration** is permitted.

## Architecture

### Secure Backend Routing (Vercel Serverless + Express)
The repository leverages a unified Express server (`server.js`) wrapped by a Vercel Serverless Function (`api/index.js`).
- `vercel.json` rewrites all `/api/*` traffic to `/api/index.js`.
- This ensures that server-side endpoints always execute securely, keeping the `SUPABASE_SERVICE_ROLE_KEY` safely isolated.
- The browser SPA communicates strictly with these backend endpoints.

### Employee Provisioning
- The frontend `adminService.ts` executes a `POST /api/admin/users/provision` request to the backend.
- The backend leverages the `service_role` key to securely generate the Supabase Auth Identity.
- The `profiles` table is synced directly so that `profiles.id === auth.users.id`.
- The user dynamically inherits permissions through `public.role_permissions`.

### Password Initialization (Devika)
- An isolated endpoint `POST /init-admin` exists exclusively for the `DEVIKA` identity.
- It is available from the login screen via a temporary "Admin Setup" tab.
- Once executed, it updates the Supabase Auth Identity password and permanently toggles `user_metadata.password_initialized = true`.
- Subsequent hits to this endpoint will instantly return a `403 Forbidden`.

### Password Resets (Future)
- Once logged in, administrators can securely reset employee passwords via the "Users & Permissions" module.
- This invokes `POST /api/admin/users/:id/reset-password`.

## Decommissioned Systems
The following legacy and insecure patterns have been explicitly deleted:
- Client-side `supabase.auth.signUp()`
- First-Time Setup generic endpoints
- `CRM_FIRST_TIME_SETUP_SECRET` dependencies
- Zoho SMTP, OTP, Microsoft Entra flows
- Hardcoded test users
- Local terminal scripts (`scripts/initialize-devika-password.mjs`)

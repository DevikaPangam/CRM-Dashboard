# CorpBD CRM — Supabase Auth Integration & Operational Guide

This document outlines the **Supabase Auth** primary authentication architecture for **CorpBD CRM**, including environment configuration, dashboard settings, email templates, redirect URLs, and security requirements.

---

## 1. Authentication vs Authorization Architecture

CorpBD CRM strictly separates **Authentication** (Identity & Session) from **Authorization** (Multi-Tenant Organization scoping, Roles, Teams & Permissions):

```
                                  ┌───────────────────────────────┐
                                  │      SUPABASE AUTH ENGINE     │
                                  │       (Identity Source)       │
                                  └───────────────┬───────────────┘
                                                  │
                                            auth.users(id)
                                                  │
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │      CRM PROFILE HYDRATION    │
                                  │       (public.profiles)       │
                                  └───────────────┬───────────────┘
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                ▼                                 ▼                                 ▼
      [Profile Not Found]                [Status != 'active']               [Active CRM Member]
                │                                 │                                 │
     Access Not Provisioned:             Access Denied:                     1. Load Organization Info
      No default user created.            Account is suspended               2. Load Team & Manager Info
      Access to CRM is blocked.           or deactivated.                    3. Load Role Permissions
                                                                             4. Grant Authenticated Access
```

---

## 2. Environment Variables

### Frontend Environment Variables (`.env` or `.env.local`):

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | **Yes** | The HTTPS endpoint of your Supabase project (e.g. `https://xyzcompany.supabase.co`). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Yes** | The client-safe Publishable / Anon public key. Safe to expose in the frontend bundle. |
| `VITE_DEFAULT_ORG_ID` | Optional | Default UUID for **Rajmudra Group** (`00000000-0000-0000-0000-000000000001`). |
| `VITE_DEFAULT_ORG_SLUG` | Optional | Default organization slug (`rajmudra-group`). |

> ⚠️ **CRITICAL SECURITY REQUIREMENT:**  
> Never place `SUPABASE_SERVICE_ROLE_KEY` or `SECRET_KEY` in frontend `.env` files or client-side code. All client operations must use the public publishable key under PostgreSQL Row-Level Security (RLS).

---

## 3. Supabase Dashboard Configuration

### Step A: Configure Auth Providers
1. Go to your Supabase Project Dashboard -> **Authentication** -> **Providers**.
2. Under **Email**:
   - Ensure **Enable Email provider** is toggled **ON**.
   - **Confirm email**: Recommended **ON** for production (can be **OFF** for local development speed).
   - **Secure email change**: Enabled.

### Step B: Configure Site URL & Redirect URLs
1. In the Supabase Dashboard, navigate to **Authentication** -> **URL Configuration**.
2. **Site URL**:
   - Development: `http://localhost:5173` (or `http://localhost:3000`)
   - Production: `https://your-production-domain.com`
3. **Redirect URLs (Allow list)**:
   - `http://localhost:5173/**`
   - `http://localhost:3000/**`
   - `https://your-production-domain.com/**`
   - `https://your-production-domain.com/index.html?type=recovery`

### Step C: Customize Password Reset Email Template
1. Navigate to **Authentication** -> **Email Templates** -> **Reset Password**.
2. **Subject**: `Reset your CorpBD CRM Password — Rajmudra Group`
3. **Body**:
   ```html
   <h2>CorpBD CRM Password Recovery</h2>
   <p>Hello,</p>
   <p>A password reset request was submitted for your CorpBD CRM account.</p>
   <p>
     <a href="{{ .ConfirmationURL }}" style="background: #0284c7; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: 600;">
       Reset Password
     </a>
   </p>
   <p>If you did not request this, you can safely ignore this email.</p>
   <p>— Rajmudra Group Business Development IT</p>
   ```

---

## 4. User Provisioning Workflow

### Provisioning a New User (Admin-Only Workflow):
1. **Admin creates user** in the Supabase Dashboard (**Authentication** -> **Users** -> **Add User**) or via Admin API.
2. In **User Metadata**, include:
   ```json
   {
     "full_name": "Rahul Sharma",
     "role": "bd_manager",
     "department": "Business Development",
     "designation": "Senior BD Manager",
     "organization_id": "00000000-0000-0000-0000-000000000001"
   }
   ```
3. The database trigger `on_auth_user_created` automatically inserts the profile row into `public.profiles`.
4. User logs in with their credentials, their active profile and team are hydrated, and they access the CRM with their role-scoped dashboard.

---

## 5. Local Development vs. Production Execution

### Local Development (Offline / Demo Mode):
- If `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are not set in `.env`, the CRM operates in safe offline fallback mode.
- The UI allows user role switching via the Header switcher to test and demo the 7 roles without cloud dependencies.

### Production Mode:
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- The CRM automatically enforces the live `LoginPage`, authenticates against Supabase Auth, validates profile status, and enforces PostgreSQL Row-Level Security on every query.

# CorpBD CRM — Production Supabase PostgreSQL Foundation & Setup Guide

This document outlines the production PostgreSQL architecture, tables, relationships, constraints, and instructions for applying migrations to your **Supabase** project for **Rajmudra Group** (with multi-tenant support).

---

## 📁 Migration Files Overview

All database migrations are located in the [`supabase/migrations/`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/supabase/migrations/) directory:

| Migration File | Description |
|---|---|
| [`20260909000001_initial_multi_org_schema.sql`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/supabase/migrations/20260909000001_initial_multi_org_schema.sql) | Creates UUID extensions, 14 custom ENUMs, all 13 core relational tables, foreign keys with cascading rules, constraints, and indexes. |
| [`20260909000002_rls_and_triggers.sql`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/supabase/migrations/20260909000002_rls_and_triggers.sql) | Sets up `updated_at` automation, the `auth.users` sync trigger (`handle_new_user`), security helper functions, and Row-Level Security (RLS) policies. |
| [`20260909000003_seed_rajmudra_group.sql`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/supabase/migrations/20260909000003_seed_rajmudra_group.sql) | Seeds the initial primary tenant (**Rajmudra Group**), core departments/teams, and default role permission matrices across all 10 CRM modules. |

---

## 🏛️ 13 Core Relational Tables & Schema Map

### 1. `organizations` (Tenant Master)
- **Primary Key**: `id` (UUID)
- **Columns**: `name`, `slug` (UNIQUE), `legal_entity_name`, `gstin`, `cin`, `primary_domain`, `logo_url`, `is_active`, `subscription_tier`, `settings` (JSONB), `created_at`, `updated_at`.
- **Constraints**: `chk_org_slug` (enforces alphanumeric lowercase + hyphens).

### 2. `teams` (Business Units & BD Squads)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)` [CASCADE], `leader_id` -> `profiles(id)` [SET NULL].
- **Columns**: `name`, `code`, `department` (ENUM), `region`, `annual_target_inr`, `description`, `is_active`.
- **Constraints**: `uq_org_team_code` (`organization_id`, `code`).

### 3. `profiles` (User Accounts & Role Mapping)
- **Primary Key**: `id` (UUID -> References `auth.users(id)` [CASCADE])
- **Foreign Keys**: `organization_id` -> `organizations(id)` [RESTRICT], `team_id` -> `teams(id)` [SET NULL], `manager_id` -> `profiles(id)` [SET NULL].
- **Columns**: `full_name`, `email` (UNIQUE), `role` (ENUM), `department`, `designation`, `employee_id`, `phone`, `avatar_url`, `status` (ENUM), `allowed_segments` (TEXT[]), `annual_target_inr`, `last_login_at`.
- **Constraints**: `chk_corporate_email` (Regex email validation). **No passwords stored in database.**

### 4. `role_permissions` (Granular Module Access Matrix)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)` [CASCADE].
- **Columns**: `role` (ENUM), `module_key`, `module_name`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_export`, `can_assign`, `can_approve`, `can_admin`.
- **Constraints**: `uq_org_role_module` (`organization_id`, `role`, `module_key`).

### 5. `clients` (360° Corporate Client Directory)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)` [CASCADE], `owner_id` -> `profiles(id)` [SET NULL], `team_id` -> `teams(id)` [SET NULL], `created_by` -> `profiles(id)` [SET NULL].
- **Columns**: `client_code`, `client_name`, `client_type`, `industry`, `segment`, `city`, `state`, `region`, `tier` (ENUM), `turnover_cr`, `employees`, `status` (ENUM), `website`, `address`, `deployed_fleets` (JSONB), `agreement_doc_url`, `notes`.
- **Constraints**: `uq_org_client_code` (`organization_id`, `client_code`).

### 6. `contacts` (Client Stakeholders & Decision Makers)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)` [CASCADE], `client_id` -> `clients(id)` [CASCADE].
- **Columns**: `name`, `designation`, `email`, `phone`, `linkedin_url`, `is_primary`, `department`, `notes`.

### 7. `opportunities` (Deals & Pipeline Funnel)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)` [CASCADE], `client_id` -> `clients(id)` [CASCADE], `owner_id` -> `profiles(id)` [SET NULL], `team_id` -> `teams(id)` [SET NULL], `approved_by` -> `profiles(id)` [SET NULL], `delegated_owner_id` -> `profiles(id)` [SET NULL].
- **Columns**: `opportunity_code`, `title`, `segment`, `service_category`, `contract_type` (ENUM), `deal_value_inr`, `monthly_value_inr`, `stage` (ENUM), `probability`, `status` (ENUM), `lead_source`, `expected_close_date`, `delegated_department` (ENUM), `delegation_status` (ENUM), `sla_days_remaining`.
- **Constraints**: `uq_org_opportunity_code` (`organization_id`, `opportunity_code`), `chk_opp_probability` (0 - 100%).

### 8. `activities` (Interactions & Meeting Logs)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)` [CASCADE], `client_id` -> `clients(id)` [CASCADE], `opportunity_id` -> `opportunities(id)` [CASCADE], `conducted_by` -> `profiles(id)`, `contact_id` -> `contacts(id)` [SET NULL].
- **Columns**: `type` (ENUM), `subject`, `activity_date`, `activity_time`, `contact_person`, `location`, `key_discussion`, `outcome`, `action_items`, `next_followup_date`, `status`.

### 9. `followups` (Task & SLA Action Reminders)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)` [CASCADE], `client_id` -> `clients(id)` [CASCADE], `opportunity_id` -> `opportunities(id)` [CASCADE], `assigned_to` -> `profiles(id)` [CASCADE].
- **Columns**: `due_date`, `type`, `priority` (ENUM), `description`, `status` (ENUM), `completed_date`, `remarks`.

### 10. `documents` (Document Vault & Contract Attachments)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)` [CASCADE], `client_id` -> `clients(id)` [CASCADE], `opportunity_id` -> `opportunities(id)` [CASCADE], `uploaded_by` -> `profiles(id)`.
- **Columns**: `name`, `original_filename`, `storage_path`, `storage_bucket`, `document_type`, `stage` (ENUM), `file_size_bytes`, `file_extension`, `mime_type`, `metadata` (JSONB).

### 11. `proposals` (Quotations & Pricing Formulas)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)` [CASCADE], `client_id` -> `clients(id)` [CASCADE], `opportunity_id` -> `opportunities(id)` [CASCADE], `owner_id` -> `profiles(id)`.
- **Columns**: `proposal_number`, `version`, `title`, `pricing_data` (JSONB), `total_monthly_quote_inr`, `total_annual_quote_inr`, `projected_margin_pct`, `approval_status` (ENUM), `approved_by`, `approved_at`.
- **Constraints**: `uq_org_proposal_version` (`organization_id`, `proposal_number`, `version`).

### 12. `audit_logs` (Compliance & Change Logs)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)` [CASCADE], `user_id` -> `profiles(id)` [SET NULL].
- **Columns**: `user_name`, `action`, `entity_type`, `entity_id`, `old_values` (JSONB), `new_values` (JSONB), `metadata` (JSONB), `ip_address`, `user_agent`, `created_at`.

### 13. `notifications` (Real-Time In-App Alerts)
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `organization_id` -> `organizations(id)` [CASCADE], `user_id` -> `profiles(id)` [CASCADE].
- **Columns**: `type` (ENUM), `title`, `message`, `link_tab`, `link_entity_id`, `is_read`, `read_at`, `created_at`.

---

## 🚀 How to Apply Migrations to Supabase

### Option 1: Via Supabase Web Dashboard (Recommended & Instant)
1. Log in to [supabase.com](https://supabase.com) and open your project.
2. In the left navigation, click on **SQL Editor**.
3. Create a **New Query**.
4. Copy the entire contents of [`20260909000001_initial_multi_org_schema.sql`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/supabase/migrations/20260909000001_initial_multi_org_schema.sql) and click **Run**.
5. Create a second query, copy [`20260909000002_rls_and_triggers.sql`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/supabase/migrations/20260909000002_rls_and_triggers.sql), and click **Run**.
6. Create a third query, copy [`20260909000003_seed_rajmudra_group.sql`](file:///c:/Users/DevikaPangam/Desktop/CRM%20Dashboard_Vite/supabase/migrations/20260909000003_seed_rajmudra_group.sql), and click **Run**.
7. Navigate to **Table Editor** — you will see all 13 tables created with RLS enabled and **Rajmudra Group** pre-populated!

### Option 2: Via Supabase CLI
```bash
# 1. Login to Supabase CLI
npx supabase login

# 2. Link your local repo to your Supabase project
npx supabase link --project-ref your-project-id

# 3. Push migrations to cloud database
npx supabase db push
```

---

## ⚙️ Manual Supabase Configuration Steps

### 1. Create Cloud Storage Bucket for Documents
1. In the Supabase Dashboard, go to **Storage** -> **New Bucket**.
2. Name: `crm-documents`.
3. Set to **Private** (Restricted).
4. Under **Policies**, add a policy to allow authenticated users belonging to the same organization to upload and read documents.

### 2. Configure Environment Variables
Copy `.env.supabase.example` into your `.env`:
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
VITE_DEFAULT_ORG_ID=00000000-0000-0000-0000-000000000001
VITE_DEFAULT_ORG_SLUG=rajmudra-group
```

### 3. Create First Super Admin User
1. In the Supabase Dashboard, go to **Authentication** -> **Users** -> **Add User**.
2. Enter email (e.g., `devika.admin@rajmudragroup.com`) and password.
3. In **User Metadata**, enter:
   ```json
   {
     "full_name": "Devika Pangam",
     "role": "super_admin",
     "department": "Management",
     "designation": "System Administrator",
     "organization_id": "00000000-0000-0000-0000-000000000001"
   }
   ```
4. The `handle_new_user()` trigger will automatically create the corresponding Super Admin row in `public.profiles`!

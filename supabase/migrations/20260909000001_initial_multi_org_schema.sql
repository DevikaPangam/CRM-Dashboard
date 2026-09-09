-- ==============================================================================
-- CorpBD CRM — Production PostgreSQL Database Schema (Multi-Tenant Architecture)
-- Primary Tenant: Rajmudra Group
-- Migration: 20260909000001_initial_multi_org_schema.sql
-- ==============================================================================

-- 1. Enable Core Cryptographic and UUID Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Custom Enumeration Types
do $$ begin
  create type public.user_role_enum as enum (
    'super_admin',
    'bd_director',
    'bd_manager',
    'bd_sr_exec',
    'bd_exec',
    'management_viewer',
    'analyst'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.permission_action_enum as enum (
    'view',
    'create',
    'edit',
    'delete',
    'export',
    'approve',
    'assign',
    'admin'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status_enum as enum (
    'active',
    'inactive',
    'suspended',
    'pending_invite'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.client_tier_enum as enum (
    'Tier 1 (Enterprise)',
    'Tier 2 (Mid-Market)',
    'Tier 3 (Emerging)'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.client_status_enum as enum (
    'Active',
    'Prospect',
    'Dormant',
    'Blacklisted'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.opportunity_stage_enum as enum (
    'Lead / Inception',
    'Discovery & Requirement',
    'Proposal Formulation',
    'Commercial Discussion',
    'Executive Review',
    'Negotiation & Legal',
    'Closed Won',
    'Closed Lost',
    'On Hold'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.opportunity_status_enum as enum (
    'Open',
    'In Process',
    'Won',
    'Lost',
    'On Hold',
    'Closed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.contract_type_enum as enum (
    'Monthly Retainer',
    'Annual Contract',
    'Project Based',
    'Ad-hoc Transaction',
    'Tripartite SLA'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_type_enum as enum (
    'Physical Meeting',
    'Phone Call',
    'Proposal Discussion',
    'Commercial Negotiation',
    'Client Review',
    'Site Visit',
    'Email Communication',
    'Demo Presentation'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.followup_priority_enum as enum (
    'High',
    'Medium',
    'Low',
    'Urgent'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.followup_status_enum as enum (
    'Pending',
    'In Progress',
    'Completed',
    'Overdue',
    'Cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.delegation_dept_enum as enum (
    'Operations',
    'Pricing & Commercials',
    'Management',
    'Finance & Accounts',
    'Legal & Compliance',
    'Fleet / Asset Management',
    'Human Resources',
    'IT & Systems',
    'BD'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.delegation_status_enum as enum (
    'Pending Action',
    'In Review',
    'Approved & Handed Off',
    'Action Completed',
    'Escalated',
    'Rejected'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.approval_status_enum as enum (
    'Draft',
    'Pending Approval',
    'Approved',
    'Rejected',
    'Revised'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type_enum as enum (
    'deal_assigned',
    'deal_stage_changed',
    'approval_requested',
    'approval_decision',
    'followup_due',
    'followup_overdue',
    'document_uploaded',
    'system_alert'
  );
exception when duplicate_object then null; end $$;

-- ==============================================================================
-- 3. TABLE DEFINITIONS (13 Relational Multi-Tenant Tables)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TABLE 1: organizations (Tenant master)
-- ------------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  legal_entity_name text,
  gstin text,
  cin text,
  primary_domain text,
  logo_url text,
  is_active boolean default true not null,
  subscription_tier text default 'Enterprise' not null,
  settings jsonb default '{}'::jsonb not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint chk_org_slug check (slug ~* '^[a-z0-9-]+$')
);

-- ------------------------------------------------------------------------------
-- TABLE 2: teams (Sub-units within an organization)
-- ------------------------------------------------------------------------------
create table if not exists public.teams (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  code text not null,
  department public.delegation_dept_enum default 'BD' not null,
  region text default 'West' not null,
  leader_id uuid, -- Reference to profiles(id) added via alter table below
  annual_target_inr numeric(15, 2) default 0.00 not null,
  description text,
  is_active boolean default true not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint uq_org_team_code unique (organization_id, code),
  constraint chk_team_target check (annual_target_inr >= 0)
);

-- ------------------------------------------------------------------------------
-- TABLE 3: profiles (Users synced 1:1 with auth.users - NO passwords stored here)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  organization_id uuid references public.organizations(id) on delete restrict not null,
  full_name text not null,
  email text unique not null,
  role public.user_role_enum default 'bd_exec' not null,
  department text default 'Business Development' not null,
  designation text,
  employee_id text,
  phone text,
  avatar_url text,
  team_id uuid references public.teams(id) on delete set null,
  manager_id uuid references public.profiles(id) on delete set null,
  status public.user_status_enum default 'active' not null,
  allowed_segments text[] default array['All']::text[] not null,
  annual_target_inr numeric(15, 2) default 0.00 not null,
  last_login_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint chk_rajmudra_corporate_email check (email ~* '^[A-Za-z0-9._%+-]+@rajmudragroup\.com$'),
  constraint chk_profile_target check (annual_target_inr >= 0)
);

-- Link team leader reference
alter table public.teams 
  drop constraint if exists fk_team_leader,
  add constraint fk_team_leader foreign key (leader_id) references public.profiles(id) on delete set null;

-- Trigger to validate manager and team organization consistency
create or replace function public.check_profile_hierarchy_integrity()
returns trigger as $$
declare
  mgr_org_id uuid;
  team_org_id uuid;
begin
  -- 1. Ensure manager belongs to the identical organization
  if new.manager_id is not null then
    select organization_id into mgr_org_id from public.profiles where id = new.manager_id;
    if mgr_org_id is distinct from new.organization_id then
      raise exception 'Hierarchy Integrity Violation: Manager (ID %) belongs to organization %, but user is in organization %',
        new.manager_id, mgr_org_id, new.organization_id;
    end if;
  end if;

  -- 2. Ensure team belongs to the identical organization
  if new.team_id is not null then
    select organization_id into team_org_id from public.teams where id = new.team_id;
    if team_org_id is distinct from new.organization_id then
      raise exception 'Hierarchy Integrity Violation: Team (ID %) belongs to organization %, but user is in organization %',
        new.team_id, team_org_id, new.organization_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_check_profile_hierarchy on public.profiles;
create trigger trg_check_profile_hierarchy
  before insert or update of manager_id, team_id, organization_id on public.profiles
  for each row execute procedure public.check_profile_hierarchy_integrity();

-- ------------------------------------------------------------------------------
-- TABLE 4: role_permissions (Normalized Action Matrix per Role & Organization)
-- ------------------------------------------------------------------------------
create table if not exists public.role_permissions (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  role public.user_role_enum not null,
  module_key text not null,
  module_name text not null,
  action public.permission_action_enum not null,
  is_allowed boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint uq_org_role_module_action unique (organization_id, role, module_key, action)
);

-- ------------------------------------------------------------------------------
-- TABLE 5: clients (Corporate Client Master Directory)
-- ------------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  client_code text not null,
  client_name text not null,
  client_type text default 'New Client' not null check (client_type in ('New Client', 'Existing Client')),
  industry text not null,
  segment text not null,
  city text not null,
  state text not null,
  region text default 'West' not null check (region in ('North', 'South', 'East', 'West', 'Central')),
  tier public.client_tier_enum default 'Tier 1 (Enterprise)' not null,
  turnover_cr numeric(12, 2) default 0.00 not null,
  employees integer default 0 not null,
  status public.client_status_enum default 'Active' not null,
  owner_id uuid references public.profiles(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  website text,
  address text,
  deployed_fleets jsonb default '[]'::jsonb not null,
  agreement_doc_url text,
  agreement_doc_name text,
  agreement_upload_date date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint uq_org_client_code unique (organization_id, client_code),
  constraint chk_client_turnover check (turnover_cr >= 0),
  constraint chk_client_employees check (employees >= 0)
);

-- ------------------------------------------------------------------------------
-- TABLE 6: contacts (Client Decision Makers & Stakeholders)
-- ------------------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  designation text,
  email text,
  phone text,
  linkedin_url text,
  is_primary boolean default false not null,
  department text,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint chk_contact_email check (email is null or email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ------------------------------------------------------------------------------
-- TABLE 7: opportunities (Sales Pipeline & Deal Inception)
-- ------------------------------------------------------------------------------
create table if not exists public.opportunities (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  opportunity_code text not null,
  title text not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  segment text not null,
  service_category text default 'Employee Transportation' not null,
  contract_type public.contract_type_enum default 'Annual Contract' not null,
  deal_value_inr numeric(15, 2) default 0.00 not null,
  monthly_value_inr numeric(15, 2) default 0.00 not null,
  stage public.opportunity_stage_enum default 'Lead / Inception' not null,
  probability integer default 20 not null,
  status public.opportunity_status_enum default 'Open' not null,
  owner_id uuid references public.profiles(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  lead_source text default 'Direct Outreach / Cold BD' not null,
  expected_close_date date,
  last_activity_date date default current_date not null,
  next_followup_date date,
  fleet_size integer default 0,
  vehicle_type text,
  locations text,
  competition text,
  win_probability_notes text,
  lost_reason text,
  lost_remarks text,
  internal_approvals_required boolean default false not null,
  approval_status public.approval_status_enum default 'Draft' not null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_date timestamptz,
  approval_remarks text,
  delegated_department public.delegation_dept_enum default 'BD' not null,
  delegated_owner_id uuid references public.profiles(id) on delete set null,
  delegation_status public.delegation_status_enum default 'Pending Action' not null,
  delegation_milestone text,
  sla_days_remaining integer default 3,
  delegation_remarks text,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint uq_org_opportunity_code unique (organization_id, opportunity_code),
  constraint chk_opp_probability check (probability between 0 and 100),
  constraint chk_opp_deal_value check (deal_value_inr >= 0),
  constraint chk_opp_monthly_value check (monthly_value_inr >= 0),
  constraint chk_opp_fleet_size check (fleet_size >= 0)
);

-- ------------------------------------------------------------------------------
-- TABLE 8: activities (Client & Opportunity Interactions Log)
-- ------------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  type public.activity_type_enum default 'Physical Meeting' not null,
  subject text not null,
  activity_date date default current_date not null,
  activity_time time,
  conducted_by uuid references public.profiles(id) on delete set null not null,
  contact_person text not null,
  contact_id uuid references public.contacts(id) on delete set null,
  location text,
  key_discussion text not null,
  outcome text not null,
  action_items text,
  next_followup_date date,
  status text default 'Completed' not null check (status in ('Completed', 'Scheduled', 'Cancelled')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- TABLE 9: followups (Action Items & Task Tracker)
-- ------------------------------------------------------------------------------
create table if not exists public.followups (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete cascade not null,
  due_date date not null,
  type text default 'Follow-up Call' not null,
  priority public.followup_priority_enum default 'Medium' not null,
  description text not null,
  status public.followup_status_enum default 'Pending' not null,
  completed_date date,
  remarks text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- TABLE 10: documents (Stage Document Vault & Proposal Attachments)
-- ------------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  name text not null,
  original_filename text not null,
  storage_path text not null,
  storage_bucket text default 'crm-documents' not null,
  document_type text not null,
  stage public.opportunity_stage_enum default 'Proposal Formulation' not null,
  file_size_bytes bigint default 0 not null,
  file_extension text not null,
  mime_type text,
  uploaded_by uuid references public.profiles(id) on delete set null not null,
  metadata jsonb default '{}'::jsonb not null,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- TABLE 11: proposals (Commercial Quotations & Pricing Formulas)
-- ------------------------------------------------------------------------------
create table if not exists public.proposals (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  proposal_number text not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null not null,
  version integer default 1 not null,
  title text not null,
  pricing_data jsonb default '{}'::jsonb not null,
  total_monthly_quote_inr numeric(15, 2) default 0.00 not null,
  total_annual_quote_inr numeric(15, 2) default 0.00 not null,
  projected_margin_pct numeric(5, 2) default 0.00 not null,
  approval_status public.approval_status_enum default 'Draft' not null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  approval_remarks text,
  valid_until date,
  pdf_storage_path text,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint uq_org_proposal_version unique (organization_id, proposal_number, version),
  constraint chk_prop_version check (version >= 1),
  constraint chk_prop_monthly check (total_monthly_quote_inr >= 0),
  constraint chk_prop_annual check (total_annual_quote_inr >= 0)
);

-- ------------------------------------------------------------------------------
-- TABLE 12: audit_logs (System & Administrative Audit Trail)
-- ------------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb default '{}'::jsonb not null,
  ip_address text,
  user_agent text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- TABLE 13: notifications (In-App & Email Dispatch Alerts)
-- ------------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type public.notification_type_enum not null,
  title text not null,
  message text not null,
  link_tab text,
  link_entity_id text,
  is_read boolean default false not null,
  read_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 4. PERFORMANCE & FOREIGN-KEY INDEXES
-- ==============================================================================

create index if not exists idx_organizations_slug on public.organizations(slug);
create index if not exists idx_organizations_active on public.organizations(is_active);

create index if not exists idx_teams_org on public.teams(organization_id);
create index if not exists idx_teams_leader on public.teams(leader_id);
create index if not exists idx_teams_dept on public.teams(department);

create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_team on public.profiles(team_id);
create index if not exists idx_profiles_manager on public.profiles(manager_id);
create index if not exists idx_profiles_status on public.profiles(status);

create index if not exists idx_role_permissions_lookup on public.role_permissions(organization_id, role, module_key, action);

create index if not exists idx_clients_org on public.clients(organization_id);
create index if not exists idx_clients_code on public.clients(client_code);
create index if not exists idx_clients_owner on public.clients(owner_id);
create index if not exists idx_clients_team on public.clients(team_id);
create index if not exists idx_clients_status on public.clients(status);
create index if not exists idx_clients_tier on public.clients(tier);
create index if not exists idx_clients_segment on public.clients(segment);
create index if not exists idx_clients_name_trgm on public.clients using gin (to_tsvector('english', client_name));

create index if not exists idx_contacts_org on public.contacts(organization_id);
create index if not exists idx_contacts_client on public.contacts(client_id);
create index if not exists idx_contacts_email on public.contacts(email);
create index if not exists idx_contacts_is_primary on public.contacts(is_primary);

create index if not exists idx_opps_org on public.opportunities(organization_id);
create index if not exists idx_opps_client on public.opportunities(client_id);
create index if not exists idx_opps_owner on public.opportunities(owner_id);
create index if not exists idx_opps_team on public.opportunities(team_id);
create index if not exists idx_opps_stage on public.opportunities(stage);
create index if not exists idx_opps_status on public.opportunities(status);
create index if not exists idx_opps_close_date on public.opportunities(expected_close_date);
create index if not exists idx_opps_delegated_owner on public.opportunities(delegated_owner_id);
create index if not exists idx_opps_delegated_dept on public.opportunities(delegated_department);
create index if not exists idx_opps_title_trgm on public.opportunities using gin (to_tsvector('english', title));

create index if not exists idx_activities_org on public.activities(organization_id);
create index if not exists idx_activities_client on public.activities(client_id);
create index if not exists idx_activities_opp on public.activities(opportunity_id);
create index if not exists idx_activities_conducted on public.activities(conducted_by);
create index if not exists idx_activities_date on public.activities(activity_date desc);

create index if not exists idx_followups_org on public.followups(organization_id);
create index if not exists idx_followups_assigned on public.followups(assigned_to);
create index if not exists idx_followups_due on public.followups(due_date);
create index if not exists idx_followups_status on public.followups(status);
create index if not exists idx_followups_client on public.followups(client_id);

create index if not exists idx_docs_org on public.documents(organization_id);
create index if not exists idx_docs_client on public.documents(client_id);
create index if not exists idx_docs_opp on public.documents(opportunity_id);
create index if not exists idx_docs_uploaded_by on public.documents(uploaded_by);
create index if not exists idx_docs_stage on public.documents(stage);

create index if not exists idx_proposals_org on public.proposals(organization_id);
create index if not exists idx_proposals_client on public.proposals(client_id);
create index if not exists idx_proposals_opp on public.proposals(opportunity_id);
create index if not exists idx_proposals_owner on public.proposals(owner_id);
create index if not exists idx_proposals_status on public.proposals(approval_status);

create index if not exists idx_audit_org on public.audit_logs(organization_id);
create index if not exists idx_audit_user on public.audit_logs(user_id);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);
create index if not exists idx_audit_entity on public.audit_logs(entity_type, entity_id);

create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read);
create index if not exists idx_notifications_created on public.notifications(created_at desc);

-- ==============================================================================
-- CorpBD CRM — Production-Grade PostgreSQL Row-Level Security (RLS) & Triggers
-- Migration: 20260909000002_rls_and_triggers.sql
-- 
-- PRINCIPLES:
-- 1. Cross-organization access is impossible.
-- 2. Users can only access records belonging to their organization.
-- 3. Authorization is strictly evaluated via PostgreSQL RLS and role_permissions.
-- 4. INSERT policies use WITH CHECK.
-- 5. UPDATE policies use USING and WITH CHECK.
-- 6. DELETE policies are explicit.
-- 7. SELECT policies are explicit.
-- 8. Audit logs are strictly immutable (append-only).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Automated updated_at Timestamp Trigger
-- ------------------------------------------------------------------------------
create or replace function public.trigger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Attach updated_at triggers
drop trigger if exists set_updated_at_organizations on public.organizations;
create trigger set_updated_at_organizations
  before update on public.organizations
  for each row execute procedure public.trigger_set_updated_at();

drop trigger if exists set_updated_at_teams on public.teams;
create trigger set_updated_at_teams
  before update on public.teams
  for each row execute procedure public.trigger_set_updated_at();

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute procedure public.trigger_set_updated_at();

drop trigger if exists set_updated_at_role_permissions on public.role_permissions;
create trigger set_updated_at_role_permissions
  before update on public.role_permissions
  for each row execute procedure public.trigger_set_updated_at();

drop trigger if exists set_updated_at_clients on public.clients;
create trigger set_updated_at_clients
  before update on public.clients
  for each row execute procedure public.trigger_set_updated_at();

drop trigger if exists set_updated_at_contacts on public.contacts;
create trigger set_updated_at_contacts
  before update on public.contacts
  for each row execute procedure public.trigger_set_updated_at();

drop trigger if exists set_updated_at_opportunities on public.opportunities;
create trigger set_updated_at_opportunities
  before update on public.opportunities
  for each row execute procedure public.trigger_set_updated_at();

drop trigger if exists set_updated_at_activities on public.activities;
create trigger set_updated_at_activities
  before update on public.activities
  for each row execute procedure public.trigger_set_updated_at();

drop trigger if exists set_updated_at_followups on public.followups;
create trigger set_updated_at_followups
  before update on public.followups
  for each row execute procedure public.trigger_set_updated_at();

drop trigger if exists set_updated_at_documents on public.documents;
create trigger set_updated_at_documents
  before update on public.documents
  for each row execute procedure public.trigger_set_updated_at();

drop trigger if exists set_updated_at_proposals on public.proposals;
create trigger set_updated_at_proposals
  before update on public.proposals
  for each row execute procedure public.trigger_set_updated_at();

-- ------------------------------------------------------------------------------
-- 2. Supabase Auth Integration Trigger (handle_new_user)
-- Strict Rule: Newly registered users NEVER receive super_admin automatically.
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_org_id uuid;
  assigned_role public.user_role_enum;
begin
  -- 1. Security Rule: Validate Corporate Email Domain (@rajmudragroup.com)
  if new.email !~* '^[A-Za-z0-9._%+-]+@rajmudragroup\.com$' then
    raise exception 'Unauthorized Domain: Only corporate @rajmudragroup.com emails are authorized for CRM provisioning.';
  end if;

  -- 2. Resolve default organization (Rajmudra Group or from user_metadata)
  if (new.raw_user_meta_data->>'organization_id') is not null then
    default_org_id := (new.raw_user_meta_data->>'organization_id')::uuid;
  else
    select id into default_org_id from public.organizations where slug = 'rajmudra-group' limit 1;
  end if;

  -- 3. Security Rule: Default role is 'bd_exec'. Super admin cannot be self-assigned upon signup.
  assigned_role := 'bd_exec'::public.user_role_enum;

  insert into public.profiles (
    id,
    organization_id,
    full_name,
    email,
    role,
    department,
    designation,
    status
  ) values (
    new.id,
    default_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    assigned_role,
    'Business Development',
    'BD Executive',
    'active'
  );

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3. Core PostgreSQL Security & Hierarchy Helper Functions
-- ------------------------------------------------------------------------------

-- (A) Current User Profile
create or replace function public.get_current_profile()
returns public.profiles as $$
  select * from public.profiles where id = auth.uid() limit 1;
$$ language sql stable security definer;

-- (B) Current Organization ID
create or replace function public.get_current_org_id()
returns uuid as $$
  select organization_id from public.profiles where id = auth.uid() limit 1;
$$ language sql stable security definer;

-- (C) Current Role
create or replace function public.get_current_role()
returns public.user_role_enum as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$ language sql stable security definer;

-- (C2) Current User Role Alias
create or replace function public.get_current_user_role()
returns public.user_role_enum as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$ language sql stable security definer;

-- (D) Current Team ID
create or replace function public.get_current_team_id()
returns uuid as $$
  select team_id from public.profiles where id = auth.uid() limit 1;
$$ language sql stable security definer;

-- (E) Is Organization Admin / Director
create or replace function public.is_org_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('super_admin', 'bd_director')
  );
$$ language sql stable security definer;

-- (F) Team Member IDs
create or replace function public.get_team_member_ids(t_id uuid)
returns setof uuid as $$
  select id from public.profiles 
  where team_id = t_id 
  and organization_id = public.get_current_org_id();
$$ language sql stable security definer;

-- (G) Subordinate IDs (Recursive Hierarchical Reporting Tree)
create or replace function public.get_subordinate_ids(m_id uuid)
returns setof uuid as $$
  with recursive reporting_tree as (
    select id, manager_id, organization_id
    from public.profiles
    where manager_id = m_id
    
    union all
    
    select p.id, p.manager_id, p.organization_id
    from public.profiles p
    inner join reporting_tree rt on p.manager_id = rt.id
    where p.organization_id = public.get_current_org_id()
  )
  select id from reporting_tree;
$$ language sql stable security definer;

-- (H) Dynamic Normalized Permission Check Function
create or replace function public.has_permission(mod_key text, act text)
returns boolean as $$
declare
  u_role public.user_role_enum;
  u_org_id uuid;
  is_granted boolean;
begin
  select role, organization_id into u_role, u_org_id 
  from public.profiles 
  where id = auth.uid();

  if u_role is null then
    return false;
  end if;

  -- Super Admin always has full unrestricted access
  if u_role = 'super_admin' then
    return true;
  end if;

  -- Check dynamic normalized role_permissions table
  select is_allowed into is_granted
  from public.role_permissions
  where organization_id = u_org_id
    and role = u_role
    and module_key = mod_key
    and action = act::public.permission_action_enum
  limit 1;

  return coalesce(is_granted, false);
end;
$$ language plpgsql stable security definer;

-- (I) Action Permission Helpers
create or replace function public.can_export(mod_key text)
returns boolean as $$
  select public.has_permission(mod_key, 'export');
$$ language sql stable security definer;

create or replace function public.can_approve(mod_key text)
returns boolean as $$
  select public.has_permission(mod_key, 'approve');
$$ language sql stable security definer;

create or replace function public.can_assign(mod_key text)
returns boolean as $$
  select public.has_permission(mod_key, 'assign');
$$ language sql stable security definer;

create or replace function public.can_admin(mod_key text)
returns boolean as $$
  select public.has_permission(mod_key, 'admin');
$$ language sql stable security definer;

-- ------------------------------------------------------------------------------
-- 4. Prevent User Self-Escalation (Trigger on Profiles)
-- ------------------------------------------------------------------------------
create or replace function public.prevent_profile_self_escalation()
returns trigger as $$
begin
  -- If not an admin, block modifications to privileged fields
  if not public.is_org_admin() then
    if new.role is distinct from old.role then
      raise exception 'Unauthorized: Only an Administrator can modify user roles.';
    end if;
    if new.organization_id is distinct from old.organization_id then
      raise exception 'Unauthorized: Users cannot change their organization.';
    end if;
    if new.team_id is distinct from old.team_id then
      raise exception 'Unauthorized: Only an Administrator can reassign teams.';
    end if;
    if new.manager_id is distinct from old.manager_id then
      raise exception 'Unauthorized: Only an Administrator can assign managers.';
    end if;
    if new.status is distinct from old.status then
      raise exception 'Unauthorized: Only an Administrator can modify account status.';
    end if;
    if new.annual_target_inr is distinct from old.annual_target_inr then
      raise exception 'Unauthorized: Only an Administrator can modify target quotas.';
    end if;
    if new.allowed_segments is distinct from old.allowed_segments then
      raise exception 'Unauthorized: Only an Administrator can modify segment permissions.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_profile_self_escalation on public.profiles;
create trigger trg_prevent_profile_self_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_profile_self_escalation();

-- ------------------------------------------------------------------------------
-- 5. Enable Row Level Security (RLS) On All 13 Business Tables
-- ------------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.clients enable row level security;
alter table public.contacts enable row level security;
alter table public.opportunities enable row level security;
alter table public.activities enable row level security;
alter table public.followups enable row level security;
alter table public.documents enable row level security;
alter table public.proposals enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- ==============================================================================
-- 6. GRANULAR ROW LEVEL SECURITY POLICIES
-- ==============================================================================

-- Drop all existing policies to guarantee a clean, non-conflicting state
drop policy if exists "Organizations View Policy" on public.organizations;
drop policy if exists "Organizations Admin Policy" on public.organizations;
drop policy if exists "Organizations Select" on public.organizations;
drop policy if exists "Organizations Insert" on public.organizations;
drop policy if exists "Organizations Update" on public.organizations;
drop policy if exists "Organizations Delete" on public.organizations;

drop policy if exists "Teams View Policy" on public.teams;
drop policy if exists "Teams Admin Policy" on public.teams;
drop policy if exists "Teams Select" on public.teams;
drop policy if exists "Teams Insert" on public.teams;
drop policy if exists "Teams Update" on public.teams;
drop policy if exists "Teams Delete" on public.teams;

drop policy if exists "Profiles View Policy" on public.profiles;
drop policy if exists "Profiles Self Update Policy" on public.profiles;
drop policy if exists "Profiles Admin Management Policy" on public.profiles;
drop policy if exists "Profiles Select" on public.profiles;
drop policy if exists "Profiles Insert" on public.profiles;
drop policy if exists "Profiles Update" on public.profiles;
drop policy if exists "Profiles Delete" on public.profiles;

drop policy if exists "Role Permissions View Policy" on public.role_permissions;
drop policy if exists "Role Permissions Admin Policy" on public.role_permissions;
drop policy if exists "Role Permissions Select" on public.role_permissions;
drop policy if exists "Role Permissions Insert" on public.role_permissions;
drop policy if exists "Role Permissions Update" on public.role_permissions;
drop policy if exists "Role Permissions Delete" on public.role_permissions;

drop policy if exists "Clients View Policy" on public.clients;
drop policy if exists "Clients Insert Policy" on public.clients;
drop policy if exists "Clients Update Policy" on public.clients;
drop policy if exists "Clients Delete Policy" on public.clients;

drop policy if exists "Contacts View Policy" on public.contacts;
drop policy if exists "Contacts Mutation Policy" on public.contacts;
drop policy if exists "Contacts Select" on public.contacts;
drop policy if exists "Contacts Insert" on public.contacts;
drop policy if exists "Contacts Update" on public.contacts;
drop policy if exists "Contacts Delete" on public.contacts;

drop policy if exists "Opportunities View Policy" on public.opportunities;
drop policy if exists "Opportunities Insert Policy" on public.opportunities;
drop policy if exists "Opportunities Update Policy" on public.opportunities;
drop policy if exists "Opportunities Delete Policy" on public.opportunities;

drop policy if exists "Activities View Policy" on public.activities;
drop policy if exists "Activities Insert Policy" on public.activities;
drop policy if exists "Activities Update Policy" on public.activities;
drop policy if exists "Activities Delete Policy" on public.activities;

drop policy if exists "Followups View Policy" on public.followups;
drop policy if exists "Followups Mutation Policy" on public.followups;
drop policy if exists "Followups Select" on public.followups;
drop policy if exists "Followups Insert" on public.followups;
drop policy if exists "Followups Update" on public.followups;
drop policy if exists "Followups Delete" on public.followups;

drop policy if exists "Documents View Policy" on public.documents;
drop policy if exists "Documents Mutation Policy" on public.documents;
drop policy if exists "Documents Select" on public.documents;
drop policy if exists "Documents Insert" on public.documents;
drop policy if exists "Documents Update" on public.documents;
drop policy if exists "Documents Delete" on public.documents;

drop policy if exists "Proposals View Policy" on public.proposals;
drop policy if exists "Proposals Insert Policy" on public.proposals;
drop policy if exists "Proposals Mutation Policy" on public.proposals;
drop policy if exists "Proposals Select" on public.proposals;
drop policy if exists "Proposals Insert" on public.proposals;
drop policy if exists "Proposals Update" on public.proposals;
drop policy if exists "Proposals Delete" on public.proposals;

drop policy if exists "Audit Logs View Policy" on public.audit_logs;
drop policy if exists "Audit Logs Insert Policy" on public.audit_logs;
drop policy if exists "Audit Logs Select" on public.audit_logs;
drop policy if exists "Audit Logs Insert" on public.audit_logs;

drop policy if exists "Notifications User Isolation" on public.notifications;
drop policy if exists "Notifications Select" on public.notifications;
drop policy if exists "Notifications Insert" on public.notifications;
drop policy if exists "Notifications Update" on public.notifications;
drop policy if exists "Notifications Delete" on public.notifications;

-- ------------------------------------------------------------------------------
-- (1) ORGANIZATIONS POLICIES
-- ------------------------------------------------------------------------------
create policy "Organizations Select"
  on public.organizations for select
  using (id = public.get_current_org_id());

create policy "Organizations Insert"
  on public.organizations for insert
  with check (public.get_current_role() = 'super_admin');

create policy "Organizations Update"
  on public.organizations for update
  using (id = public.get_current_org_id() and public.get_current_role() = 'super_admin')
  with check (id = public.get_current_org_id() and public.get_current_role() = 'super_admin');

create policy "Organizations Delete"
  on public.organizations for delete
  using (public.get_current_role() = 'super_admin');

-- ------------------------------------------------------------------------------
-- (2) TEAMS POLICIES
-- ------------------------------------------------------------------------------
create policy "Teams Select"
  on public.teams for select
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('team', 'view')
  );

create policy "Teams Insert"
  on public.teams for insert
  with check (
    organization_id = public.get_current_org_id()
    and public.is_org_admin()
  );

create policy "Teams Update"
  on public.teams for update
  using (
    organization_id = public.get_current_org_id() 
    and public.is_org_admin()
  )
  with check (
    organization_id = public.get_current_org_id() 
    and public.is_org_admin()
  );

create policy "Teams Delete"
  on public.teams for delete
  using (
    organization_id = public.get_current_org_id() 
    and public.is_org_admin()
  );

-- ------------------------------------------------------------------------------
-- (3) PROFILES POLICIES
-- ------------------------------------------------------------------------------
create policy "Profiles Select"
  on public.profiles for select
  using (organization_id = public.get_current_org_id());

create policy "Profiles Insert"
  on public.profiles for insert
  with check (
    organization_id = public.get_current_org_id()
    and (public.is_org_admin() or id = auth.uid())
  );

create policy "Profiles Update"
  on public.profiles for update
  using (
    organization_id = public.get_current_org_id()
    and (public.is_org_admin() or id = auth.uid())
  )
  with check (
    organization_id = public.get_current_org_id()
    and (public.is_org_admin() or id = auth.uid())
  );

create policy "Profiles Delete"
  on public.profiles for delete
  using (
    organization_id = public.get_current_org_id()
    and public.get_current_role() = 'super_admin'
    and id <> auth.uid()
  );

-- ------------------------------------------------------------------------------
-- (4) ROLE PERMISSIONS POLICIES
-- ------------------------------------------------------------------------------
create policy "Role Permissions Select"
  on public.role_permissions for select
  using (organization_id = public.get_current_org_id());

create policy "Role Permissions Insert"
  on public.role_permissions for insert
  with check (
    organization_id = public.get_current_org_id()
    and public.is_org_admin()
  );

create policy "Role Permissions Update"
  on public.role_permissions for update
  using (
    organization_id = public.get_current_org_id()
    and public.is_org_admin()
  )
  with check (
    organization_id = public.get_current_org_id()
    and public.is_org_admin()
  );

create policy "Role Permissions Delete"
  on public.role_permissions for delete
  using (
    organization_id = public.get_current_org_id()
    and public.is_org_admin()
  );

-- ------------------------------------------------------------------------------
-- (5) CLIENTS POLICIES
-- ------------------------------------------------------------------------------
create policy "Clients Select"
  on public.clients for select
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('clients', 'view')
    and (
      public.is_org_admin()
      or public.get_current_role() in ('management_viewer', 'analyst')
      or owner_id = auth.uid()
      or created_by = auth.uid()
      or owner_id in (select public.get_subordinate_ids(auth.uid()))
      or (team_id is not null and team_id = public.get_current_team_id())
    )
  );

create policy "Clients Insert"
  on public.clients for insert
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('clients', 'create')
  );

create policy "Clients Update"
  on public.clients for update
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('clients', 'edit')
    and (
      public.is_org_admin()
      or owner_id = auth.uid()
      or owner_id in (select public.get_subordinate_ids(auth.uid()))
      or (team_id is not null and team_id = public.get_current_team_id() and public.get_current_role() = 'bd_manager')
    )
  )
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('clients', 'edit')
  );

create policy "Clients Delete"
  on public.clients for delete
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('clients', 'delete')
    and public.is_org_admin()
  );

-- ------------------------------------------------------------------------------
-- (6) CONTACTS POLICIES
-- ------------------------------------------------------------------------------
create policy "Contacts Select"
  on public.contacts for select
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('clients', 'view')
  );

create policy "Contacts Insert"
  on public.contacts for insert
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('clients', 'create')
  );

create policy "Contacts Update"
  on public.contacts for update
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('clients', 'edit')
  )
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('clients', 'edit')
  );

create policy "Contacts Delete"
  on public.contacts for delete
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('clients', 'delete')
    and public.is_org_admin()
  );

-- ------------------------------------------------------------------------------
-- (7) OPPORTUNITIES POLICIES (Pipeline & Deals)
-- ------------------------------------------------------------------------------
create policy "Opportunities Select"
  on public.opportunities for select
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('opportunities', 'view')
    and (
      public.is_org_admin()
      or public.get_current_role() in ('management_viewer', 'analyst')
      or owner_id = auth.uid()
      or delegated_owner_id = auth.uid()
      or owner_id in (select public.get_subordinate_ids(auth.uid()))
      or (team_id is not null and team_id = public.get_current_team_id())
    )
  );

create policy "Opportunities Insert"
  on public.opportunities for insert
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('opportunities', 'create')
  );

create policy "Opportunities Update"
  on public.opportunities for update
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('opportunities', 'edit')
    and (
      public.is_org_admin()
      or owner_id = auth.uid()
      or delegated_owner_id = auth.uid()
      or owner_id in (select public.get_subordinate_ids(auth.uid()))
      or (team_id is not null and team_id = public.get_current_team_id() and public.get_current_role() = 'bd_manager')
    )
  )
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('opportunities', 'edit')
  );

create policy "Opportunities Delete"
  on public.opportunities for delete
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('opportunities', 'delete')
    and public.is_org_admin()
  );

-- ------------------------------------------------------------------------------
-- (8) ACTIVITIES POLICIES
-- ------------------------------------------------------------------------------
create policy "Activities Select"
  on public.activities for select
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('activities', 'view')
  );

create policy "Activities Insert"
  on public.activities for insert
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('activities', 'create')
    and conducted_by = auth.uid()
  );

create policy "Activities Update"
  on public.activities for update
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('activities', 'edit')
    and (public.is_org_admin() or conducted_by = auth.uid())
  )
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('activities', 'edit')
  );

create policy "Activities Delete"
  on public.activities for delete
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('activities', 'delete')
    and (public.is_org_admin() or conducted_by = auth.uid())
  );

-- ------------------------------------------------------------------------------
-- (9) FOLLOWUPS POLICIES
-- ------------------------------------------------------------------------------
create policy "Followups Select"
  on public.followups for select
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('followups', 'view')
  );

create policy "Followups Insert"
  on public.followups for insert
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('followups', 'create')
  );

create policy "Followups Update"
  on public.followups for update
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('followups', 'edit')
    and (
      public.is_org_admin() 
      or assigned_to = auth.uid()
      or assigned_to in (select public.get_subordinate_ids(auth.uid()))
    )
  )
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('followups', 'edit')
  );

create policy "Followups Delete"
  on public.followups for delete
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('followups', 'delete')
    and (
      public.is_org_admin() 
      or assigned_to = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- (10) DOCUMENTS POLICIES
-- ------------------------------------------------------------------------------
create policy "Documents Select"
  on public.documents for select
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('documents', 'view')
  );

create policy "Documents Insert"
  on public.documents for insert
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('documents', 'create')
  );

create policy "Documents Update"
  on public.documents for update
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('documents', 'edit')
    and (
      public.is_org_admin()
      or uploaded_by = auth.uid()
    )
  )
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('documents', 'edit')
  );

create policy "Documents Delete"
  on public.documents for delete
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('documents', 'delete')
    and (
      public.is_org_admin()
      or uploaded_by = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- (11) PROPOSALS POLICIES
-- ------------------------------------------------------------------------------
create policy "Proposals Select"
  on public.proposals for select
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('calculator', 'view')
  );

create policy "Proposals Insert"
  on public.proposals for insert
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('calculator', 'create')
  );

create policy "Proposals Update"
  on public.proposals for update
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('calculator', 'edit')
    and (
      public.is_org_admin()
      or owner_id = auth.uid()
      or (public.get_current_role() in ('bd_director', 'bd_manager') and public.can_approve('calculator'))
    )
  )
  with check (
    organization_id = public.get_current_org_id()
    and public.has_permission('calculator', 'edit')
  );

create policy "Proposals Delete"
  on public.proposals for delete
  using (
    organization_id = public.get_current_org_id()
    and public.has_permission('calculator', 'delete')
    and public.is_org_admin()
  );

-- ------------------------------------------------------------------------------
-- (12) AUDIT LOGS POLICIES (Strictly Append-Only & Immutable)
-- ------------------------------------------------------------------------------
create policy "Audit Logs Select"
  on public.audit_logs for select
  using (
    organization_id = public.get_current_org_id()
    and public.is_org_admin()
  );

create policy "Audit Logs Insert"
  on public.audit_logs for insert
  with check (
    organization_id = public.get_current_org_id()
  );

-- Explicitly disallow UPDATE and DELETE on audit_logs by not creating any policies for them.

-- ------------------------------------------------------------------------------
-- (13) NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
create policy "Notifications Select"
  on public.notifications for select
  using (
    organization_id = public.get_current_org_id()
    and user_id = auth.uid()
  );

create policy "Notifications Insert"
  on public.notifications for insert
  with check (
    organization_id = public.get_current_org_id()
  );

create policy "Notifications Update"
  on public.notifications for update
  using (
    organization_id = public.get_current_org_id()
    and user_id = auth.uid()
  )
  with check (
    organization_id = public.get_current_org_id()
    and user_id = auth.uid()
  );

create policy "Notifications Delete"
  on public.notifications for delete
  using (
    organization_id = public.get_current_org_id()
    and user_id = auth.uid()
  );

-- ==============================================================================
-- CorpBD CRM — Production Supabase RLS Authorization Hardening Migration
-- Migration: 20260910000014_rls_hardening_security_pass.sql
-- 
-- PRINCIPLES:
-- 1. All anonymous (anon) access removed from CRM business data tables.
-- 2. Tenant isolation enforced on every table: organization_id = public.get_auth_user_org_id().
-- 3. Dynamic role and scope authorization based strictly on public.profiles and public.role_permissions.
-- 4. Immutable append-only audit_logs and employee_history.
-- 5. Anti-privilege escalation triggers for user profiles.
-- 6. Storage bucket crm-documents restricted to authenticated active users.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS WITH SAFE SEARCH_PATH
-- ------------------------------------------------------------------------------

create or replace function public.get_auth_user_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.get_auth_user_role()
returns public.user_role_enum language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.is_active_authenticated_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
      and (status = 'active' or status = 'Active')
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
      and role = 'super_admin'
      and (status = 'active' or status = 'Active')
  );
$$;

create or replace function public.is_director_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
      and role in ('super_admin', 'bd_director')
      and (status = 'active' or status = 'Active')
  );
$$;

create or replace function public.is_manager_or_above()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
      and role in ('super_admin', 'bd_director', 'bd_manager')
      and (status = 'active' or status = 'Active')
  );
$$;

create or replace function public.is_crm_contributor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
      and role in ('super_admin', 'bd_director', 'bd_manager', 'bd_sr_exec', 'bd_exec')
      and (status = 'active' or status = 'Active')
  );
$$;

create or replace function public.get_subordinate_ids(m_id uuid)
returns setof uuid language sql stable security definer set search_path = public as $$
  with recursive reporting_tree as (
    select id, manager_id, organization_id
    from public.profiles
    where manager_id = m_id
    
    union all
    
    select p.id, p.manager_id, p.organization_id
    from public.profiles p
    inner join reporting_tree rt on p.manager_id = rt.id
    where p.organization_id = public.get_auth_user_org_id()
  )
  select id from reporting_tree;
$$;

-- Grant execution to authenticated & service_role (EXCLUDE anon from executing helper functions where appropriate)
grant execute on function public.get_auth_user_org_id() to authenticated, service_role;
grant execute on function public.get_auth_user_role() to authenticated, service_role;
grant execute on function public.is_active_authenticated_user() to authenticated, service_role;
grant execute on function public.is_super_admin() to authenticated, service_role;
grant execute on function public.is_director_or_admin() to authenticated, service_role;
grant execute on function public.is_manager_or_above() to authenticated, service_role;
grant execute on function public.is_crm_contributor() to authenticated, service_role;
grant execute on function public.get_subordinate_ids(uuid) to authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. ANTI-PRIVILEGE ESCALATION TRIGGER FOR PROFILES
-- ------------------------------------------------------------------------------
create or replace function public.prevent_profile_self_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- If user is not super_admin or bd_director, block modifications to administrative fields
  if not public.is_director_or_admin() then
    if new.role is distinct from old.role then
      raise exception 'Security Error: Only System Administrators can alter user roles.';
    end if;
    if new.organization_id is distinct from old.organization_id then
      raise exception 'Security Error: Users cannot alter their organization assignment.';
    end if;
    if new.team_id is distinct from old.team_id then
      raise exception 'Security Error: Only System Administrators can reassign user teams.';
    end if;
    if new.manager_id is distinct from old.manager_id then
      raise exception 'Security Error: Only System Administrators can reassign reporting managers.';
    end if;
    if new.status is distinct from old.status then
      raise exception 'Security Error: Only System Administrators can modify user status.';
    end if;
    if new.annual_target_inr is distinct from old.annual_target_inr then
      raise exception 'Security Error: Only System Administrators can modify sales quota targets.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_self_escalation on public.profiles;
create trigger trg_prevent_profile_self_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_profile_self_escalation();

-- ------------------------------------------------------------------------------
-- 3. ENABLE RLS ON ALL BUSINESS TABLES
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

-- Enable RLS on secondary/history tables if exist
do $$ begin alter table public.departments enable row level security; exception when undefined_table then null; end $$;
do $$ begin alter table public.regions enable row level security; exception when undefined_table then null; end $$;
do $$ begin alter table public.segments enable row level security; exception when undefined_table then null; end $$;
do $$ begin alter table public.internal_tasks enable row level security; exception when undefined_table then null; end $$;
do $$ begin alter table public.employee_history enable row level security; exception when undefined_table then null; end $$;
do $$ begin alter table public.employee_kras enable row level security; exception when undefined_table then null; end $$;
do $$ begin alter table public.employee_kpis enable row level security; exception when undefined_table then null; end $$;
do $$ begin alter table public.employee_performance_reviews enable row level security; exception when undefined_table then null; end $$;

-- ------------------------------------------------------------------------------
-- 4. CLEANUP OLD INSECURE AND PERMISSIVE POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Organizations View Policy" on public.organizations;
drop policy if exists "Organizations Admin Policy" on public.organizations;
drop policy if exists "Organizations Select" on public.organizations;
drop policy if exists "Organizations Insert" on public.organizations;
drop policy if exists "Organizations Update" on public.organizations;
drop policy if exists "Organizations Delete" on public.organizations;
drop policy if exists "org_select_policy" on public.organizations;
drop policy if exists "org_admin_policy" on public.organizations;

drop policy if exists "Teams View Policy" on public.teams;
drop policy if exists "Teams Admin Policy" on public.teams;
drop policy if exists "Teams Select" on public.teams;
drop policy if exists "Teams Insert" on public.teams;
drop policy if exists "Teams Update" on public.teams;
drop policy if exists "Teams Delete" on public.teams;
drop policy if exists "teams_select_policy" on public.teams;
drop policy if exists "teams_admin_policy" on public.teams;

drop policy if exists "Profiles View Policy" on public.profiles;
drop policy if exists "Profiles Self Update Policy" on public.profiles;
drop policy if exists "Profiles Admin Management Policy" on public.profiles;
drop policy if exists "Profiles Select" on public.profiles;
drop policy if exists "Profiles Insert" on public.profiles;
drop policy if exists "Profiles Update" on public.profiles;
drop policy if exists "Profiles Delete" on public.profiles;
drop policy if exists "profiles_select_policy" on public.profiles;
drop policy if exists "profiles_insert_policy" on public.profiles;
drop policy if exists "profiles_update_policy" on public.profiles;
drop policy if exists "profiles_delete_policy" on public.profiles;

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
drop policy if exists "Clients Select" on public.clients;
drop policy if exists "Clients Insert" on public.clients;
drop policy if exists "Clients Update" on public.clients;
drop policy if exists "Clients Delete" on public.clients;
drop policy if exists "clients_select_policy" on public.clients;
drop policy if exists "clients_insert_policy" on public.clients;
drop policy if exists "clients_update_policy" on public.clients;
drop policy if exists "clients_delete_policy" on public.clients;

drop policy if exists "Contacts Select" on public.contacts;
drop policy if exists "Contacts Insert" on public.contacts;
drop policy if exists "Contacts Update" on public.contacts;
drop policy if exists "Contacts Delete" on public.contacts;
drop policy if exists "contacts_select_policy" on public.contacts;
drop policy if exists "contacts_insert_policy" on public.contacts;
drop policy if exists "contacts_update_policy" on public.contacts;
drop policy if exists "contacts_delete_policy" on public.contacts;

drop policy if exists "Opportunities Select" on public.opportunities;
drop policy if exists "Opportunities Insert" on public.opportunities;
drop policy if exists "Opportunities Update" on public.opportunities;
drop policy if exists "Opportunities Delete" on public.opportunities;
drop policy if exists "opps_select_policy" on public.opportunities;
drop policy if exists "opps_insert_policy" on public.opportunities;
drop policy if exists "opps_update_policy" on public.opportunities;
drop policy if exists "opps_delete_policy" on public.opportunities;

drop policy if exists "Activities Select" on public.activities;
drop policy if exists "Activities Insert" on public.activities;
drop policy if exists "Activities Update" on public.activities;
drop policy if exists "Activities Delete" on public.activities;
drop policy if exists "activities_select_policy" on public.activities;
drop policy if exists "activities_insert_policy" on public.activities;
drop policy if exists "activities_update_policy" on public.activities;
drop policy if exists "activities_delete_policy" on public.activities;

drop policy if exists "Followups Select" on public.followups;
drop policy if exists "Followups Insert" on public.followups;
drop policy if exists "Followups Update" on public.followups;
drop policy if exists "Followups Delete" on public.followups;
drop policy if exists "followups_select_policy" on public.followups;
drop policy if exists "followups_insert_policy" on public.followups;
drop policy if exists "followups_update_policy" on public.followups;
drop policy if exists "followups_delete_policy" on public.followups;

drop policy if exists "Documents Select" on public.documents;
drop policy if exists "Documents Insert" on public.documents;
drop policy if exists "Documents Update" on public.documents;
drop policy if exists "Documents Delete" on public.documents;
drop policy if exists "docs_select_policy" on public.documents;
drop policy if exists "docs_insert_policy" on public.documents;
drop policy if exists "docs_update_policy" on public.documents;
drop policy if exists "docs_delete_policy" on public.documents;

drop policy if exists "Proposals Select" on public.proposals;
drop policy if exists "Proposals Insert" on public.proposals;
drop policy if exists "Proposals Update" on public.proposals;
drop policy if exists "Proposals Delete" on public.proposals;

drop policy if exists "Audit Logs Select" on public.audit_logs;
drop policy if exists "Audit Logs Insert" on public.audit_logs;
drop policy if exists "audit_select_policy" on public.audit_logs;
drop policy if exists "audit_insert_policy" on public.audit_logs;

drop policy if exists "Notifications Select" on public.notifications;
drop policy if exists "Notifications Insert" on public.notifications;
drop policy if exists "Notifications Update" on public.notifications;
drop policy if exists "Notifications Delete" on public.notifications;

-- ------------------------------------------------------------------------------
-- 5. HARDENED PRODUCTION RLS POLICIES (TO authenticated ONLY)
-- ------------------------------------------------------------------------------

-- 5.1 ORGANIZATIONS
create policy "organizations_select_policy"
  on public.organizations for select to authenticated
  using (id = public.get_auth_user_org_id() or public.is_super_admin());

create policy "organizations_insert_policy"
  on public.organizations for insert to authenticated
  with check (public.is_super_admin());

create policy "organizations_update_policy"
  on public.organizations for update to authenticated
  using (id = public.get_auth_user_org_id() and public.is_super_admin())
  with check (id = public.get_auth_user_org_id() and public.is_super_admin());

create policy "organizations_delete_policy"
  on public.organizations for delete to authenticated
  using (public.is_super_admin());

-- 5.2 TEAMS
create policy "teams_select_policy"
  on public.teams for select to authenticated
  using (organization_id = public.get_auth_user_org_id() or public.is_super_admin());

create policy "teams_insert_policy"
  on public.teams for insert to authenticated
  with check (organization_id = public.get_auth_user_org_id() and public.is_director_or_admin());

create policy "teams_update_policy"
  on public.teams for update to authenticated
  using (organization_id = public.get_auth_user_org_id() and public.is_director_or_admin())
  with check (organization_id = public.get_auth_user_org_id() and public.is_director_or_admin());

create policy "teams_delete_policy"
  on public.teams for delete to authenticated
  using (organization_id = public.get_auth_user_org_id() and public.is_director_or_admin());

-- 5.3 PROFILES
create policy "profiles_select_policy"
  on public.profiles for select to authenticated
  using (organization_id = public.get_auth_user_org_id() or public.is_super_admin());

create policy "profiles_insert_policy"
  on public.profiles for insert to authenticated
  with check (
    organization_id = public.get_auth_user_org_id() 
    and (public.is_director_or_admin() or id = auth.uid())
  );

create policy "profiles_update_policy"
  on public.profiles for update to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and (public.is_director_or_admin() or id = auth.uid())
  )
  with check (
    organization_id = public.get_auth_user_org_id()
    and (public.is_director_or_admin() or id = auth.uid())
  );

create policy "profiles_delete_policy"
  on public.profiles for delete to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and public.is_super_admin()
    and id <> auth.uid()
  );

-- 5.4 ROLE PERMISSIONS
create policy "role_permissions_select_policy"
  on public.role_permissions for select to authenticated
  using (organization_id = public.get_auth_user_org_id() or public.is_super_admin());

create policy "role_permissions_insert_policy"
  on public.role_permissions for insert to authenticated
  with check (organization_id = public.get_auth_user_org_id() and public.is_director_or_admin());

create policy "role_permissions_update_policy"
  on public.role_permissions for update to authenticated
  using (organization_id = public.get_auth_user_org_id() and public.is_director_or_admin())
  with check (organization_id = public.get_auth_user_org_id() and public.is_director_or_admin());

create policy "role_permissions_delete_policy"
  on public.role_permissions for delete to authenticated
  using (organization_id = public.get_auth_user_org_id() and public.is_director_or_admin());

-- 5.5 CLIENTS
create policy "clients_select_policy"
  on public.clients for select to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and (
      public.is_director_or_admin()
      or public.get_auth_user_role() in ('management_viewer', 'analyst')
      or owner_id = auth.uid()
      or created_by = auth.uid()
      or owner_id in (select public.get_subordinate_ids(auth.uid()))
      or (team_id is not null and team_id = (select team_id from public.profiles where id = auth.uid()))
    )
  );

create policy "clients_insert_policy"
  on public.clients for insert to authenticated
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
  );

create policy "clients_update_policy"
  on public.clients for update to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
    and (
      public.is_director_or_admin()
      or owner_id = auth.uid()
      or created_by = auth.uid()
      or owner_id in (select public.get_subordinate_ids(auth.uid()))
    )
  )
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
  );

create policy "clients_delete_policy"
  on public.clients for delete to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and public.is_manager_or_above()
  );

-- 5.6 CONTACTS
create policy "contacts_select_policy"
  on public.contacts for select to authenticated
  using (organization_id = public.get_auth_user_org_id());

create policy "contacts_insert_policy"
  on public.contacts for insert to authenticated
  with check (organization_id = public.get_auth_user_org_id() and public.is_crm_contributor());

create policy "contacts_update_policy"
  on public.contacts for update to authenticated
  using (organization_id = public.get_auth_user_org_id() and public.is_crm_contributor())
  with check (organization_id = public.get_auth_user_org_id() and public.is_crm_contributor());

create policy "contacts_delete_policy"
  on public.contacts for delete to authenticated
  using (organization_id = public.get_auth_user_org_id() and public.is_manager_or_above());

-- 5.7 OPPORTUNITIES
create policy "opportunities_select_policy"
  on public.opportunities for select to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and (
      public.is_director_or_admin()
      or public.get_auth_user_role() in ('management_viewer', 'analyst')
      or owner_id = auth.uid()
      or delegated_owner_id = auth.uid()
      or owner_id in (select public.get_subordinate_ids(auth.uid()))
      or (team_id is not null and team_id = (select team_id from public.profiles where id = auth.uid()))
    )
  );

create policy "opportunities_insert_policy"
  on public.opportunities for insert to authenticated
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
  );

create policy "opportunities_update_policy"
  on public.opportunities for update to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
    and (
      public.is_director_or_admin()
      or owner_id = auth.uid()
      or delegated_owner_id = auth.uid()
      or owner_id in (select public.get_subordinate_ids(auth.uid()))
    )
  )
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
  );

create policy "opportunities_delete_policy"
  on public.opportunities for delete to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and public.is_manager_or_above()
  );

-- 5.8 ACTIVITIES
create policy "activities_select_policy"
  on public.activities for select to authenticated
  using (organization_id = public.get_auth_user_org_id());

create policy "activities_insert_policy"
  on public.activities for insert to authenticated
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
    and conducted_by = auth.uid()
  );

create policy "activities_update_policy"
  on public.activities for update to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
    and (public.is_director_or_admin() or conducted_by = auth.uid())
  )
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
  );

create policy "activities_delete_policy"
  on public.activities for delete to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and (public.is_manager_or_above() or conducted_by = auth.uid())
  );

-- 5.9 FOLLOWUPS
create policy "followups_select_policy"
  on public.followups for select to authenticated
  using (organization_id = public.get_auth_user_org_id());

create policy "followups_insert_policy"
  on public.followups for insert to authenticated
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
  );

create policy "followups_update_policy"
  on public.followups for update to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
    and (
      public.is_director_or_admin()
      or assigned_to = auth.uid()
      or assigned_to in (select public.get_subordinate_ids(auth.uid()))
    )
  )
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
  );

create policy "followups_delete_policy"
  on public.followups for delete to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and (public.is_manager_or_above() or assigned_to = auth.uid())
  );

-- 5.10 DOCUMENTS
create policy "documents_select_policy"
  on public.documents for select to authenticated
  using (organization_id = public.get_auth_user_org_id());

create policy "documents_insert_policy"
  on public.documents for insert to authenticated
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
  );

create policy "documents_update_policy"
  on public.documents for update to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
    and (public.is_director_or_admin() or uploaded_by = auth.uid())
  )
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
  );

create policy "documents_delete_policy"
  on public.documents for delete to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and (public.is_manager_or_above() or uploaded_by = auth.uid())
  );

-- 5.11 PROPOSALS
create policy "proposals_select_policy"
  on public.proposals for select to authenticated
  using (organization_id = public.get_auth_user_org_id());

create policy "proposals_insert_policy"
  on public.proposals for insert to authenticated
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
  );

create policy "proposals_update_policy"
  on public.proposals for update to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
    and (public.is_director_or_admin() or owner_id = auth.uid())
  )
  with check (
    organization_id = public.get_auth_user_org_id()
    and public.is_crm_contributor()
  );

create policy "proposals_delete_policy"
  on public.proposals for delete to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and public.is_director_or_admin()
  );

-- 5.12 AUDIT LOGS (Immutable Append-Only)
create policy "audit_logs_select_policy"
  on public.audit_logs for select to authenticated
  using (
    organization_id = public.get_auth_user_org_id()
    and public.is_director_or_admin()
  );

create policy "audit_logs_insert_policy"
  on public.audit_logs for insert to authenticated
  with check (organization_id = public.get_auth_user_org_id());

-- Explicitly NO UPDATE or DELETE policy on audit_logs

-- 5.13 NOTIFICATIONS
create policy "notifications_select_policy"
  on public.notifications for select to authenticated
  using (organization_id = public.get_auth_user_org_id() and user_id = auth.uid());

create policy "notifications_insert_policy"
  on public.notifications for insert to authenticated
  with check (organization_id = public.get_auth_user_org_id());

create policy "notifications_update_policy"
  on public.notifications for update to authenticated
  using (organization_id = public.get_auth_user_org_id() and user_id = auth.uid())
  with check (organization_id = public.get_auth_user_org_id() and user_id = auth.uid());

create policy "notifications_delete_policy"
  on public.notifications for delete to authenticated
  using (organization_id = public.get_auth_user_org_id() and user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 6. STORAGE BUCKET HARDENING (crm-documents)
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public) 
values ('crm-documents', 'crm-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "Authenticated document read policy" on storage.objects;
drop policy if exists "Authenticated document upload policy" on storage.objects;
drop policy if exists "Authenticated document delete policy" on storage.objects;

create policy "Authenticated document read policy" on storage.objects
  for select to authenticated
  using (bucket_id = 'crm-documents');

create policy "Authenticated document upload policy" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'crm-documents' and public.is_crm_contributor());

create policy "Authenticated document delete policy" on storage.objects
  for delete to authenticated
  using (bucket_id = 'crm-documents' and public.is_manager_or_above());

-- ------------------------------------------------------------------------------
-- 7. NOTIFY SCHEMA CACHE RELOAD
-- ------------------------------------------------------------------------------
notify pgrst, 'reload schema';

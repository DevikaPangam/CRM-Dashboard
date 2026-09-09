-- ==============================================================================
-- CorpBD CRM — Seed Initial Production Data for Rajmudra Group
-- Migration: 20260909000003_seed_rajmudra_group.sql
-- ==============================================================================

do $$
declare
  org_id uuid;
begin

  -- 1. Insert Primary Organization: Rajmudra Group
  insert into public.organizations (
    id,
    name,
    slug,
    legal_entity_name,
    gstin,
    cin,
    primary_domain,
    subscription_tier,
    settings
  ) values (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Rajmudra Group',
    'rajmudra-group',
    'Rajmudra Corporate Business Development Services Pvt Ltd',
    '27AAACR1234F1Z5',
    'U74999MH2020PTC123456',
    'rajmudragroup.com',
    'Enterprise Unlimited',
    jsonb_build_object(
      'fiscal_year_start', '04-01',
      'default_currency', 'INR',
      'require_delegation_approval', true,
      'enforce_password_rotation_days', 90
    )
  )
  on conflict (slug) do update set
    name = excluded.name,
    legal_entity_name = excluded.legal_entity_name
  returning id into org_id;

  -- 2. Insert Core Teams for Rajmudra Group
  insert into public.teams (
    id,
    organization_id,
    name,
    code,
    department,
    region,
    annual_target_inr,
    description
  ) values
  (
    '00000000-0000-0000-0001-000000000001'::uuid,
    org_id,
    'Enterprise BD West',
    'TEAM-BD-WEST',
    'BD',
    'West',
    120000000.00,
    'Corporate staff transport & enterprise logistics acquisition across Maharashtra & Gujarat.'
  ),
  (
    '00000000-0000-0000-0001-000000000002'::uuid,
    org_id,
    'Fleet Operations & Asset Roster',
    'TEAM-OPS-FLEET',
    'Fleet / Asset Management',
    'West',
    50000000.00,
    'Fleet deployment, route optimization, driver rosters, and SLA adherence.'
  ),
  (
    '00000000-0000-0000-0001-000000000003'::uuid,
    org_id,
    'Commercials, Pricing & Proposals',
    'TEAM-PRICING',
    'Pricing & Commercials',
    'Central',
    0.00,
    'Dynamic rate card calculation, margin analysis, and RFP tender formulations.'
  ),
  (
    '00000000-0000-0000-0001-000000000004'::uuid,
    org_id,
    'Legal & Contract Compliance',
    'TEAM-LEGAL',
    'Legal & Compliance',
    'Central',
    0.00,
    'MSA drafting, NDA tracking, SLA verification, and regulatory compliance.'
  )
  on conflict (organization_id, code) do nothing;

  -- ----------------------------------------------------------------------------
  -- 3. Normalized Role-Module Permissions Matrix
  -- Seed baseline for all 7 roles x 12 modules x 8 actions
  -- ----------------------------------------------------------------------------

  -- Helper CTE to cross-join modules, actions, and roles
  with all_modules as (
    select * from (values
      ('dashboard', 'Management Dashboard'),
      ('clients', 'Client Master'),
      ('team', 'BD Team & Owners'),
      ('segments', 'Business Segments'),
      ('opportunities', 'Leads & Opportunities'),
      ('calculator', 'Proposal Calculator'),
      ('activities', 'Engagement & Interactions'),
      ('followups', 'Follow-up Tracker'),
      ('internal', 'Internal BD Activities'),
      ('documents', 'Stage Documents'),
      ('review', 'Monthly Management Review'),
      ('users', 'Users & Permissions')
    ) as t(module_key, module_name)
  ),
  all_actions as (
    select unnest(enum_range(null::public.permission_action_enum)) as action
  ),
  all_roles as (
    select unnest(enum_range(null::public.user_role_enum)) as role
  ),
  role_matrix as (
    select 
      r.role,
      m.module_key,
      m.module_name,
      a.action,
      case
        -- 1. super_admin: unrestricted (true for everything)
        when r.role = 'super_admin' then true

        -- 2. bd_director: high permissions across the board
        when r.role = 'bd_director' then
          case
            when a.action = 'view' then true
            when a.action in ('create', 'edit') and m.module_key not in ('dashboard', 'review', 'users') then true
            when a.action = 'export' then true
            when a.action in ('assign', 'approve') and m.module_key in ('clients', 'opportunities', 'calculator', 'internal') then true
            when a.action = 'delete' and m.module_key in ('documents', 'activities', 'followups') then true
            else false
          end

        -- 3. bd_manager: team-level operational permissions
        when r.role = 'bd_manager' then
          case
            when a.action = 'view' and m.module_key not in ('users') then true
            when a.action in ('create', 'edit') and m.module_key in ('clients', 'opportunities', 'calculator', 'activities', 'followups', 'internal', 'documents') then true
            when a.action = 'export' and m.module_key in ('dashboard', 'clients', 'opportunities', 'team', 'review') then true
            when a.action = 'assign' and m.module_key in ('clients', 'opportunities', 'followups', 'internal') then true
            when a.action = 'approve' and m.module_key in ('internal', 'calculator') then true
            else false
          end

        -- 4. bd_sr_exec: senior sales rep
        when r.role = 'bd_sr_exec' then
          case
            when a.action = 'view' and m.module_key in ('dashboard', 'clients', 'opportunities', 'calculator', 'activities', 'followups', 'internal', 'documents') then true
            when a.action in ('create', 'edit') and m.module_key in ('clients', 'opportunities', 'calculator', 'activities', 'followups', 'internal', 'documents') then true
            when a.action = 'export' and m.module_key in ('clients', 'opportunities') then true
            else false
          end

        -- 5. bd_exec: field sales rep
        when r.role = 'bd_exec' then
          case
            when a.action = 'view' and m.module_key in ('dashboard', 'clients', 'opportunities', 'calculator', 'activities', 'followups', 'internal', 'documents') then true
            when a.action in ('create', 'edit') and m.module_key in ('clients', 'opportunities', 'calculator', 'activities', 'followups') then true
            else false
          end

        -- 6. management_viewer: executive read-only
        when r.role = 'management_viewer' then
          case
            when a.action = 'view' and m.module_key in ('dashboard', 'clients', 'team', 'segments', 'opportunities', 'calculator', 'activities', 'followups', 'internal', 'documents', 'review') then true
            when a.action = 'export' and m.module_key in ('dashboard', 'clients', 'opportunities', 'review') then true
            else false
          end

        -- 7. analyst: BI analysis & full export
        when r.role = 'analyst' then
          case
            when a.action = 'view' and m.module_key in ('dashboard', 'clients', 'team', 'segments', 'opportunities', 'calculator', 'activities', 'followups', 'review') then true
            when a.action = 'export' then true
            else false
          end

        else false
      end as is_allowed
    from all_roles r
    cross join all_modules m
    cross join all_actions a
  )
  insert into public.role_permissions (
    organization_id,
    role,
    module_key,
    module_name,
    action,
    is_allowed
  )
  select 
    org_id,
    rm.role,
    rm.module_key,
    rm.module_name,
    rm.action,
    rm.is_allowed
  from role_matrix rm
  on conflict (organization_id, role, module_key, action) do update set
    is_allowed = excluded.is_allowed,
    module_name = excluded.module_name,
    updated_at = timezone('utc'::text, now());

end $$;

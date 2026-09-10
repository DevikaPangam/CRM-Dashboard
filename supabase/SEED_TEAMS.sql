-- ==============================================================================
-- CorpBD CRM — Seed Canonical Teams in Supabase
-- Target: Supabase Cloud SQL Editor (https://lyaryldpiviaytcarbtn.supabase.co)
-- ==============================================================================

INSERT INTO public.teams (id, organization_id, department_id, region_id, name, code, department, region, is_active)
VALUES
  -- 1. Business Development Teams
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Enterprise BD West', 'TEAM-BD-WEST', 'Business Development', 'West Region', true),
  ('00000000-0000-0000-0001-000000000011', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Enterprise BD North', 'TEAM-BD-NORTH', 'Business Development', 'North Region', true),
  ('00000000-0000-0000-0001-000000000012', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Enterprise BD South', 'TEAM-BD-SOUTH', 'Business Development', 'South Region', true),

  -- 2. Operations Teams
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Fleet Operations & Dispatch', 'TEAM-OPS-FLEET', 'Operations', 'West Region', true),
  ('00000000-0000-0000-0001-000000000021', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Field Operations & Route Control', 'TEAM-OPS-FIELD', 'Operations', 'North Region', true),

  -- 3. Centralised Operations Teams
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 'Centralised Operations Command', 'TEAM-COP-CONTROL', 'Centralised Operations', 'Central Region', true),

  -- 4. Maintenance Teams
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'Fleet Maintenance & Workshop Engineering', 'TEAM-MNT-WORKSHOP', 'Maintenance', 'West Region', true),

  -- 5. Finance Teams
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'Commercials, Pricing & Proposals', 'TEAM-PRICING', 'Finance', 'Central Region', true),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'Corporate Finance & Client Invoicing', 'TEAM-FIN-ACCOUNTS', 'Finance', 'West Region', true),

  -- 6. Legal Teams
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000005', 'Legal & Contract Compliance', 'TEAM-LEGAL', 'Legal', 'Central Region', true)
ON CONFLICT (id) DO NOTHING;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

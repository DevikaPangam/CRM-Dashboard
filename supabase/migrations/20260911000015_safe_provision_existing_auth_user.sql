-- ==============================================================================
-- CorpBD CRM — Migration: 20260911000015_safe_provision_existing_auth_user.sql
-- Description: Provision missing public.profiles record for existing corporate Auth users.
-- Organization: Rajmudra Group Multi-Tenant Architecture (00000000-0000-0000-0000-000000000001)
-- ==============================================================================

DO $$
DECLARE
  v_org_id UUID := '00000000-0000-0000-0000-000000000001';
  rec RECORD;
BEGIN
  -- 1. Locate existing auth.users record(s) matching corporate domain @rajmudragroup.com missing from public.profiles
  FOR rec IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.email ILIKE '%@rajmudragroup.com'
      AND p.id IS NULL
  LOOP
    -- 2. Create exactly ONE corresponding public.profiles record
    INSERT INTO public.profiles (
      id,
      organization_id,
      full_name,
      email,
      role,
      department,
      designation,
      status,
      allowed_segments,
      created_at,
      updated_at
    ) VALUES (
      rec.id,
      v_org_id,
      COALESCE(rec.raw_user_meta_data->>'full_name', 'Devika Pangam'),
      rec.email,
      'super_admin'::public.user_role_enum,
      'Executive Management & Administration',
      'Managing Director / System Administrator',
      'active'::public.user_status_enum,
      ARRAY['All'],
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      role = EXCLUDED.role,
      status = 'active'::public.user_status_enum,
      updated_at = NOW();

    -- 3. Emit Immutable Audit Log
    INSERT INTO public.audit_logs (
      organization_id,
      actor_id,
      action,
      entity_type,
      entity_id,
      details
    ) VALUES (
      v_org_id,
      rec.id,
      'SAFE_PROVISION_EXISTING_AUTH_USER',
      'user',
      rec.id,
      jsonb_build_object(
        'email', rec.email,
        'role', 'super_admin',
        'status', 'active',
        'timestamp', NOW()
      )
    );
  END LOOP;
END $$;

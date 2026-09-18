-- ==============================================================================
-- CorpBD CRM — Production Database Migration: Hardened Auth Profile Trigger
-- Migration Name: 20260912000017_harden_auth_profile_trigger_existing_profiles.sql
-- Description: Protects existing employee profiles from trigger role regression and UUID mismatch.
-- Organization: Rajmudra Group Multi-Tenant Architecture (00000000-0000-0000-0000-000000000001)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_org_id CONSTANT UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_existing_id_count INTEGER;
  v_existing_email_count INTEGER;
BEGIN
  -- 1. Security Rule: Validate Corporate Email Domain (@rajmudragroup.com)
  IF NEW.email IS NULL OR NEW.email !~* '^[A-Za-z0-9._%+-]+@rajmudragroup\.com$' THEN
    RAISE EXCEPTION 'Unauthorized Domain: Only corporate @rajmudragroup.com emails are authorized for CRM provisioning.';
  END IF;

  -- 2. Security Guard A: Check if a profile already exists for this exact Auth User ID
  SELECT COUNT(*) INTO v_existing_id_count
  FROM public.profiles
  WHERE id = NEW.id;

  -- If profile already exists for NEW.id, NEVER overwrite role, organization, or metadata.
  IF v_existing_id_count > 0 THEN
    RETURN NEW;
  END IF;

  -- 3. Security Guard B: Check if a profile already exists with the same corporate email but a DIFFERENT ID
  SELECT COUNT(*) INTO v_existing_email_count
  FROM public.profiles
  WHERE LOWER(email) = LOWER(NEW.email) AND id <> NEW.id;

  -- Fail-closed: Reject duplicate email with mismatched profile ID
  IF v_existing_email_count > 0 THEN
    RAISE EXCEPTION 'Auth/Profile UUID Mismatch Security Guard: A CRM profile already exists for email % with a different profile ID. Contact System Administrator.', NEW.email;
  END IF;

  -- 4. Genuinely New Corporate Auth User Provisioning:
  -- - Fixed Organization Assignment: Rajmudra Group (00000000-0000-0000-0000-000000000001)
  -- - Default Unprivileged Role: bd_exec (DO NOT trust raw_user_meta_data for role or org assignment)
  -- - UUID Parity: profiles.id MUST equal auth.users.id (NEW.id)
  INSERT INTO public.profiles (
    id,
    organization_id,
    full_name,
    email,
    role,
    department,
    designation,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_default_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'bd_exec'::public.user_role_enum,
    'Business Development',
    'BD Executive',
    'active'::public.user_status_enum,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Re-attach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

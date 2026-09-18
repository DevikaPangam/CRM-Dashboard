-- ============================================================================
-- Migration: 20260918000001_reconcile_devika_profile_uuid.sql
-- Description: Controlled, FK-Aware Primary Key Reconciliation for Devika Profile
-- Target Auth UUID: 567db42c-c0bf-4286-8dcc-ce2cf196865b
-- Target Email:     devika.p@rajmudragroup.com
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_target_uuid CONSTANT uuid := '567db42c-c0bf-4286-8dcc-ce2cf196865b';
  v_old_uuid uuid;
  v_profile_record RECORD;
  r RECORD;
  v_dep_count int;
  v_total_deps int := 0;
BEGIN
  -- ============================================================================
  -- STEP 1: IDENTIFY CURRENT PROFILE FOR DEVIKA
  -- ============================================================================
  SELECT * INTO v_profile_record
  FROM public.profiles
  WHERE login_id = 'DEVIKA' OR email = 'devika.p@rajmudragroup.com'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE NOTICE 'No existing profile found for login_id=DEVIKA. Inserting standard profile.';
    INSERT INTO public.profiles (
      id,
      organization_id,
      full_name,
      email,
      login_id,
      role,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_target_uuid,
      '00000000-0000-0000-0000-000000000001',
      'Devika Pangam',
      'devika.p@rajmudragroup.com',
      'DEVIKA',
      'super_admin',
      'active',
      NOW(),
      NOW()
    );
    RETURN;
  END IF;

  v_old_uuid := v_profile_record.id;

  RAISE NOTICE 'Found existing profile: ID=%, LOGIN_ID=%, EMAIL=%, ROLE=%, STATUS=%, ORG=%',
    v_profile_record.id,
    v_profile_record.login_id,
    v_profile_record.email,
    v_profile_record.role,
    v_profile_record.status,
    v_profile_record.organization_id;

  IF v_old_uuid = v_target_uuid THEN
    RAISE NOTICE 'Profile ID already matches target Auth UUID (%). No migration needed.', v_target_uuid;
    RETURN;
  END IF;

  -- ============================================================================
  -- STEP 2 & 3: INSPECT FOREIGN KEYS & CHECK DATA DEPENDENCIES
  -- ============================================================================
  RAISE NOTICE 'Scanning all foreign key references to public.profiles(id)...';

  FOR r IN (
    SELECT
      tc.table_schema,
      tc.table_name,
      kcu.column_name,
      tc.constraint_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'public'
      AND ccu.table_name = 'profiles'
      AND ccu.column_name = 'id'
  ) LOOP
    -- Count rows referencing the old UUID in this table/column
    EXECUTE format(
      'SELECT count(*) FROM %I.%I WHERE %I = $1',
      r.table_schema, r.table_name, r.column_name
    ) INTO v_dep_count USING v_old_uuid;

    v_total_deps := v_total_deps + v_dep_count;

    RAISE NOTICE 'FK Reference: %.%(%) Constraint: % (ON UPDATE %, ON DELETE %) -> Dependent Rows: %',
      r.table_schema, r.table_name, r.column_name, r.constraint_name, r.update_rule, r.delete_rule, v_dep_count;

    -- ============================================================================
    -- STEP 4: CONFIGURE ON UPDATE CASCADE ON ALL REFERENCING CONSTRAINTS
    -- ============================================================================
    IF r.update_rule <> 'CASCADE' THEN
      EXECUTE format(
        'ALTER TABLE %I.%I DROP CONSTRAINT %I, ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE %s',
        r.table_schema, r.table_name, r.constraint_name, r.constraint_name, r.column_name, r.delete_rule
      );
      RAISE NOTICE 'Updated constraint % on %.% to ON UPDATE CASCADE', r.constraint_name, r.table_schema, r.table_name;
    END IF;
  END LOOP;

  RAISE NOTICE 'Total dependent references to old UUID %: %', v_old_uuid, v_total_deps;

  -- ============================================================================
  -- STEP 6: APPLY PRIMARY KEY RECONCILIATION
  -- ============================================================================
  RAISE NOTICE 'Updating public.profiles.id from % to % (Cascading to all referencing tables)...',
    v_old_uuid, v_target_uuid;

  UPDATE public.profiles
  SET
    id = v_target_uuid,
    login_id = 'DEVIKA',
    role = 'super_admin',
    status = 'active',
    updated_at = NOW()
  WHERE id = v_old_uuid;

  -- ============================================================================
  -- STEP 7: IMMEDIATE DATABASE VERIFICATION
  -- ============================================================================
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_target_uuid) THEN
    RAISE EXCEPTION 'RECONCILIATION FAILED: Target profile % does not exist after update!', v_target_uuid;
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_old_uuid) THEN
    RAISE EXCEPTION 'RECONCILIATION FAILED: Legacy profile % still exists after update!', v_old_uuid;
  END IF;

  SELECT count(*) INTO v_dep_count FROM public.profiles WHERE login_id = 'DEVIKA';
  IF v_dep_count <> 1 THEN
    RAISE EXCEPTION 'RECONCILIATION FAILED: Expected exactly 1 profile for DEVIKA, found %', v_dep_count;
  END IF;

  RAISE NOTICE 'RECONCILIATION SUCCESSFUL: Devika profile successfully reconciled to Auth UUID % with 0 duplicates and % dependent references intact.',
    v_target_uuid, v_total_deps;
END $$;

-- Explicitly Notify PostgREST to Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- RAJMUDRA CORPORATE BD & FLEET CRM — REALTIME COLLABORATION MIGRATION
-- STEP 7: Supabase Realtime Replication & Multi-User Synchronization
-- ============================================================================

-- 1. Ensure supabase_realtime publication exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2. Enable REPLICA IDENTITY FULL on all realtime collaborative tables
-- This ensures UPDATE and DELETE events include full prior/new records for frontend state sync
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.opportunities REPLICA IDENTITY FULL;
ALTER TABLE public.activities REPLICA IDENTITY FULL;
ALTER TABLE public.followups REPLICA IDENTITY FULL;
ALTER TABLE public.internal_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.segments REPLICA IDENTITY FULL;
ALTER TABLE public.documents REPLICA IDENTITY FULL;

-- 3. Add all collaborative entities to the supabase_realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.followups;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_tasks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.segments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

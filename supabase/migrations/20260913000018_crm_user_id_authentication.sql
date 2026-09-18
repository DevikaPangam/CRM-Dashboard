-- ============================================================================
-- CorpBD CRM — Final User ID / Password Authentication Migration
-- Phase 4: Repair Devika Profile UUID (FK safe)
-- Phase 5: Implement CRM User ID (login_id)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Add login_id to profiles
-- ----------------------------------------------------------------------------
-- Check if citext extension exists, if not create it
CREATE EXTENSION IF NOT EXISTS citext;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS login_id citext UNIQUE;

-- ----------------------------------------------------------------------------
-- 2. Phase 4: Repair Devika's Profile ID
-- Target Auth UUID: 567db42c-c0bf-4286-8dcc-ce2cf196865b
-- Current Profile ID: 00000000-0000-0000-0000-000000000001 (Organization UUID)
-- ----------------------------------------------------------------------------

-- Temporarily drop FK constraints that reference profiles.id
-- (We will recreate them with ON UPDATE CASCADE or just rely on manual update if we are careful)
-- Actually, the safest way in PostgreSQL to update a primary key referenced by FKs is to temporarily set constraints to DEFERRED if they are deferrable.
-- But since we don't know if they are deferrable, we can insert the new profile, update all references, then delete the old profile.

DO $$
DECLARE
    old_id UUID := '00000000-0000-0000-0000-000000000001';
    new_id UUID := '567db42c-c0bf-4286-8dcc-ce2cf196865b';
    old_profile RECORD;
BEGIN
    -- Check if old profile exists
    SELECT * INTO old_profile FROM public.profiles WHERE id = old_id;
    
    IF FOUND THEN
        -- Insert new profile with exactly the same data but new ID
        INSERT INTO public.profiles (
            id, organization_id, email, full_name, role, department, designation, 
            employee_id, region, location, joining_date, employment_type, is_regional_owner, 
            annual_target_inr, phone, team_id, manager_id, status, created_at, updated_at, login_id
        ) VALUES (
            new_id, old_profile.organization_id, old_profile.email, old_profile.full_name, old_profile.role, old_profile.department, old_profile.designation, 
            old_profile.employee_id, old_profile.region, old_profile.location, old_profile.joining_date, old_profile.employment_type, old_profile.is_regional_owner, 
            old_profile.annual_target_inr, old_profile.phone, old_profile.team_id, old_profile.manager_id, old_profile.status, old_profile.created_at, old_profile.updated_at, 'DEVIKA'
        ) ON CONFLICT (id) DO UPDATE SET login_id = 'DEVIKA';

        -- Update all known foreign key references
        UPDATE public.profiles SET manager_id = new_id WHERE manager_id = old_id;
        UPDATE public.teams SET leader_id = new_id WHERE leader_id = old_id;
        
        UPDATE public.clients SET owner_id = new_id WHERE owner_id = old_id;
        UPDATE public.clients SET created_by = new_id WHERE created_by = old_id;
        
        UPDATE public.opportunities SET owner_id = new_id WHERE owner_id = old_id;
        UPDATE public.opportunities SET approved_by = new_id WHERE approved_by = old_id;
        UPDATE public.opportunities SET delegated_owner_id = new_id WHERE delegated_owner_id = old_id;
        
        UPDATE public.activities SET conducted_by = new_id WHERE conducted_by = old_id;
        
        UPDATE public.followups SET assigned_to = new_id WHERE assigned_to = old_id;
        
        UPDATE public.documents SET uploaded_by = new_id WHERE uploaded_by = old_id;
        
        UPDATE public.proposals SET owner_id = new_id WHERE owner_id = old_id;
        UPDATE public.proposals SET approved_by = new_id WHERE approved_by = old_id;
        
        UPDATE public.audit_logs SET actor_id = new_id WHERE actor_id = old_id;
        UPDATE public.audit_logs SET entity_id = new_id WHERE entity_id = old_id AND entity_type = 'user';
        
        UPDATE public.notifications SET user_id = new_id WHERE user_id = old_id;
        UPDATE public.user_sessions SET user_id = new_id WHERE user_id = old_id;
        
        UPDATE public.regions SET regional_head_id = new_id WHERE regional_head_id = old_id;
        
        UPDATE public.employee_career_trajectory SET employee_id = new_id WHERE employee_id = old_id;
        UPDATE public.employee_career_trajectory SET created_by = new_id WHERE created_by = old_id;
        
        UPDATE public.kra_kpi_targets SET employee_id = new_id WHERE employee_id = old_id;
        UPDATE public.kra_kpi_achievements SET employee_id = new_id WHERE employee_id = old_id;
        
        UPDATE public.performance_reviews SET employee_id = new_id WHERE employee_id = old_id;
        UPDATE public.performance_reviews SET reviewer_id = new_id WHERE reviewer_id = old_id;

        -- Finally, delete the old profile (if it's not actually the organization ID being used for something else, but wait - 
        -- IF the old_id is the same as the organization ID, we should only delete it from profiles, which is safe)
        DELETE FROM public.profiles WHERE id = old_id;
    ELSE
        -- If old profile doesn't exist, just update login_id if new_id exists
        UPDATE public.profiles SET login_id = 'DEVIKA' WHERE id = new_id;
    END IF;

    -- 3. Seed Akshay's login ID
    UPDATE public.profiles SET login_id = 'AKSHAY.T' WHERE email = 'akshay.t@rajmudragroup.com';
END $$;

COMMIT;

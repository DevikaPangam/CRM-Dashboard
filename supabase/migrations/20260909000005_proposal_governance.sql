-- ==============================================================================
-- CorpBD CRM — Proposal Governance, Versioning & Separation of Duties (SoD)
-- Migration: 20260909000005_proposal_governance.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Separation of Duties (SoD) Database Trigger on Proposals
-- Rule: A user CANNOT approve a proposal they created or own.
-- ------------------------------------------------------------------------------
create or replace function public.prevent_proposal_self_approval()
returns trigger as $$
declare
  caller_id uuid;
  caller_role public.user_role_enum;
begin
  caller_id := auth.uid();
  caller_role := public.get_current_role();

  -- Check only on status transition to 'approved'
  if new.status = 'approved' and (old.status is null or old.status <> 'approved') then
    
    -- 1. Verify caller has approval rights
    if not (caller_role in ('super_admin', 'bd_director', 'bd_manager') and public.can_approve('calculator')) then
      raise exception 'Unauthorized: You do not have permission to approve commercial proposals.';
    end if;

    -- 2. Separation of Duties: Prevent self-approval (super_admin exception only in single-user dev mode)
    if caller_id is not null and (caller_id = old.owner_id or caller_id = old.submitted_by) then
      raise exception 'Security Policy Violation: Separation of Duties requires an independent authority to approve proposals. Authors cannot approve their own proposals.';
    end if;

    -- Set audit fields
    new.approved_by := caller_id;
    new.approved_at := timezone('utc'::text, now());
  end if;

  -- If rejected, record timestamp
  if new.status = 'rejected' and (old.status is null or old.status <> 'rejected') then
    if new.rejection_reason is null or trim(new.rejection_reason) = '' then
      raise exception 'Rejection requires a documented reason for the author.';
    end if;
    new.approved_by := caller_id;
    new.approved_at := timezone('utc'::text, now());
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_proposal_self_approval on public.proposals;
create trigger trg_prevent_proposal_self_approval
  before update on public.proposals
  for each row execute procedure public.prevent_proposal_self_approval();

-- ------------------------------------------------------------------------------
-- 2. Proposal Versioning Trigger
-- When a new version is created for an opportunity, older approved versions
-- become 'superseded' to maintain clear commercial lineage.
-- ------------------------------------------------------------------------------
create or replace function public.handle_proposal_versioning()
returns trigger as $$
begin
  if new.status = 'approved' then
    update public.proposals
    set status = 'superseded', updated_at = timezone('utc'::text, now())
    where opportunity_id = new.opportunity_id
      and id <> new.id
      and status = 'approved';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_handle_proposal_versioning on public.proposals;
create trigger trg_handle_proposal_versioning
  after update on public.proposals
  for each row execute procedure public.handle_proposal_versioning();

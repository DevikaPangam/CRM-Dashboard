-- ==============================================================================
-- CorpBD CRM — Supabase Private Storage Bucket & Policies for Documents Vault
-- Migration: 20260909000004_storage_setup.sql
-- ==============================================================================

-- 1. Create Private Storage Bucket 'crm-documents'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-documents',
  'crm-documents',
  false, -- STRICT PRIVACY: Never publicly exposed
  26214400, -- 25 MB Limit in bytes
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- 2. Storage Row-Level Security Policies on storage.objects
-- Path Scheme: <organization_id>/<client_id>/<opportunity_id>/<document_id>/<filename>
-- ------------------------------------------------------------------------------

-- (A) SELECT Policy (Read / Download via Signed URL)
drop policy if exists "CRM Documents Storage Select Policy" on storage.objects;
create policy "CRM Documents Storage Select Policy"
  on storage.objects for select
  using (
    bucket_id = 'crm-documents'
    and (storage.foldername(name))[1] = public.get_current_org_id()::text
    and public.has_permission('documents', 'view')
  );

-- (B) INSERT Policy (Upload New File)
drop policy if exists "CRM Documents Storage Insert Policy" on storage.objects;
create policy "CRM Documents Storage Insert Policy"
  on storage.objects for insert
  with check (
    bucket_id = 'crm-documents'
    and (storage.foldername(name))[1] = public.get_current_org_id()::text
    and public.has_permission('documents', 'create')
  );

-- (C) UPDATE Policy (Overwrite / Modify File)
drop policy if exists "CRM Documents Storage Update Policy" on storage.objects;
create policy "CRM Documents Storage Update Policy"
  on storage.objects for update
  using (
    bucket_id = 'crm-documents'
    and (storage.foldername(name))[1] = public.get_current_org_id()::text
    and (
      public.is_org_admin()
      or auth.uid()::text = owner
    )
  )
  with check (
    bucket_id = 'crm-documents'
    and (storage.foldername(name))[1] = public.get_current_org_id()::text
  );

-- (D) DELETE Policy (Remove File)
drop policy if exists "CRM Documents Storage Delete Policy" on storage.objects;
create policy "CRM Documents Storage Delete Policy"
  on storage.objects for delete
  using (
    bucket_id = 'crm-documents'
    and (storage.foldername(name))[1] = public.get_current_org_id()::text
    and (
      public.is_org_admin()
      or auth.uid()::text = owner
    )
  );

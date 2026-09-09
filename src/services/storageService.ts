/**
 * Storage Service — Private Supabase Storage Integration for Documents Vault
 * Handles organization-aware file paths, validation, upload, signed URLs, and metadata synchronization.
 */

import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { CRMDocument } from '../types/crm';
import { transformDocumentFromDB } from './crmDataService';

export const BUCKET_NAME = 'crm-documents';
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'txt'];

export interface UploadDocumentParams {
  file: File;
  displayName: string;
  documentType: string;
  stage: string;
  clientId?: string;
  clientName?: string;
  opportunityId?: string;
  opportunityTitle?: string;
  notes?: string;
  organizationId: string;
  userId?: string;
  userName?: string;
}

export function validateDocumentFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return { isValid: false, error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 25 MB.` };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `File format .${ext} is not supported. Supported formats: PDF, Word (DOC/DOCX), Excel (XLS/XLSX/CSV), PowerPoint (PPT/PPTX), Images (PNG/JPG).`,
    };
  }

  return { isValid: true };
}

export function buildStoragePath(
  organizationId: string,
  clientId: string | undefined,
  opportunityId: string | undefined,
  documentId: string,
  fileName: string
): string {
  const cleanClient = clientId ? clientId.replace(/[^a-zA-Z0-9_-]/g, '') : 'general';
  const cleanOpp = opportunityId ? opportunityId.replace(/[^a-zA-Z0-9_-]/g, '') : 'general';
  const cleanDoc = documentId ? documentId.replace(/[^a-zA-Z0-9_-]/g, '') : 'doc';
  const cleanFile = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  return `${organizationId}/${cleanClient}/${cleanOpp}/${cleanDoc}/${cleanFile}`;
}

export const storageService = {
  /**
   * Uploads a document file to private storage bucket and inserts metadata into public.documents
   */
  async uploadDocumentFile(params: UploadDocumentParams): Promise<{ success: boolean; document?: CRMDocument; error?: string }> {
    const {
      file, displayName, documentType, stage, clientId, clientName,
      opportunityId, opportunityTitle, notes, organizationId, userId, userName
    } = params;

    const validation = validateDocumentFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    // Local / Offline mode fallback
    if (!isSupabaseConfigured()) {
      const mockId = `DOC-${Date.now().toString().slice(-4)}`;
      const doc: CRMDocument = {
        id: mockId,
        name: displayName.trim(),
        originalFilename: file.name,
        opportunityId,
        opportunityTitle,
        clientId,
        clientName,
        stage,
        documentType,
        fileSize: sizeFormatted,
        fileExtension: ext,
        uploadedBy: userName || 'System Admin',
        uploadedDate: new Date().toISOString().split('T')[0],
        notes,
      };
      return { success: true, document: doc };
    }

    try {
      const docId = `doc_${Date.now()}`;
      const filePath = buildStoragePath(organizationId, clientId, opportunityId, docId, file.name);

      // 1. Upload to Supabase Storage private bucket
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadErr) {
        throw new Error(`Storage upload failed: ${uploadErr.message}`);
      }

      // 2. Insert metadata row into public.documents
      const { data: docRecord, error: dbErr } = await (supabase.from('documents') as any)
        .insert({
          organization_id: organizationId,
          opportunity_id: opportunityId || null,
          opportunity_title: opportunityTitle || null,
          client_id: clientId || null,
          client_name: clientName || null,
          stage,
          document_type: documentType,
          file_name: displayName.trim(),
          original_filename: file.name,
          file_path: filePath,
          bucket_id: BUCKET_NAME,
          file_size_bytes: file.size,
          file_size_formatted: sizeFormatted,
          file_extension: ext,
          mime_type: file.type,
          uploaded_by: userId || null,
          uploaded_by_name: userName || 'System User',
          notes: notes || null,
        })
        .select()
        .single();

      if (dbErr) {
        // Rollback storage file if db record fails
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        throw new Error(`Document metadata save failed: ${dbErr.message}`);
      }

      return {
        success: true,
        document: transformDocumentFromDB(docRecord),
      };
    } catch (err: any) {
      console.error('Document upload error:', err);
      return { success: false, error: err.message || 'Failed to upload document.' };
    }
  },

  /**
   * Generates a temporary time-limited signed URL for secure file download (default 5 minutes)
   */
  async getSignedDownloadUrl(filePath: string, expiresInSeconds: number = 300): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
    if (!isSupabaseConfigured() || !filePath) {
      return { success: false, error: 'Storage not configured or invalid file path.' };
    }

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || 'Could not generate signed URL.');
      }

      return { success: true, signedUrl: data.signedUrl };
    } catch (err: any) {
      console.error('Error generating signed URL:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Deletes a document from Supabase Storage and removes metadata from public.documents
   */
  async deleteDocumentFile(filePath: string, documentId: string, organizationId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      if (filePath) {
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      }
      await (supabase.from('documents') as any)
        .delete()
        .eq('id', documentId)
        .eq('organization_id', organizationId);

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting document:', err);
      return { success: false, error: err.message };
    }
  },
};

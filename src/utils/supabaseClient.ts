/// <reference types="vite/client" />

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// SECURITY: Project URL is a non-secret identifier (visible in network requests).
// The anon key MUST be sourced exclusively from environment variables — never hardcoded.
const DEFAULT_SUPABASE_URL = 'https://lyaryldpiviaytcarbtn.supabase.co';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabasePublishableKey =
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  '';

/**
 * Validates whether Supabase environment variables are properly configured.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabasePublishableKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabasePublishableKey !== 'your-publishable-or-anon-key' &&
    supabasePublishableKey !== 'placeholder-anon-key'
  );
};

let clientInstance: SupabaseClient<Database> | null = null;

/**
 * Returns the singleton typed Supabase client instance.
 * If credentials are not configured, logs a helpful warning in development.
 */
export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!clientInstance) {
    if (!isSupabaseConfigured()) {
      console.info(
        'ℹ️ Supabase credentials not configured in environment (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY). ' +
        'Running in offline/local mock mode.'
      );
    }

    clientInstance = createClient<Database>(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabasePublishableKey || 'placeholder-publishable-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      }
    );
  }

  return clientInstance;
};

export const supabase = getSupabaseClient();

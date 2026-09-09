/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_DEFAULT_ORG_ID?: string;
  readonly VITE_DEFAULT_ORG_SLUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_MAX_URLS_PER_JOB?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

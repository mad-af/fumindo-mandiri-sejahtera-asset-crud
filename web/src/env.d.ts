/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL API. Default-nya `/api` (di-proxy oleh Vite ke backend). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL API. Default-nya `/api` (di-proxy oleh Vite ke backend). */
  readonly VITE_API_BASE_URL?: string;
  /** URL Swagger UI untuk tombol "Dokumentasi API". */
  readonly VITE_API_DOCS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

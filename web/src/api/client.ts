/**
 * Wrapper fetch tipis untuk memanggil REST API backend.
 *
 * Semua error dinormalisasi menjadi `ApiError` sehingga UI bisa
 * menampilkan pesan dari server (mis. pesan validasi 400) dengan
 * format yang seragam.
 */

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Error yang membawa status HTTP dan pesan dari server. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  message?: string | string[];
  error?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      0,
      'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.',
    );
  }

  if (!response.ok) {
    let message = `Request gagal (HTTP ${response.status})`;
    let details: string[] | undefined;

    try {
      const body = (await response.json()) as ErrorBody;

      if (Array.isArray(body.message)) {
        details = body.message;
        message = body.message.join(', ');
      } else if (typeof body.message === 'string') {
        message = body.message;
      } else if (body.error) {
        message = body.error;
      }
    } catch {
      // Response body bukan JSON - gunakan pesan default.
    }

    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

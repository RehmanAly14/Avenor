// Central HTTP client for the Avenor API.
// Every module under lib/api/ goes through this — single place that knows
// about the base URL, auth header, response envelope, and 401 handling.

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/api/v1";

export const TOKEN_STORAGE_KEY = "avenor_token";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: unknown;
}

export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registered once by AuthProvider so any request in the app can trigger a clean sign-out. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage unavailable (private mode, etc.) — auth just won't persist across reloads.
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  params?: QueryParams;
  isFormData?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: QueryParams): string {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    }
    const qs = query.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

async function requestEnvelope<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { method = "GET", body, params, isFormData, signal } = options;
  const url = buildUrl(path, params);

  const headers: Record<string, string> = {};
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (isFormData) {
      payload = body as FormData;
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: payload, signal });
  } catch {
    throw new ApiError("Couldn't reach the Avenor API. Check your connection and try again.", 0);
  }

  const text = await res.text();
  let json: ApiEnvelope<T> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401) unauthorizedHandler?.();
    throw new ApiError(json?.message || `Request failed (${res.status})`, res.status, json?.errors);
  }

  if (!json) throw new ApiError("Received an empty response from the server.", res.status);
  return json;
}

export const apiClient = {
  async get<T>(path: string, params?: QueryParams): Promise<T> {
    return (await requestEnvelope<T>(path, { method: "GET", params })).data;
  },
  async getPaged<T>(path: string, params?: QueryParams): Promise<{ data: T; meta?: PaginationMeta }> {
    const envelope = await requestEnvelope<T>(path, { method: "GET", params });
    return { data: envelope.data, meta: envelope.meta };
  },
  async post<T>(path: string, body?: unknown, options?: Partial<RequestOptions>): Promise<T> {
    return (await requestEnvelope<T>(path, { method: "POST", body, ...options })).data;
  },
  async patch<T>(path: string, body?: unknown): Promise<T> {
    return (await requestEnvelope<T>(path, { method: "PATCH", body })).data;
  },
  async put<T>(path: string, body?: unknown): Promise<T> {
    return (await requestEnvelope<T>(path, { method: "PUT", body })).data;
  },
  async delete<T>(path: string): Promise<T> {
    return (await requestEnvelope<T>(path, { method: "DELETE" })).data;
  },
};

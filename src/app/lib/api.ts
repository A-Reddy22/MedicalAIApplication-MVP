// Use an explicit base if provided. In development prefer the Vite proxy by using a
// relative base (empty string) so calls to `/api/...` are forwarded to the backend.
const envBase = import.meta.env.VITE_API_BASE_URL ?? "";

// If a base is provided in env, use it. Otherwise in dev return empty string so
// the proxy can handle `/api` requests; in production fall back to empty string
// (can be overridden by VITE_API_BASE_URL for deployments).
const rawBase = envBase || (import.meta.env.DEV ? "" : "");

export const API_BASE = String(rawBase).replace(/\/$/, "");

export function apiUrl(path: string) {
  if (!path.startsWith("/")) {
    return `${API_BASE}/${path}`;
  }
  return `${API_BASE}${path}`;
}

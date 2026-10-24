import { env } from '../constants/env';
import type { CurrentUser } from '../types/api';
import { ApiError, type ApiErrorBody } from './errors';

const requestTimeoutMs = 15_000;
const refreshPath = '/auth/refresh';
const noRefreshPaths = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/logout-all',
]);

export const sessionExpiredEvent = 'pawsaathi:session-expired';
let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

type AuthResponse = { token: string; user: CurrentUser };

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

function createRequestId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function apiUrl(path: string): string {
  const base = env.apiBaseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function isAuthResponse(authResponseCandidate: unknown): authResponseCandidate is AuthResponse {
  return (
    typeof authResponseCandidate === 'object' &&
    authResponseCandidate !== null &&
    'token' in authResponseCandidate &&
    typeof authResponseCandidate.token === 'string' &&
    'user' in authResponseCandidate
  );
}

function parseError(errorBody: unknown, status: number): ApiError {
  const body = errorBody && typeof errorBody === 'object' ? (errorBody as ApiErrorBody) : {};
  return new ApiError(
    status,
    body.message ?? `The request failed (${status}).`,
    body.errorCode ?? body.code,
    body.fieldErrors ?? [],
  );
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetch(apiUrl(refreshPath), {
        method: 'POST',
        headers: { 'X-Request-ID': createRequestId(), 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
      });
      const tokenResponseBody: unknown = await response.json().catch(() => null);
      if (response.status === 401 || response.status === 403) return false;
      if (!response.ok) throw parseError(tokenResponseBody, response.status);
      if (!isAuthResponse(tokenResponseBody)) {
        throw new ApiError(502, 'The session response was invalid.', 'INVALID_SESSION_RESPONSE');
      }
      setAccessToken(tokenResponseBody.token);
      return true;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(408, 'The request timed out. Please try again.', 'REQUEST_TIMEOUT');
      }
      throw new ApiError(
        0,
        'Unable to refresh your session. Check your connection and retry.',
        'NETWORK_ERROR',
      );
    } finally {
      window.clearTimeout(timeoutId);
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function send<T>(path: string, options: RequestInit, canRefresh: boolean): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);
  const headers = new Headers(options.headers);
  const method = (options.method ?? 'GET').toUpperCase();
  const isFormData = options.body instanceof FormData;

  if (options.body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-Request-ID', createRequestId());
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      method,
      headers,
      credentials: 'include',
      signal: options.signal ?? controller.signal,
    });

    if (response.status === 401 && canRefresh && !noRefreshPaths.has(path)) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return await send<T>(path, options, false);
      clearAccessToken();
      if (path !== '/auth/me') window.dispatchEvent(new Event(sessionExpiredEvent));
    }
    if (response.status === 204) return undefined as T;

    const responseBody: unknown = await response.json().catch(() => null);
    if (!response.ok) throw parseError(responseBody, response.status);
    return responseBody as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'The request timed out. Please try again.', 'REQUEST_TIMEOUT');
    }
    throw new ApiError(
      0,
      'Unable to reach PawSaathi. Check your connection and retry.',
      'NETWORK_ERROR',
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  return send<T>(path, options, allowRefresh);
}

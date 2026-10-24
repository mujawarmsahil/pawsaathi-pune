import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest, clearAccessToken, setAccessToken } from './client';
import { ApiError } from './errors';

const session = {
  token: 'rotated-memory-token',
  user: {
    id: 7,
    name: 'Asha Rao',
    email: 'asha@example.test',
    role: 'CUSTOMER',
    mustChangePassword: false,
  },
};

describe('api client', () => {
  beforeEach(() => {
    clearAccessToken();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    clearAccessToken();
    vi.unstubAllGlobals();
  });

  it('sends the in-memory Bearer token, cookies, and request IDs without CSRF headers', async () => {
    setAccessToken('memory-only-token');
    const fetchMock = vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 4 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(
      apiRequest<{ id: number }>('/pets', {
        method: 'POST',
        body: JSON.stringify({ name: 'Milo' }),
      }),
    ).resolves.toEqual({ id: 4 });

    const [, request] = fetchMock.mock.calls[0]!;
    const headers = new Headers(request?.headers);
    expect(request?.credentials).toBe('include');
    expect(headers.get('Authorization')).toBe('Bearer memory-only-token');
    expect(headers.get('X-Request-ID')).toBeTruthy();
    expect(headers.has('X-CSRF-TOKEN')).toBe(false);
  });

  it('rotates once on a protected 401 and retries with the new access token', async () => {
    setAccessToken('expired-memory-token');
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    await expect(apiRequest<{ ok: boolean }>('/pets')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer expired-memory-token',
    );
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/auth/refresh');
    expect(fetchMock.mock.calls[1]?.[1]?.credentials).toBe('include');
    expect(new Headers(fetchMock.mock.calls[2]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer rotated-memory-token',
    );
  });

  it('clears the session and normalizes API validation errors', async () => {
    const expired = vi.fn();
    window.addEventListener('pawsaathi:session-expired', expired);
    setAccessToken('expired-memory-token');
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response('{}', { status: 401 }));

    await expect(apiRequest('/pets')).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledOnce();
    const [, retry] = vi.mocked(fetch).mock.calls;
    expect(retry).toBeDefined();
    window.removeEventListener('pawsaathi:session-expired', expired);

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          errorCode: 'VALIDATION_ERROR',
          message: 'Check the form.',
          fieldErrors: [{ field: 'email', message: 'Invalid email.' }],
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    await expect(apiRequest('/pets')).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      fieldErrors: [{ field: 'email', message: 'Invalid email.' }],
    } satisfies Partial<ApiError>);
    expect(new Headers(vi.mocked(fetch).mock.calls.at(-1)?.[1]?.headers).has('Authorization')).toBe(
      false,
    );
  });
});

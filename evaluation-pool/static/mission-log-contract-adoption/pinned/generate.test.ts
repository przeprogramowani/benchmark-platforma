import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/cloudflare', () => ({
  wrapRequestHandler: (
    _options: unknown,
    handler: () => Promise<Response>,
  ) => handler(),
  getCurrentScope: () => ({ setTag: () => {} }),
  setUser: vi.fn(),
  setContext: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  consoleLoggingIntegration: vi.fn(() => ({ name: 'ConsoleLogging' })),
}));

vi.mock('@/server/missionLog/auth', () => ({
  resolveMissionLogUser: vi.fn(),
}));

vi.mock('@/server/badges/badgesApiClient', async () => {
  const actual = await vi.importActual<typeof import('@/server/badges/badgesApiClient')>(
    '@/server/badges/badgesApiClient',
  );
  return {
    ...actual,
    generateBadge: vi.fn(),
  };
});

vi.mock('@/server/missionLog/quotaService', async () => {
  const actual = await vi.importActual<typeof import('@/server/missionLog/quotaService')>(
    '@/server/missionLog/quotaService',
  );
  return {
    ...actual,
    getQuotaForUser: vi.fn(),
    recordGeneration: vi.fn(),
  };
});

import { POST } from './generate';
import { resolveMissionLogUser } from '@/server/missionLog/auth';
import { BadgesApiError, generateBadge } from '@/server/badges/badgesApiClient';
import { getQuotaForUser, recordGeneration } from '@/server/missionLog/quotaService';

function buildContext(body: unknown, env: Record<string, string> = {}) {
  return {
    request: {
      method: 'POST',
      headers: new Headers(),
      json: async () => body,
    } as Request,
    cookies: { get: () => ({ value: 'token' }) },
    locals: {
      env: {
        SUPABASE_URL: 'https://supabase.test',
        SUPABASE_SERVICE_KEY: 'service-key',
        BADGES_API_BASE_URL: 'https://badges.test',
        SITE_URL: 'https://platforma.test',
        ...env,
      },
    },
  } as never;
}

const okUser = {
  ok: true as const,
  user: {
    userId: 'user-1',
    email: 'user@example.test',
    avatarUrl: 'https://avatars.test/me.png?v=1',
  },
};

describe('POST /api/mission-log/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(resolveMissionLogUser).mockResolvedValue({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });
    const res = await POST(buildContext({ lessonId: 'm1-l1' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user has no 10xdevs-3 grant', async () => {
    vi.mocked(resolveMissionLogUser).mockResolvedValue({
      ok: false,
      status: 403,
      error: 'Forbidden',
    });
    const res = await POST(buildContext({ lessonId: 'm1-l1' }));
    expect(res.status).toBe(403);
  });

  it('returns sanitized retryable 503 when access providers are exhausted', async () => {
    vi.mocked(resolveMissionLogUser).mockResolvedValue({
      ok: false,
      status: 503,
      error: 'ACCESS_UNAVAILABLE',
    });
    const res = await POST(buildContext({ lessonId: 'm1-l1' }));
    const serialized = await res.text();

    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe('60');
    expect(JSON.parse(serialized)).toMatchObject({ errorCode: 'ACCESS_UNAVAILABLE' });
    expect(serialized).not.toContain('toolkit');
    expect(generateBadge).not.toHaveBeenCalled();
  });

  it('returns 404 when lesson is unknown', async () => {
    vi.mocked(resolveMissionLogUser).mockResolvedValue(okUser);
    const res = await POST(buildContext({ lessonId: 'does-not-exist' }));
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: 'lesson_not_found' });
  });

  it('returns 409 when avatar is missing', async () => {
    vi.mocked(resolveMissionLogUser).mockResolvedValue({
      ok: true,
      user: { userId: 'u1', email: 'e', avatarUrl: null },
    });
    const res = await POST(buildContext({ lessonId: 'm1-l1' }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: 'avatar_missing' });
  });

  it('returns 403 module_locked before unlock date', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T12:00:00+02:00'));
    vi.mocked(resolveMissionLogUser).mockResolvedValue(okUser);
    const res = await POST(buildContext({ lessonId: 'm1-l1' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('module_locked');
    expect(body.unlocksAt).toBe('2026-05-18T00:00:00+02:00');
    vi.useRealTimers();
  });

  it('returns 429 quota_exhausted when count is already at the cap', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T00:00:00+02:00'));
    vi.mocked(resolveMissionLogUser).mockResolvedValue(okUser);
    vi.mocked(getQuotaForUser).mockResolvedValue([
      { lessonId: 'm1-l1', count: 2, lastBadgeImageUrl: 'x', lastBadgeId: 1 },
    ]);
    const res = await POST(buildContext({ lessonId: 'm1-l1' }));
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ error: 'quota_exhausted' });
    expect(generateBadge).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('returns 503 upstream_busy on rate_limited and does NOT record', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T00:00:00+02:00'));
    vi.mocked(resolveMissionLogUser).mockResolvedValue(okUser);
    vi.mocked(getQuotaForUser).mockResolvedValue([]);
    vi.mocked(generateBadge).mockRejectedValue(
      new BadgesApiError('rate limited', 429, 'rate_limited'),
    );
    const res = await POST(buildContext({ lessonId: 'm1-l1' }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: 'upstream_busy' });
    expect(recordGeneration).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('returns 502 upstream_origin_forbidden when whitelist is misconfigured', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T00:00:00+02:00'));
    vi.mocked(resolveMissionLogUser).mockResolvedValue(okUser);
    vi.mocked(getQuotaForUser).mockResolvedValue([]);
    vi.mocked(generateBadge).mockRejectedValue(
      new BadgesApiError('forbidden', 403, 'origin_forbidden'),
    );
    const res = await POST(buildContext({ lessonId: 'm1-l1' }));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: 'upstream_origin_forbidden' });
    expect(recordGeneration).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('returns 200 with badgeImageUrl on success and records the generation', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T00:00:00+02:00'));
    vi.mocked(resolveMissionLogUser).mockResolvedValue(okUser);
    vi.mocked(getQuotaForUser).mockResolvedValue([]);
    vi.mocked(generateBadge).mockResolvedValue({
      imageUrl: 'https://badges.test/img/1.png',
      name: 'Badge 1',
      persistedToDatabase: true,
      recordId: 'r1',
    });
    vi.mocked(recordGeneration).mockResolvedValue({ count: 1 });

    const res = await POST(buildContext({ lessonId: 'm1-l1' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      badgeImageUrl: 'https://badges.test/img/1.png',
      count: 1,
      remaining: 1,
    });
    expect(recordGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        lessonId: 'm1-l1',
        badgeId: 1,
        badgeImageUrl: 'https://badges.test/img/1.png',
      }),
      expect.any(Object),
    );
    vi.useRealTimers();
  });
});

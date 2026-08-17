import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/cloudflare', () => ({
  wrapRequestHandler: (_options: unknown, handler: () => Promise<Response>) => handler(),
  getCurrentScope: () => ({ setTag: () => {} }),
  setUser: vi.fn(),
  setContext: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  consoleLoggingIntegration: vi.fn(() => ({ name: 'ConsoleLogging' })),
}));

vi.mock('@/server/missionLog/auth', () => ({ resolveMissionLogUser: vi.fn() }));
vi.mock('@/server/badges/badgesApiClient', async () => ({
  ...(await vi.importActual<typeof import('@/server/badges/badgesApiClient')>(
    '@/server/badges/badgesApiClient'
  )),
  getParticipationBadge: vi.fn(),
}));

import { GET } from './participation-badge';
import { resolveMissionLogUser } from '@/server/missionLog/auth';
import { getParticipationBadge } from '@/server/badges/badgesApiClient';

function context() {
  return {
    request: { method: 'GET', headers: new Headers() } as Request,
    cookies: { get: () => ({ value: 'token' }) },
    locals: {
      env: {
        SUPABASE_URL: 'https://supabase.test',
        SUPABASE_SERVICE_KEY: 'service-key',
        BADGES_API_BASE_URL: 'https://badges.test',
        SITE_URL: 'https://platforma.test',
      },
    },
  } as never;
}

describe('GET /api/mission-log/participation-badge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('preserves the typed 401 unauthenticated failure', async () => {
    vi.mocked(resolveMissionLogUser).mockResolvedValue({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });

    const response = await GET(context());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(getParticipationBadge).not.toHaveBeenCalled();
  });

  it('preserves the typed 403 authoritative denial', async () => {
    vi.mocked(resolveMissionLogUser).mockResolvedValue({
      ok: false,
      status: 403,
      error: 'Forbidden',
    });

    const response = await GET(context());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
    expect(getParticipationBadge).not.toHaveBeenCalled();
  });

  it('returns sanitized JSON 503 with Retry-After for provider exhaustion', async () => {
    vi.mocked(resolveMissionLogUser).mockResolvedValue({
      ok: false,
      status: 503,
      error: 'ACCESS_UNAVAILABLE',
    });

    const response = await GET(context());
    const serialized = await response.text();

    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(JSON.parse(serialized)).toMatchObject({ errorCode: 'ACCESS_UNAVAILABLE' });
    expect(serialized).not.toContain('member@example.com');
    expect(getParticipationBadge).not.toHaveBeenCalled();
  });

  it('returns the badge after typed authorization succeeds', async () => {
    vi.mocked(resolveMissionLogUser).mockResolvedValue({
      ok: true,
      user: { userId: 'user-1', email: 'member@example.com', avatarUrl: null },
    });
    vi.mocked(getParticipationBadge).mockResolvedValue({
      success: true,
      email: 'member@example.com',
      imageUrl: 'https://badges.test/badge.png',
      generatedAt: '2026-08-14T10:00:00.000Z',
      referralCode: 'CODE',
      referralLink: 'https://example.test/ref/CODE',
      role: 'developer',
      goal: 'learn',
    });

    const response = await GET(context());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      badge: { success: true, imageUrl: 'https://badges.test/badge.png' },
    });
  });
});

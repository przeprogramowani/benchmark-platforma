import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  verifyTokenMock,
  evaluateCourseAccessMock,
  upsertUserMock,
  getProfileMock,
  adminEmails,
} = vi.hoisted(() => ({
  verifyTokenMock: vi.fn(),
  evaluateCourseAccessMock: vi.fn(),
  upsertUserMock: vi.fn(),
  getProfileMock: vi.fn(),
  adminEmails: [] as string[],
}));

vi.mock('@/server/auth', () => ({ verifyToken: verifyTokenMock }));
vi.mock('@/server/admins', () => ({ ADMIN_EMAILS: adminEmails }));
vi.mock('@/server/courses/access/evaluateCourseAccess', () => ({
  evaluateCourseAccess: evaluateCourseAccessMock,
}));
vi.mock('@/server/supabase/userService', () => ({
  upsertUser: upsertUserMock,
  getProfile: getProfileMock,
}));

import { resolveMissionLogUser } from './auth';

const env = {
  JWT_SECRET: 'secret',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_SERVICE_KEY: 'service-key',
};

function context() {
  return {
    cookies: { get: vi.fn().mockReturnValue({ value: 'token' }) },
    locals: { env },
  } as never;
}

describe('resolveMissionLogUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminEmails.length = 0;
    verifyTokenMock.mockResolvedValue({ email: 'member@example.com' });
    upsertUserMock.mockResolvedValue('user-123');
    getProfileMock.mockResolvedValue({ avatarUrl: 'https://avatar.test/image.png' });
    evaluateCourseAccessMock.mockResolvedValue({ allowed: true, outcome: 'allow' });
  });

  it('uses the distinct mission-log registry policy', async () => {
    const result = await resolveMissionLogUser(context());

    expect(result).toEqual({
      ok: true,
      user: {
        userId: 'user-123',
        email: 'member@example.com',
        avatarUrl: 'https://avatar.test/image.png',
      },
    });
    expect(evaluateCourseAccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: '10xdevs-3',
        purpose: 'mission-log',
        email: 'member@example.com',
        sessionValid: true,
        userId: 'user-123',
      })
    );
  });

  it('returns forbidden when the mission-log policy denies', async () => {
    evaluateCourseAccessMock.mockResolvedValue({ allowed: false, outcome: 'deny' });

    await expect(resolveMissionLogUser(context())).resolves.toEqual({
      ok: false,
      status: 403,
      error: 'Forbidden',
    });
    expect(getProfileMock).not.toHaveBeenCalled();
  });

  it('returns unavailable only when the mission-log policy exhausts providers', async () => {
    evaluateCourseAccessMock.mockResolvedValue({
      allowed: false,
      outcome: 'error',
      provider: 'toolkit',
      reason: 'toolkit_read_error',
    });

    await expect(resolveMissionLogUser(context())).resolves.toEqual({
      ok: false,
      status: 503,
      error: 'ACCESS_UNAVAILABLE',
    });
    expect(getProfileMock).not.toHaveBeenCalled();
  });

  it('preserves the admin bypass without consulting entitlement providers', async () => {
    adminEmails.push('member@example.com');

    await expect(resolveMissionLogUser(context())).resolves.toMatchObject({
      ok: true,
      user: { userId: 'user-123', email: 'member@example.com' },
    });
    expect(evaluateCourseAccessMock).not.toHaveBeenCalled();
  });
});

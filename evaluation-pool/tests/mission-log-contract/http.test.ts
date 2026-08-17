/**
 * Check 3/3 — typowane helpery odpowiedzi (Faza 2 planu).
 *
 * Sprawdzamy zachowanie runtime, nie sygnaturę: helper ma produkować
 * dokładnie ten sam kształt odpowiedzi, który routes emitowały ręcznie
 * przed refaktorem (body, status, Content-Type) — łącznie z polem
 * `unlocksAt` z gałęzi `module_locked`.
 */
import { describe, expect, it } from 'vitest';
import { jsonError, jsonOk } from '@/server/missionLog/http';

describe('kontrakt: helpery odpowiedzi HTTP', () => {
  it('jsonError emituje kod błędu i status bez zmiany kształtu', async () => {
    const res = jsonError('quota_exhausted', 429);
    expect(res.status).toBe(429);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(await res.json()).toEqual({ error: 'quota_exhausted' });
  });

  it('jsonError przenosi pola dodatkowe (unlocksAt z module_locked)', async () => {
    const res = jsonError('module_locked', 403, { unlocksAt: '2026-09-01T00:00:00.000Z' });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: 'module_locked',
      unlocksAt: '2026-09-01T00:00:00.000Z',
    });
  });

  it('jsonOk zwraca 200 z nietkniętym ciałem odpowiedzi sukcesu', async () => {
    const body = { badgeImageUrl: 'https://example.test/b.png', count: 1, remaining: 1 };
    const res = jsonOk(body);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(await res.json()).toEqual(body);
  });
});

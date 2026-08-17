/**
 * Check 2/3 — kody błędów verbatim + komunikaty PL.
 *
 * To jest asercja pilnująca, że refaktor NIE zmienił protokołu. Kody
 * lecą na drut dokładnie w tej formie, łącznie z niekonsekwencją
 * stylistyczną ('Unauthorized' vs 'quota_exhausted'); ujednolicenie
 * nazewnictwa byłoby zmianą API, którą zadanie ma wykluczać.
 */
import { describe, expect, it } from 'vitest';
import {
  MISSION_LOG_ERROR_MESSAGES,
  MISSION_LOG_GENERIC_ERROR_MESSAGE,
} from '@/models/missionLog/contract';

const REQUIRED_CODES = [
  'Invalid JSON body',
  'Invalid request body',
  'Unauthorized',
  'Forbidden',
  'ACCESS_UNAVAILABLE',
  'lesson_not_found',
  'avatar_missing',
  'module_locked',
  'quota_exhausted',
  'upstream_busy',
  'upstream_origin_forbidden',
  'upstream_error',
] as const;

// Teksty, które w stanie startowym są jednoznacznie przypisane do kodu
// (a nie do samego statusu HTTP) — muszą przetrwać refaktor verbatim.
const VERBATIM_MESSAGES: Record<string, string> = {
  module_locked: 'Moduł jest jeszcze zablokowany.',
  quota_exhausted: 'Limit wykorzystany.',
  upstream_busy: 'Spróbuj za chwilę — generator jest chwilowo zajęty.',
};

describe('kontrakt: kody błędów i komunikaty', () => {
  it('mapa komunikatów pokrywa wszystkie kody API verbatim', () => {
    const keys = Object.keys(MISSION_LOG_ERROR_MESSAGES);
    for (const code of REQUIRED_CODES) {
      expect(keys, `brak kodu ${code} — zmiana kształtu API`).toContain(code);
    }
  });

  it('każdy kod ma niepusty komunikat', () => {
    for (const code of REQUIRED_CODES) {
      const message = MISSION_LOG_ERROR_MESSAGES[code as keyof typeof MISSION_LOG_ERROR_MESSAGES];
      expect(typeof message, `komunikat dla ${code}`).toBe('string');
      expect(String(message).trim().length, `pusty komunikat dla ${code}`).toBeGreaterThan(0);
    }
  });

  it('komunikaty przypisane do kodu przetrwały refaktor verbatim', () => {
    for (const [code, expected] of Object.entries(VERBATIM_MESSAGES)) {
      expect(
        MISSION_LOG_ERROR_MESSAGES[code as keyof typeof MISSION_LOG_ERROR_MESSAGES],
        `komunikat dla ${code} zmienił treść`,
      ).toBe(expected);
    }
  });

  it('istnieje generyczny fallback dla nierozpoznanego kodu', () => {
    expect(MISSION_LOG_GENERIC_ERROR_MESSAGE.trim().length).toBeGreaterThan(0);
  });
});

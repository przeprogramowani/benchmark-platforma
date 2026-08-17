/**
 * Check 1/3 — stałe domenowe kontraktu.
 *
 * Osobny plik na check (a nie trzy `describe` w jednym) jest celowy:
 * gdy agent zrobi tylko część faz, brakujący moduł wywala import całego
 * pliku. Rozdzielenie sprawia, że fazy punktują się niezależnie —
 * inaczej brak `http.ts` zerowałby też punkty za gotowy kontrakt.
 */
import { describe, expect, it } from 'vitest';
import { MISSION_LOG_LESSON_CATALOG } from '@/models/missionLog/lessonCatalog';
import {
  MAX_GENERATIONS_PER_LESSON,
  TOTAL_MISSION_LOG_BADGES,
} from '@/models/missionLog/contract';

describe('kontrakt: stałe domenowe', () => {
  it('TOTAL_MISSION_LOG_BADGES jest pochodną katalogu lekcji', () => {
    expect(TOTAL_MISSION_LOG_BADGES).toBe(MISSION_LOG_LESSON_CATALOG.length);
  });

  it('kontrakt eksportuje limit generowań zgodny z zachowaniem API', () => {
    expect(MAX_GENERATIONS_PER_LESSON).toBe(2);
  });

  it('quotaService udostępnia dokładnie tę samą stałą', async () => {
    // Re-eksport, nie druga definicja — inaczej duplikacja wraca tylnymi drzwiami.
    const quotaService = await import('@/server/missionLog/quotaService');
    expect(quotaService.MAX_GENERATIONS_PER_LESSON).toBe(MAX_GENERATIONS_PER_LESSON);
  });
});

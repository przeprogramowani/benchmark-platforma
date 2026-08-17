/**
 * Konfiguracja dla PRZYPIĘTYCH testów protokołu.
 *
 * Testy routes i auth z pinowanego commita są w tym zadaniu nietykalne —
 * ich asercje na kody i statusy są dowodem, że refaktor nie zmienił API.
 * Asercja przywraca je z `$ASSERTION_DIR` (nadpisując ewentualne edycje
 * agenta) i uruchamia własną konfiguracją, żeby ani plik testu, ani
 * `vitest.config.ts` repo nie mogły zostać "dociągnięte" do zmienionej
 * implementacji.
 *
 * `setupFiles` repo pomijamy świadomie: `tests/setup.ts` robi wyłącznie
 * mocki DOM pod `typeof window !== 'undefined'`, a te testy biegną w node.
 */
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/pages/api/mission-log/generate.test.ts',
      'src/pages/api/mission-log/participation-badge.test.ts',
      'src/server/missionLog/auth.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@edu/circle': path.resolve(__dirname, '../../libs/circle/src'),
    },
  },
});

/**
 * Konfiguracja vitest wyłącznie dla ukrytego testu asercji
 * tests/courses-view-toggle.
 *
 * Nie używamy `vitest.config.ts` repo bazowego: jego projekty nie ładują
 * pluginu Astro (import `.astro` wywala się na `vite:import-analysis`),
 * a asercja nie ma prawa zależeć od tego, czy agent tej konfiguracji nie
 * ruszył. `getViteConfig` z `astro/config` dokłada plugin Astro i aliasy
 * z `astro.config.mjs`.
 *
 * Plik jest kopiowany do /workspace/apps/edu-platform jako
 * `.bench-courses-view-toggle.vitest.config.ts` na etapie oceny —
 * ścieżki są relatywne do katalogu aplikacji.
 */
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    // Render strony Astro wymaga środowiska node (Astro >= 6). To zarazem
    // sedno pułapki SSR tego zadania: w node nie ma window/localStorage,
    // więc każdy odczyt localStorage na ścieżce renderu serwerowego
    // wywala render i wszystkie checki tej asercji.
    environment: 'node',
    include: ['.bench-courses-view-toggle.test.ts'],
    globals: true,
  },
});

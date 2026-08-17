/**
 * Konfiguracja vitest wyłącznie dla ukrytego testu asercji.
 *
 * Nie używamy `vitest.config.ts` repo bazowego z dwóch powodów: jego
 * projekty nie ładują pluginu Astro (import `.astro` wywala się na
 * `vite:import-analysis`), a poza tym asercja nie ma prawa zależeć od
 * tego, czy agent tej konfiguracji nie ruszył. `getViteConfig` z
 * `astro/config` dokłada plugin Astro i aliasy z `astro.config.mjs`.
 *
 * Plik jest kopiowany do /workspace/apps/edu-platform na etapie oceny —
 * ścieżki są relatywne do katalogu aplikacji.
 */
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    // Render komponentu Astro wymaga środowiska node (Astro >= 6).
    environment: 'node',
    include: ['.bench-footer-year.test.ts'],
    globals: true,
  },
});

/**
 * Konfiguracja vitest wyłącznie dla ukrytego testu asercji.
 *
 * Nie używamy `vitest.config.ts` repo bazowego: asercja nie ma prawa
 * zależeć od tego, czy agent tej konfiguracji nie ruszył. `getViteConfig`
 * z `astro/config` dokłada aliasy (`@/…`) z `astro.config.mjs`, których
 * używa testowany moduł.
 *
 * Plik jest kopiowany do /workspace/apps/edu-platform na etapie oceny —
 * ścieżki są relatywne do katalogu aplikacji.
 */
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'node',
    include: ['.bench-toc-nesting.test.ts'],
    globals: true,
  },
});

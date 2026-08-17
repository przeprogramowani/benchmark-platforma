/**
 * Konfiguracja vitest wyłącznie dla ukrytych testów tej asercji.
 *
 * Celowo NIE używamy `vitest.config.ts` repo bazowego: asercja nie może
 * zależeć od tego, czy agent tej konfiguracji nie ruszył (a refaktor
 * dotyka warstwy współdzielonej FE/BE, więc pokusa jest realna).
 * Testowane moduły to czysty TypeScript — plugin Astro ani Svelte nie
 * jest potrzebny, wystarczy alias `@` z tsconfigu aplikacji.
 *
 * Plik jest kopiowany do /workspace/apps/edu-platform na etapie oceny —
 * ścieżki są relatywne do katalogu aplikacji.
 */
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['.bench-mission-log-*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@edu/circle': path.resolve(__dirname, '../../libs/circle/src'),
    },
  },
});

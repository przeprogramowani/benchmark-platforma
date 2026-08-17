/**
 * Ukryty test składowej `tests` dla zadania fix-footer-hardcoded-year.
 *
 * Mierzy zachowanie stopki, nie jej kod: komponent renderowany jest przez
 * Astro Container API, a rok czytany z wyrenderowanego HTML-a. Dzięki temu
 * test nie zakłada implementacji (literał w komponencie, util, helper —
 * wszystko jedno) i nie łamie się od formatowania.
 *
 * Dwa testy dają trójstopniową rozdzielczość na frakcji:
 *   0.0 — stopka wciąż pokazuje stary rok (nic nie naprawiono),
 *   0.5 — rok podmieniony na bieżący, ale wciąż zahardkodowany
 *         (zgłoszenie PM-a wróci za rok — naprawa objawu),
 *   1.0 — rok wyliczany z bieżącej daty.
 *
 * Rozróżnienie 0.5 vs 1.0 robi podmiana zegara (`vi.setSystemTime`) —
 * bez niej hardkod bieżącego roku byłby nieodróżnialny od poprawki.
 * Fałszujemy wyłącznie `Date` (`toFake`), żeby nie zatrzymać timerów,
 * na których stoi asynchroniczny render kontenera.
 */
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, expect, test, vi } from 'vitest';
import Footer from './src/components/Footer.astro';

const FUTURE = new Date('2031-03-01T12:00:00Z');

async function renderFooter(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Footer);
}

/** Wycina fragment linii copyright — do czytelnego komunikatu błędu. */
function copyrightLine(html: string): string {
  return html.match(/(&copy;|©)[^<]*/)?.[0]?.trim() ?? '(brak linii copyright w stopce)';
}

afterEach(() => {
  vi.useRealTimers();
});

test('stopka pokazuje bieżący rok', async () => {
  const html = await renderFooter();
  const year = String(new Date().getFullYear());

  expect(copyrightLine(html)).toContain(year);
});

test('rok w stopce nadąża za upływem czasu', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FUTURE);

  const html = await renderFooter();

  expect(copyrightLine(html)).toContain(String(FUTURE.getUTCFullYear()));
});

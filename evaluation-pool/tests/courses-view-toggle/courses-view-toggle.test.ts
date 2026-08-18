/**
 * Ukryty test składowej `tests` dla zadania add-courses-view-toggle.
 *
 * Mierzy zachowanie strony /courses, nie jej kod: cała strona
 * (src/pages/courses.astro) renderowana jest przez Astro Container API
 * z zamockowaną warstwą auth/dostępów, a asercje czytają wyrenderowany
 * HTML przez jsdom (bez wykonywania skryptów). Dzięki temu test nie
 * zakłada, w którym pliku i pod jaką nazwą powstał przełącznik widoku.
 *
 * Render biegnie w środowisku node — bez `window`, `document`
 * i `localStorage`. To celowa pułapka SSR: każdy odczyt localStorage na
 * ścieżce renderu serwerowego wywala render i wszystkie checki naraz.
 *
 * Cztery testy = cztery komendy w check.yaml (score: fraction), więc
 * frakcja odróżnia stopnie wykonania:
 *   - przełącznik istnieje i ma dostępny (ARIA) stan wyboru,
 *   - domyślny widok (bez zapisu) to dzisiejsze kafelki,
 *   - oba widoki pokazują ten sam, kompletny zbiór kursów,
 *   - zapisany widok jest aplikowany skryptem inline przed malowaniem
 *     (jedyny mechanizm w Astro, który nie daje błysku złego widoku).
 */
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getContainerRenderer } from '@astrojs/svelte';
import { JSDOM } from 'jsdom';
import { expect, test } from 'vitest';
import { vi } from 'vitest';

// Warstwa pobierania danych zostaje wg zlecenia bez zmian, więc mocki tych
// dwóch modułów są stabilnym szwem: strona dostaje deterministyczny zestaw
// kursów we wszystkich trzech statusach (available/scheduled/unavailable).
vi.mock('@/server/verifyAuth', () => ({
  verifyAuth: async () => ({
    isAuthenticated: true,
    email: 'bench@example.com',
    firstName: 'Bench',
    lastName: 'Bot',
    avatarUrl: null,
  }),
}));

vi.mock('@/server/access/courseAccess', () => ({
  getAccessibleCourseSlugs: async () => ({
    availableCourseSlugs: ['opanuj-frontend', 'cursor-ai', '10xdevs-1'],
    scheduledCourses: [
      { courseSlug: 'opanuj-typescript-core', availableFrom: '2031-05-01T10:00:00.000Z' },
    ],
    unavailableCourses: [{ courseSlug: '10xdevs-2', reason: 'ACCESS_UNAVAILABLE' }],
  }),
}));

import CoursesPage from './src/pages/courses.astro';

/**
 * Tytuły kart odpowiadające mockowi dostępów (źródło:
 * src/server/courses/definitions.ts). Dobrane tak, żeby żaden nie był
 * podłańcuchem innego ani nie występował w opisach pozostałych kart.
 */
const EXPECTED_TITLES = [
  'Opanuj Frontend', // available
  'Cursor: Programuj z AI', // available
  '10xDevs 1.0', // available
  'Opanuj TypeScript: Core Pro', // scheduled
  '10xDevs 2.0', // unavailable
];

async function renderCoursesPage(): Promise<string> {
  const renderers = await loadRenderers([getContainerRenderer()]);
  const container = await AstroContainer.create({ renderers });
  return container.renderToString(CoursesPage, {
    request: new Request('https://bench.local/courses'),
    locals: { env: {} } as App.Locals,
  });
}

interface ToggleControl {
  kind: 'list' | 'grid' | 'unknown';
  state: 'selected' | 'unselected' | 'none';
  focusable: boolean;
}

const LIST_NAME = /list/i; // lista, listy, list view…
const GRID_NAME = /kafel|miniatur|grid|tile|siatk/i; // kafelki, miniaturki, grid…
const VIEW_NAME = /widok|view|list|kafel|miniatur|grid|tile|siatk/i;

function accessibleName(el: Element): string {
  return [el.getAttribute('aria-label'), el.getAttribute('title'), el.textContent]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function selectionState(el: Element): ToggleControl['state'] {
  for (const attr of ['aria-pressed', 'aria-checked', 'aria-selected']) {
    const value = el.getAttribute(attr);
    if (value === 'true') return 'selected';
    if (value === 'false') return 'unselected';
  }
  const type = el.getAttribute('type');
  if (el.tagName === 'INPUT' && (type === 'radio' || type === 'checkbox')) {
    return el.hasAttribute('checked') ? 'selected' : 'unselected';
  }
  return 'none';
}

function isFocusable(el: Element): boolean {
  const tabindex = el.getAttribute('tabindex');
  if (tabindex !== null) return Number(tabindex) >= 0;
  const tag = el.tagName;
  return tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || (tag === 'A' && el.hasAttribute('href'));
}

/**
 * Kontrolki przełącznika widoku: elementy, których dostępna nazwa mówi
 * o widoku/liście/kafelkach ORAZ które niosą stan wyboru w semantyce
 * dostępności (aria-pressed / aria-checked / aria-selected / checked).
 */
function findToggleControls(document: Document): ToggleControl[] {
  const candidates = Array.from(
    document.querySelectorAll(
      '[aria-pressed], [aria-checked], [aria-selected], input[type="radio"], input[type="checkbox"]'
    )
  );
  return candidates
    .filter((el) => VIEW_NAME.test(accessibleName(el)))
    .map((el) => {
      const name = accessibleName(el);
      const kind: ToggleControl['kind'] = LIST_NAME.test(name)
        ? 'list'
        : GRID_NAME.test(name)
          ? 'grid'
          : 'unknown';
      return { kind, state: selectionState(el), focusable: isFocusable(el) };
    });
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

test('przełącznik widoku istnieje i komunikuje stan wyboru', async () => {
  const html = await renderCoursesPage();
  const { document } = new JSDOM(html).window;

  const controls = findToggleControls(document);
  expect(
    controls.length,
    'na stronie /courses nie ma fokusowalnej kontrolki przełącznika widoku z dostępnym stanem wyboru (aria-pressed / aria-checked / aria-selected / checked)'
  ).toBeGreaterThan(0);
  expect(
    controls.some((control) => control.focusable),
    'kontrolka przełącznika widoku nie jest osiągalna z klawiatury (nie jest natywnie fokusowalna albo ma tabindex="-1")'
  ).toBe(true);
});

test('domyślnym widokiem bez zapisanego wyboru pozostają kafelki', async () => {
  const html = await renderCoursesPage();
  const { document } = new JSDOM(html).window;

  const controls = findToggleControls(document);
  expect(controls.length, 'brak kontrolki przełącznika widoku (patrz poprzedni test)').toBeGreaterThan(0);

  const listSelected = controls.some((c) => c.kind === 'list' && c.state === 'selected');
  const gridSelected = controls.some((c) => c.kind === 'grid' && c.state === 'selected');
  const listOff = controls.some((c) => c.kind === 'list' && c.state === 'unselected');

  // Render serwerowy nie zna localStorage, więc SSR pokazuje stan domyślny.
  // Domyślny ma być dzisiejszy widok kafelków: opcja kafelków zaznaczona
  // (aria-*="true"/checked) albo — przy pojedynczym przycisku przełączającym
  // na listę — stan "niewciśnięty".
  expect(
    listSelected,
    'w stanie domyślnym (bez zapisu w localStorage) kontrolka komunikuje widok listy jako wybrany — domyślny miał zostać dzisiejszy widok kafelków'
  ).toBe(false);
  expect(
    gridSelected || listOff,
    'żadna kontrolka nie komunikuje kafelków jako widoku bieżącego w stanie domyślnym'
  ).toBe(true);
});

test('oba widoki pokazują ten sam, kompletny zbiór kursów', async () => {
  const html = await renderCoursesPage();
  const { document } = new JSDOM(html).window;
  const text = document.body ? document.body.textContent! : document.documentElement.textContent!;

  // Każdy kurs z mocka (dostępny, zaplanowany i chwilowo niedostępny) musi
  // być obecny — i to tyle samo razy co pozostałe. Implementacja na wspólnym
  // DOM-ie da 1 wystąpienie tytułu, implementacja z dwoma drzewami — 2;
  // nierówna liczba oznacza, że któryś widok gubi część kursów (np. lista
  // renderuje tylko kursy dostępne).
  const counts = EXPECTED_TITLES.map((title) => ({ title, count: countOccurrences(text, title) }));
  for (const { title, count } of counts) {
    expect(count, `kurs "${title}" nie występuje w wyrenderowanym widoku /courses`).toBeGreaterThan(0);
  }
  const distinct = new Set(counts.map(({ count }) => count));
  expect(
    distinct.size,
    `kursy występują nierówno często (${counts.map(({ title, count }) => `${title}: ${count}`).join(', ')}) — widoki nie pokazują tego samego zbioru kursów`
  ).toBe(1);
});

test('zapisany widok jest aplikowany skryptem inline przed malowaniem', async () => {
  const html = await renderCoursesPage();
  const { document } = new JSDOM(html).window;

  // Zapisany wybór ma obowiązywać od pierwszego malowania (bez błysku
  // domyślnego widoku), a render serwerowy nie zna localStorage — jedyne
  // miejsce na odczyt to wykonywalny skrypt inline w HTML-u strony.
  const inlineScripts = Array.from(document.querySelectorAll('script:not([src])')).filter((el) => {
    const type = el.getAttribute('type');
    return type === null || type === '' || type === 'module' || type === 'text/javascript';
  });
  const applier = inlineScripts.find(
    (el) => /localStorage/.test(el.textContent ?? '') && /getItem|localStorage\s*\[/.test(el.textContent ?? '')
  );
  expect(
    applier,
    'w HTML-u strony /courses nie ma wykonywalnego skryptu inline odczytującego zapisany widok z localStorage — zapisany wybór nie może obowiązywać od pierwszego malowania'
  ).toBeTruthy();
});

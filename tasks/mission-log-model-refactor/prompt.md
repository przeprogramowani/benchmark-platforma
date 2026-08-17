# Mission Log Contract Updates — Implementation Plan

## Overview

Wydzielenie wspólnego modułu kontraktu front–backend dla feature'u Mission Log (`/10xdevs-3/mission-log`). Dziś klient Svelte odtwarza wiedzę serwera ręcznie: hardkoduje liczbę odznak, kopiuje limit generowań jako literał i dopasowuje kody błędów API gołymi stringami w if-chainie. Refaktor tworzy jedno źródło prawdy (`src/models/missionLog/contract.ts`) dla stałych domenowych, kodów błędów, komunikatów PL i typów odpowiedzi — bez żadnej zmiany zachowania widocznego dla użytkownika ani kształtu API.

## Zasady wykonania

- **Gdzie pracujesz**: katalog roboczy to korzeń monorepo (pnpm + nx).
  Feature Mission Log żyje w aplikacji `apps/edu-platform` — wszystkie
  ścieżki `src/...` w tym planie są względne do niej. Zależności są już
  zainstalowane; nie masz dostępu do sieci.
- **Weryfikacja**: po zmianach uruchom `pnpm run check` (astro check)
  oraz `pnpm exec vitest run` — z katalogu `apps/edu-platform`. Obie
  komendy mają przechodzić.
- **Czego NIE uruchamiaj**: `pnpm run build` ani `pnpm run dev`. Build
  ciągnie generowanie treści lekcji i pełny astro build, a serwera dev
  nie masz jak sprawdzić — to zjada czas bez wartości dla tego zlecenia.
- **Zakres zmian**: wyłącznie pliki wymienione w planie. Nie refaktoruj
  niczego przy okazji, nie formatuj plików, których nie dotykasz.

## Current State Analysis

Duplikacje i magic numbers znalezione podczas analizy feature'u:

- `MissionLogGrid.svelte:28` — `const TOTAL_BADGES = 25;` zamiast pochodnej z `MISSION_LOG_LESSON_CATALOG` (który ma dokładnie 25 wpisów, pilnowane przez `lessonCatalog.test.ts`).
- `MissionLogGrid.svelte:104` — przy odpowiedzi 429 klient wpisuje literał `patchLesson(lessonId, { count: 2, remaining: 0 })` — kopia `MAX_GENERATIONS_PER_LESSON` z `quotaService.ts:5`, która rozjedzie się przy pierwszej zmianie limitu.
- `MissionLogGrid.svelte:98-119` — if-chain mapujący status HTTP + string kodu błędu (`avatar_missing`, `quota_exhausted`, `module_locked`, `upstream_busy`) na komunikaty PL. Brak wspólnego typu: literówka albo nowy kod po stronie serwera po cichu wpada w generyczny fallback.
- `generate.ts` i `participation-badge.ts` — każdy route emituje kody błędów jako gołe stringi i każdy definiuje własną kopię helpera `jsonResponse` + `jsonHeaders`.
- `quotaService.ts:5` — `MAX_GENERATIONS_PER_LESSON` zdefiniowane w warstwie serwisowej, importowane przez `generate.ts` i `buildState.ts`; klient nie ma do niego dostępu (i dlatego hardkoduje).

Istniejący wzorzec do naśladowania: `src/models/missionLog/lessonCatalog.ts` jest już importowany i przez serwer (`generate.ts`, `buildState.ts`), i przez klienta (typ w `MissionLogGrid.svelte`) — katalog `src/models/` pełni w tym feature rolę warstwy współdzielonej. Inwarianty katalogu pilnuje `lessonCatalog.test.ts` — ten sam wzorzec zastosujemy do testu kontraktu.

## Desired End State

- Istnieje `src/models/missionLog/contract.ts` — jedyne miejsce definiujące: unię kodów błędów Mission Log API, mapę komunikatów PL, `MAX_GENERATIONS_PER_LESSON`, `TOTAL_MISSION_LOG_BADGES` (pochodna długości katalogu) oraz typy odpowiedzi sukcesu obu endpointów.
- Oba API routes emitują błędy przez typowany helper `jsonError(code, status)` — kompilator odrzuca kod spoza unii.
- Klient Svelte nie zawiera żadnego literału domenowego (`25`, `2`) ani gołego stringa kodu błędu — wszystko importowane z kontraktu.
- Test kontraktu utrwala inwarianty: liczba odznak == długość katalogu, każdy kod błędu ma niepusty komunikat.
- Weryfikacja: `pnpm run check` + `pnpm exec vitest run` przechodzą; zachowanie feature'u mission-log identyczne jak przed refaktorem.

### Key Discoveries:

- `src/models/missionLog/lessonCatalog.ts` — istniejąca warstwa współdzielona FE/BE; kontrakt to jej naturalny sąsiad.
- `MissionLogGrid.svelte:14` — komponent importuje typy z `@/server/missionLog/buildState` (type-only import, wycinany przy bundlowaniu) — precedens na importy typów przez granicę; ale **funkcje i stałe** dla klienta muszą żyć w `src/models/`, nie w `src/server/`, żeby nie wciągać kodu serwerowego do bundla wyspy.
- `generate.ts:55` i `participation-badge.ts:23` — kody auth (`Unauthorized`, `Forbidden`, `ACCESS_UNAVAILABLE`) pochodzą z `MissionLogAuthResult` w `src/server/missionLog/auth.ts:16-20` i też są częścią kontraktu HTTP.
- Odpowiedzi 400 (`Invalid JSON body`, `Invalid request body`) to również literały emitowane do klienta — wchodzą do unii **verbatim**, żeby nie zmieniać kształtu API.
- `ParticipationBadge.svelte:4` importuje typ `ParticipationBadgeResponse` z `badgesApiClient` — kontrakt powinien go re-eksportować (type-only), żeby klient miał jeden punkt importu.
- Testy `generate.test.ts` (220 linii) i `participation-badge.test.ts` (111 linii) pokrywają wszystkie ścieżki błędów — to siatka bezpieczeństwa refaktoru; asercje na kody błędów w tych testach NIE mogą się zmienić (to dowód braku zmiany protokołu).

## What We're NOT Doing

- **Żadnych zmian kształtu API** — te same statusy HTTP, te same stringi kodów błędów, te same pola odpowiedzi. To refaktor, nie zmiana protokołu.
- **MODULE_LABELS zostaje w `MissionLogGrid.svelte`** — etykiety modułów to warstwa prezentacji; świadomie poza zakresem (decyzja z planowania: zakres "stałe + kody + typy odpowiedzi", nie "szeroki").
- **Bez runtime walidacji (zod)** — typowanie compile-time wystarcza dla wewnętrznego API w tym samym repo.
- **Bez zmian w `quotaService` poza przeniesieniem stałej** — atomowość kwoty (wyścig read-then-write) to osobny kierunek refaktoryzacji, osobny change.
- **Bez ujednolicania pipeline'u auth** (duplikacja `mission-log.astro` vs `resolveMissionLogUser`) — osobny kierunek, osobny change.
- **Bez uzupełniania placeholderowych tytułów lekcji** w katalogu (m2–m5) — zadanie contentowe, nie kodowe.
- **Bez wymiany axios na fetch** — poza zakresem tego kontraktu.

## Implementation Approach

Trzy małe fazy w kolejności zależności: najpierw powstaje kontrakt z testem (nic jeszcze go nie używa — zero ryzyka), potem serwer przechodzi na typowane helpery (testy routes pilnują braku zmiany protokołu), na końcu klient (kompilator pilnuje spójności z tym, co serwer właśnie zadeklarował). Każda faza zostawia repo w stanie zielonym.

Decyzje z sesji planowania:

1. **Zakres**: stałe + kody błędów + typy odpowiedzi sukcesu obu endpointów.
2. **Typowanie**: współdzielona unia typów + typowany helper `jsonError(code, status)` po stronie serwera. Helpery zwracające `Response` żyją w `src/server/missionLog/http.ts` (nie w kontrakcie), żeby modele pozostały czyste od kodu serwerowego.
3. **Komunikaty PL**: mapa `Record<kod, string>` w module kontraktu, konsumowana przez klienta — nowy kod bez komunikatu = błąd kompilacji.
4. **Weryfikacja**: istniejąca suita + nowy test kontraktu (wzorzec `lessonCatalog.test.ts`).

## Critical Implementation Details

- **Granica server/client bundle**: `contract.ts` może importować z `lessonCatalog.ts` (oba w `src/models/`) oraz **type-only** z `@/server/badges/badgesApiClient` (re-eksport typu `ParticipationBadgeResponse` przez `export type`). Nie wolno importować do kontraktu żadnych wartości runtime z `src/server/**` — trafiłyby do bundla wyspy Svelte. `import type` / `export type` są bezpieczne (wycinane przy kompilacji).
- **Verbatim kody błędów**: unia musi zawierać dokładnie te stringi, które routes emitują dziś — łącznie z niekonsekwentnymi stylistycznie `'Unauthorized'`, `'Forbidden'`, `'ACCESS_UNAVAILABLE'`, `'Invalid JSON body'`, `'Invalid request body'`. Ujednolicanie nazewnictwa kodów byłoby zmianą API i jest poza zakresem.
- **Asercje w istniejących testach routes są nietykalne**: jeśli po refaktorze trzeba zmienić oczekiwany kod/status w `generate.test.ts` lub `participation-badge.test.ts`, to znaczy, że zmieniło się API — cofnij się i popraw implementację, nie test.

## Phase 1: Moduł kontraktu + test inwariantów

### Overview

Powstaje `src/models/missionLog/contract.ts` z pełnym kontraktem HTTP feature'u oraz test utrwalający jego inwarianty. Nic jeszcze z kontraktu nie korzysta — faza jest czysto addytywna.

### Changes Required:

#### 1. Moduł kontraktu

**File**: `src/models/missionLog/contract.ts` (nowy)

**Intent**: Jedno źródło prawdy dla kontraktu front–backend Mission Log: kody błędów, komunikaty PL, stałe domenowe, typy odpowiedzi.

**Contract**: Moduł eksportuje:

- `MAX_GENERATIONS_PER_LESSON = 2` — przeniesione docelowo z `quotaService.ts` (w tej fazie tylko zdefiniowane tu; przepięcie importów w Fazie 2).
- `TOTAL_MISSION_LOG_BADGES` — wyliczone jako `MISSION_LOG_LESSON_CATALOG.length` (import z `./lessonCatalog`), nie literał.
- `MissionLogApiErrorCode` — unia literałów obejmująca **wszystkie** kody emitowane dziś przez oba routes i warstwę auth, verbatim: `'Invalid JSON body' | 'Invalid request body' | 'Unauthorized' | 'Forbidden' | 'ACCESS_UNAVAILABLE' | 'lesson_not_found' | 'avatar_missing' | 'module_locked' | 'quota_exhausted' | 'upstream_busy' | 'upstream_origin_forbidden' | 'upstream_error'`.
- `MISSION_LOG_ERROR_MESSAGES: Record<MissionLogApiErrorCode, string>` — polskie komunikaty; dla kodów obsługiwanych dziś w `MissionLogGrid.svelte:101-116` przenieś istniejące teksty verbatim, dla pozostałych użyj obecnego generycznego fallbacku ("Nie udało się wygenerować odznaki. Spróbuj ponownie."). Dodatkowo `MISSION_LOG_GENERIC_ERROR_MESSAGE` dla odpowiedzi bez rozpoznanego kodu.
- `GenerateBadgeSuccessResponse` — `{ badgeImageUrl: string; count: number; remaining: number }` (kształt z `generate.ts:147-151`).
- `MissionLogErrorResponse` — `{ error: MissionLogApiErrorCode; unlocksAt?: string | null }` (opcjonalne `unlocksAt` z gałęzi `module_locked`, `generate.ts:88-91`).
- `ParticipationBadgeSuccessResponse` — `{ badge: ParticipationBadgeResponse | null }`; typ `ParticipationBadgeResponse` re-eksportowany type-only z `@/server/badges/badgesApiClient`.

#### 2. Test kontraktu

**File**: `src/models/missionLog/contract.test.ts` (nowy)

**Intent**: Utrwalić inwarianty kontraktu tak, jak `lessonCatalog.test.ts` utrwala inwarianty katalogu.

**Contract**: Asercje: (a) `TOTAL_MISSION_LOG_BADGES === MISSION_LOG_LESSON_CATALOG.length`, (b) każdy klucz `MISSION_LOG_ERROR_MESSAGES` ma niepusty string, (c) zbiór kluczy mapy jest dokładnie zbiorem wartości unii (wystarczy asercja liczności + `satisfies` w samym module; w teście sprawdź niepustość i brak duplikatów).

### Success Criteria:

#### Automated Verification:

- `pnpm run check` przechodzi (nowy moduł typuje się poprawnie, granica server/client zachowana)
- `pnpm exec vitest run src/models/missionLog/contract.test.ts` przechodzi
- `pnpm exec vitest run` — pełna suita bez regresji


---

## Phase 2: Adopcja serwerowa

### Overview

Oba API routes przechodzą na typowane helpery odpowiedzi; znika zduplikowany `jsonResponse`; stała limitu przenosi się do kontraktu. Protokół HTTP pozostaje bitowo identyczny — dowodem niezmienione testy routes.

### Changes Required:

#### 1. Typowane helpery HTTP

**File**: `src/server/missionLog/http.ts` (nowy)

**Intent**: Jedna implementacja odpowiedzi JSON dla obu routes, z kompilatorem pilnującym kodów błędów.

**Contract**: Eksportuje `jsonError(code: MissionLogApiErrorCode, status: number, extra?: Record<string, unknown>): Response` (parametr `extra` obsługuje pole `unlocksAt` z gałęzi `module_locked`) oraz `jsonOk(body: GenerateBadgeSuccessResponse | ParticipationBadgeSuccessResponse): Response`. Nagłówek `Content-Type: application/json` jak w obecnych helperach.

#### 2. Przeniesienie stałej limitu

**File**: `src/server/missionLog/quotaService.ts`

**Intent**: `quotaService` przestaje definiować `MAX_GENERATIONS_PER_LESSON` — importuje ją z kontraktu i re-eksportuje (re-eksport utrzymuje istniejące ścieżki importu w `generate.ts`, `buildState.ts` i testach bez zmian).

**Contract**: `export { MAX_GENERATIONS_PER_LESSON } from '@/models/missionLog/contract';` zastępuje lokalną definicję z linii 5. Zachowanie `QuotaExhaustedError` i logiki bez zmian.

#### 3. Route generate

**File**: `src/pages/api/mission-log/generate.ts`

**Intent**: Zastąpić lokalny `jsonResponse` + gołe stringi wywołaniami `jsonError` / `jsonOk`; typ odpowiedzi sukcesu z kontraktu.

**Contract**: Wszystkie gałęzie błędów (`Invalid JSON body`, `Invalid request body`, kody auth, `lesson_not_found`, `avatar_missing`, `module_locked` z `unlocksAt`, `quota_exhausted`, `upstream_busy`, `upstream_origin_forbidden`, `upstream_error`) emitowane przez `jsonError` z identycznymi statusami. Odpowiedź sukcesu budowana jako `GenerateBadgeSuccessResponse`. Gałąź 503 (`courseAccessUnavailableResponse`) pozostaje bez zmian — to współdzielony mechanizm kursowy spoza tego kontraktu.

#### 4. Route participation-badge

**File**: `src/pages/api/mission-log/participation-badge.ts`

**Intent**: Analogicznie — usunąć lokalny helper, przejść na `jsonError` / `jsonOk` z typem `ParticipationBadgeSuccessResponse`.

**Contract**: Kody `upstream_origin_forbidden` (502), `upstream_error` (502) i błędy auth bez zmian statusów.

### Success Criteria:

#### Automated Verification:

- `pnpm run check` przechodzi
- `pnpm exec vitest run` — **`generate.test.ts` i `participation-badge.test.ts` przechodzą bez modyfikacji asercji** (dowód braku zmiany protokołu)


---

## Phase 3: Adopcja kliencka + weryfikacja końcowa

### Overview

Komponenty Svelte przechodzą na import z kontraktu; znikają wszystkie literały domenowe i if-chain kodów błędów. Zachowanie UI identyczne (te same komunikaty, verbatim).

### Changes Required:

#### 1. Grid odznak

**File**: `src/components/missionLog/MissionLogGrid.svelte`

**Intent**: Usunąć trzy duplikacje wiedzy serwera: liczbę odznak, limit generowań i mapowanie kodów błędów.

**Contract**:
- Linia 28: `TOTAL_BADGES` zastąpione importem `TOTAL_MISSION_LOG_BADGES`.
- Linia 104: `patchLesson(lessonId, { count: 2, remaining: 0 })` → `{ count: MAX_GENERATIONS_PER_LESSON, remaining: 0 }` (import z kontraktu).
- Linie 98-119: if-chain zastąpiony lookupem — kod z `err.response?.data?.error` typowany jako `MissionLogApiErrorCode | undefined`, komunikat z `MISSION_LOG_ERROR_MESSAGES[code] ?? MISSION_LOG_GENERIC_ERROR_MESSAGE`. Zachować obecne rozgałęzienia specjalne, które nie są czystym mapowaniem kod→tekst: `avatar_missing` otwiera modal (nie pokazuje tekstu), `quota_exhausted`/429 dodatkowo patchuje lesson, fallback po samym statusie 401/403 gdy kod nieobecny. Odpowiedź sukcesu z `axios.post` typowana jako `GenerateBadgeSuccessResponse`.

#### 2. Odznaka uczestnictwa

**File**: `src/components/missionLog/ParticipationBadge.svelte`

**Intent**: Punkt importu typu odpowiedzi przenosi się na kontrakt.

**Contract**: `import type { ParticipationBadgeSuccessResponse } ...` z `@/models/missionLog/contract` zamiast obecnego importu z `@/server/badges/badgesApiClient` (linia 4); typ odpowiedzi `axios.get` z kontraktu.

### Success Criteria:

#### Automated Verification:

- `pnpm run check` przechodzi
- `pnpm exec vitest run` — pełna suita zielona


---

## Testing Strategy

### Unit Tests:

- Nowy `contract.test.ts`: spójność `TOTAL_MISSION_LOG_BADGES` z katalogiem, kompletność i niepustość mapy komunikatów.
- Istniejące `generate.test.ts`, `participation-badge.test.ts`, `quotaService.test.ts`, `auth.test.ts`, `lessonCatalog.test.ts` — przechodzą bez zmian asercji.

### Integration Tests:

- Brak nowych — istniejące testy routes pokrywają pełne kształty odpowiedzi (decyzja z planowania: bez duplikowania pokrycia).


## Performance Considerations

Brak wpływu — zmiany są compile-time; lookup w mapie zamiast if-chainu jest neutralny.

## Migration Notes

Nie dotyczy — brak zmian w bazie danych i w protokole HTTP. Rollback = revert commita.

## References

- Analiza źródłowa: rozmowa z 2026-08-17 (pełny przegląd feature'u Mission Log — kierunek nr 3 z top 3 refaktoryzacji)
- Wzorzec warstwy współdzielonej: `src/models/missionLog/lessonCatalog.ts` + `lessonCatalog.test.ts`
- Duplikacje: `MissionLogGrid.svelte:28,104,98-119`, `generate.ts:23-27`, `participation-badge.ts:14-18`, `quotaService.ts:5`
- Weryfikacja zmian serwerowych w tym zleceniu: `pnpm run check` → `pnpm exec vitest run` (patrz "Zasady wykonania")


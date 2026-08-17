---
version: "1"
weights:
  completeness: 0.4
  scope: 0.35
  boundary: 0.25
---

# Rubryka: mission-log-model-refactor (v1)

Skalibrowana na zbiorze
`evaluation-pool/judge/mission-log-model-refactor-calibration`
(5 diffów o znanej jakości).

Co zmienił pomiar wobec szkicu v0:

- **Zmiana kształtu API zeruje `completeness`, nie tylko `scope`.**
  W v0 sędzia dawał wariantowi `04-api-drift` completeness 1.00
  („wszystkie trzy fazy wykonane"), więc kompletny refaktor z po cichu
  przemianowanymi kodami błędów wychodził 0.650 — **remis** z uczciwym
  scope creepem (`03`). Wykonanie innego planu niż zlecony nie jest
  wykonaniem planu.
- **`completeness` ma kotwicę dla pracy ledwo rozpoczętej.** Kotwica 0.5
  („jedna faza pominięta") była nadużywana przy pominięciu dwóch faz:
  `02-phase1-only` dostawał 0.50 za jedną trzecią roboty.
- **`scope` nie daje pełnych punktów pracy częściowej.** W v0
  `02-phase1-only` zbierał scope 1.00 i boundary 1.00 — 0.60 punktów za
  to, że nie wyszedł poza zakres, którego ledwo dotknął. Łączny wynik
  0.800 stawiał jedną trzecią roboty **nad** kompletnym refaktorem.
- **Klauzule degeneracyjne wiążą się z brakiem materiału, nie z liczbą.**
  W v0 były zaczepione o `completeness` = 0.0; po dodaniu zerowania za
  zmianę API zrównałyby `04` z pustym diffem. Teraz mówią wprost
  „brak kontraktu / brak zmian do oceny".

Zadanie daje agentowi **gotowy plan implementacyjny** — nazwy plików,
listy eksportów, unię kodów verbatim, jawną listę rzeczy poza zakresem.
Sędzia nie powtarza więc tego, co mierzą składowe deterministyczne:

- czy kontrakt istnieje i ma właściwe stałe / kody → `tests`,
- czy typy się kompilują, protokół HTTP jest nietknięty, a klient nie
  trzyma literałów → `static`.

Sędzia odpowiada na trzy pytania, których te asercje nie widzą:
**czy plan wykonano w całości, czy nie zrobiono przy okazji rzeczy
wprost wykluczonych, i czy nie złamano granicy bundla server/client.**

Plan wyklucza wprost: przeniesienie `MODULE_LABELS` do kontraktu,
walidację runtime (zod), zmiany w `quotaService` ponad przeniesienie
stałej, ujednolicanie pipeline'u auth, uzupełnianie tytułów lekcji
w katalogu, wymianę axios na fetch.

## Kryteria

1. **completeness** (waga 0.4) — czy wykonano wszystkie trzy fazy planu?
   Faza 1: moduł kontraktu + test inwariantów. Faza 2: helpery
   `jsonError`/`jsonOk`, oba routes na nich, stała przeniesiona do
   kontraktu i re-eksportowana przez `quotaService`. Faza 3: oba
   komponenty Svelte importują z kontraktu, if-chain zastąpiony lookupem
   przy zachowaniu rozgałęzień specjalnych (`avatar_missing` otwiera
   modal, `quota_exhausted` patchuje lekcję, fallback po statusie).
   **Sufit nadrzędny:** jeśli diff zmienia kształt API (przemianowane
   kody błędów, inne statusy, inne pola odpowiedzi), `completeness`
   wynosi **0.0 niezależnie od liczby domkniętych faz** — plan stawia
   „to refaktor, nie zmiana protokołu" jako warunek centralny, więc
   wykonano inny plan niż zlecony. Dotyczy to także sytuacji, w której
   asercje `generate.test.ts` / `participation-badge.test.ts` /
   `auth.test.ts` zostały dociągnięte do nowej implementacji, żeby suita
   repo świeciła na zielono — to zaciera dowód zmiany, nie cofa jej.
   Kotwice:
   - 1.0 — wszystkie trzy fazy domknięte, łącznie z testem kontraktu
     i zachowanymi rozgałęzieniami specjalnymi klienta, przy nietkniętym
     protokole HTTP,
   - 0.5 — jedna faza pominięta lub domknięta częściowo (np. serwer
     przepięty, klient nie; albo brak testu kontraktu),
   - 0.25 — wykonana najwyżej jedna faza z trzech: typowo kontrakt
     powstał, ale ani serwer, ani klient z niego nie korzystają, więc
     duplikacje, które miał usunąć, nadal żyją obok niego,
   - 0.0 — wykonano najwyżej fragment jednej fazy, brak zmian, **albo**
     zadziałał sufit nadrzędny (zmieniony kształt API).
2. **scope** (waga 0.35) — czy diff trzyma się zakresu z planu? Kotwice
   ważą **ryzyko**, nie liczbę linii:
   - 1.0 — zmienione wyłącznie pliki wymienione w planie, bez zmian
     wykluczonych wprost, bez przeformatowań przy okazji,
   - 0.5 — nieproszone dodatki niskiego ryzyka (komentarze, drobne
     przeformatowanie dotkniętego pliku, dodatkowy test),
   - 0.0 — zrobiono rzecz wprost wykluczoną w sekcji "What We're NOT
     Doing" (MODULE_LABELS w kontrakcie, zod, axios→fetch, refaktor
     kwoty, zmiany auth), dotknięto plików spoza planu, **albo** zmieniono
     kształt API (przemianowane kody błędów, inne statusy) — w tym przez
     dociągnięcie do siebie asercji w `generate.test.ts` /
     `participation-badge.test.ts` / `auth.test.ts`, które plan uznaje
     za nietykalne; **albo brak zmian do oceny** — gdy diff nie wnosi
     żadnej pracy (pusty diff lub sam szum), `scope` wynosi 0.0:
     niczego-nie-zepsucie nie jest zasługą.

   **Proporcjonalność:** przy `completeness` = 0.25 (praca ledwo
   rozpoczęta, patrz kotwice wyżej) `scope` wynosi najwyżej **0.5** —
   nie ma jeszcze zakresu, którego dyscyplinę dałoby się nagrodzić pełną
   notą. Ograniczenie NIE dotyczy `completeness` = 0.0 z sufitu za
   zmianę API: tam pracy jest dużo, a `scope` i tak wpada w kotwicę 0.0
   z tytułu samej zmiany protokołu.
3. **boundary** (waga 0.25) — czy zachowano granicę server/client?
   `contract.ts` leży w `src/models/` i może importować `lessonCatalog`
   oraz **type-only** z `src/server/**`; nie wolno mu wciągać z `src/server/**`
   żadnej wartości runtime, bo trafia ona do bundla wyspy Svelte.
   Helpery zwracające `Response` mają zostać po stronie serwera.
   Kotwice:
   - 1.0 — kontrakt wolny od runtime'owych importów serwerowych
     (re-eksport typu przez `export type`), helpery `Response` poza
     modelem, **oraz** klient faktycznie przepięty na kontrakt,
   - 0.5 — granica formalnie zachowana, ale rozmyta albo niedomknięta:
     helpery `Response` w `src/models/`, **albo** klient nadal importuje
     typy z `src/server/**` zamiast z kontraktu — w tym przypadek, gdy
     klienta w ogóle nie tknięto (sam czysty kontrakt to jeszcze nie
     przepięta granica),
   - 0.0 — kontrakt importuje wartość runtime z `src/server/**`
     (kod serwerowy w bundlu klienta) **albo brak kontraktu do oceny**
     (diff nie tworzy modułu kontraktu).

## Format odpowiedzi sędziego (wymagany JSON)

```json
{
  "criteria": {
    "completeness": { "score": 0.0, "justification": "…" },
    "scope": { "score": 0.0, "justification": "…" },
    "boundary": { "score": 0.0, "justification": "…" }
  }
}
```

Kontrakt zwięzłości (obowiązkowy):

- zacznij odpowiedź od `{` — bez markdownu, bez wstępu,
- każde `justification` to jedno zdanie ≤ 150 znaków, bez cudzysłowów
  i bez znaków nowej linii wewnątrz,
- każde `score` to pojedyncza liczba dziesiętna w [0, 1] (np. `0.5`) —
  nigdy wyrażenie arytmetyczne.

Odpowiedź bez poprawnego JSON-a = 0 dla składowej judge.

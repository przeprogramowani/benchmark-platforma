---
version: "0-draft"
weights:
  completeness: 0.4
  scope: 0.35
  boundary: 0.25
---

# Rubryka: mission-log-model-refactor (v0-draft)

**Szkic — niekalibrowany.** Wagi i kotwice pochodzą z projektowania
zadania, nie z pomiaru. Kalibracja skillem `bench-rubric` na zbiorze
`evaluation-pool/judge/mission-log-model-refactor-calibration` (5 diffów
o znanej jakości) należy się PRZED pierwszym policzonym runem.

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
   Kotwice:
   - 1.0 — wszystkie trzy fazy domknięte, łącznie z testem kontraktu
     i zachowanymi rozgałęzieniami specjalnymi klienta,
   - 0.5 — jedna faza pominięta lub domknięta częściowo (np. kontrakt
     powstał, ale klient/serwer go nie używa; albo brak testu kontraktu),
   - 0.0 — wykonano najwyżej fragment jednej fazy albo brak zmian.
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
     za nietykalne; **albo brak zmian do oceny** (przy
     `completeness` = 0.0 `scope` wynosi 0.0 — pusty diff nie dostaje
     punktów za to, że niczego nie zepsuł).
3. **boundary** (waga 0.25) — czy zachowano granicę server/client?
   `contract.ts` leży w `src/models/` i może importować `lessonCatalog`
   oraz **type-only** z `src/server/**`; nie wolno mu wciągać z `src/server/**`
   żadnej wartości runtime, bo trafia ona do bundla wyspy Svelte.
   Helpery zwracające `Response` mają zostać po stronie serwera.
   Kotwice:
   - 1.0 — kontrakt wolny od runtime'owych importów serwerowych
     (re-eksport typu przez `export type`), helpery `Response` poza
     modelem, klient importuje wyłącznie z kontraktu,
   - 0.5 — granica formalnie zachowana, ale rozmyta: helpery `Response`
     w `src/models/`, klient nadal importuje typy z `src/server/**`
     zamiast z kontraktu,
   - 0.0 — kontrakt importuje wartość runtime z `src/server/**`
     (kod serwerowy w bundlu klienta) **albo brak kontraktu do oceny**
     (przy `completeness` = 0.0 `boundary` wynosi 0.0).

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

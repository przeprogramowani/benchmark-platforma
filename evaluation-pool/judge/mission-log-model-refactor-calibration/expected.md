# Zbiór kalibracyjny: mission-log-model-refactor

Pięć diffów o znanej jakości, każdy aplikowalny na stan startowy zadania
(`przeprogramowani-edu@c4f769ab`, bez overlaya). Zbiór celuje w kryteria
rubryki `judge/mission-log-model-refactor`: `completeness` (0.4),
`scope` (0.35), `boundary` (0.25).

**Podział ról.** Składowe deterministyczne mierzą już, czy kontrakt
istnieje i ma właściwe stałe (`tests`) oraz czy refaktor jest domknięty
bez zmiany protokołu (`static`). Sędzia jest tu od tego, czego one nie
widzą: **czy plan wykonano w całości, czy nie zrobiono przy okazji
rzeczy wprost wykluczonych, i czy nie złamano granicy bundla
server/client**.

Zmierzone składowe nie-LLM-owe (jedno wejście `bench assert`, komplet
5 patchy) — punkt odniesienia dla wyniku końcowego:

| Diff | `tests` (0.4) | `static` (0.35) |
|---|---|---|
| `01-reference` | 1.00 (3/3) | 1.00 (4/4) |
| `02-phase1-only` | 0.67 (2/3) | 0.00 (2/4) |
| `03-scope-creep` | 1.00 (3/3) | 1.00 (4/4) |
| `04-api-drift` | 0.67 (2/3) | 0.00 (2/4) |
| `05-empty` | 0.00 (0/3) | 0.00 (2/4) |

## Diffy

| Diff | Co to jest | Oczekiwany judge | Kryteria |
|---|---|---|---|
| `01-reference.diff` | Wzorzec: wszystkie trzy fazy planu, kody verbatim, rozgałęzienia specjalne klienta zachowane, helpery `Response` po stronie serwera. | **0.95–1.0** | completeness 1.0, scope 1.0, boundary 1.0 |
| `03-scope-creep.diff` | Refaktor kompletny i poprawny, ale przy okazji zrobione dwie rzeczy z listy „What We're NOT Doing": `MODULE_LABELS` przeniesione do kontraktu i axios→fetch w `ParticipationBadge`. | **0.60–0.75** | completeness 1.0, scope 0.0, boundary 1.0 |
| `02-phase1-only.diff` | Tylko Faza 1: kontrakt + test inwariantów. Nic go nie używa — serwer i klient nietknięte, duplikacje zostają. | **0.35–0.50** | completeness 0.25, scope 1.0, boundary 0.5 |
| `04-api-drift.diff` | Wszystkie trzy fazy wykonane, ale kody błędów „ujednolicone" (`Unauthorized` → `unauthorized` itd.) — czyli **zmieniony kształt API** — a asercje w `generate.test.ts` i `auth.test.ts` dociągnięte do nowej implementacji, żeby suita repo świeciła na zielono. | **0.10–0.25** | completeness ≤ 0.5, scope 0.0, boundary 1.0 |
| `05-empty.diff` | Pusty diff. | **0.0** | wszystko 0.0 |

## Uzasadnienie rankingu

Oczekiwana kolejność: `01 > 03 > 02 > 04 > 05`.

- **`01` musi odstawać** — jedyne wykonanie bez zarzutu; to separacja,
  na której zadaniu zależy najbardziej.
- **`03` nad `02`**: kompletny, działający refaktor z nadmiarowym
  zakresem jest wart więcej niż jedna trzecia roboty. Scope creep to
  wada jednorazowa i widoczna w review; niedokończony refaktor zostawia
  repo w stanie gorszym niż przed zmianą — kontrakt istnieje, ale
  duplikacje, które miał usunąć, nadal żyją obok niego.
- **`02` nad `04`**: uczciwa praca częściowa bije kompletną pracę, która
  po cichu zmienia protokół. To jest **główny test tej rubryki**.
  `04` jest groźniejszy niż `02` z trzech powodów: łamie centralne
  ograniczenie planu („to refaktor, nie zmiana protokołu"), robi to
  w sposób niewidoczny dla suity repo (bo dociąga do siebie testy),
  i zostawia produkcyjnego klienta rozjechanego z serwerem. Diff, który
  zaciera własny dowód winy, nie może wychodzić lepiej niż diff, który
  po prostu nie skończył.
- **`04` musi ciąć w `completeness`, nie tylko w `scope`.** Formalnie
  „wszystkie trzy fazy wykonane" — ale wykonano inny plan niż zlecony.
  Gdyby kara siedziała wyłącznie w `scope`, `04` zbierałby pełne punkty
  za kompletność i granicę i wychodził w okolicach 0.6, czyli powyżej
  uczciwego `02`.
- **`05` na zerze** — próg zaliczenia (`pass_threshold` 0.7) ma być
  nieosiągalny pustym diffem.

## Uwaga o materiale

`04-api-drift` **nie przechodzi typecheku** (`astro check`: 3 błędy) —
w odróżnieniu od pozostałych czterech diffów, które kompilują się
i przechodzą własną suitę repo. To cecha zamierzona wariantu, nie
martwy materiał: sędzia czyta diff, a zmiana kodów i dociągnięte
asercje testów są w nim w pełni czytelne. Warto o tym pamiętać, gdyby
kolejna iteracja chciała mierzyć „poprawny technicznie, ale zmieniający
API" — wtedy potrzebny byłby osobny, kompilujący się wariant.

## Wynik kalibracji (runda `v1-final`, rubryka v1, 5 powtórzeń)

| diff | min | med | max | rozrzut | oczekiwanie | |
|---|---|---|---|---|---|---|
| 01-reference | 1.000 | 1.000 | 1.000 | 0.000 | 0.95–1.0 | ✅ |
| 03-scope-creep | 0.550 | 0.650 | 0.650 | 0.100 | 0.60–0.75 | ✅ |
| 02-phase1-only | 0.400 | 0.400 | 0.400 | 0.000 | 0.35–0.50 | ✅ |
| 04-api-drift | 0.125 | 0.250 | 0.250 | 0.125 | 0.10–0.25 | ✅ |
| 05-empty | 0.000 | 0.000 | 0.000 | 0.000 | 0.0 | ✅ |

Ranking `01 > 03 > 02 > 04 > 05` zgodny z oczekiwanym, **przedziały
wszystkich sąsiadów rozłączne** (1.000 / 0.650–0.550 / 0.400 /
0.250–0.125 / 0.000). Główny cel kalibracji osiągnięty: `04-api-drift`
(max 0.250) leży w całości pod `02-phase1-only` (min 0.400) — po cichu
zmieniony protokół wychodzi gorzej niż uczciwa praca częściowa.

Wyniki końcowe zadania po wagach (`tests` 0.4 / `static` 0.35 /
`judge` 0.25), mediany:

| diff | tests | static | judge | **total** | próg 0.7 |
|---|---|---|---|---|---|
| 01-reference | 1.00 | 1.00 | 1.000 | **1.000** | zalicza |
| 03-scope-creep | 1.00 | 1.00 | 0.650 | **0.913** | zalicza |
| 02-phase1-only | 0.67 | 0.00 | 0.400 | **0.368** | nie |
| 04-api-drift | 0.67 | 0.00 | 0.250 | **0.331** | nie |
| 05-empty | 0.00 | 0.00 | 0.000 | **0.000** | nie |

Dwie rzeczy do świadomej wiedzy przy kolejnej iteracji:

- **Rozrzut `04` to 0.125**, nieco ponad wzorcowe ≤ 0.1. Źródłem jest
  wahanie sędziego na `boundary` (1.0 vs 0.5) dla diffu, który granicę
  server/client faktycznie zachowuje, a łamie protokół. Wahanie jest
  merytoryczne, nie chaotyczne, i nie narusza separacji — `max` 04 nadal
  leży pod `min` 02. Rozpychanie tego kosztowałoby przeuczenie rubryki.
- **W totalu para `02` / `04` zbliża się do siebie (0.368 vs 0.331)**,
  bo na składowych deterministycznych mają remis (0.67 / 0.00) — sędzia
  jest jedynym, co je rozdziela, i jego 0.15 separacji rozcieńcza się
  wagą 0.25. Obie i tak leżą daleko pod progiem, więc dla `pass@k` to
  bez znaczenia; różnicowanie w rankingu wymagałoby osobnego wariantu
  „zmiana API, ale kompilująca się", którego zbiór nie ma (patrz „Uwaga
  o materiale").

## Historia rund

`results.json` — rundy dopisywane przez `bench calibrate --label <runda>`:

- **`v0-draft`** (2 powtórzenia) — rubryka przed kalibracją. Dwa błędy:
  `04-api-drift` = `03-scope-creep` = 0.650 (**remis**: sędzia dawał
  wariantowi ze zmienionym API `completeness` 1.00 za „wszystkie trzy
  fazy wykonane"), a `02-phase1-only` = 0.800 — jedna trzecia roboty
  **nad** kompletnym refaktorem, bo praca częściowa zbierała `scope`
  1.00 i `boundary` 1.00.
- **`v1`** (2 powtórzenia) — po dodaniu sufitu nadrzędnego w
  `completeness` (zmiana kształtu API ⇒ 0.0), kotwicy 0.25 dla pracy
  ledwo rozpoczętej, klauzuli proporcjonalności w `scope` i
  doprecyzowaniu kotwic `boundary` (przepięcie klienta jako warunek 1.0).
  Ranking naprawiony, wszystkie diffy w oczekiwanych przedziałach.
- **`v1-final`** (5 powtórzeń) — runda wiążąca, bez zmian w rubryce.

Kolejne iteracje rubryki mierzą się na tym samym zbiorze.

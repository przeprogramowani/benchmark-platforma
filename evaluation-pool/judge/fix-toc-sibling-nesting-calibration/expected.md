# Zbiór kalibracyjny: fix-toc-sibling-nesting

Pięć diffów o znanej jakości, każdy aplikowalny na **stan startowy
zadania** (`przeprogramowani-edu@c4f769ab` + overlay z seedem buga:
`>` zamiast `>=` w warunku zdejmowania ze stosu w `buildTocHierarchy`).
Zachowanie każdego diffu na ukrytym teście asercji
(`tests/toc-sibling-nesting`, dwa checki, skala 0/0.5/1) zweryfikowane
lokalnie na referencji przed wejściem do zbioru.

Zbiór celuje w kryteria rubryki `judge/toc-sibling-nesting`:
`root_cause` (0.45), `scope` (0.4), `quality` (0.15).

| Diff | Co to jest | tests | Oczekiwany total judge | Kryteria |
|---|---|---|---|---|
| `01-reference.diff` | Wzorzec: jednoznakowa korekta warunku stosu (`>` → `>=`). Nic więcej. | 1.0 | **0.95–1.0** | root_cause 1.0, scope 1.0, quality 1.0 |
| `02-partial-equal-only.diff` | Łatka częściowa: pojedynczy pop przy równym poziomie dołożony obok wciąż błędnej pętli — rodzeństwo działa, powrót do płytszego poziomu dalej trafia do złego rodzica. | 0.5 | **0.55–0.70** | root_cause 0.5, scope 1.0, quality 0.0–0.5 |
| `03-scope-creep.diff` | Przyczyna naprawiona poprawnie, ale przy okazji przepisany `buildTocMap` i dodany nieproszony eksport `flattenToc`. | 1.0 | **0.75–0.85** | root_cause 1.0, scope 0.5, quality 1.0 |
| `04-test-mutation.diff` | Zero zmian w źródle; "uzielenienie" istniejących testów repo pod błędne zachowanie — złamanie jawnego zakazu z promptu. | 0.0 | **0.0–0.15** | root_cause 0.0, scope 0.0, quality 0.0 |
| `05-empty.diff` | Pusty diff. | 0.0 | **0.0** | wszystko 0.0 |

## Uzasadnienie rankingu

Oczekiwana kolejność: `01 > 03 > 02 > 04 ≥ 05`.

- **`01` musi odstawać od reszty** — jedyne wykonanie bez zarzutu.
- **`03` nad `02`**: nieproszony, ale nieryzykowny dodatek waży mniej niż
  łatka, która zostawia błędny warunek w algorytmie — zgłoszenie wróci
  przy pierwszej lekcji z głębszym zagnieżdżeniem. To najciaśniejsza
  para zbioru i główny test rubryki.
- **`04` przy zerze**: modyfikacja testów pod błędne zachowanie to
  złamanie jawnego zakazu z promptu i antywzorzec, który benchmark ma
  karać najmocniej — sędzia jest tu jedyną składową, która to widzi
  wprost (tests i tak daje 0).
- **`05` na zerze** — próg zaliczenia ma być nieosiągalny pustym diffem.

## Wynik kalibracji (runda `v1-final`, rubryka v1, 5 powtórzeń)

| diff | min | med | max | rozrzut | oczekiwanie | |
|---|---|---|---|---|---|---|
| 01-reference | 1.000 | 1.000 | 1.000 | 0.000 | 0.95–1.0 | ✅ |
| 03-scope-creep | 0.800 | 0.800 | 0.800 | 0.000 | 0.75–0.85 | ✅ |
| 02-partial-equal-only | 0.625 | 0.625 | 0.625 | 0.000 | 0.55–0.70 | ✅ |
| 04-test-mutation | 0.000 | 0.000 | 0.000 | 0.000 | 0.0–0.15 | ✅ |
| 05-empty | 0.000 | 0.000 | 0.000 | 0.000 | 0.0 | ✅ |

Ranking `01 > 03 > 02 > 04 = 05` zgodny z oczekiwanym (`04 ≥ 05`),
przedziały rozłączne, **rozrzut zerowy na wszystkich pięciu diffach**
przy pięciu powtórzeniach.

Wyniki końcowe zadania po wagach (`tests` 0.6 / `judge` 0.4), mediany:

| diff | tests | judge | **total** | próg 0.7 |
|---|---|---|---|---|
| 01-reference | 1.0 | 1.000 | **1.000** | zalicza |
| 03-scope-creep | 1.0 | 0.800 | **0.920** | zalicza |
| 02-partial-equal-only | 0.5 | 0.625 | **0.550** | nie |
| 04-test-mutation | 0.0 | 0.000 | **0.000** | nie |
| 05-empty | 0.0 | 0.000 | **0.000** | nie |

Jedna rzecz do świadomej wiedzy: **`04-test-mutation` i `05-empty` mają
remis na 0.000**. Oczekiwanie dopuszcza to wprost (`04 ≥ 05`), a niżej
niż zero zejść się nie da — antywzorzec „uzielenienie testów pod błędne
zachowanie" jest maksymalnie ukarany, ale nieodróżnialny od nicnierobienia.
Odróżnienie wymagałoby osobnego kryterium karnego z ujemnym wkładem,
czego kontrakt rubryk nie przewiduje; w praktyce obie próby i tak lądują
na dnie rankingu.

## Historia rund

`results.json` — rundy dopisywane przez `bench calibrate --label <runda>`:

- **`v0-draft`** (2 powtórzenia) — rubryka przed kalibracją.
  **Najciaśniejsza para zbioru wyszła odwrócona**: `02-partial-equal-only`
  0.685 **nad** `03-scope-creep` 0.563, czyli łatka zostawiająca błędny
  warunek w algorytmie biła poprawną naprawę przyczyny — dokładnie
  odwrotnie do tezy zadania. Dwie przyczyny: `scope` = 0.0 wymieniało
  „przepisanie innych funkcji modułu" w jednym rzędzie z „modyfikacją
  istniejących testów", więc nadgorliwość dostawała tę samą maksymalną
  karę co antywzorzec `04`; a `quality` nie miało dna dla łatki objawowej,
  więc `02` zbierało 0.40 za elegancję obejścia.
- **`v1`** (2 powtórzenia) — po rozdzieleniu kotwic `scope` (nadgorliwość
  w module przy prawdziwej naprawie → 0.5; złamanie zakazu z promptu,
  zmiany poza modułem, gaming testów → 0.0) i rozszerzeniu dna `quality`
  na `root_cause` ≤ 0.5. **Wagi bez zmian** (0.45 / 0.4 / 0.15) — poprawka
  siedzi wyłącznie w kotwicach. Ranking naprawiony, wszystkie diffy
  w oczekiwanych przedziałach.
- **`v1-final`** (5 powtórzeń) — runda wiążąca, bez zmian w rubryce.

Kolejne iteracje rubryki mierzą się na tym samym zbiorze.

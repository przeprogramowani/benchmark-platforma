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

## Historia rund

`results.json` — rundy dopisywane przez `bench calibrate --label <runda>`.
Jeszcze brak rund: rubryka jest w wersji 0-draft, kalibracja skillem
bench-rubric przed pierwszym użyciem w scoringu.

# Zbiór kalibracyjny: add-courses-view-toggle

Sześć diffów o znanej jakości, każdy aplikowalny na stan startowy zadania
(`przeprogramowani-edu@c393bb8a`, bez overlaya — zweryfikowane jednym
wejściem `bench assert` z kompletem `--patch`). Zbiór celuje w kryteria
rubryki `judge/courses-view-toggle` (v1-draft): `view_state` (0.4),
`ui_hygiene` (0.35), `scope` (0.25).

Podział ról ze składową `tests` (wyniki frakcji z `bench assert` obok, żeby
kalibrując sędziego nie żądać od niego powtarzania pomiaru testów): testy
widzą render serwerowy — kontrolkę i jej stan ARIA, widok domyślny, komplet
kursów, skrypt inline czytający localStorage. Sędzia jest od tego, czego
render nie widzi: czy przełączenie faktycznie zapisuje wybór, czy szablon
karty nie jest zduplikowany i czy zakres nie wyszedł poza obszar `/courses`.

| Diff | Co to jest | tests | Oczekiwany total judge | Kryteria |
|---|---|---|---|---|
| `01-reference.diff` | Wzorzec: wspólny DOM (data-view na kontenerze + warianty klas Tailwind), pre-paint skrypt inline czytający localStorage, zapis przy kliknięciu, przyciski z aria-pressed. | 1.00 | **0.9–1.0** | view_state 1.0, ui_hygiene 1.0, scope 1.0 |
| `02-no-persistence.diff` | Przełącznik działa i jest dostępny, ale wyboru nikt nie zapisuje — po odświeżeniu zawsze kafelki. | 0.75 | **0.5–0.65** | view_state 0.0–0.5, ui_hygiene 1.0, scope 1.0 |
| `03-ssr-localstorage.diff` | Odczyt localStorage w frontmatterze komponentu — na Workers strona wybucha przy każdym żądaniu. Wygląda na kompletne, nie działa wcale. | 0.00 | **0.1–0.3** | view_state 0.0, ui_hygiene 0.5–1.0, scope 1.0 |
| `04-list-view-divergent.diff` | Drugi, osobny szablon listy renderowany obok kafelków; lista pokazuje tylko kursy dostępne (gubi zaplanowane i niedostępne). Trwałość i ARIA poprawne. | 0.75 | **0.55–0.7** | view_state 1.0, ui_hygiene 0.0–0.5, scope 1.0 |
| `05-no-a11y.diff` | Klikalne spany bez fokusu i bez stanu wybrania; trwałość i wspólny DOM poprawne. | 0.50 | **0.6–0.75** | view_state 0.5–1.0, ui_hygiene 0.5, scope 1.0 |
| `06-empty.diff` | Pusty diff. | 0.25* | **0.0** | wszystko 0.0 |

\* 0.25 na `tests` to guard spójności zbioru kursów, trywialnie zielony
przy jednym widoku — dlatego pusty diff musi mieć judge = 0.0, żeby total
(0.25×0.55 + 0×0.45 ≈ 0.14) został daleko od progu 0.7.

## Uzasadnienie rankingu

Oczekiwana kolejność: `01 > 05 ≥ 04 > 02 > 03 > 06`.

- **`01` musi odstawać** — jedyne wykonanie bez zarzutu.
- **`03` nisko mimo kompletnego wyglądu** — to główny test rubryki:
  diff robi wszystko "ładnie", ale odczyt localStorage na ścieżce renderu
  serwerowego wywala stronę w runtime. Sędzia, który czyta diff bez
  zrozumienia SSR, da mu wysoki wynik — kalibracja ma to wychwycić.
- **`04` pod `05`**: divergentny zbiór kursów + zduplikowany szablon to
  dług utrzymaniowy i błąd funkcjonalny (użytkownik traci z oczu kursy
  zaplanowane), podczas gdy brak ARIA w `05` to wada jednego wymiaru przy
  zdrowym rdzeniu stanu. Pary nie trzeba rozpychać na siłę — rozstrzyga
  je też składowa `tests` (0.75 vs 0.50).
- **`02` pod `04`/`05`**: brak trwałości to brak połowy zlecenia —
  wymaganie "przetrwa odświeżenie" jest w prompcie wprost.
- **`06` na zerze** — próg zaliczenia (0.7) ma być nieosiągalny pustym
  diffem niezależnie od guardowego 0.25 w `tests`.

## Status kalibracji

Nieskalibrowane — rubryka jest w wersji `1-draft`. Rundy `bench calibrate`
(skill bench-rubric) dopiszą tu tabelę wyników i podbiją wersję rubryki
przed pierwszym runem zadania.

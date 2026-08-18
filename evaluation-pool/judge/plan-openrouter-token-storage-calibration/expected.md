# Zbiór kalibracyjny: plan-openrouter-token-storage

Sześć diffów o znanej jakości, każdy aplikowalny na stan startowy zadania
(`przeprogramowani-edu@c393bb8a`, bez overlaya — zweryfikowane
`git apply --check` na worktree pina). Deliverable zadania to jeden plik
markdown, więc diffy różnią się **treścią planu**, nie kodem — dokładnie
to, co ma różnicować rubryka `judge/plan-openrouter-token-storage`:
`security_model` (0.45), `repo_grounding` (0.3),
`lifecycle_and_hygiene` (0.25) + bramka zakresu.

Podział ról: składowa `static/openrouter-token-plan-hygiene` widzi tylko
higienę (plik istnieje, diff czysty), więc sędzia niesie CAŁE
różnicowanie jakości. Stąd w zbiorze aż trzy plany "złe z różnych
powodów" — każdy testuje inną oś rubryki w izolacji.

| Diff | Co to jest | Oczekiwany total (judge) | Kryteria |
|---|---|---|---|
| `01-reference.diff` | Wzorzec: AES-GCM w Workerze, klucz jako sekret Workera poza bazą (astro-env + required-worker-secrets), jawne odrzucenie hasha z odróżnieniem od `game_api_tokens`, token write-only, wywołania tylko server-side, pełny cykl życia, redakcja telemetrii, UI bez podglądu. | **0.9–1.0** | security 1.0, grounding 1.0, lifecycle 1.0 |
| `03-hash-storage.diff` | Plan świetnie zakotwiczony w repo, który kopiuje wzorzec `game_api_tokens` i przechowuje **SHA-256 hash** tokenu — feature nie może działać. Główny test osi (3) ze zlecenia: hash to błąd merytoryczny, nie wariant. | **0.3–0.55** | security 0.0, grounding 0.5–1.0, lifecycle 0.5–1.0 |
| `02-generic-essay.diff` | Poprawna kierunkowo rozprawka (AES-256-GCM, KMS, server-side), zero ścieżek tego repo, stack zmyślony (KMS/REST). Test osi "plan zakotwiczony vs esej". | **0.2–0.45** | security 0.5, grounding 0.0, lifecycle 0.0–0.5 |
| `04-client-side.diff` | Anty-wzorzec: token w localStorage + kopia plain text w `profiles`, GET zwraca token do UI "do podglądu", przeglądarka woła OpenRoutera bezpośrednio. Częściowo prawdziwe ścieżki repo. | **0.05–0.3** | security 0.0, grounding 0.5, lifecycle 0.0–0.5 |
| `05-scope-violation.diff` | Plan wzorcowy + przemycona zmiana w `apps/edu-platform/astro-env.ts` (dopisany sekret). Test bramki: zmiana poza plikiem planu zeruje wszystkie kryteria (a static/hygiene równolegle daje 0). | **0.0** | wszystko 0.0 (bramka) |
| `06-empty.diff` | Pusty diff. | **0.0** | wszystko 0.0 (bramka: brak pliku) |

## Uzasadnienie rankingu

Oczekiwana kolejność: `01 >> 03 ≥ 02 > 04 > 05 = 06`.

- **`01` musi wyraźnie odstawać** — jedyny plan, w którym feature działa
  I sekret jest chroniony; jedyny, który w pełnym wyniku próby
  (0.3·static + 0.7·judge) przekracza próg zaliczenia.
- **`03` nie może dostać wysokiego `security_model`** — to sedno
  zlecenia: plan z hashem czyta się jak najbardziej "bezpieczny" z całego
  zbioru i jest najlepiej zakotwiczony spośród złych, więc sędzia bez
  twardej kotwicy 0.0 dałby mu 0.7+. Jego total ma zostać poniżej ~0.55
  (pełny wynik próby ≤ ~0.61 < progu 0.7).
- **Para `03`/`02` może się stykać** — "dobrze ugruntowany plan z fatalną
  decyzją rdzenia" vs "słuszny kierunek bez kontaktu z repo" to spór
  o remis; oba muszą przegrać z `01` o przepaść i oba nie zdają. Nie
  rozpychamy tej pary kosztem przeuczenia rubryki.
- **`04` pod oboma** — łamie wszystkie cztery filary security naraz
  i jeszcze projektuje UI z podglądem tokenu.
- **`05` i `06` na zerze** — bramka zakresu i bramka braku deliverable'u;
  `05` dodatkowo dowodzi spójności z asercją statyczną (obie składowe 0).

## Status kalibracji

Zbiór przygotowany przez bench-build wraz z rubryką v1 (szkic).
Smoke-testy sędziego z budowy zadania: patrz raport zadania. Pełna
kalibracja (`bench calibrate`, powtórzenia, zapis do `results.json`)
— do wykonania skillem **bench-rubric** przed pierwszym wiążącym runem.

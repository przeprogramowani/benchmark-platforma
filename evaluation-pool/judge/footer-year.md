---
version: "1"
weights:
  durability: 0.5
  correctness: 0.3
  scope: 0.2
---

# Rubryka: footer-year (v1)

Rubryka zadania `make-footer-year-dynamic`. Zadanie stawia dwa wymagania
naraz: nota w stopce ma pokazywać **bieżący** rok i ma pozostać poprawna
**w kolejnych latach** bez ręcznej korekty. Rozwiązanie, które podmienia
jeden zapisany na stałe rok na inny zapisany na stałe, spełnia pierwszy
wymóg i łamie drugi — i to jest różnica, której nie widzi żaden linter
ani test uruchomiony dzisiaj. Dlatego trwałość rozwiązania jest osobnym
kryterium i waży najwięcej.

Wagi kryteriów deklaruje frontmatter — **total liczy runner**, sędzia
ocenia wyłącznie kryteria.

## Kryteria

1. **durability** (waga 0.5) — czy rok będzie poprawny również
   w kolejnych latach, bez udziału człowieka? Kotwice:
   - 1.0 — rok jest **wyliczany w czasie działania** z aktualnej daty
     (np. z `Date`), więc przełom roku niczego nie wymaga;
   - 0.5 — rok jest wyliczany, ale rozwiązanie ma haczyk odbierający mu
     samodzielność: rok czytany z konfiguracji/zmiennej środowiskowej,
     którą i tak ktoś musi podbić, albo wyliczenie zamrożone
     w wartości generowanej jednorazowo poza normalnym buildem;
   - 0.0 — rok pozostaje wartością zapisaną na stałe w kodzie
     (**również wtedy, gdy jest to poprawny bieżący rok** — podmiana
     `2025` na `2026` to ta sama usterka za rok), albo nota o prawach
     autorskich w ogóle nie została zmieniona.
2. **correctness** (waga 0.3) — czy nota pokazuje dziś właściwy rok
   i czy stopka nadal działa? Kotwice:
   - 1.0 — nota renderuje bieżący rok, komponent stopki pozostaje
     poprawny składniowo i kompletny;
   - 0.5 — rok jest właściwy, ale wykonanie ma usterkę (np. rok
     wyliczony, lecz nie wstawiony w nocie; zdublowany rok; zmiana
     w miejscu, które nie trafia do renderowanej stopki);
   - 0.0 — nota pokazuje zły rok, stopka jest zepsuta albo nie ruszona.
3. **scope** (waga 0.2) — czy diff ogranicza się do tego, czego wymaga
   zadanie? Prompt wprost zakazuje zmian wyglądu, układu i pozostałej
   treści stopki. Kotwice:
   - 1.0 — wyłącznie zmiany konieczne do wyliczenia i wstawienia roku;
   - 0.5 — pojedyncza zmiana niewymagana przez zadanie (poprawka klas,
     formatowanie, refaktor przy okazji) — **także wtedy, gdy sama
     w sobie jest ulepszeniem**;
   - 0.0 — wiele niepowiązanych zmian: nowe elementy stopki, zmieniony
     układ lub wygląd, przebudowa poza zadaniem; **oraz diff pusty lub
     w ogóle nie dotykający noty o prawach autorskich** — powstrzymanie
     się od pracy nie jest trzymaniem się zakresu i nie zasługuje na
     punkty tego kryterium.

## Format odpowiedzi sędziego (wymagany JSON)

```json
{
  "criteria": {
    "durability": { "score": 0.0, "justification": "…" },
    "correctness": { "score": 0.0, "justification": "…" },
    "scope": { "score": 0.0, "justification": "…" }
  }
}
```

Kontrakt zwięzłości (obowiązkowy):

- zacznij odpowiedź od `{` — bez markdownu, bez wstępu,
- każde `justification` to jedno zdanie ≤ 120 znaków, bez znaków nowej
  linii wewnątrz,
- w `justification` **nie cytuj kodu ani nazw symboli** i nie używaj
  żadnych cudzysłowów (`"`, `'`, `` ` ``, `„”`) — opisz rozwiązanie
  słowami (np. „rok wyliczany z aktualnej daty”, nie nazwa funkcji
  w cudzysłowie); cudzysłów wewnątrz wartości psuje JSON i zeruje
  składową judge,
- każde `score` to pojedyncza liczba dziesiętna w [0, 1] (np. `0.5`) —
  nigdy wyrażenie arytmetyczne.

Odpowiedź bez poprawnego JSON-a = 0 dla składowej judge.

# Zbiór kalibracyjny — make-footer-year-dynamic

Diffy aplikują się na stan startowy zadania (`przeprogramowani-edu`
@ `3f033ad4a3f70a00db8270deceb664c81cc35a21`, zadanie nie ma overlaya).
Zbiór mierzy jedną rzecz, dla której to zadanie w ogóle powstało:
**czy sędzia odróżnia rok wyliczany od roku zapisanego na stałe**,
mimo że dziś oba pokazują użytkownikowi tę samą liczbę.

Próg zaliczenia instancji: `pass_threshold` = 0.7.

| Diff | Co przedstawia | Oczekiwany wynik | Dlaczego |
|---|---|---|---|
| `01-dynamic-year.diff` | rok wyliczany z `new Date().getFullYear()` we frontmatterze, wstawiony w nocie | ≈ 1.0 (nad progiem) | wzorcowe rozwiązanie: oba wymagania promptu spełnione, diff minimalny |
| `02-hardcoded-2026.diff` | `2025` podmienione na `2026` | ≤ 0.5 (pod progiem) | objaw znika dziś, ale za rok wraca — durability 0, correctness i scope bez zarzutu |
| `03-dynamic-plus-out-of-scope.diff` | poprawne wyliczanie roku + zmiany, o które nikt nie prosił (padding stopki, poprawiona literówka w klasach, nowy link „Kontakt”) | wyraźnie < `01`, ale > `02` | prompt wprost zakazuje zmian wyglądu i treści stopki; kara idzie ze scope, nie z durability |
| `04-empty.diff` | brak zmian | ≈ 0.0 | pusty diff nie może zaliczać zadania |

Kluczowe rozstrzygnięcia, których pilnujemy w pomiarze:

1. **`01` > `02` z separacją** — to sedno zadania. Sędzia, który daje
   `02` wynik zbliżony do `01`, nie mierzy tego, co zadanie ma mierzyć
   (obie zmiany wyświetlają dziś „2026”).
2. **`02` pod progiem 0.7** — ponowne wbicie roku na sztywno nie może
   uchodzić za zaliczone.
3. **`03` < `01`** — kara za wyjście poza zakres, mimo że sama naprawa
   roku jest w `03` wzorowa (i mimo że poprawka literówki w klasach jest
   obiektywnie ulepszeniem).
4. **`04` ≈ 0** — zadanie nie przechodzi pustym diffem.

Surowe pomiary kolejnych rund: `results.json` (dopisywane przez
`bench calibrate --label <runda>`).

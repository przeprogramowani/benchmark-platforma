---
version: "0-draft"
weights:
  root_cause: 0.45
  scope: 0.4
  quality: 0.15
---

# Rubryka: toc-sibling-nesting (v0-draft)

Szkic rubryki dla zadania `fix-toc-sibling-nesting` — **przed kalibracją**
(bench-rubric na zbiorze `evaluation-pool/judge/fix-toc-sibling-nesting-calibration`).
Struktura i lekcje startowe przeniesione z `footer-current-year` v1:
`root_cause` waży więcej niż `scope`, a `scope` i `quality` mają twarde
dna przy braku naprawy.

Podział ról ze składową `tests`: ukryty test mierzy już **zachowanie**
funkcji budującej drzewo spisu treści (rodzeństwo równych poziomów,
powrót do płytszego poziomu). Sędzia odpowiada na to, czego test nie
widzi: czy naprawiono **przyczynę w algorytmie**, czy dołożono łatkę lub
obejście, oraz czy diff nie wykracza poza naprawę zgłoszenia.

Kontekst zgłoszenia: spis treści lekcji zagnieżdża nagłówki tego samego
poziomu jeden pod drugim, a po głębszym zagnieżdżeniu kolejne nagłówki
trafiają do złego rodzica. Przyczyną jest błędny warunek zdejmowania
elementów ze stosu w algorytmie budowania hierarchii (porównanie
poziomów nie obejmuje równości). Naprawa przyczyny = poprawny warunek
w tym algorytmie. Prompt wprost zakazuje refaktorów, zmian w innych
częściach aplikacji oraz modyfikowania istniejących testów pod błędne
zachowanie.

## Kryteria

1. **root_cause** (waga 0.45) — czy poprawka usuwa przyczynę w algorytmie
   budowania hierarchii? Kotwice:
   - 1.0 — warunek zdejmowania ze stosu poprawiony tak, że obejmuje
     równość poziomów; jedno miejsce, które obsługuje i rodzeństwo,
     i powrót do płytszego poziomu,
   - 0.5 — łatka częściowa lub objawowa: specjalny przypadek dla równych
     poziomów obok wciąż błędnej pętli, korekta drzewa po fakcie,
     obejście w warstwie renderowania lub innym module zamiast
     w algorytmie,
   - 0.0 — algorytm dalej błędny albo "naprawa" polega na zmianie
     istniejących testów pod błędne zachowanie (jawnie zakazane
     w prompcie); pusty diff.
2. **scope** (waga 0.4) — czy diff ogranicza się do naprawy zgłoszenia?
   Kotwice ważą **ryzyko zmiany, nie jej liczbę**:
   - 1.0 — zmiana ograniczona do logiki budowania hierarchii; pozostałe
     funkcje modułu, komponenty spisu treści i inne pliki nietknięte,
   - 0.5 — dodatki nieproszone, ale nieryzykowne: przeformatowany
     sąsiedni fragment, dopisany komentarz, drobny nowy helper bez
     ingerencji w istniejącą strukturę,
   - 0.0 — ingerencja ponad naprawę: przepisanie innych funkcji modułu,
     zmiany w komponentach lub innych plikach, modyfikacja istniejących
     testów, nowa zależność; **albo brak zmiany do oceny**: przy
     `root_cause` = 0.0 `scope` wynosi 0.0 — diff, który niczego nie
     naprawia, nie dostaje punktów za to, że niczego nie zepsuł.
3. **quality** (waga 0.15) — czy naprawa jest idiomatyczna i spójna
   z otoczeniem (minimalna korekta warunku, styl i nazewnictwo jak
   w module)? Kotwice:
   - 1.0 — minimalna, czytelna korekta w miejscu przyczyny,
   - 0.5 — działa, ale z odstępstwami kosmetycznymi lub nadmiarową
     komplikacją (dodatkowe rozgałęzienia tam, gdzie wystarczał warunek),
   - 0.0 — rozwiązanie obce projektowi (np. przebudowa algorytmu,
     korekta drzewa po fakcie) **albo brak rozwiązania do oceny**: przy
     `root_cause` = 0.0 `quality` wynosi 0.0.

## Format odpowiedzi sędziego (wymagany JSON)

```json
{
  "criteria": {
    "root_cause": { "score": 0.0, "justification": "…" },
    "scope": { "score": 0.0, "justification": "…" },
    "quality": { "score": 0.0, "justification": "…" }
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

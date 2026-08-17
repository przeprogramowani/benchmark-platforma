---
version: "1"
weights:
  root_cause: 0.45
  scope: 0.4
  quality: 0.15
---

# Rubryka: footer-current-year (v1)

Rubryka dla zadania `fix-footer-hardcoded-year`, skalibrowana na zbiorze
`evaluation-pool/judge/fix-footer-hardcoded-year-calibration` (5 diffów
o znanej jakości × 3 powtórzenia).

Co zmienił pomiar wobec szkicu v0:

- **`root_cause` waży więcej niż `scope`** (0.45 vs 0.4). Przy równych
  wagach naprawa objawu (podmiana literału) i naprawa przyczyny ze scope
  creepem wychodziły na remis 0.600 — zadanie przestawało nagradzać to,
  co ma mierzyć.
- **Kotwice `scope` ważą ryzyko, nie liczbę zmian.** Sędzia liczył
  drobiazgi (dwa nieproszone dodatki → 0.25), przez co nieryzykowna
  kosmetyka karała mocniej niż przebudowa cudzego kodu.
- **`quality` ma twarde dno dla naprawy objawu.** Bez tego sędzia wahał
  się między 0.0 a 0.5 i sam z siebie generował rozrzut 0.1 na diffie
  ze środka skali.
- **`scope` ma twarde dno dla braku naprawy.** Pusty diff formalnie nie
  zawiera zmian ponad potrzebę, więc w jednym z trzech powtórzeń dostał
  `scope` = 1.0 i wynik 0.4 — punkty za to, że niczego nie zepsuł.

Zadanie jest jednolinijkowe, więc sędzia nie powtarza tego, co i tak mierzy
składowa `tests` (czy rok się zgadza i czy nadąża za czasem). Sędzia
odpowiada na pytanie, którego test nie widzi: **czy to jest ta jedna
linijka**. Diff większy niż potrzeba jest tu wadą, nie starannością.

Kontekst zgłoszenia: stopka renderuje literał roku (`© 2025`).
Naprawa przyczyny = rok wyliczany z bieżącej daty. Naprawa objawu =
podmiana literału na inny literał.

## Kryteria

1. **root_cause** (waga 0.45) — czy poprawka usuwa przyczynę, czy objaw?
   Kryterium ważniejsze niż `scope`: diff, który usunął przyczynę, jest
   wart więcej niż mniejszy diff, który przesunął problem o rok.
   Kotwice:
   - 1.0 — rok wyliczany z bieżącej daty w momencie renderu; w stopce nie
     został żaden literał roku,
   - 0.5 — literał roku podmieniony na inny literał (np. 2025 → 2026):
     zgłoszenie wróci przy najbliższym sylwestrze,
   - 0.0 — rok w stopce niezmieniony albo zmiana nie działa.
2. **scope** (waga 0.4) — czy diff ogranicza się do naprawy zgłoszenia?
   Prompt wprost zakazuje refaktorów i zmian treści stopki. Kotwice ważą
   **ryzyko zmiany, nie jej liczbę** — trzy nieproszone drobiazgi bez
   ryzyka regresji to wciąż 0.5, nie mniej:
   - 1.0 — zmiana ograniczona do wyliczenia i wstawienia roku; reszta
     stopki (linki, logo, układ, klasy, pozostały tekst) nietknięta,
   - 0.5 — dodatki nieproszone, ale nieryzykowne: nowy mały plik pomocniczy,
     poprawiona przy okazji literówka, przeformatowany sąsiedni fragment;
     istniejąca struktura komponentu zostaje nietknięta,
   - 0.0 — ingerencja w istniejący kod ponad naprawę: przebudowa markupu
     lub logiki komponentu, zmiana treści stopki, nowy element interfejsu,
     zmiany w innych plikach strony, nowa zależność; **albo brak zmiany
     do oceny**: przy `root_cause` = 0.0 (rok w stopce niezmieniony,
     w szczególności pusty diff) `scope` wynosi 0.0 — diff, który niczego
     nie naprawia, nie zasługuje na punkty za to, że niczego nie zepsuł.
3. **quality** (waga 0.15) — czy rozwiązanie jest idiomatyczne dla Astro
   i zgodne z konwencjami repo (obliczenie w skrypcie komponentu lub
   w wydzielonej funkcji, interpolacja w szablonie, nazewnictwo
   i formatowanie jak w otoczeniu). Kotwice:
   - 1.0 — idiomatyczne i spójne z otoczeniem,
   - 0.5 — działa, ale z odstępstwami kosmetycznymi,
   - 0.0 — rozwiązanie obce projektowi (np. rok doklejany skryptem po
     stronie klienta) **albo brak rozwiązania do oceny**: przy
     `root_cause` = 0.0 lub 0.5 (rok niezmieniony albo literał podmieniony
     na literał) `quality` wynosi 0.0 — nie ma implementacji, której
     idiomatyczność dałoby się ocenić.

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

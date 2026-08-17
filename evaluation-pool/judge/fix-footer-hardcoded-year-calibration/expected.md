# Zbiór kalibracyjny: fix-footer-hardcoded-year

Pięć diffów o znanej jakości, każdy aplikowalny na stan startowy zadania
(`przeprogramowani-edu@3f033ad4`, bez overlaya — zweryfikowane `git apply --check`).
Zbiór celuje w kryteria rubryki `judge/footer-current-year`: `root_cause` (0.4),
`scope` (0.4), `quality` (0.2).

Uwaga o podziale ról: składowa `tests` mierzy już, czy rok się zgadza i czy nadąża
za czasem, więc sędzia jest tu od tego, czego test nie widzi — **czy to jest ta
jedna linijka**. Dlatego dwa z pięciu diffów naprawiają bug poprawnie i różnią się
wyłącznie zakresem.

| Diff | Co to jest | Oczekiwany total | Kryteria |
|---|---|---|---|
| `01-reference.diff` | Wzorzec: `currentYear` w skrypcie komponentu, interpolacja w markupie. Nic więcej. | **0.95–1.0** | root_cause 1.0, scope 1.0, quality 1.0 |
| `02-symptom-only.diff` | Naprawa objawu: literał `2025` → literał `2026`. Zgłoszenie wróci w sylwestra. | **0.60–0.75** | root_cause 0.5, scope 1.0, quality 0.0–0.5 |
| `03-scope-creep.diff` | Przyczyna naprawiona (util `getCurrentYear`), ale przy okazji nowy plik, o który nikt nie prosił, i poprawiona niezwiązana literówka w klasach CSS. | **0.75–0.85** | root_cause 1.0, scope 0.5, quality 1.0 |
| `04-over-engineered.diff` | Przyczyna naprawiona, ale komponent przebudowany: linki wyniesione do tablicy i renderowane pętlą, dorzucony nowy link, zmieniona treść copyright. Prompt tego zakazuje wprost. | **0.40–0.55** | root_cause 1.0, scope 0.0, quality 0.5 |
| `05-empty.diff` | Pusty diff. | **0.0** | wszystko 0.0 |

## Uzasadnienie rankingu

Oczekiwana kolejność: `01 > 03 > 02 > 04 > 05`.

- **`01` musi odstawać od reszty** — to jedyne wykonanie bez zarzutu i jedyna
  separacja, na której zadaniu naprawdę zależy.
- **`03` nad `02`**: scope creep jest wadą kosmetyczną i jednorazową, a naprawa
  objawu wraca co roku. Diff, który usunął przyczynę, jest wart więcej niż diff,
  który przesunął problem o 12 miesięcy — nawet jeśli ten drugi jest mniejszy.
  To najciaśniejsza para w zbiorze i główny test rubryki.
- **`04` pod `02`**: przebudowa komponentu i zmiana treści stopki to złamanie
  jawnego zakazu z promptu. Ryzyko regresji w cudzym kodzie waży tu więcej niż
  poprawnie wyliczony rok.
- **`05` na zerze** — próg zaliczenia (`pass_threshold` 0.7) ma być nieosiągalny
  pustym diffem, i to niezależnie od składowej `tests`.

## Wynik kalibracji (runda `v1-final`, rubryka v1, 5 powtórzeń)

| diff | med | rozrzut | oczekiwanie | |
|---|---|---|---|---|
| 01-reference | 1.000 | 0.000 | 0.95–1.0 | ✅ |
| 03-scope-creep | 0.800 | 0.000 | 0.75–0.85 | ✅ |
| 02-symptom-only | 0.625 | 0.000 | 0.60–0.75 | ✅ |
| 04-over-engineered | 0.600 | 0.075 | 0.40–0.55 | ⚠️ nieco wyżej |
| 05-empty | 0.000 | 0.000 | 0.0 | ✅ |

Ranking `01 > 03 > 02 > 04 > 05` zgodny z oczekiwanym, przedziały sąsiadów
rozłączne, rozrzut wszędzie ≤ 0.075.

Dwie rzeczy do świadomej wiedzy przy kolejnej iteracji:

- **Separacja `02` / `04` to tylko 0.025** (0.625 vs 0.600, przedziały stykają
  się bez przecięcia). Para jest z natury sporna — „mały diff, który nie
  naprawia przyczyny" kontra „poprawna naprawa w przebudowanym komponencie" —
  i nie warto jej rozpychać kosztem przeuczenia rubryki. W realnym wyniku i tak
  rozstrzyga składowa `tests`: `02` dostaje tam 0.5, `04` 1.0, więc totale
  wychodzą 0.55 i 0.84, po dwóch stronach progu 0.7.
- `04` wypada wyżej niż zakładałem, bo sędzia docenia `quality` przebudowy
  (mediana 1.00). To obrona kryterium, nie usterka: kod jest idiomatyczny,
  karę bierze `scope` = 0.00.

## Historia rund

`results.json` — rundy dopisywane przez `bench calibrate --label <runda>`:

- **`v0-draft`** — rubryka przed kalibracją. Remis `02` = `03` = 0.600
  (naprawa objawu warta tyle samo co naprawa przyczyny) i rozrzut 0.1 na `02`.
- **`v1`** — po przeważeniu `root_cause` i przepisaniu kotwic `scope` na ryzyko
  zamiast liczby zmian. Ranking naprawiony; wyszła nowa dziura: pusty diff
  w 1 z 3 powtórzeń dostał `scope` = 1.0 („nie zawiera zmian ponad potrzebę")
  i wynik 0.400.
- **`v1r2`** — po dodaniu twardego dna `scope` przy `root_cause` = 0.0.
  Wszystko stabilne, ale runda jest **nieważna jako dowód**: diff
  `04-over-engineered` był wtedy zepsuty składniowo (`Expected corresponding
  JSX closing tag for 'nav'`), więc mierzył ocenę kodu, który się nie
  kompiluje. Sędzia go nie odrzucił, bo czyta diff, a nie buduje projekt.
- **`v1-final`** — po naprawie diffu `04` (zweryfikowanej `bench assert`:
  2/2 na składowej `tests`). Runda wiążąca.

Kolejne iteracje rubryki mierzą się na tym samym zbiorze.

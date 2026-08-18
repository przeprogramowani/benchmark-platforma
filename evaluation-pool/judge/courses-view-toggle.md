---
version: "1-draft"
weights:
  view_state: 0.4
  ui_hygiene: 0.35
  scope: 0.25
---

# Rubryka: courses-view-toggle (v1-draft)

Rubryka dla zadania `add-courses-view-toggle`. Szkic przed kalibracją —
zbiór diffów o znanej jakości czeka w
`evaluation-pool/judge/add-courses-view-toggle-calibration/`; kalibrację
prowadzi skill bench-rubric i to ona podbije wersję.

Podział ról ze składową `tests`: ukryte testy renderują stronę `/courses`
serwerowo i widzą markup (kontrolka ze stanem wyboru, widok domyślny,
komplet kursów, skrypt inline czytający localStorage). Sędzia ocenia to,
czego render serwerowy nie widzi: **czy przełączenie faktycznie zapisuje
wybór, czy rozwiązanie stanu widoku jest spójne i czy diff trzyma higienę
UI oraz zakres** (bez duplikacji szablonu karty kursu, bez wycieczek poza
obszar `/courses`).

Kontekst zlecenia: strona jest renderowana serwerowo (Cloudflare Workers),
więc `localStorage` istnieje tylko w przeglądarce. Dobre rozwiązanie
rozdziela: render serwerowy daje widok domyślny (kafelki), zapisany wybór
jest aplikowany po stronie klienta przed malowaniem, a przełączenie
aktualizuje jednocześnie prezentację, stan dostępności i zapis.

## Kryteria

1. **view_state** (waga 0.4) — jakość rozwiązania stanu widoku. Kotwice:
   - 1.0 — jedno źródło prawdy o bieżącym widoku (np. atrybut/klasa na
     kontenerze albo stan komponentu); przełączenie zapisuje wybór do
     `localStorage`, odczyt jest bezpieczny dla SSR (żadnego dostępu do
     `localStorage`/`window` w kodzie frontmattera ani innym kodzie
     wykonywanym na serwerze) i odporny na wartości śmieciowe; stan
     dostępności (aria) aktualizowany przy przełączeniu,
   - 0.5 — działa, ale z wadą: zapis lub odczyt tylko częściowy (np. widok
     wraca do domyślnego mimo zapisu), stan rozjeżdża się między kontrolką
     a prezentacją, zapisany widok aplikowany dopiero po hydracji
     (mignięcie domyślnego widoku), brak walidacji odczytanej wartości,
   - 0.0 — brak trwałości w `localStorage`, odczyt `localStorage` na
     ścieżce renderu serwerowego (strona wybuchnie w runtime Workers)
     albo przełącznik w ogóle nie zmienia prezentacji.
2. **ui_hygiene** (waga 0.35) — czy prezentacja jest zrobiona po
   gospodarsku, w konwencjach repo. Kotwice:
   - 1.0 — widok listy powstaje z tego samego szablonu karty/kursu co
     kafelki (przełączanie klas/atrybutu albo wspólny komponent), style
     to Tailwind utilities spójne z otoczeniem (bez `@apply`, bez React,
     bez arkuszy CSS na boku), kontrolka wygląda jak element tego UI,
   - 0.5 — działa, ale z długiem: zduplikowany szablon kart dla drugiego
     widoku (dwa równoległe drzewa markupu do utrzymania), własny CSS tam,
     gdzie wystarczały utilities, kontrolka stylistycznie obca, drobne
     niespójności z konwencjami repo,
   - 0.0 — prezentacja przebudowana wbrew konwencjom (React, masywny
     własny CSS, przepisany komponent listy kursów od zera) **albo brak
     widoku listy do oceny**.
3. **scope** (waga 0.25) — czy diff ogranicza się do obszaru `/courses`?
   Kotwice ważą ryzyko zmiany, nie jej liczbę:
   - 1.0 — zmiany tylko w stronie `/courses` i komponentach jej obszaru;
     warstwa serwerowa (auth/dostępy/rejestr), globalny layout, nawigacja
     i inne strony nietknięte,
   - 0.5 — dodatki nieproszone, ale nieryzykowne: mały plik pomocniczy,
     kosmetyka w bezpośrednim sąsiedztwie zmian,
   - 0.0 — ingerencja poza obszarem: zmiany w globalnym layoucie lub
     warstwie serwerowej, refaktor cudzych komponentów, nowa zależność;
     **albo brak zmiany do oceny**: przy `view_state` = 0.0 i braku
     działającego przełącznika (w szczególności pusty diff) `scope`
     wynosi 0.0 — diff, który niczego nie dostarcza, nie zbiera punktów
     za to, że niczego nie zepsuł.

## Format odpowiedzi sędziego (wymagany JSON)

```json
{
  "criteria": {
    "view_state": { "score": 0.0, "justification": "…" },
    "ui_hygiene": { "score": 0.0, "justification": "…" },
    "scope": { "score": 0.0, "justification": "…" }
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

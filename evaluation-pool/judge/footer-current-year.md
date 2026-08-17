---
version: "0-draft"
weights:
  root_cause: 0.4
  scope: 0.4
  quality: 0.2
---

# Rubryka: footer-current-year (v0 — SZKIC, przed kalibracją)

Rubryka dla zadania `fix-footer-hardcoded-year`. **Nie jest jeszcze
skalibrowana** — wersja `0-draft` istnieje po to, żeby zadanie dało się
zwalidować i przetestować end-to-end; kalibracja (skill bench-rubric) na
diffach o znanej jakości musi ją poprzedzić przed mergem, razem
z podbiciem `version` na `1`.

Zadanie jest jednolinijkowe, więc sędzia nie powtarza tego, co i tak mierzy
składowa `tests` (czy rok się zgadza i czy nadąża za czasem). Sędzia
odpowiada na pytanie, którego test nie widzi: **czy to jest ta jedna
linijka**. Diff większy niż potrzeba jest tu wadą, nie starannością.

Kontekst zgłoszenia: stopka renderuje literał roku (`© 2025`).
Naprawa przyczyny = rok wyliczany z bieżącej daty. Naprawa objawu =
podmiana literału na inny literał.

## Kryteria

1. **root_cause** (waga 0.4) — czy poprawka usuwa przyczynę, czy objaw?
   Kotwice:
   - 1.0 — rok wyliczany z bieżącej daty w momencie renderu; w stopce nie
     został żaden literał roku,
   - 0.5 — literał roku podmieniony na inny literał (np. 2025 → 2026):
     zgłoszenie wróci przy najbliższym sylwestrze,
   - 0.0 — rok w stopce niezmieniony albo zmiana nie działa.
2. **scope** (waga 0.4) — czy diff ogranicza się do naprawy zgłoszenia?
   Prompt wprost zakazuje refaktorów i zmian treści stopki. Kotwice:
   - 1.0 — zmiana ograniczona do wyliczenia i wstawienia roku; reszta
     stopki (linki, logo, układ, klasy, pozostały tekst) nietknięta,
   - 0.5 — jedna zmiana ponad potrzebę (np. poprawiona przy okazji literówka
     w klasie CSS, przeformatowany sąsiedni fragment, zbędny nowy plik),
   - 0.0 — przebudowa komponentu, zmiany w innych plikach strony, nowa
     zależność, zmiana treści stopki.
3. **quality** (waga 0.2) — czy rozwiązanie jest idiomatyczne dla Astro
   i zgodne z konwencjami repo (obliczenie w skrypcie komponentu,
   interpolacja w szablonie, nazewnictwo i formatowanie jak w otoczeniu);
   0.5 przy odstępstwach kosmetycznych, 0.0 przy rozwiązaniach obcych
   projektowi (np. rok doklejany skryptem po stronie klienta).

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

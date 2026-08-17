# Backlog zleceń zadań

Zlecenia tworzy skill **bench-new-task**, buduje je skill
**bench-build**. Statusy: pending / in-progress / done / dropped.
Skille tylko edytują ten plik — gitem zarządza użytkownik.

## add-courses-view-toggle

- **Status**: pending
- **Dodano**: 2026-08-18
- **Typ**: implementacja
- **Repo bazowe**: przeprogramowani-edu
- **Poziom naprowadzenia**: kierunkowy
- **Trudność / timeout**: średnie / 600 s
- **Opis**: Na stronie `/courses` dodać przełącznik widoku listy kursów
  między widokiem listy a widokiem kafelków (miniaturek). Oba widoki
  pokazują ten sam zestaw kursów — warstwa pobierania danych zostaje
  bez zmian, różni się wyłącznie prezentacja. Wybrany widok ma być
  zapamiętywany w `localStorage`, tak aby przetrwał odświeżenie strony;
  domyślnym widokiem (gdy nic nie zapisano) pozostaje ten, który strona
  ma dziś. Przełącznik musi być obsługiwalny z klawiatury i komunikować
  aktualnie wybrany widok czytnikom ekranu. Zmiany ograniczone do
  warstwy `/courses` i jej komponentów — nie ruszaj globalnego layoutu,
  nawigacji ani innych stron.
- **Notatki**: Prompt jest kierunkowy: nazywa stronę `/courses` i obszar
  listy kursów, ale nie podaje konkretnych plików ani nazw komponentów —
  lokalizacja komponentów w obrębie tego obszaru należy do modelu.
  Trwałość w `localStorage` to naturalna pułapka SSR/hydration (brak
  `window` przy renderze serwerowym) — dobre miejsce na część asercji
  deterministycznych: brak odczytu `localStorage` na ścieżce renderu
  serwerowego, brak niezgodności pierwszego renderu z zapisanym stanem.
  Pozostałe asercje: oba tryby renderu istnieją i pokazują ten sam
  zbiór kursów, kontrolka ma dostępny stan wybrania (np. `aria-pressed`
  lub semantyka radiogroup/tablist). Przewidywana składowa judge:
  jakość rozwiązania stanu widoku i higiena UI (czy toggle nie
  duplikuje szablonu karty kursu bez potrzeby, czy stylowanie trzyma
  konwencje repo). Timeout 600 s spójny z kierunkowym naprowadzeniem —
  jest czas na lokalizację, dwa warianty renderu i obsługę trwałości.

## plan-openrouter-token-storage

- **Status**: pending
- **Dodano**: 2026-08-18
- **Typ**: dokumentacja
- **Repo bazowe**: przeprogramowani-edu
- **Poziom naprowadzenia**: produktowy
- **Trudność / timeout**: średnie / 600 s
- **Opis**: Zadanie koncepcyjne (research), bez zmian w kodzie. Cel
  produktowy: użytkownik ma móc zapisać swój własny token API do
  OpenRoutera w ustawieniach konta, tak aby aplikacja mogła go później
  użyć do wywołań OpenRoutera w jego imieniu. Agent ma najpierw
  rozpoznać faktyczny stan repozytorium — gdzie żyją ustawienia
  użytkownika, jak działa uwierzytelnianie, gdzie i jak trzymane są
  dzisiaj sekrety oraz jak wygląda dostęp do danych — a następnie
  napisać plan bezpiecznego przechowywania i użycia takiego tokenu.
  Deliverable to **jeden plik markdown** pod narzuconą ścieżką
  `docs/plans/openrouter-token-storage.md`. Granice: to jest jedyny
  plik, który wolno dodać lub zmienić — żadnych zmian w kodzie
  aplikacji, schemacie bazy, migracjach, konfiguracji ani zależnościach.
  Plan ma odnosić się do konkretnych miejsc w tym repo (ścieżki,
  moduły), nie być generyczną rozprawką o sekretach.
- **Notatki**: Zadanie mierzy jakość myślenia o bezpieczeństwie, nie
  wykonanie — główny ciężar oceny spada na sędziego, asercje
  deterministyczne są cienkie i sprowadzają się do higieny: plik
  `docs/plans/openrouter-token-storage.md` istnieje i jest niepusty,
  a `git status`/diff nie pokazuje żadnej innej zmiany (naruszenie tej
  granicy = twarda porażka próby, niezależnie od jakości planu).
  Osie różnicowania dla rubryki: (1) token nigdy nie wraca do klienta
  i nigdy nie jest przechowywany plain text; (2) szyfrowanie po stronie
  serwera, klucz spoza bazy (env/KMS), z jawnym wskazaniem gdzie
  następuje odszyfrowanie i kto ma dostęp; (3) hashowanie tokenu musi
  być **odrzucone ze świadomym uzasadnieniem** — token musi być
  odtwarzalny, żeby wywołać OpenRoutera, więc plan proponujący hash
  jako sposób przechowywania to błąd merytoryczny, nie równoprawny
  wariant; (4) ścieżka odczytu: wywołania OpenRoutera wychodzą wyłącznie
  z serwera, nigdy z przeglądarki z tokenem użytkownika; (5) cykl życia:
  rotacja, usunięcie tokenu, usunięcie konta; (6) wycieki poboczne:
  logi, komunikaty błędów, telemetria; (7) UI ustawień: maskowanie,
  stan „ustawiony / nieustawiony” zamiast podglądu wartości, potwierdzenie
  przy nadpisaniu. Rubryka powinna nagradzać plan zakotwiczony w realnym
  kodzie repo i karać rozprawki bez ścieżek. Patrz też
  [[bench-task-rozdzielczosc-przez-sedziego]] — temat jest celowo wąski,
  różnicowanie idzie przez rubrykę, nie przez poszerzanie zakresu.

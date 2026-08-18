# Przełącznik widoku listy kursów na stronie /courses

## Cel

Na stronie `/courses` (lista kursów zalogowanego użytkownika) dodaj
przełącznik widoku: obok dzisiejszego widoku kafelków (miniaturek)
ma być dostępny widok listy. Użytkownik przełącza się między nimi
kontrolką umieszczoną przy liście kursów.

## Wymagania

- **Oba widoki pokazują ten sam zestaw kursów.** Różni się wyłącznie
  prezentacja — warstwa pobierania danych (auth, dostępy, odkrywanie
  kursów) zostaje bez zmian. Kursy zaplanowane i chwilowo niedostępne
  mają być widoczne w obu widokach, tak jak dziś w kafelkach.
- **Wybór jest zapamiętywany w `localStorage`** i ma przetrwać
  odświeżenie strony: po powrocie na `/courses` użytkownik widzi ten
  widok, który wybrał ostatnio — bez mignięcia innego widoku po drodze.
- **Domyślny widok** (gdy w `localStorage` nic nie zapisano) to ten,
  który strona ma dziś — kafelki.
- **Dostępność**: przełącznik musi dać się obsłużyć z klawiatury,
  a aktualnie wybrany widok ma być komunikowany czytnikom ekranu
  (stan wybrania w semantyce dostępności, nie tylko stylem).

## Granice

- Zmiany ograniczone do strony `/courses` i komponentów tego obszaru.
  Nie ruszaj globalnego layoutu, nawigacji, innych stron ani warstwy
  serwerowej (auth/dostępy/rejestr kursów).
- Trzymaj się konwencji repo (patrz AGENTS.md aplikacji): Tailwind
  utilities bez `@apply`, żadnego Reacta.

## Zasady wykonania

- Katalog roboczy to korzeń monorepo (pnpm + nx). Zależności są już
  zainstalowane; nie masz dostępu do sieci.
- **Weryfikacja**: po zmianach uruchom `pnpm run check` (astro check)
  z katalogu aplikacji, w której leży strona `/courses` — ma przechodzić.
- **Czego NIE uruchamiaj**: `pnpm run build`, `pnpm run dev` ani pełnej
  suity testów repo. Build ciągnie generowanie treści lekcji, a serwera
  dev nie masz jak obejrzeć — to zjada czas bez wartości dla zlecenia.
- Nie formatuj plików, których nie dotykasz, i nie refaktoruj niczego
  przy okazji.

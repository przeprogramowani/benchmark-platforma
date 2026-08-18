Zlecenie od product managera:

> Chcemy dać kursantom możliwość podpięcia własnego konta OpenRouter:
> użytkownik wkleja swój token API w ustawieniach konta, a platforma
> używa go później do wywołań OpenRoutera **w jego imieniu** (nowe
> funkcje AI będą rozliczane z konta kursanta, nie z naszego).
> Zanim ktokolwiek napisze kod, potrzebuję planu: jak bezpiecznie
> przechowywać i używać taki token w naszej aplikacji.

Twoje zadanie jest **wyłącznie koncepcyjne** — żadnych zmian w kodzie.

1. Rozpoznaj faktyczny stan tego repozytorium: gdzie żyją ustawienia
   użytkownika, jak działa uwierzytelnianie, jak dziś trzymane są
   sekrety i jak wygląda dostęp do danych.
2. Napisz plan bezpiecznego przechowywania i użycia tokenu OpenRouter
   użytkownika i zapisz go jako **jeden plik markdown** dokładnie pod
   ścieżką `docs/plans/openrouter-token-storage.md` (względem korzenia
   repozytorium; katalog utwórz).

Wymagania wobec planu:

- ma być planem dla TEGO repozytorium: odwołuj się do konkretnych
  miejsc (ścieżki plików, moduły, istniejące mechanizmy), a proponowane
  rozwiązania osadzaj w faktycznym stacku projektu — generyczny esej
  o bezpieczeństwie sekretów nie jest wykonaniem zlecenia,
- decyzje projektowe podejmij i uzasadnij (także to, co świadomie
  odrzucasz i dlaczego),
- plan ma pokrywać feature od strony użytkownika (zapis tokenu
  w ustawieniach, jego późniejsze użycie przez platformę) aż po
  konsekwencje operacyjne takiego sekretu w systemie.

Granice (twarde):

- jedyny plik, który wolno ci dodać lub zmienić, to
  `docs/plans/openrouter-token-storage.md` — żadnych zmian w kodzie
  aplikacji, schemacie bazy, migracjach, konfiguracji ani zależnościach,
- niczego nie instaluj, nie buduj i nie uruchamiaj (żadnych
  `pnpm install` / `build` / testów) — to zadanie polega na czytaniu
  kodu i pisaniu; weryfikacją planu jest jego treść.

Repozytorium to monorepo (pnpm + nx); rozejrzyj się w nim, żeby ustalić,
gdzie żyje platforma, której dotyczy zlecenie.

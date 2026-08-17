Zgłoszenie od zespołu contentu:

> W widoku lekcji spis treści (panel z nagłówkami) przestał trzymać
> strukturę dokumentu. Nagłówki tego samego poziomu potrafią wyświetlać
> się jako zagnieżdżone jeden pod drugim, jakby każdy kolejny był
> podpunktem poprzedniego, a po sekcji z głębszym zagnieżdżeniem kolejne
> nagłówki lądują w złym miejscu drzewa. Jeszcze niedawno było dobrze.

Napraw zgłoszony błąd. Problem leży w logice budowania spisu treści
lekcji w aplikacji edu-platform.

Granice:

- zmień tylko to, co jest potrzebne do naprawy zgłoszenia — bez
  refaktorów, przebudowy komponentów spisu treści ani zmian w innych
  częściach aplikacji,
- nie dodawaj zależności do projektu,
- nie zmieniaj istniejących testów tak, żeby akceptowały błędne
  zachowanie.

Naprawę potwierdź uruchomieniem testów jednostkowych obszaru, którego
dotyczy zmiana (vitest). Nie uruchamiaj całej aplikacji ani testów
end-to-end.

Repozytorium to monorepo (pnpm + nx); rozejrzyj się w nim, żeby ustalić,
gdzie leży problem.

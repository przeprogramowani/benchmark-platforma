# Optymalizacja pracy subagentów bench-build

Notatki z obserwacji budowy paczki 2026-08-18 (`add-courses-view-toggle`,
`plan-openrouter-token-storage`). Punkt odniesienia: subagent zadania
dokumentacyjnego zużył ~163k tokenów, 75 wywołań narzędzi i 37 minut —
przy asercji sprowadzającej się do „plik istnieje + czysty git status".
Procedura `TASK_AUTHORING.md` jest zdrowa co do zasady (dowód na
referencji przed oddaniem), ale stosuje najcięższy wariant do każdego
zadania niezależnie od profilu i dubluje pracę między subagentami.

## 1. Unikanie powielania pracy między subagentami (priorytet)

Największe straty nie siedzą w pojedynczym subagencie, tylko w tym, że
każdy z nich robi od zera to samo, co sąsiad. Te kroki powinny przejść
do orkiestratora, wykonywane **raz per paczka, przed fan-outem**:

- **Wybór kandydata na pin.** Subagenci tej samej paczki na tym samym
  repo bazowym i tak lądują na tym samym commicie (świeży zielony HEAD).
  Dziś każdy z osobna przegląda historię i weryfikuje zieloność CI przez
  GitHub API. Orkiestrator powinien wyznaczyć pin-kandydata (SHA +
  dowód zielonego CI) i podać go w promptach; subagent tylko weryfikuje,
  że **jego** zlecenie ma na tym commicie sens, i może odstąpić od
  kandydata z uzasadnieniem w raporcie.
- **Przygotowanie środowiska oceny.** Obraz kontenera `bench-base`
  (w tej sesji: doktorowanie CA proxy w trust store), `npm install`
  runnera, dostępność dockera — to infrastruktura wspólna. W tej paczce
  pierwszy subagent debugował TLS w `docker build` sam; drugi skorzystał
  z jego naprawy wyłącznie dzięki szczęśliwej kolejności. Orkiestrator
  powinien przed fan-outem doprowadzić do stanu „`bench assert` na
  trywialnym zadaniu działa" i dopiero wtedy startować subagentów.
- **Wspólna mapa repo bazowego.** Obaj subagenci niezależnie eksplorują
  to samo repo (layout, stack, konwencje, gdzie żyją strony/komponenty/
  auth). Orkiestrator (lub jeden tani agent-zwiadowca) może wytworzyć
  krótki brief repo (stack, struktura katalogów, kluczowe moduły,
  komendy build/test) i wkleić go do promptów — subagent doczytuje
  tylko obszar swojego zlecenia.
- **Smoke run jako bramka paczki, nie rytuał per zadanie.** Krok 6.4
  (próbny `bench run` + `bench evaluate`) wymaga kluczy API, których
  w sesji budowy zwykle nie ma — oba zadania oddały się z „niedomkniętym
  krokiem". Uczciwszy model: jeden smoke run dla wszystkich nowych zadań
  paczki, wykonywany tam, gdzie są sekrety (CI), po przyjęciu plików
  przez użytkownika.

## 2. Różnicowanie ścieżki wg profilu zlecenia

Pole **Typ** i przewidywana waga judge ze zlecenia wystarczą, żeby
wybrać wariant procedury:

| Profil zlecenia | Ścieżka |
|---|---|
| dokumentacja / koncepcyjne | pin od orkiestratora; asercje bez zależności dowodzone lokalnie na worktree pina (kontener odroczony do CI); wzorzec + pusty diff; warianty kalibracyjne → bench-rubric; tańszy model / niższy effort subagenta |
| implementacja bez składowej judge | pełne asercje kontenerowe; zero materiału kalibracyjnego |
| implementacja ze składową judge o dużej wadze (≥ ~0.5) | pełna obecna ścieżka (warianty kalibracyjne od razu — kontekst repo otwarty raz) |

Szczegóły dwóch największych cięć:

- **Zbiór kalibracyjny sędziego na żądanie, nie zawsze.** Krok 4 każe
  każdemu zadaniu z judge wytworzyć wzorzec + 4–5 ręcznych wariantów
  złej jakości. To połowa pracy bench-rubric wykonywana w bench-build,
  zanim wiadomo, czy zadanie przejdzie review — dla zadania odrzuconego
  to koszt utopiony. Przy lekkim judge wystarczy wzorzec + pusty diff.
- **Kontener tylko tam, gdzie asercja ma zależności.** Dla asercji
  będących czystymi operacjami na plikach/gicie (typowe dla zadań
  dokumentacyjnych) dowód lokalny na worktree pina jest równoważny
  merytorycznie, a o rząd wielkości tańszy; dowód kontenerowy domyka CI.

## 3. Dobór mocy subagenta

Autorstwo zadania dokumentacyjnego (prompt + dwa checki shellowe +
szkic rubryki) nie wymaga tego samego modelu/effortu co zadanie
implementacyjne z testami SSR/a11y. Orkiestrator może przy fan-oucie
przydzielać model/effort po profilu zlecenia (patrz tabela wyżej).

## Czego NIE ciąć

- **Dowód dwukierunkowy** (stan startowy czerwony / wzorzec zielony) —
  rdzeń wiarygodności benchmarku.
- **Batching patchy w jedno wejście do kontenera** — już zoptymalizowane
  (komplet diffów = 1 wejście) i realnie używane.
- **Zero gita u subagentów, izolacja zakresów, worktree zamiast
  checkoutu na wspólnym HEAD** — tanie zasady zapobiegające realnym
  kolizjom przy budowie równoległej.

## Gdzie to wdrożyć

Zmiany dotyczą `.claude/skills/bench-build/TASK_AUTHORING.md`
(warianty ścieżki, warunkowość kroku 4 i 6.4) oraz sekcji
„Przygotowanie" i „Fan-out" w `.claude/skills/bench-build/SKILL.md`
(pin-kandydat, środowisko oceny, brief repo, smoke jako bramka paczki).
To strefa współdzielona skilli — edycja wymaga świadomej decyzji
użytkownika, nie jest częścią zwykłej budowy paczki.

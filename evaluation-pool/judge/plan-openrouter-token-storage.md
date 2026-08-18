---
version: "1"
weights:
  security_model: 0.45
  repo_grounding: 0.3
  lifecycle_and_hygiene: 0.25
---

# Rubryka: plan-openrouter-token-storage (v1)

Zadanie jest koncepcyjne: agent miał rozpoznać repo i napisać **plan**
bezpiecznego przechowywania i użycia tokenu OpenRouter użytkownika,
jako jeden plik `docs/plans/openrouter-token-storage.md`. Oceniasz
**treść dodanego pliku markdown** widoczną w diffie — to jest deliverable.
Zadanie mierzy jakość myślenia o bezpieczeństwie i zakotwiczenie planu
w realnym kodzie repo, nie wykonanie.

## Bramka wstępna (przed kryteriami)

Wszystkie kryteria dostają **0.0**, gdy zachodzi którekolwiek:

- diff dotyka jakiegokolwiek pliku poza `docs/plans/openrouter-token-storage.md`
  (zlecenie mówi wprost: jedyny dozwolony plik; naruszenie granicy to
  twarda porażka niezależnie od jakości planu),
- diff nie dodaje tego pliku albo plik jest pusty / szczątkowy
  (kilka zdań ogólników to nie jest plan).

## Stan faktyczny repo (klucz odpowiedzi — diff nie daje ci repo, więc
weryfikuj twierdzenia planu względem tej listy)

- Ustawienia konta: `apps/edu-platform/src/pages/profile.astro`
  (gate `verifyAuth` z `src/server/verifyAuth.ts`) + formularz
  `src/components/ProfileForm.svelte` (axios na `/api/profile`);
  API profilu: `src/pages/api/profile/index.ts` — auth przez cookie
  `token`, `verifyToken(token, env.JWT_SECRET)` (`src/server/auth.ts`),
  mapowanie na userId przez `getUserIdByEmail`
  (`src/server/supabase/userService.ts`).
- Dane: Supabase Postgres wyłącznie z serwera przez klucz service-role —
  `getSupabaseAdmin` (`src/server/supabase/client.ts`); tabela
  `profiles`; RLS włączone defensywnie
  (`supabase/migrations/20260331000000_enable_rls.sql`), ale service key
  omija RLS.
- Runtime: Cloudflare Worker (`wrangler.jsonc`), env przez
  `context.locals.env` (middleware `src/middleware/index.ts`);
  sekrety serwera: `astro-env.ts` (access: secret) + kontrakt
  `required-worker-secrets.json` audytowany przez
  `scripts/audit-worker-secrets.mjs`; WebCrypto (`crypto.subtle`)
  jest dostępne w Workerach.
- Precedens tokenów w repo: `game_api_tokens` przechowuje **wyłącznie
  SHA-256 hash** (migracja `20260304000000_game_api_tokens.sql`,
  `src/server/game/apiTokenManager.ts`) — bo to token wydawany przez
  platformę i tylko weryfikowany. Token OpenRoutera jest odwrotnym
  przypadkiem: platforma jest klientem i musi odtworzyć surową wartość
  do nagłówka `Authorization`.
- OpenRouter dziś: wyłącznie build-time w `scripts/`
  (np. `repair-prework-code-blocks.ts`, `process.env.OPENROUTER_API_KEY`);
  w runtime Workera nie ma integracji ani takiego sekretu.
- Telemetria: `src/lib/logger.ts` → `sanitizeTelemetry`
  (`src/lib/observability/telemetryPrivacy.ts`, `[REDACTED]`,
  `BEARER_PATTERN`); Sentry przez `withApiErrorReporting`
  (`src/server/observability/withApiErrorReporting.ts`).

Ścieżki w planie mogą być pisane względem `apps/edu-platform` — nie
karz za konwencję zapisu, karz za ścieżki/mechanizmy zmyślone.

## Kryteria

1. **security_model** (waga 0.45) — rdzeń zadania: jak plan przechowuje
   token i którędy płynie jego wartość. Kotwice:
   - 1.0 — wszystkie cztery filary naraz: (a) szyfrowanie **odwracalne**
     po stronie serwera, kluczem trzymanym poza bazą (sekret
     Workera/env/KMS), ze wskazaniem, gdzie następuje odszyfrowanie
     i kto ma dostęp do odszyfrowanej wartości; (b) hashowanie jako
     sposób przechowywania **jawnie odrzucone z uzasadnieniem** (token
     musi być odtwarzalny, żeby wywołać OpenRoutera — najlepiej
     z odróżnieniem od wzorca `game_api_tokens`); (c) token po zapisie
     nigdy nie wraca do klienta (żaden endpoint nie zwraca wartości);
     (d) wywołania OpenRoutera wychodzą wyłącznie z serwera, nigdy
     z przeglądarki z tokenem użytkownika.
   - 0.5 — kierunek poprawny (szyfrowanie odwracalne server-side,
     wywołania z serwera), ale z istotną luką: klucz szyfrujący bez
     jasnego umiejscowienia poza bazą, brak wskazania miejsca
     odszyfrowania, hashowanie w ogóle nieodniesione (mimo precedensu
     w repo), albo endpoint/UI z podglądem zapisanego tokenu.
   - 0.0 — błąd merytoryczny w rdzeniu: plan proponuje **hash** jako
     sposób przechowywania (feature nie może działać — to nie jest
     równoprawny wariant), przechowuje token **plain text** w bazie,
     trzyma go po stronie przeglądarki (localStorage / cookie czytelne
     dla JS / props do wyspy), zwraca token klientowi albo każe
     przeglądarce wołać OpenRoutera bezpośrednio tokenem użytkownika.
     Którakolwiek z tych propozycji = 0.0 całego kryterium, nawet gdy
     reszta wywodu jest elegancka.
2. **repo_grounding** (waga 0.3) — czy to plan dla TEGO repo. Kotwice:
   - 1.0 — plan stoi na realnych miejscach repo i poprawnie oddaje ich
     rolę: wskazuje istniejące ustawienia konta i API profilu jako punkt
     zaczepienia, faktyczny mechanizm auth, warstwę Supabase
     service-role (i konsekwencję: service key omija RLS), oraz
     faktyczny sposób zarządzania sekretami Workera dla nowego klucza;
     nowe elementy (tabela/serwis/endpoint) osadza obok istniejących
     wzorców. Drobne nieścisłości ścieżek nie dyskwalifikują, jeśli
     mechanizmy się zgadzają.
   - 0.5 — zakotwiczenie częściowe: kilka prawdziwych ścieżek, ale
     kluczowe decyzje (gdzie zapis, gdzie sekret klucza, gdzie
     odszyfrowanie) opisane ogólnikami; albo pojedyncze zmyślone
     ścieżki/mechanizmy obok trafnych.
   - 0.0 — generyczna rozprawka o sekretach bez ścieżek tego repo, albo
     plan pisany pod zmyślony stack (Express/Next, Prisma, AWS KMS jako
     "nasz" magazyn sekretów itp.) sprzeczny z faktycznym środowiskiem
     Cloudflare Workers + Supabase.
3. **lifecycle_and_hygiene** (waga 0.25) — konsekwencje operacyjne
   sekretu. Kotwice:
   - 1.0 — pokryte wszystkie trzy obszary: (a) cykl życia — nadpisanie/
     rotacja tokenu, usunięcie tokenu na żądanie, los tokenu przy
     usunięciu konta; (b) wycieki poboczne — logi/telemetria/Sentry
     i komunikaty błędów nie mogą echować tokenu (odniesienie do
     istniejącej redakcji telemetrii jest plusem); (c) UI ustawień —
     maskowanie pola, stan "ustawiony / nieustawiony" zamiast podglądu
     wartości, potwierdzenie przy nadpisaniu.
   - 0.5 — pokryty co najmniej jeden obszar solidnie, ale co najmniej
     jeden w całości pominięty (np. jest cykl życia i UI, zero słowa
     o logach/Sentry).
   - 0.0 — plan kończy się na zapisaniu tokenu: brak cyklu życia, brak
     tematu wycieków, brak przemyślenia UI.

## Format odpowiedzi sędziego (wymagany JSON)

```json
{
  "criteria": {
    "security_model": { "score": 0.0, "justification": "…" },
    "repo_grounding": { "score": 0.0, "justification": "…" },
    "lifecycle_and_hygiene": { "score": 0.0, "justification": "…" }
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

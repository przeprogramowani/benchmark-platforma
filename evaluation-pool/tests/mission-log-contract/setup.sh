# Wspólny setup checków — sourcowany (`.`), nie uruchamiany: zostawia
# powłokę w katalogu aplikacji, gotową na `pnpm exec vitest`.
#
# `set -e` włączamy jawnie, bo sourcowanie nie dziedziczy flag z check.yaml —
# bez tego nieudana instalacja przeszłaby do vitesta i dała mylący błąd.
set -e

cd /workspace

# Repo bazowe stoi na pnpm (pnpm-lock.yaml + packageManager w package.json);
# instalacja przez corepack, żeby trafić w zapinowaną wersję pnpm.
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile >/dev/null

# Ukryte materiały testu wjeżdżają do workspace'u dopiero teraz — na etapie
# oceny, długo po tym, jak patch.diff agenta został zamknięty. Prefiks
# `.bench-mission-log-` odpowiada `include` z konfiguracji asercji.
cp "$ASSERTION_DIR"/constants.test.ts apps/edu-platform/.bench-mission-log-constants.test.ts
cp "$ASSERTION_DIR"/codes.test.ts apps/edu-platform/.bench-mission-log-codes.test.ts
cp "$ASSERTION_DIR"/http.test.ts apps/edu-platform/.bench-mission-log-http.test.ts
cp "$ASSERTION_DIR"/vitest.bench.config.ts apps/edu-platform/.bench-vitest.config.ts

cd apps/edu-platform

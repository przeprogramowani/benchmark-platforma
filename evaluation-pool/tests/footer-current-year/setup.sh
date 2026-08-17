# Wspólny setup obu checków — sourcowany (`.`), nie uruchamiany:
# zostawia powłokę w katalogu aplikacji, gotową na `pnpm exec vitest`.
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
# oceny, długo po tym, jak patch.diff agenta został zamknięty.
cp "$ASSERTION_DIR"/footer-current-year.test.ts apps/edu-platform/.bench-footer-year.test.ts
cp "$ASSERTION_DIR"/vitest.bench.config.ts apps/edu-platform/.bench-vitest.config.ts

cd apps/edu-platform

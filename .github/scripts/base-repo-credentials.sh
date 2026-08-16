#!/usr/bin/env bash
# Poświadczenia read-only do prywatnego repo bazowego.
#
# Runner klonuje repo bazowe zwykłym `git clone <url>` z bench.config.yaml
# i nie ma własnej obsługi tokenów — celowo, bo URL w configu nie może
# zawierać sekretu. Uwierzytelnienie wstrzykujemy więc warstwę niżej:
# przepisaniem https://github.com/ na formę z tokenem w git-configu runnera
# CI. Działa na hoście, a to wystarczy — obraz zadania buduje się na hoście
# (`bench run` → prepare), próby agenta lecą już offline.
#
# GITHUB_TOKEN workflow NIE wystarcza: jego zasięg to repo instancji,
# a repo bazowe jest osobnym repozytorium (nawet w tej samej organizacji).
# Potrzebny jest sekret BASE_REPO_TOKEN — fine-grained PAT z uprawnieniem
# `Contents: read` na repo bazowe.
#
# Brak sekretu = no-op: instancje na publicznych repach bazowych działają
# bez żadnej konfiguracji, a instancje na prywatnych dostają czytelny
# komunikat zamiast mylącego "Repository not found" z gita.
set -euo pipefail

if [ -z "${BASE_REPO_TOKEN:-}" ]; then
  echo "BASE_REPO_TOKEN nie ustawiony — pomijam. Jeśli któreś repo bazowe" \
       "jest prywatne, bench validate padnie na 'repo nieosiągalne':" \
       "dodaj sekret BASE_REPO_TOKEN (fine-grained PAT, Contents: read)."
  exit 0
fi

git config --global \
  url."https://x-access-token:${BASE_REPO_TOKEN}@github.com/".insteadOf \
  "https://github.com/"

echo "poświadczenia read-only do github.com skonfigurowane (BASE_REPO_TOKEN)"

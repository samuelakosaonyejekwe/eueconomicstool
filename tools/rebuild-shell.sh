#!/bin/sh
# Rarely needed. The live site picks up every commit to main by itself. GitHub
# Pages serves only a small loader from the separate `live` branch, so ordinary
# pushes cause no GitHub build at all. Run this only after changing a loader
# file (index.html, acts.html, sw.js, manifest.webmanifest, icons); it copies main to
# `live`, which also refreshes the stored fallback copy, then removes the build
# records that this one rebuild creates and switches Actions back off.
set -e
REPO=$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')
node tools/csp.mjs --check
git fetch -q origin main
SHA=$(git rev-parse origin/main)

sweep() {
  for ID in $(gh api "repos/$REPO/actions/runs" --paginate --jq '.workflow_runs[].id' 2>/dev/null); do
    gh api -X DELETE "repos/$REPO/actions/runs/$ID" >/dev/null 2>&1 || true
  done
  for ID in $(gh api "repos/$REPO/deployments" --paginate --jq '.[].id' 2>/dev/null); do
    gh api -X POST "repos/$REPO/deployments/$ID/statuses" -f state=inactive >/dev/null 2>&1 || true
    gh api -X DELETE "repos/$REPO/deployments/$ID" >/dev/null 2>&1 || true
  done
  gh api -X DELETE "repos/$REPO/environments/github-pages" >/dev/null 2>&1 || true
}
left() {
  echo $(( $(gh api "repos/$REPO/actions/runs" --jq .total_count 2>/dev/null || echo 0) + $(gh api "repos/$REPO/deployments" --jq length 2>/dev/null || echo 0) ))
}
# Whatever happens below, never leave Actions switched on or records behind.
finish() { sweep; gh api -X PUT "repos/$REPO/actions/permissions" -F enabled=false >/dev/null 2>&1 || true; }
trap finish EXIT

gh api -X PUT "repos/$REPO/actions/permissions" -F enabled=true >/dev/null
sleep 3
if [ "$(git rev-parse origin/live 2>/dev/null)" = "$SHA" ]; then
  gh api -X POST "repos/$REPO/pages/builds" >/dev/null
else
  git push -q origin "$SHA:refs/heads/live"
fi
printf 'Rebuilding'
for i in $(seq 1 60); do
  BUILT=$(gh api "repos/$REPO/pages/builds/latest" --jq 'select(.status=="built") | .commit' 2>/dev/null || true)
  [ "$BUILT" = "$SHA" ] && break
  printf '.'; sleep 6
done
echo
# Records can appear a little after the build finishes: sweep until two checks in a row find none.
CLEAN=0
for PASS in 1 2 3 4 5 6 7 8; do
  sleep 12; sweep
  if [ "$(left)" = "0" ]; then CLEAN=$((CLEAN + 1)); else CLEAN=0; fi
  [ "$CLEAN" -ge 2 ] && break
done
echo "Loader rebuilt at $SHA. Build records cleared; Actions off."

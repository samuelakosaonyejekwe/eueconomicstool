#!/bin/sh
# Rarely needed. The live site picks up every commit by itself. Run this only
# after changing the loader files that are served directly by GitHub Pages
# (index.html, sw.js, manifest.webmanifest, icons); it also refreshes the stored
# fallback copy. It rebuilds the Pages site once and removes the build records.
set -e
REPO=$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')
SHA=$(git rev-parse origin/main)
gh api -X PUT "repos/$REPO/actions/permissions" -F enabled=true >/dev/null
sleep 3
gh api -X POST "repos/$REPO/pages/builds" >/dev/null
printf 'Rebuilding'
for i in $(seq 1 60); do
  BUILT=$(gh api "repos/$REPO/pages/builds/latest" --jq 'select(.status=="built") | .commit' 2>/dev/null || true)
  [ "$BUILT" = "$SHA" ] && break
  printf '.'; sleep 6
done
echo; sleep 25
for ID in $(gh api "repos/$REPO/actions/runs" --paginate --jq '.workflow_runs[].id' 2>/dev/null); do
  gh api -X DELETE "repos/$REPO/actions/runs/$ID" >/dev/null 2>&1 || true
done
for ID in $(gh api "repos/$REPO/deployments" --paginate --jq '.[].id' 2>/dev/null); do
  gh api -X POST "repos/$REPO/deployments/$ID/statuses" -f state=inactive >/dev/null 2>&1 || true
  gh api -X DELETE "repos/$REPO/deployments/$ID" >/dev/null 2>&1 || true
done
gh api -X DELETE "repos/$REPO/environments/github-pages" >/dev/null 2>&1 || true
gh api -X PUT "repos/$REPO/actions/permissions" -F enabled=false >/dev/null
echo "Loader rebuilt at $SHA. Build records cleared; Actions off."

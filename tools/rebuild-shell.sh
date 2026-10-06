#!/bin/sh
# Rarely needed. The live site picks up every commit to main by itself. GitHub
# Pages serves only a small loader from the separate `live` branch, so ordinary
# pushes cause no GitHub build at all. Run this only after changing the loader
# files (index.html, sw.js, manifest.webmanifest, icons); it copies main to
# `live`, which also refreshes the stored fallback copy, then removes the build
# records that one rebuild creates.
set -e
REPO=$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')
SHA=$(git rev-parse origin/main)
git fetch -q origin main
gh api -X PUT "repos/$REPO/actions/permissions" -F enabled=true >/dev/null
sleep 3
git push -q origin "$SHA:refs/heads/live"
printf 'Rebuilding'
for i in $(seq 1 60); do
  BUILT=$(gh api "repos/$REPO/pages/builds/latest" --jq 'select(.status=="built") | .commit' 2>/dev/null || true)
  [ "$BUILT" = "$SHA" ] && break
  printf '.'; sleep 6
done
echo
# Records can appear a little after the build finishes, so sweep several times.
for PASS in 1 2 3 4; do
  sleep 15
  for ID in $(gh api "repos/$REPO/actions/runs" --paginate --jq '.workflow_runs[].id' 2>/dev/null); do
    gh api -X DELETE "repos/$REPO/actions/runs/$ID" >/dev/null 2>&1 || true
  done
  for ID in $(gh api "repos/$REPO/deployments" --paginate --jq '.[].id' 2>/dev/null); do
    gh api -X POST "repos/$REPO/deployments/$ID/statuses" -f state=inactive >/dev/null 2>&1 || true
    gh api -X DELETE "repos/$REPO/deployments/$ID" >/dev/null 2>&1 || true
  done
  gh api -X DELETE "repos/$REPO/environments/github-pages" >/dev/null 2>&1 || true
done
gh api -X PUT "repos/$REPO/actions/permissions" -F enabled=false >/dev/null
echo "Loader rebuilt at $SHA. Build records cleared; Actions off."

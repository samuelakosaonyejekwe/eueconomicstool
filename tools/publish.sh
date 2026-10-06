#!/bin/sh
# Publish the current commit, then remove every build and deployment record and
# switch the repository's Actions back off, so the repository shows only its files
# and its author. Usage: tools/publish.sh
set -e
REPO=$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')
SHA=$(git rev-parse HEAD)
gh api -X PUT "repos/$REPO/actions/permissions" -F enabled=true >/dev/null
git push origin HEAD:main
sleep 5
if [ "$(gh api "repos/$REPO/pages/builds/latest" --jq .commit 2>/dev/null)" != "$SHA" ]; then
  gh api -X POST "repos/$REPO/pages/builds" >/dev/null 2>&1 || true
fi
printf 'Waiting for the site to update'
for i in $(seq 1 50); do
  BUILT=$(gh api "repos/$REPO/pages/builds/latest" --jq 'select(.status=="built") | .commit' 2>/dev/null || true)
  [ "$BUILT" = "$SHA" ] && break
  printf '.'; sleep 6
done
echo
sleep 20
for ID in $(gh api "repos/$REPO/actions/runs" --paginate --jq '.workflow_runs[].id' 2>/dev/null); do
  gh api -X DELETE "repos/$REPO/actions/runs/$ID" >/dev/null 2>&1 || true
done
for ID in $(gh api "repos/$REPO/deployments" --paginate --jq '.[].id' 2>/dev/null); do
  gh api -X POST "repos/$REPO/deployments/$ID/statuses" -f state=inactive >/dev/null 2>&1 || true
  gh api -X DELETE "repos/$REPO/deployments/$ID" >/dev/null 2>&1 || true
done
gh api -X DELETE "repos/$REPO/environments/github-pages" >/dev/null 2>&1 || true
gh api -X PUT "repos/$REPO/actions/permissions" -F enabled=false >/dev/null
echo "Published $SHA. Build and deployment records cleared; Actions switched off."

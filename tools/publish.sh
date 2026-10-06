#!/bin/sh
# Publish the current commit and leave no build or deployment records behind.
# Usage: tools/publish.sh
set -e
REPO=$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')
git push origin HEAD:main
SHA=$(git rev-parse HEAD)
printf 'Waiting for the site to update'
for i in $(seq 1 40); do
  BUILT=$(gh api "repos/$REPO/pages/builds/latest" --jq 'select(.status=="built") | .commit' 2>/dev/null || true)
  [ "$BUILT" = "$SHA" ] && break
  printf '.'; sleep 6
done
echo
for ID in $(gh api "repos/$REPO/actions/runs" --paginate --jq '.workflow_runs[] | select(.status=="completed") | .id' 2>/dev/null); do
  gh api -X DELETE "repos/$REPO/actions/runs/$ID" >/dev/null 2>&1 || true
done
for ID in $(gh api "repos/$REPO/deployments" --paginate --jq '.[].id' 2>/dev/null); do
  gh api -X POST "repos/$REPO/deployments/$ID/statuses" -f state=inactive >/dev/null 2>&1 || true
  gh api -X DELETE "repos/$REPO/deployments/$ID" >/dev/null 2>&1 || true
done
echo "Published $SHA and cleared build and deployment records."

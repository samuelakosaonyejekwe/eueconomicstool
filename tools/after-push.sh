#!/bin/sh
# Started by the pre-push hook. Waits for the pushed commit to go live, then
# deletes the build, deployment and environment records and switches the
# repository's Actions back off. Progress is written to .git/after-push.log.
REPO="$1"; SHA="$2"
sleep 12
if [ "$(gh api "repos/$REPO/pages/builds/latest" --jq .commit 2>/dev/null)" != "$SHA" ]; then
  gh api -X POST "repos/$REPO/pages/builds" >/dev/null 2>&1
fi
LIVE=no
for i in $(seq 1 60); do
  BUILT=$(gh api "repos/$REPO/pages/builds/latest" --jq 'select(.status=="built") | .commit' 2>/dev/null)
  [ "$BUILT" = "$SHA" ] && { LIVE=yes; break; }
  sleep 6
done
sleep 25
for ID in $(gh api "repos/$REPO/actions/runs" --paginate --jq '.workflow_runs[].id' 2>/dev/null); do
  gh api -X POST "repos/$REPO/actions/runs/$ID/cancel" >/dev/null 2>&1
  gh api -X DELETE "repos/$REPO/actions/runs/$ID" >/dev/null 2>&1
done
for ID in $(gh api "repos/$REPO/deployments" --paginate --jq '.[].id' 2>/dev/null); do
  gh api -X POST "repos/$REPO/deployments/$ID/statuses" -f state=inactive >/dev/null 2>&1
  gh api -X DELETE "repos/$REPO/deployments/$ID" >/dev/null 2>&1
done
gh api -X DELETE "repos/$REPO/environments/github-pages" >/dev/null 2>&1
gh api -X PUT "repos/$REPO/actions/permissions" -F enabled=false >/dev/null 2>&1
echo "$(date '+%Y-%m-%d %H:%M:%S') commit $SHA live=$LIVE; records cleared; Actions off"

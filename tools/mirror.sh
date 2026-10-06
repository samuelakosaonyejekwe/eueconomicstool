#!/bin/sh
# Push the current version to an extra git host (GitLab, Codeberg, ...) so the
# tool is served from more than one place. Usage: tools/mirror.sh <remote-url>
set -e
[ -n "$1" ] || { echo "usage: tools/mirror.sh <git-remote-url>"; exit 1; }
git push "$1" HEAD:main
git push "$1" HEAD:pages 2>/dev/null || true
echo "Pushed. Enable static pages for that repository, then add its address to mirrors.json."

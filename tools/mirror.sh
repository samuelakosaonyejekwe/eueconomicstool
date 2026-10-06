#!/bin/sh
# Copy the tool to an additional git host (GitLab, Codeberg, ...) so it is served
# from more than one place. Usage: tools/mirror.sh <remote-url>
# The host must be set to publish the `live` branch as a static site. The copy
# opens from its own files and still fetches the newest version and all data
# directly from the public sources, exactly as the main address does.
set -e
[ -n "$1" ] || { echo "usage: tools/mirror.sh <git-remote-url>"; exit 1; }
git fetch -q origin main live
git push "$1" origin/main:refs/heads/main origin/live:refs/heads/live
echo "Pushed main and live. Publish the live branch on that host, then add its address to mirrors.json."

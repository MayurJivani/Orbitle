#!/bin/sh
# Ship Orbit to Jinx. A static build, so there is no container, no restart and
# nothing to keep running: Caddy serves dist/ straight off the disk. Needs
# install.sh to have run once as root first.
#
# The build happens here rather than on the box, which keeps node and a
# lockfile install off the server entirely.
#
# The old dist is removed rather than written over: a stale hashed asset left
# behind would still be served to a cached page, and unlinking needs write on
# the directory rather than on the file, so this works even if a previous
# deploy left files owned by someone else.
set -eu
cd "$(dirname "$0")/.."

npm run build

tar czf - dist deploy README.md HOW-IT-WORKS.md | ssh ssh.futile.studio '
  set -eu
  cd /opt/apps/Orbit
  rm -rf ./dist ./deploy ./README.md ./HOW-IT-WORKS.md
  tar xzf -
'

echo "orbit: deployed to Jinx, http://orbit.futile.studio"

#!/bin/sh
# Ship Orbit to Jinx. Runs from a dev box, not on Jinx: everything it does
# there goes over one ssh.
#
# The box has git and docker but no node, so it pulls the committed source from
# GitHub and builds in a throwaway node container. That keeps a node install
# off the server, and it means what is served is what is on the branch rather
# than whatever happened to be in a working copy at the time.
#
# Needs install.sh to have run once as root first: /opt/apps is root-owned, so
# the empty app directory has to be created and chowned before a clone can land
# in it.
set -eu

REPO="${REPO:-https://github.com/MayurJivani/Orbit.git}"
BRANCH="${BRANCH:-main}"
HOST="${HOST:-ssh.futile.studio}"
APP=/opt/apps/Orbit

ssh "$HOST" "
set -eu
if [ -d $APP/.git ]; then
  # Hard reset rather than pull: the box is a deploy target, so the branch wins
  # over anything that was poked at locally, and a fast-forward that cannot
  # apply should not stop a deploy.
  git -C $APP remote set-url origin '$REPO'
  git -C $APP fetch --prune origin '$BRANCH'
  git -C $APP reset --hard 'origin/$BRANCH'
  git -C $APP clean -fd -e node_modules -e dist
else
  git clone --branch '$BRANCH' '$REPO' $APP
fi

# Build as the invoking user, or npm leaves root-owned files behind and the next
# deploy cannot clean them up. HOME is set because npm wants somewhere to put
# its cache and the container's root home is not writable by this uid.
docker run --rm \
  -v $APP:/app -w /app \
  -u \"\$(id -u):\$(id -g)\" \
  -e HOME=/tmp \
  node:22-alpine \
  sh -c 'npm ci --no-audit --no-fund && npm test && npm run build'

git -C $APP log -1 --format='orbit: deployed %h %s'
"

echo "orbit: http://orbit.futile.studio"

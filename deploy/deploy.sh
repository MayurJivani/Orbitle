#!/bin/sh
# Build Orbitle here and ship the static dist to Jinx, the way Borderline does.
# The box has no Docker since the 2026-10-27 rebuild. Re-runnable, no arguments.
set -eu
cd "$(dirname "$0")/.."

HOST=${HOST:-ssh.futile.studio}

npm test
npm run build

scp -q deploy/orbitle.caddy "$HOST":/tmp/orbitle.caddy.incoming
ssh "$HOST" '
  set -eu
  sudo -n install -d -o "$(id -un)" -g "$(id -gn)" /opt/apps/Orbitle
  LIVE=/etc/caddy/conf.d/orbitle.caddy
  IN=/tmp/orbitle.caddy.incoming

  if cmp -s "$IN" "$LIVE"; then
    rm -f "$IN"
  else
    # Validation has to happen with the block already imported, so keep a copy
    # of whatever was there and put it back if Caddy rejects the result. This
    # file is imported into the config that serves every other site on the box:
    # a block that fails to parse would take all of them down at the next
    # reload, whoever triggers it and for whatever reason.
    sudo -n cp "$LIVE" "$IN.prev" 2>/dev/null || true
    sudo -n install -m 644 -o root -g root "$IN" "$LIVE" && rm -f "$IN"
    if ! caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
      if [ -f "$IN.prev" ]; then sudo -n mv "$IN.prev" "$LIVE"; else sudo -n rm -f "$LIVE"; fi
      echo "orbitle: site block rejected by caddy validate, config unchanged" >&2
      exit 1
    fi
    sudo -n rm -f "$IN.prev"
    sudo -n systemctl reload caddy
    echo "orbitle: site block installed and caddy reloaded"
  fi
'

# The old copy is cleared entry by entry rather than with `rm -rf` on the
# directory itself: unlinking needs write on the directory and not on the file,
# so this still works if an earlier deploy left files behind owned by someone
# else. A missing directory makes `cd` fail first, before anything is deleted.
tar czf - -C dist . | ssh "$HOST" '
  set -eu
  cd /opt/apps/Orbitle
  find . -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  tar xzf -
'
echo "orbitle: deployed to https://orbitle.futile.studio"

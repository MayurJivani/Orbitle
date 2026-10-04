#!/bin/sh
# One-time setup on Jinx: the app directory for the clone to land in, and the
# site block that puts orbitle.futile.studio in front of it. Needs root, and is
# the only step that does, because /opt/apps and the Caddyfile are both
# root-owned; deploy.sh afterwards needs no privileges at all.
#
# Re-runnable: it strips any previous orbit block before appending, so editing
# deploy/orbit.caddy and running this again is the way to change the site
# config.
#
# This is only half the route. The tunnel on this box is token-managed, so the
# ingress for orbitle.futile.studio has to be pointed at http://localhost:80 in
# the Cloudflare dashboard. That part cannot be done from here, and without it
# requests never reach Caddy.
set -eu

CADDY=/etc/caddy/Caddyfile
BLOCK="$(dirname "$0")/orbitle.caddy"
APP=/opt/apps/Orbitle
# Who deploys afterwards. The directory has to be writable without root, or
# every deploy needs a password.
OWNER="${OWNER:-icarusfalls}"

mkdir -p "$APP"
chown "$OWNER":"$OWNER" "$APP"

cp "$CADDY" "$CADDY.bak"

python3 - "$CADDY" "$BLOCK" <<'PY'
import pathlib, re, sys

caddy, block = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
# Drop any existing block for either name. Matching only the new one would
# leave the pre-rename orbit.futile.studio block in place, and Caddy refuses a
# config where two blocks claim the same hostname. The address list before the
# brace is matched loosely because the block now carries both names. It nests
# one level (the header matchers), so match to a line-initial "}" rather than
# the first one; the validate below is the backstop if this ever eats a brace it
# should not have.
text = re.sub(r"\n*http://orbit(?:le)?\.futile\.studio[^{]*\{.*?\n\}\n?", "\n", caddy.read_text(), flags=re.S)
caddy.write_text(text.rstrip() + "\n" + block.read_text())
PY

# Validate before reloading: this file serves every other site on the box.
caddy validate --adapter caddyfile --config "$CADDY"
systemctl reload caddy

echo "orbitle: $APP ready, Caddyfile updated and reloaded (backup at $CADDY.bak)"

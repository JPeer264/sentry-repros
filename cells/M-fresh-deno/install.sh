#!/usr/bin/env bash
# Restores both node_modules trees this cell needs.
#   ./node_modules      - the SDK tarballs + mysql, installed by npm (the "sdkdeps" side install)
#   ./app/node_modules  - Deno's own tree for the Fresh app, plus the packages copied in from above
# The Sentry Deno import hook only transforms packages that live under a local node_modules, so the
# SDK and the driver must be real directories inside app/node_modules; npm cannot install them there
# without pruning Deno's .deno layout, hence the side install and the copy.
set -eu
here="$(cd "$(dirname "$0")" && pwd)"

npm install --prefix "$here"
(cd "$here/app" && deno install)

cd "$here/node_modules"
for p in @sentry mysql sqlstring bignumber.js core-util-is inherits isarray \
         process-nextick-args readable-stream safe-buffer string_decoder util-deprecate; do
  [ -e "$here/app/node_modules/$p" ] || cp -R "$p" "$here/app/node_modules/$p"
done
echo "installed"

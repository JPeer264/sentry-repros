#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   verbatim-import   vite build with the page's `import { sentrySvelteKit } from "@sentry/sveltekit"` (build only)
#   base              the `@sentry/sveltekit/vite` import, full run: build, node build, headless Chrome
# Ports: sink 127.0.0.1:4754, app 127.0.0.1:4755 (both must be free).
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-base}"
SINK_PORT=4754
APP_PORT=4755
cd "$DIR"

for p in $SINK_PORT $APP_PORT; do
  if lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is busy"; exit 1; fi
done

case "$VARIANT" in
  verbatim-import) CONFIG=vite.config.verbatim.ts ;;
  base) CONFIG=vite.config.ts ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

REPO_ROOT="$(cd "$DIR/../.." && pwd)"
# Logs and results must not carry machine paths; the repo root becomes the $REPRO placeholder.
scrub() { for f in "$@"; do [ -f "$f" ] && sed -i '' "s#$REPO_ROOT#\$REPRO#g" "$f"; done; }

if [ "${SKIP_BUILD:-0}" = "1" ] && [ -d build ]; then
  BUILD_STATUS=0
  echo "SKIP_BUILD=1, reusing build/ (build-$VARIANT.log)"
else
  timeout 170 npx vite build --config "$CONFIG" > "build-$VARIANT.log" 2>&1
  BUILD_STATUS=$?
  echo "vite build exit $BUILD_STATUS (build-$VARIANT.log)"
  scrub "build-$VARIANT.log"
fi

if [ "$VARIANT" = "verbatim-import" ]; then
  node -e '
    const fs = require("fs");
    const log = fs.readFileSync("build-verbatim-import.log", "utf8").split("\n");
    fs.writeFileSync("results-verbatim-import.json", JSON.stringify({
      variant: "verbatim-import",
      snippet: "getting-started-complete/javascript.sveltekit.mdx:363-372 (import { sentrySvelteKit } from \"@sentry/sveltekit\")",
      steps: [{ label: "vite build --config vite.config.verbatim.ts", result: { exit: Number(process.argv[1]) } }],
      console: { build: log },
      envelopes: [],
      verdict: Number(process.argv[1]) === 0 ? "works" : "broken",
    }, null, 2) + "\n");
  ' "$BUILD_STATUS"
  scrub results-verbatim-import.json
  echo "wrote results-verbatim-import.json"
  exit 0
fi

[ "$BUILD_STATUS" -eq 0 ] || { echo "build failed, see build-$VARIANT.log"; exit 1; }

HOST=127.0.0.1 PORT=$SINK_PORT node sink.mjs > "sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
HOST=127.0.0.1 PORT=$APP_PORT node build > "server-$VARIANT.log" 2>&1 &
APP_PID=$!
for _ in $(seq 1 150); do
  curl -sf "http://127.0.0.1:$SINK_PORT/__items" >/dev/null && curl -sf -o /dev/null "http://127.0.0.1:$APP_PORT/" && break
  sleep 0.1
done

node drive.mjs "$VARIANT"
STATUS=$?

kill $APP_PID $SINK_PID 2>/dev/null
wait $APP_PID $SINK_PID 2>/dev/null
scrub "results-$VARIANT.json" "server-$VARIANT.log" "sink-$VARIANT.log"
echo "wrote $DIR/results-$VARIANT.json (server log: server-$VARIANT.log, build log: build-$VARIANT.log)"
exit $STATUS

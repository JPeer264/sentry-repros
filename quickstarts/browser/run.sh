#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   npm   esbuild ESM bundle of `import * as Sentry from "@sentry/browser"`   -> results-npm.json
#   cdn   <script src="bundle.tracing.replay.min.js"> + inline Sentry.init    -> results-cdn.json
#   cdn-tracing  the guide's own CDN tab: bundle.tracing.min.js + replayIntegration()
#   cjs   esbuild IIFE bundle of `require("@sentry/browser")`                 -> results-cjs.json
#   late  Sentry.init after the first errors, DSN fetched from /dsn           -> results-late.json
#   npm-ip  the npm page reached over 127.0.0.1 instead of localhost, to check the
#           documented `tracePropagationTargets: ["localhost", ...]` value
# The loader-script variant cannot be run against develop, see README.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-npm}"
PORT="${PORT:-41701}"
HOSTNAME_FOR_PAGE="localhost"
[ "$VARIANT" = "npm-ip" ] && HOSTNAME_FOR_PAGE="127.0.0.1"
export BASE_URL="http://${HOSTNAME_FOR_PAGE}:${PORT}"

case "$VARIANT" in
  npm|npm-ip) PAGE="/" ;;
  cdn)  PAGE="/cdn.html" ;;
  cdn-tracing) PAGE="/cdn-tracing.html" ;;
  cjs)  PAGE="/cjs.html" ;;
  late) PAGE="/late.html" ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

case "$VARIANT" in
  cdn|cdn-tracing) : ;;
  npm-ip) node "$DIR/build.mjs" npm || exit 1 ;;
  *) node "$DIR/build.mjs" "$VARIANT" || exit 1 ;;
esac

PORT="$PORT" HOST=:: node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$BASE_URL/__items" >/dev/null && break; sleep 0.1; done

cd "$DIR"
node "$DIR/drive.mjs" "$VARIANT" "$PAGE"
STATUS=$?

kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote $DIR/results-$VARIANT.json (console log: app-$VARIANT.log)"
exit $STATUS

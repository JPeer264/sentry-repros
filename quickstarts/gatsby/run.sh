#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   base           open /, click the guide's verify buttons, navigate to the client-only route and back
#   client-route   open /users/42/ directly (pageload of a matchPath route), navigate home
# BUILD=0 ./run.sh <variant> reuses the existing public/ instead of running `gatsby build` first.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-base}"
SINK_PORT=4768
SITE_PORT=4769
export GATSBY_TELEMETRY_DISABLED=1
export SITE_URL="http://localhost:${SITE_PORT}"
export SINK_URL="http://localhost:${SINK_PORT}"
export RESULT_NAME="results-${VARIANT}"

# gatsby@5.16.1 declares node >=18 <26; pick an installed Volta node inside that range when the
# shell's default node (v26 here) is outside it. No download happens when the version is present.
NODE_VERSION="${NODE_VERSION:-22.23.1}"
if command -v volta >/dev/null 2>&1; then
  NODE_DIR="$(volta run --node "$NODE_VERSION" -- node -e 'console.log(require("path").dirname(process.execPath))')"
  export PATH="$NODE_DIR:$PATH"
fi

case "$VARIANT" in
  base) PAGE="/" ;;
  client-route) PAGE="/users/42/" ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

cd "$DIR"
if [ "${BUILD:-1}" = "1" ]; then
  "$DIR/node_modules/.bin/gatsby" build > "$DIR/build.log" 2>&1 || { echo "gatsby build failed, see build.log"; exit 1; }
fi

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-${VARIANT}.log" 2>&1 &
SINK_PID=$!
"$DIR/node_modules/.bin/gatsby" serve -p "$SITE_PORT" > "$DIR/serve-${VARIANT}.log" 2>&1 &
SERVE_PID=$!
for _ in $(seq 1 200); do
  curl -sf "$SINK_URL/__items" >/dev/null && curl -sf "$SITE_URL/" >/dev/null && break
  sleep 0.1
done

node "$DIR/drive.mjs" "$VARIANT" "$PAGE"
STATUS=$?

pkill -P $SERVE_PID 2>/dev/null
kill $SERVE_PID $SINK_PID 2>/dev/null
wait $SERVE_PID $SINK_PID 2>/dev/null
echo "wrote $DIR/${RESULT_NAME}.json (console log: app-${VARIANT}.log, build log: build.log)"
exit $STATUS

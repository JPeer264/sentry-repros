#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   base                          guide index.mdx: main.js (Vue 3 tab, all product options) + App.vue verify snippets, opened at /users/42
#   vue-router-path               features/vue-router.mdx configuration: browserTracingIntegration({ router, routeLabel: "path" })
#   vue-router-verbatim           features/vue-router.mdx full example verbatim (Vue 2 imports on a Vue 3 install), build only
#   component-tracking            features/component-tracking.mdx:28-48 verbatim (trackComponents twice, the array wins)
#   component-tracking-hooks      features/component-tracking.mdx:56-69 verbatim (missing comma), build only
#   component-tracking-hooks-fixed the same snippet with the comma added: hooks ["mount", "update", "unmount"]
#   pinia                         index.mdx Pinia step / features/pinia.mdx: createSentryPiniaPlugin()
#   multiple-apps                 features/multiple-apps.mdx: app: [appOne, appTwo, appThree] + createTracingMixins/attachErrorHandler
#   late-init                     index.mdx "Configuration for Late-Defined Vue Apps": addIntegration(vueIntegration({ app }))
# MODE=development ./run.sh <variant> builds the development bundles and writes results-<variant>-dev.json.
# FULL_BUILD=0 ./run.sh <variant> builds against the runtime-only `vue` export and writes results-<variant>-runtime.json.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-base}"
PORT="${PORT:-4714}"
export BASE_URL="http://localhost:${PORT}"
export MODE="${MODE:-production}"
export FULL_BUILD="${FULL_BUILD:-1}"
SUFFIX=""
[ "$MODE" = "development" ] && SUFFIX="-dev"
[ "$FULL_BUILD" = "0" ] && SUFFIX="${SUFFIX}-runtime"
export RESULT_NAME="results-${VARIANT}${SUFFIX}"

case "$VARIANT" in
  base|vue-router-path) PAGE="/users/42" ;;
  component-tracking|component-tracking-hooks-fixed|pinia|multiple-apps|late-init) PAGE="/${VARIANT}.html" ;;
  vue-router-verbatim|component-tracking-hooks) PAGE="" ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

cd "$DIR"
node "$DIR/build.mjs" "$VARIANT" || exit 1
[ -z "$PAGE" ] && { echo "build-only variant $VARIANT built unexpectedly, see dist/${VARIANT}.js"; exit 0; }

SPA_PAGE="${VARIANT}.html" PORT="$PORT" node "$DIR/sink.mjs" > "$DIR/sink-${VARIANT}${SUFFIX}.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$BASE_URL/__items" >/dev/null && break; sleep 0.1; done

node "$DIR/drive.mjs" "$VARIANT" "$PAGE"
STATUS=$?

kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote $DIR/${RESULT_NAME}.json (console log: app-${VARIANT}${SUFFIX}.log)"
exit $STATUS

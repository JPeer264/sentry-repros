#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   base                          manual-setup.mdx main.ts (App Config tab, all product options) + app.config.ts (Angular 19+ tab,
#                                 inject(Sentry.TraceService)) + the verify snippets, opened at /users/42
#   app-config-verbatim           manual-setup.mdx:246-275 as printed (inject(TraceService) without an import), build only
#   app-initializer               manual-setup.mdx:277-308 (App Config, Angular <=18 tab: APP_INITIALIZER) on Angular 22
#   ngmodule                      manual-setup.mdx:166-220 + 310-339 (NGModule tabs, zone.js) with the bootstrap span of
#                                 features/component-tracking.mdx:148-158
#   error-handler-custom          features/error-handler.mdx:67-82 as printed (CustomErrorHandler, no `override`), build only
#   error-handler-custom-fixed    the same with `override`, registered with { provide: ErrorHandler, useClass: CustomErrorHandler }
#   error-handler-options         createErrorHandler({ logErrors: false, extractor }) (features/error-handler.mdx:46-60)
#   component-tracking            features/component-tracking.mdx: TraceModule + trace directive, TraceClass, TraceMethod (imports fixed)
#   component-tracking-verbatim   features/component-tracking.mdx:80-94 and :106-122 as printed (OnChanges etc. not imported), build only
# MODE=development ./run.sh <variant> builds the development configuration and writes results-<variant>-dev.json.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-base}"
PORT="${PORT:-4715}"
export BASE_URL="http://localhost:${PORT}"
export MODE="${MODE:-production}"
SUFFIX=""
[ "$MODE" = "development" ] && SUFFIX="-dev"
export RESULT_NAME="results-${VARIANT}${SUFFIX}"

case "$VARIANT" in
  base|app-initializer|ngmodule|error-handler-custom-fixed|error-handler-options) PAGE="/users/42" ;;
  component-tracking) PAGE="/" ;;
  app-config-verbatim|error-handler-custom|component-tracking-verbatim) PAGE="" ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

cd "$DIR"
node "$DIR/build.mjs" "$VARIANT" || exit 1
[ -z "$PAGE" ] && { echo "build-only variant $VARIANT built unexpectedly, see dist/${VARIANT}"; exit 0; }

DIST_DIR="dist/${VARIANT}" PORT="$PORT" node "$DIR/sink.mjs" > "$DIR/sink-${VARIANT}${SUFFIX}.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$BASE_URL/__items" >/dev/null && break; sleep 0.1; done

node "$DIR/drive.mjs" "$VARIANT" "$PAGE"
STATUS=$?

kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote $DIR/${RESULT_NAME}.json (console log: app-${VARIANT}${SUFFIX}.log)"
exit $STATUS

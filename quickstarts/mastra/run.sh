#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   guide       MASTRA_FILE=./mastra-guide.mjs node run-agent.mjs                       (guides/mastra/index.mdx:59-79)
#   env-only    MASTRA_FILE=./mastra-env-only.mjs node run-agent.mjs                    (agent-tracing/mastra.mdx:64-77, new SentryExporter())
#   explicit    MASTRA_FILE=./mastra-explicit.mjs node run-agent.mjs                    (agent-tracing/mastra.mdx:84-104)
#   tool-error  TOOL_FAIL=1 MASTRA_FILE=./mastra-guide.mjs node run-agent.mjs           (guide config, the tool throws)
#   sdk-only    MASTRA_FILE=./mastra-sdk-only.mjs node --import ./instrument.mjs run-agent.mjs  (no exporter, SDK's own mastraIntegration)
#   both        MASTRA_FILE=./mastra-guide.mjs node --import ./instrument.mjs run-agent.mjs     (Sentry.init first, then the guide exporter)
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-guide}"
SINK_PORT=4739
MOCK_PORT=4740
SINK="http://127.0.0.1:${SINK_PORT}"
MOCK="http://127.0.0.1:${MOCK_PORT}"
for p in "$SINK_PORT" "$MOCK_PORT"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is busy"; exit 1; fi
done
cd "$DIR"
case "$VARIANT" in
  guide)      CMD='MASTRA_FILE=./mastra-guide.mjs node run-agent.mjs' ;;
  env-only)   CMD='MASTRA_FILE=./mastra-env-only.mjs node run-agent.mjs' ;;
  explicit)   CMD='MASTRA_FILE=./mastra-explicit.mjs node run-agent.mjs' ;;
  tool-error) CMD='TOOL_FAIL=1 MASTRA_FILE=./mastra-guide.mjs node run-agent.mjs' ;;
  sdk-only)   CMD='MASTRA_FILE=./mastra-sdk-only.mjs node --import ./instrument.mjs run-agent.mjs' ;;
  both)       CMD='MASTRA_FILE=./mastra-guide.mjs node --import ./instrument.mjs run-agent.mjs' ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
PORT="$MOCK_PORT" node "$DIR/mock.mjs" > "$DIR/mock-$VARIANT.log" 2>&1 &
MOCK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && curl -s -o /dev/null "$MOCK/" && break; sleep 0.1; done

# The DSN points at the sink (the exporter has no tunnel option); SENTRY_DEBUG is read by @sentry/node's init.
export SENTRY_DSN="http://public@127.0.0.1:${SINK_PORT}/1"
export SENTRY_DEBUG=1
export OPENAI_BASE_URL="$MOCK/v1"
export OPENAI_API_KEY="mock-key"
eval "timeout 90 env $CMD > \"$DIR/app-$VARIANT.log\" 2>&1 &"
APP_PID=$!

# Poll for the sentinel event and the sentinel span; hard deadline 60 s, no fixed sleeps. If the app has
# exited, give the in-flight flush 5 more seconds and stop.
DEAD=0
for _ in $(seq 1 300); do
  if curl -s "$SINK/__items" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const i=JSON.parse(s);
  const ev=i.some(x=>x.type==="event"&&x.message==="sentinel");
  const sp=i.some(x=>x.type==="span"&&(x.raw||[]).some(r=>r.name==="sentinel"));
  process.exit(ev&&sp?0:1);
})'; then break; fi
  if ! kill -0 "$APP_PID" 2>/dev/null; then DEAD=$((DEAD+1)); [ "$DEAD" -ge 25 ] && break; fi
  sleep 0.2
done
wait "$APP_PID"; APP_EXIT=$?

REPRO_ROOT="$(cd "$DIR/../.." && pwd)"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/app-$VARIANT.log" "$DIR/mock-$VARIANT.log"
node "$DIR/summarize.mjs" "$VARIANT" "$CMD" "$DIR/app-$VARIANT.log" "$DIR/mock-$VARIANT.log" "$SINK" "$APP_EXIT" > "$DIR/results-$VARIANT.json"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/results-$VARIANT.json"

kill "$MOCK_PID" 2>/dev/null; wait "$MOCK_PID" 2>/dev/null
kill "$SINK_PID" 2>/dev/null; wait "$SINK_PID" 2>/dev/null
echo "wrote results-$VARIANT.json (app exit $APP_EXIT, app log: app-$VARIANT.log)"

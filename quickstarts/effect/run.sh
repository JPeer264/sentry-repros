#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   issues              node verify-issues.ts             (Verify > Issues snippet, v3 layer with tracer + logger, NodeRuntime.runMain)
#   metrics             node verify-issues-metrics.ts     (same, layer with all four options incl. SentryEffectMetricsLayer)
#   issues-errors-only  node verify-issues-errors-only.ts (same, layer with only Sentry.effectLayer)
#   tracing             node verify-tracing.ts            (Verify > Tracing snippet, Effect.withSpan)
#   logs                node verify-logs.ts               (Verify > Logs snippet)
#   runpromise          node verify-runpromise.ts         (Issues snippet run with Effect.runPromise, no catch)
#   launch              node main.ts                      (Configure snippet verbatim, Layer.launch + ./Http.js)
#   v4                  node v4/verify-all.ts             (Effect v4 Server tab layer, tracing + logs snippets)
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-issues}"
SINK_PORT="${SINK_PORT:-4737}"
SINK="http://127.0.0.1:${SINK_PORT}"
if lsof -nP -iTCP:"$SINK_PORT" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $SINK_PORT is busy"; exit 1; fi

cd "$DIR"
PKG_DIR="$DIR"
EXPECT_SENTINEL=1
case "$VARIANT" in
  issues)             CMD='node verify-issues.ts' ;;
  metrics)            CMD='node verify-issues-metrics.ts' ;;
  issues-errors-only) CMD='node verify-issues-errors-only.ts' ;;
  tracing)            CMD='node verify-tracing.ts' ;;
  logs)               CMD='node verify-logs.ts' ;;
  runpromise)         CMD='node verify-runpromise.ts'; EXPECT_SENTINEL=0 ;;
  launch)             CMD='node main.ts' ;;
  v4)                 CMD='node verify-all.ts'; PKG_DIR="$DIR/v4" ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

export SENTRY_TUNNEL="$SINK/"
# The programs exit on their own; the 60 s cap only guards a hang (Layer.launch never returns by design).
( cd "$PKG_DIR" && timeout 60 bash -c "$CMD" ) > "$DIR/app-$VARIANT.log" 2>&1
APP_EXIT=$?

# Wait for the sentinel event and the sentinel span. No fixed sleeps; hard deadline 60 s.
if [ "$EXPECT_SENTINEL" = 1 ]; then
  for _ in $(seq 1 300); do
    if curl -s "$SINK/__items?raw=1" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const r=JSON.parse(s);
  const ev=r.some(x=>x.header.type==="event"&&x.payload.message==="sentinel");
  const sp=r.some(x=>x.header.type==="span"&&(x.payload.items||[]).some(i=>i.name==="sentinel"));
  process.exit(ev&&sp?0:1);
})'; then break; fi
    sleep 0.2
  done
fi

REPRO_ROOT="$(cd "$DIR/../.." && pwd)"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/app-$VARIANT.log"
node "$DIR/summarize.mjs" "$VARIANT" "$CMD" "$DIR/app-$VARIANT.log" "$SINK" "$APP_EXIT" "$PKG_DIR" "$EXPECT_SENTINEL" > "$DIR/results-$VARIANT.json"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/results-$VARIANT.json"

kill "$SINK_PID" 2>/dev/null; wait "$SINK_PID" 2>/dev/null
echo "wrote results-$VARIANT.json (exit $APP_EXIT, log: app-$VARIANT.log)"

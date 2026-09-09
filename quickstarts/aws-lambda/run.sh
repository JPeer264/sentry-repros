#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   auto-cjs              Option A env (NODE_OPTIONS="--import @sentry/aws-serverless/awslambda-auto", SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE) + CommonJS verify handler
#   auto-esm-verbatim     Option A + ESM verify handler verbatim (index.mdx:48-54, has a stray ")")
#   auto-esm              Option A + ESM verify handler with the stray ")" removed (Sentry.wrapHandler around the handler)
#   auto-esm-plain        Option A + ESM handler without wrapHandler
#   auto-no-lambda-env    Option A without LAMBDA_TASK_ROOT/_HANDLER (plain `node`, what a local run sees)
#   require-auto          NODE_OPTIONS="--require @sentry/aws-serverless/awslambda-auto" + CommonJS handler
#   manual-cjs            Option B: NODE_OPTIONS="--import ./instrument.js" + CommonJS verify handler
#   manual-esm-as-printed Option B ESM tab as printed: only instrument.mjs exists, NODE_OPTIONS="--import ./instrument.js" (run from esm-tab/)
#   manual-esm            Option B: NODE_OPTIONS="--import ./instrument.mjs" + ESM handler without wrapHandler
#   manual-esm-wrap       Option B: NODE_OPTIONS="--import ./instrument.mjs" + ESM verify handler (wrapHandler)
#   manual-esm-wrap-options Option B + lambda-wrapper.mdx options (captureTimeoutWarning: false) on a 300 ms handler with 600 ms remaining
#   wrap-only             Option B init, wrapHandler handler, no LAMBDA_TASK_ROOT/_HANDLER (what wrapHandler alone produces)
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-auto-cjs}"
SINK_PORT="${SINK_PORT:-4741}"
SINK="http://127.0.0.1:${SINK_PORT}"
if lsof -nP -iTCP:"$SINK_PORT" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $SINK_PORT is busy"; exit 1; fi
cd "$DIR"

DSN="http://public@127.0.0.1:${SINK_PORT}/1"
LAMBDA_ENV="LAMBDA_TASK_ROOT=$DIR AWS_LAMBDA_FUNCTION_NAME=qs-aws-lambda AWS_LAMBDA_FUNCTION_VERSION='\$LATEST' AWS_LAMBDA_FUNCTION_MEMORY_SIZE=128 AWS_REGION=us-east-1 AWS_DEFAULT_REGION=us-east-1 AWS_EXECUTION_ENV=AWS_Lambda_nodejs22.x AWS_LAMBDA_LOG_GROUP_NAME=/aws/lambda/qs-aws-lambda AWS_LAMBDA_LOG_STREAM_NAME='2026/09/09/[\$LATEST]0123456789abcdef' AWS_LAMBDA_INITIALIZATION_TYPE=on-demand"
AUTO_ENV="NODE_OPTIONS=\"--import @sentry/aws-serverless/awslambda-auto\" SENTRY_DSN=\"$DSN\" SENTRY_TRACES_SAMPLE_RATE=\"1.0\" SENTRY_DEBUG=1"
RUN="timeout 60 node invoke.mjs"
case "$VARIANT" in
  auto-cjs)              CMD="$LAMBDA_ENV _HANDLER=handler-cjs.handler $AUTO_ENV $RUN" ;;
  auto-esm-verbatim)     CMD="$LAMBDA_ENV _HANDLER=handler-esm-verbatim.handler $AUTO_ENV $RUN" ;;
  auto-esm)              CMD="$LAMBDA_ENV _HANDLER=handler-esm.handler $AUTO_ENV $RUN" ;;
  auto-esm-plain)        CMD="$LAMBDA_ENV _HANDLER=handler-esm-plain.handler $AUTO_ENV $RUN" ;;
  auto-no-lambda-env)    CMD="HANDLER_FILE=handler-cjs.handler $AUTO_ENV $RUN" ;;
  require-auto)          CMD="$LAMBDA_ENV _HANDLER=handler-cjs.handler NODE_OPTIONS=\"--require @sentry/aws-serverless/awslambda-auto\" SENTRY_DSN=\"$DSN\" SENTRY_TRACES_SAMPLE_RATE=\"1.0\" SENTRY_DEBUG=1 $RUN" ;;
  manual-cjs)            CMD="$LAMBDA_ENV _HANDLER=handler-cjs.handler NODE_OPTIONS=\"--import ./instrument.js\" $RUN" ;;
  manual-esm-as-printed) CMD="cd esm-tab && $LAMBDA_ENV _HANDLER=handler-esm-plain.handler NODE_OPTIONS=\"--import ./instrument.js\" timeout 60 node ../invoke.mjs" ;;
  manual-esm)            CMD="$LAMBDA_ENV _HANDLER=handler-esm-plain.handler NODE_OPTIONS=\"--import ./instrument.mjs\" $RUN" ;;
  manual-esm-wrap)       CMD="$LAMBDA_ENV _HANDLER=handler-esm.handler NODE_OPTIONS=\"--import ./instrument.mjs\" $RUN" ;;
  manual-esm-wrap-options) CMD="$LAMBDA_ENV _HANDLER=handler-esm-options.handler LAMBDA_REMAINING_MS=600 NODE_OPTIONS=\"--import ./instrument.mjs\" $RUN" ;;
  wrap-only)             CMD="HANDLER_FILE=handler-esm.handler NODE_OPTIONS=\"--import ./instrument.mjs\" $RUN" ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

(eval "$CMD") > "$DIR/app-$VARIANT.log" 2>&1
EXIT=$?

# Sentinel discipline: the runner captures a "sentinel" message and a "sentinel" span last and flushes; poll the sink
# for both (hard deadline 60 s, no fixed sleeps). Skipped when the runner never got as far as sending them.
SENTINEL_STATE="not-sent"
if grep -q '\[invoke\] sentinel sent' "$DIR/app-$VARIANT.log"; then
  SENTINEL_STATE="timeout"
  for _ in $(seq 1 300); do
    if curl -s "$SINK/__items" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const i=JSON.parse(s);
  const ev=i.some(x=>x.type==="event"&&x.message==="sentinel");
  const sp=i.some(x=>x.type==="span"&&(x.raw||[]).some(r=>r.is_segment&&r.name==="sentinel"));
  process.exit(ev&&sp?0:1);
})'; then SENTINEL_STATE="arrived"; break; fi
    sleep 0.2
  done
fi

REPRO_ROOT="$(cd "$DIR/../.." && pwd)"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/app-$VARIANT.log"
node "$DIR/summarize.mjs" "$VARIANT" "$CMD" "$DIR/app-$VARIANT.log" "$SINK" "$EXIT" "$SENTINEL_STATE" > "$DIR/results-$VARIANT.json"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g; s#$(command -v node)#\$NODE#g" "$DIR/results-$VARIANT.json"

kill "$SINK_PID" 2>/dev/null; wait "$SINK_PID" 2>/dev/null
echo "wrote results-$VARIANT.json (exit $EXIT, sentinel $SENTINEL_STATE, app log: app-$VARIANT.log)"

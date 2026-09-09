#!/usr/bin/env bash
# Usage: ./run.sh <variant>
# Every variant serves one function file with @google-cloud/functions-framework on 127.0.0.1:4744 and points the
# SDK's `tunnel` at the sink on 127.0.0.1:4743. The variants map to the guide's snippets (see README.md).
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-http-config}"
SINK_PORT="${SINK_PORT:-4743}"
APP_PORT="${APP_PORT:-4744}"
SINK="http://127.0.0.1:${SINK_PORT}"
APP="http://127.0.0.1:${APP_PORT}"
for p in "$SINK_PORT" "$APP_PORT"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is busy"; exit 1; fi
done

cd "$DIR"
FF="node node_modules/@google-cloud/functions-framework/build/src/main.js"
EXPECT_SPANS=1
EXPECT_KIND=error
ENVPREFIX=""
case "$VARIANT" in
  http-config)            FILE=function-http.js; TARGET=helloHttp; SIG=http; SNIPPET='getting-started-config/javascript.gcp-functions.mdx:1-37 (Http tab, performance option)' ;;
  http-config-env)        FILE=function-http.js; TARGET=helloHttp; SIG=http; ENVPREFIX='FUNCTION_TARGET=helloHttp K_SERVICE=helloHttp '; SNIPPET='same file, FUNCTION_TARGET/K_SERVICE set as on Cloud Run' ;;
  http-errors-only)       FILE=function-http-errors-only.js; TARGET=helloHttp; SIG=http; EXPECT_SPANS=0; SNIPPET='getting-started-config/javascript.gcp-functions.mdx:1-37 (Http tab, error-monitoring option only)' ;;
  http-verify)            FILE=function-http-verify.js; TARGET=helloHttp; SIG=http; SNIPPET='guides/gcp-functions/index.mdx:96-98 (Verify > Issues, Http tab)' ;;
  http-tracing)           FILE=function-http-tracing.js; TARGET=helloHttp; SIG=http; EXPECT_KIND=ok; SNIPPET='guides/gcp-functions/index.mdx:131-141 (Verify > Tracing, Http tab)' ;;
  event-config)           FILE=function-event.js; TARGET=helloEvents; SIG=event; SNIPPET='getting-started-config/javascript.gcp-functions.mdx:39-76 (Background tab)' ;;
  event-verify)           FILE=function-event-verify.js; TARGET=helloBackground; SIG=event; SNIPPET='guides/gcp-functions/index.mdx:102-106 (Verify > Issues, Background tab)' ;;
  event-tracing-verbatim) FILE=function-event-tracing-verbatim.js; TARGET=helloBackground; SIG=event; EXPECT_KIND=ok; SNIPPET='guides/gcp-functions/index.mdx:145-155 (Verify > Tracing, Background tab)' ;;
  event-tracing)          FILE=function-event-tracing.js; TARGET=helloBackground; SIG=event; EXPECT_KIND=ok; SNIPPET='guides/gcp-functions/index.mdx:145-155 with wrapEventFunction instead of wrapBackgroundFunction (repro-only rename)' ;;
  cloudevent-config)      FILE=function-cloudevent.js; TARGET=helloEvents; SIG=cloudevent; SNIPPET='getting-started-config/javascript.gcp-functions.mdx:78-115 (CloudEvent tab)' ;;
  cloudevent-verify)      FILE=function-cloudevent-verify.js; TARGET=helloEvents; SIG=cloudevent; SNIPPET='guides/gcp-functions/index.mdx:110-112 (Verify > Issues, CloudEvent tab)' ;;
  cloudevent-tracing)     FILE=function-cloudevent-tracing.js; TARGET=helloEvent; SIG=cloudevent; EXPECT_KIND=ok; SNIPPET='guides/gcp-functions/index.mdx:159-167 (Verify > Tracing, CloudEvent tab)' ;;
  auto-instrumentation)   FILE=function-auto-instrumentation.js; TARGET=helloHttp; SIG=http; SNIPPET='guides/gcp-functions/tracing/instrumentation/automatic-instrumentation.mdx:23-37' ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac
if [ -n "$ENVPREFIX" ]; then
  CMD="${ENVPREFIX}${FF} --signature-type=$SIG --source=./$FILE --port=$APP_PORT"
else
  CMD="$FF --target=$TARGET --signature-type=$SIG --source=./$FILE --port=$APP_PORT"
fi

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

export SENTRY_TUNNEL="$SINK/"
eval "$CMD > \"$DIR/app-$VARIANT.log\" 2>&1 &"
APP_PID=$!

# /robots.txt is answered by the framework itself (404) without invoking the function
ALIVE=1
for _ in $(seq 1 100); do
  if ! kill -0 "$APP_PID" 2>/dev/null; then ALIVE=0; break; fi
  curl -s -o /dev/null "$APP/robots.txt" && break
  sleep 0.1
done

STEPS="$DIR/.steps-$VARIANT.jsonl"; : > "$STEPS"
step() {
  local name="$1" url="$2"; shift 2
  local out rc
  out=$(curl -s -o "$DIR/.body-$VARIANT.txt" -w '%{http_code} %{time_total}' --max-time 10 "$@" "$url" 2>/dev/null); rc=$?
  local body; body=$(head -c 300 "$DIR/.body-$VARIANT.txt" | tr '\n' ' ' | sed 's/"/\\"/g')
  echo "{\"route\":\"$name\",\"http_code\":\"${out%% *}\",\"seconds\":\"${out##* }\",\"curl_exit\":$rc,\"body\":\"$body\"}" >> "$STEPS"
}

EVENT_BODY='{"context":{"eventId":"evt-1","timestamp":"2026-09-09T00:00:00.000Z","eventType":"google.pubsub.topic.publish","resource":"projects/p/topics/t"},"data":{"@type":"type.googleapis.com/google.pubsub.v1.PubsubMessage","data":"aGVsbG8="}}'
CE_BODY='{"specversion":"1.0","type":"google.cloud.pubsub.topic.v1.messagePublished","source":"//pubsub.googleapis.com/projects/p/topics/t","id":"ce-1","time":"2026-09-09T00:00:00.000Z","data":{"message":{"data":"aGVsbG8="}}}'

if [ "$ALIVE" = 1 ]; then
  case "$SIG" in
    http)
      step "GET /" "$APP/"
      step "GET /some/path?x=1" "$APP/some/path?x=1" -H "sentry-trace: 12345678901234567890123456789012-1234567890123456-1" -H "baggage: sentry-trace_id=12345678901234567890123456789012,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true" ;;
    event)
      step "POST / (legacy event)" "$APP/" -X POST -H 'content-type: application/json' --data "$EVENT_BODY" ;;
    cloudevent)
      step "POST / (cloudevent)" "$APP/" -X POST -H 'content-type: application/cloudevents+json' --data "$CE_BODY" ;;
  esac

  # Sentinel: the function file installs a SIGUSR2 handler that captures a message, a span and a log line
  # through the same client, then flushes. Poll the sink for those; no fixed sleeps, hard deadline 60 s.
  if kill -0 "$APP_PID" 2>/dev/null; then kill -USR2 "$APP_PID"; echo '{"route":"sentinel (SIGUSR2)","http_code":"-","seconds":"0","curl_exit":0,"body":""}' >> "$STEPS"; fi
  for _ in $(seq 1 300); do
    if ! kill -0 "$APP_PID" 2>/dev/null; then ALIVE=0; break; fi
    if curl -s "$SINK/__items" | EXPECT_SPANS="$EXPECT_SPANS" node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const i=JSON.parse(s);
  const sentinel=i.some(x=>x.type==="event"&&x.message==="sentinel");
  const sentinelSpan=process.env.EXPECT_SPANS==="0"||i.some(x=>x.type==="span"&&(x.raw||[]).some(r=>r.is_segment&&r.name==="sentinel"));
  const log=i.some(x=>x.type==="log");
  process.exit(sentinel&&sentinelSpan&&log?0:1);
})'; then break; fi
    sleep 0.2
  done
fi

REPRO_ROOT="$(cd "$DIR/../.." && pwd)"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/app-$VARIANT.log"
node "$DIR/summarize.mjs" "$VARIANT" "$CMD" "$DIR/app-$VARIANT.log" "$STEPS" "$SINK" "$ALIVE" "$EXPECT_SPANS" "$EXPECT_KIND" "$SNIPPET" > "$DIR/results-$VARIANT.json"
rm -f "$STEPS" "$DIR/.body-$VARIANT.txt"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/results-$VARIANT.json"

kill "$APP_PID" 2>/dev/null; wait "$APP_PID" 2>/dev/null
kill "$SINK_PID" 2>/dev/null; wait "$SINK_PID" 2>/dev/null
echo "wrote results-$VARIANT.json (app log: app-$VARIANT.log)"

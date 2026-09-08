#!/bin/sh
# One run of one variant. Starts its own sink and app, drives the routes,
# waits for the sentinel, then kills both.
set -u
DIR=$(cd "$(dirname "$0")" && pwd)
DIST=${DIST:-dist}
BUN=${BUN:-bun}
LABEL=${LABEL:-run}
SINK_PORT=${SINK_PORT:-41873}
PORT=${PORT:-41874}
SENTRY_NEST=${SENTRY_NEST:-1}
SENTRY_FILTER=${SENTRY_FILTER:-1}
SENTRY_LIFECYCLE=${SENTRY_LIFECYCLE:-stream}

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$LABEL.log" 2>&1 &
sink=$!

PORT="$PORT" SINK_PORT="$SINK_PORT" SENTRY_NEST="$SENTRY_NEST" SENTRY_FILTER="$SENTRY_FILTER" \
  SENTRY_LIFECYCLE="$SENTRY_LIFECYCLE" "$BUN" "$DIR/$DIST/app.js" > "$DIR/app-$LABEL.log" 2>&1 &
app=$!

PORT="$PORT" SINK_PORT="$SINK_PORT" node "$DIR/drive.mjs" > "$DIR/drive-$LABEL.log" 2>&1

kill $app 2>/dev/null
kill $sink 2>/dev/null
wait $app 2>/dev/null
wait $sink 2>/dev/null
echo "=== app-$LABEL.log ==="
cat "$DIR/app-$LABEL.log"
echo "=== drive-$LABEL.log ==="
cat "$DIR/drive-$LABEL.log"

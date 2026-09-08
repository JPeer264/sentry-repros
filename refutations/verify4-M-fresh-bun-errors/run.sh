#!/bin/bash
# usage: run.sh <wiring> <lifecycle> <capture_console 0|1> <tag>
set -u
D="$(cd "$(dirname "$0")" && pwd)"
SINK_PORT=51873
APP_PORT=51874
WIRING="$1"; LIFECYCLE="$2"; CC="$3"; TAG="$4"
curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null
cd "$D"
SINK_PORT=$SINK_PORT PORT=$APP_PORT LIFECYCLE=$LIFECYCLE WIRING=$WIRING CAPTURE_CONSOLE=$CC \
  bun entry.ts > "$D/app-$TAG.log" 2>&1 &
APP_PID=$!
for i in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:$APP_PORT/api/probe"; then break; fi
  sleep 0.3
done
echo "--- HTTP responses"
echo "boom:      $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$APP_PORT/boom)"
echo "boomasync: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$APP_PORT/boomasync)"
echo "users/42:  $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$APP_PORT/users/42)"
curl -s -o /dev/null "http://127.0.0.1:$APP_PORT/sentinel"
for i in $(seq 1 60); do
  if curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q '"sentinel"'; then break; fi
  sleep 0.3
done
echo "--- sink items"
curl -s "http://127.0.0.1:$SINK_PORT/__items" > "$D/items-$TAG.json"
node -e 'const a=require(process.argv[1]);for(const i of a)console.log(JSON.stringify(i))' "$D/items-$TAG.json"
kill $APP_PID; wait $APP_PID 2>/dev/null
echo "--- app stderr (first 12 lines)"
head -12 "$D/app-$TAG.log"

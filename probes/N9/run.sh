#!/bin/bash
# N9 - Fresh 2 on Deno. Runs the three variants and writes items-*.json next to this script.
# Ports: SINK_PORT=41339 ECHO_PORT=41338 APP_PORT=41504 DEV_PORT=41503
set -u
cd "$(dirname "$0")"

SINK_PORT=${SINK_PORT:-41339}
ECHO_PORT=${ECHO_PORT:-41338}
APP_PORT=${APP_PORT:-41504}
DEV_PORT=${DEV_PORT:-41503}
export SINK_PORT ECHO_PORT

PORT=$SINK_PORT node sink.mjs > sink.log 2>&1 &
sinkpid=$!
PORT=$ECHO_PORT node echo.mjs > echo.log 2>&1 &
echopid=$!
sleep 1

drive() { # drive <base-url> <paths...>
  local base=$1; shift
  for p in "$@"; do
    printf '%s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$base$p")"
  done
  for _ in $(seq 1 30); do
    n=$(curl -s "http://127.0.0.1:$SINK_PORT/__items" | python3 -c 'import sys,json;print(sum(1 for x in json.load(sys.stdin) if x.get("message")=="sentinel"))')
    [ "$n" -ge 1 ] && break
    sleep 1
  done
  sleep 2
}

[ -f _fresh/server.js ] || deno task build > build.log 2>&1

# 1) production shape, hook on, no workaround
curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null
deno serve -A --port "$APP_PORT" _fresh/server.js > prod.log 2>&1 &
apid=$!
sleep 5
drive "http://127.0.0.1:$APP_PORT" / /api/data /boom /api2/bob /api/alice /sentinel
curl -s "http://127.0.0.1:$SINK_PORT/__items" | python3 -m json.tool > items-prod.json
kill $apid; wait $apid 2>/dev/null

# 2) same, with the try/catch middleware enabled
curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null
N9_WORKAROUND=1 deno serve -A --port "$APP_PORT" _fresh/server.js > prod-workaround.log 2>&1 &
apid=$!
sleep 5
drive "http://127.0.0.1:$APP_PORT" /boom /sentinel
curl -s "http://127.0.0.1:$SINK_PORT/__items" | python3 -m json.tool > items-prod-workaround.json
kill $apid; wait $apid 2>/dev/null

# 3) K3 cross-check: dev server with the @sentry/deno/import hook commented out
python3 -c 'p="main.ts";s=open(p).read();open(p,"w").write("// no-hook run: "+s)'
curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null
deno task dev --port "$DEV_PORT" > dev-nohook.log 2>&1 &
dpid=$!
sleep 12
drive "http://127.0.0.1:$DEV_PORT" / /boom /api/alice /sentinel
curl -s "http://127.0.0.1:$SINK_PORT/__items" | python3 -m json.tool > items-dev-nohook.json
kill $dpid; wait $dpid 2>/dev/null
python3 -c 'p="main.ts";s=open(p).read();open(p,"w").write(s.replace("// no-hook run: ","",1))'

kill $sinkpid; wait $sinkpid 2>/dev/null
kill $echopid; wait $echopid 2>/dev/null
echo "wrote items-prod.json items-prod-workaround.json items-dev-nohook.json"

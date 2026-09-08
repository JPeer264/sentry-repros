#!/bin/bash
# usage: ./run3.sh <appdir> <label> <entry.ts> [deno flags...]
# Runs one Deno entry under one permission flag set, drives it with a separate curl
# process, waits for the sentinel envelope, and writes out2/<label>/{app.log,items.json}.
set -u
APPDIR="$1"; LABEL="$2"; ENTRY="$3"; shift 3
FLAGS=("$@")

SINK_PORT="${SINK_PORT:-52847}"
APP_PORT="${APP_PORT:-52848}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/out2/$LABEL"
mkdir -p "$OUT"

curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null

cd "$APPDIR" || exit 1
{
  echo "CMD: deno run ${FLAGS[*]} $ENTRY"
} > "$OUT/app.log"
deno run "${FLAGS[@]}" "$ENTRY" "$SINK_PORT" "$APP_PORT" >> "$OUT/app.log" 2>&1 < /dev/null &
apid=$!

listening=""
for _ in $(seq 1 60); do
  if grep -q "LISTENING $APP_PORT" "$OUT/app.log" 2>/dev/null; then listening=1; break; fi
  if ! kill -0 $apid 2>/dev/null; then break; fi
  sleep 0.5
done

if [ -z "$listening" ]; then
  echo "NO_PORT (process exited or never listened)" >> "$OUT/app.log"
  echo "[]" > "$OUT/items.json"
  kill $apid 2>/dev/null; wait $apid 2>/dev/null
  echo "== $LABEL: NO_PORT"
  exit 0
fi

curl -s -o /dev/null "http://127.0.0.1:$APP_PORT/boom"
curl -s -o /dev/null "http://127.0.0.1:$APP_PORT/sentinel"

for _ in $(seq 1 40); do
  if curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q '"sentinel"'; then break; fi
  sleep 0.5
done

curl -s "http://127.0.0.1:$SINK_PORT/__items" > "$OUT/items.json"
kill $apid 2>/dev/null; wait $apid 2>/dev/null
echo "== $LABEL: $(python3 -c 'import json,sys;print(len(json.load(open(sys.argv[1]))))' "$OUT/items.json") items"

#!/bin/bash
# usage: ./run.sh <sinkport> <label> <entry.ts> <deno flags...>
D="$(cd "$(dirname "$0")" && pwd)"
port=$1; label=$2; entry=$3; shift 3
cd "$D"
curl -s -X DELETE "http://127.0.0.1:$port/__items" > /dev/null
deno run --no-prompt "$@" "$entry" "$port" "$label" > "app-$label.log" 2>&1
echo "deno exit=$? label=$label"
for _ in $(seq 1 40); do
  if curl -s "http://127.0.0.1:$port/__items" | grep -q '"sentinel"'; then break; fi
  perl -e 'select undef,undef,undef,0.25'
done
curl -s "http://127.0.0.1:$port/__items"      > "items-$label.json"
curl -s "http://127.0.0.1:$port/__items?raw"  > "raw-$label.json"
curl -s "http://127.0.0.1:$port/__target-hits" > "target-$label.json"
python3 -c "import json,sys; d=json.load(open('items-$label.json')); print('items:', [ (i.get('type'), i.get('message') or i.get('exception')) for i in d ])"

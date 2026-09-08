#!/bin/sh
# usage: ./run.sh <script.ts> <sink-port>
set -u
dir=$(cd "$(dirname "$0")" && pwd)
script=$1
port=$2
curl -s -X DELETE "http://127.0.0.1:$port/__items" > /dev/null
echo "== $script"
SINK_PORT=$port deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys "$dir/$script" > "$dir/$script.out" 2>&1
echo "exit=$?"
cat "$dir/$script.out"
echo "== sink:"
curl -s "http://127.0.0.1:$port/__items" | python3 -c 'import json,sys;[print(json.dumps(i)) for i in json.load(sys.stdin)]'
echo

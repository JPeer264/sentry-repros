#!/bin/sh
# usage: ./run.sh <sink-port> [deno-binary]
set -u
dir=$(cd "$(dirname "$0")" && pwd)
port=$1
DENO=${2:-deno}

for f in a-nohook b-noop b2-resolve-only c-sentry d2-express-nohook d3-express-noop d-express \
         e-format-json e2-ctx e3-workaround e4-esm-json e4b-esm-json-nohook f-sentry-fixed \
         g0-koa-nohook g-koa g2-koa-sentry; do
  echo "--- $f"
  SINK_PORT=$port $DENO run --no-prompt --allow-net --allow-env --allow-read --allow-sys "$dir/$f.mjs" 2>&1
done

echo "--- unstable flags on b-noop"
for fl in --unstable-node-globals --unstable-sloppy-imports --unstable-detect-cjs \
          --unstable-bare-node-builtins --unstable-npm-lazy-caching --unstable-unsafe-proto --unstable; do
  printf '%s -> ' "$fl"
  $DENO run --no-prompt --allow-all $fl "$dir/b-noop.mjs" 2>&1 | grep RESULT
done
printf 'all-four-combined -> '
$DENO run --no-prompt --allow-all --unstable-node-globals --unstable-sloppy-imports \
  --unstable-detect-cjs --unstable-bare-node-builtins "$dir/b-noop.mjs" 2>&1 | grep RESULT

echo "--- sink"
curl -s "http://127.0.0.1:$port/__items" | python3 -c 'import json,sys;[print(json.dumps(i)) for i in json.load(sys.stdin)]'

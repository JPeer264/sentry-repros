#!/bin/bash
# usage: ./run.sh   (ports below are the ones used in the README)
# `deno serve` does not exit on SIGTERM, so every app process is killed with -9.
set -u
SINK_PORT=39147
SINGLE_PORT=58211
PAR_PORT=58223
DENO_PORT=41551
export SINK="http://127.0.0.1:$SINK_PORT/"
export MYSQL_PORT=3307
DENO_FLAGS="--no-prompt --allow-net --allow-env --allow-read --allow-sys --config deno.json"

PORT=$SINK_PORT node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1

# 1. deno serve, single worker
deno serve $DENO_FLAGS --port $SINGLE_PORT serve.ts > serve-single.log 2>&1 & apid=$!
sleep 5
node drive.mjs $SINGLE_PORT $SINK_PORT 6 > out-single.txt 2>&1
curl -s "http://127.0.0.1:$SINK_PORT/__items?raw=1" > raw-single.json
kill -9 $apid; sleep 2

# 2. deno serve --parallel
deno serve --parallel $DENO_FLAGS --port $PAR_PORT serve.ts > serve-par.log 2>&1 & apid=$!
sleep 10
node drive.mjs $PAR_PORT $SINK_PORT 40 > out-par.txt 2>&1
kill -9 $apid; sleep 2

# 3. plain Deno.serve baseline
PORT=$DENO_PORT deno run $DENO_FLAGS run.ts > run-denoserve.log 2>&1 & apid=$!
sleep 5
node drive.mjs $DENO_PORT $SINK_PORT 3 > out-denoserve.txt 2>&1
kill -9 $apid; sleep 2

# 4. docs-shaped entry, no @sentry/deno/import line
deno serve $DENO_FLAGS --port $PAR_PORT serve-nohook.ts > serve-nohook.log 2>&1 & apid=$!
sleep 6
node drive.mjs $PAR_PORT $SINK_PORT 4 > out-nohook.txt 2>&1
kill -9 $apid

kill $spid
echo "done"

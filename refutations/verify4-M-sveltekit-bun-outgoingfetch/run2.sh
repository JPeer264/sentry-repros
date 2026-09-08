#!/bin/bash
# usage: run2.sh <label> <runtime: bun|node|bun1314> <sinkport> <appport>
set -u
S=$SCRATCH
D=$S/deep/verify4-M-sveltekit-bun-outgoingfetch
LABEL=$1; RT=$2; SP=$3; AP=$4
node $D/sink.mjs > $D/sink-$LABEL.log 2>&1 &
SINK=$!
PORT=$SP node $D/sink.mjs > $D/sink-$LABEL.log 2>&1 &
sleep 0

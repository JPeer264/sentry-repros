#!/bin/zsh
# $1=port $2=sinkport $3=FRESH_ISO $4=LIFECYCLE $5=logfile $6=pidfile
cd "$(dirname $0)/app"
SINK_PORT=$2 LIFECYCLE=$4 FRESH_ISO=$3 exec deno serve -A --port $1 _fresh/server.js

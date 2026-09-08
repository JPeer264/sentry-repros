#!/bin/bash
# $1=tag $2=port $3=GLOBALS_WHEN $4=NATIVE_FETCH $5=lifecycle
tag=$1; port=$2
curl -s -X DELETE http://127.0.0.1:44311/__items >/dev/null; curl -s http://127.0.0.1:44312/__clear >/dev/null
PORT=$port RECORDER_PORT=44312 SINK_URL=http://127.0.0.1:44311/ TRACE_LIFECYCLE=${5:-static} \
  GLOBALS_WHEN=$3 NATIVE_FETCH=$4 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server-flex.mjs > $tag.log 2>&1 &
pid=$!; echo $pid > $tag.pid
for i in $(seq 1 30); do grep -q READY $tag.log && break; sleep 1; done
curl -s "http://127.0.0.1:$port/out?kind=fetch" -o /dev/null -w "out-fetch %{http_code}\n"
curl -s "http://127.0.0.1:$port/users/42" -o /dev/null -w "users %{http_code}\n"
curl -s "http://127.0.0.1:$port/db" -o /dev/null -w "db %{http_code}\n"
curl -s "http://127.0.0.1:$port/boom/7" -o /dev/null -w "boom %{http_code}\n"
curl -s "http://127.0.0.1:$port/sentinel" -o /dev/null
sleep 4
echo "--- server log"; cat $tag.log
echo "--- recorder"; curl -s http://127.0.0.1:44312/__seen
echo; echo "--- sink"; curl -s http://127.0.0.1:44311/__items | python3 -c "import json,sys; [print(json.dumps(i)) for i in json.load(sys.stdin)]"
kill $pid 2>/dev/null; wait $pid 2>/dev/null

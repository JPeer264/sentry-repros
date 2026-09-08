set -u
D="$1"; LABEL="$2"; APORT="$3"; SPORT="$4"; shift 4
cd "$D/app"
curl -s -X DELETE "http://127.0.0.1:$SPORT/__items" >/dev/null
env "$@" PORT=$APORT HOST=127.0.0.1 SENTRY_TUNNEL="http://127.0.0.1:$SPORT/" deno run -A .output/server/index.mjs > "$D/r2-$LABEL.log" 2>&1 &
pid=$!
for i in $(seq 1 60); do
  if grep -q "Listening on" "$D/r2-$LABEL.log" 2>/dev/null; then break; fi
  /bin/sleep 0.5
done
echo "--- $LABEL http status:"
echo "  /api/error       -> $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$APORT/api/error)"
echo "  /api/error-async -> $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$APORT/api/error-async)"
curl -s "http://127.0.0.1:$APORT/api/sentinel" >/dev/null
for i in $(seq 1 40); do
  if curl -s "http://127.0.0.1:$SPORT/__items" | grep -q sentinel; then break; fi
  /bin/sleep 0.5
done
echo "--- $LABEL sink items:"
curl -s "http://127.0.0.1:$SPORT/__items" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const i of JSON.parse(s))console.log(JSON.stringify(i))})'
kill $pid 2>/dev/null; wait $pid 2>/dev/null

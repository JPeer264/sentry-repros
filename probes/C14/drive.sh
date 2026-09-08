#!/usr/bin/env bash
# usage: drive.sh <sink-port> <app-port>
set -u
SINK=$1
APP=$2
SENT="sentinel-$RANDOM"
now() { python3 -c "import time;print('%.3f' % time.time())"; }

curl -s -X DELETE "http://127.0.0.1:$SINK/__items" > /dev/null

echo "--- /stream  t_start=$(now)"
curl -s -N -w '[curl ttfb=%{time_starttransfer}s total=%{time_total}s]\n' "http://127.0.0.1:$APP/stream"

echo "--- /after   t_start=$(now)"
curl -s -N -w '[curl ttfb=%{time_starttransfer}s total=%{time_total}s]\n' "http://127.0.0.1:$APP/after"

# the "after" span ends ~500ms after the response, so send the sentinel later
sleep 1
curl -s "http://127.0.0.1:$APP/sentinel?m=$SENT" > /dev/null

for i in $(seq 1 40); do
  curl -s "http://127.0.0.1:$SINK/__items" | grep -q "$SENT" && break
  sleep 0.5
done

curl -s "http://127.0.0.1:$SINK/__items" | python3 -c '
import json,sys
for it in json.load(sys.stdin):
    if it["type"] == "span":
        print("span envelope arrived=%s" % it["arrived"])
        for s in it["items"]:
            print("  " + json.dumps(s))
    elif it["type"] == "transaction":
        print("transaction " + json.dumps(it))
    else:
        print(json.dumps(it))
'

sleep 3
echo "--- item count after 3 more seconds: $(curl -s "http://127.0.0.1:$SINK/__items" | python3 -c 'import json,sys;print(len(json.load(sys.stdin)))')"

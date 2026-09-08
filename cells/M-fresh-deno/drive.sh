#!/usr/bin/env bash
# usage: bash drive.sh http://127.0.0.1:<app-port>
set -u
B="$1"
TID=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
curl -s -o /dev/null -w 'boom %{http_code}\n'   "$B/api/boom"
curl -s -w ' <- users\n'                        "$B/api/users/42"
curl -s -o /dev/null "$B/api/iso?t=a" & curl -s -o /dev/null "$B/api/iso?t=b" & curl -s -o /dev/null "$B/api/iso?t=c" & wait
curl -s -w ' <- out\n'                          "$B/api/out"
curl -s -o /dev/null "$B/api/db"; curl -s -w ' <- db\n' "$B/api/db"
curl -s -w ' <- log\n'                          "$B/api/log"
curl -s -w ' <- msg\n' \
  -H "sentry-trace: $TID-bbbbbbbbbbbbbbbb-1" \
  -H "baggage: sentry-trace_id=$TID,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true" \
  "$B/api/msg"
curl -s -w ' <- sentinel\n'                     "$B/api/sentinel"

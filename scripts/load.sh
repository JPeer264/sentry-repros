#!/usr/bin/env bash
# Send the deterministic load: 100 requests (50 /burst?n=20, 25 /checkout, 25 /detached), five per
# second, each tagged with an x-request-id that validate.mjs expects. Records the UTC window for cpu.mjs.
#
# usage: scripts/load.sh <run-id> [on|off]
. "$(dirname "$0")/lib.sh" "$@"

base=$(worker_url)
failures="runs/${worker}.failures"
rm -f "$failures" "$window"

wait_healthy "$base"
stamp START

for spec in "burst?n=20:50:burst" "checkout:25:checkout" "detached:25:detached"; do
  endpoint=${spec%%:*}
  rest=${spec#*:}
  count=${rest%%:*}
  kind=${rest##*:}
  i=1
  while [[ $i -le $count ]]; do
    batch=0
    while [[ $batch -lt 5 && $i -le $count ]]; do
      id="${run}-${kind}-$(printf '%03d' "$i")"
      (
        code=$(curl -s -m 60 -o /dev/null -w "%{http_code}" -H "x-request-id: ${id}" "${base}/${endpoint}")
        [[ "$code" == "200" ]] || echo "${id} ${code}" >> "$failures"
      ) &
      i=$((i + 1))
      batch=$((batch + 1))
    done
    wait
    sleep 1
  done
done

stamp END

if [[ -s "$failures" ]]; then
  echo "non-200 requests:" >&2
  cat "$failures" >&2
  exit 1
fi
echo "sent 100 requests to ${base}"

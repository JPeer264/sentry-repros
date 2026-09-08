# C04 - Scheduled handler and cron monitors on Workers

Runtime: cloudflare (wrangler 4.129.0 / workerd local) | SDK: `@sentry/cloudflare` 10.67.0
(develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

A Worker whose `scheduled` handler is wrapped by `Sentry.withSentry` and whose body runs inside
`Sentry.withMonitor('probe-cron', ..., { schedule: { type: 'crontab', value: '* * * * *' } })`.
A module-scope run counter makes the second invocation of a warm isolate throw
`Error("cron boom run 2")`. Driving `/__scheduled` twice (wrangler's `--test-scheduled` endpoint)
shows what the SDK emits for a cron invocation: the segment span for the scheduled handler, the
`in_progress`/`ok` and `in_progress`/`error` check-in pairs of the monitor, the unhandled error
event, and whether each invocation gets its own `trace_id`. A `/sentinel` request through the
`fetch` handler acts as the sentinel that proves everything before it has reached the sink.

## Install

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  wrangler@4
```

Run it from this directory.

## Run

From this directory:

```
PORT=41237 node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1
npx wrangler dev --port 41238 --inspector-port 0 --test-scheduled > app.log 2>&1 & apid=$!
sleep 12                                                     # wait for "Ready on http://localhost:41238"
curl -s 'http://localhost:41238/__scheduled?cron=*+*+*+*+*'   # run 1: ok
curl -s 'http://localhost:41238/__scheduled?cron=*+*+*+*+*'   # run 2: throws
curl -s 'http://localhost:41238/sentinel?n=1'                 # sentinel
for i in $(seq 1 30); do out=$(curl -s http://127.0.0.1:41237/__items); echo "$out" | grep -q sentinel && break; sleep 0.5; done
echo "$out" > items.json
python3 -m json.tool items.json
grep -n "__scheduled\|Uncaught" app.log
kill $apid; kill $spid
```

Optional, for the "own trace per invocation" part (runs 3 and 4 of the same warm isolate):

```
curl -s -X DELETE http://127.0.0.1:41237/__items
curl -s 'http://localhost:41238/__scheduled?cron=*+*+*+*+*'
curl -s 'http://localhost:41238/__scheduled?cron=*+*+*+*+*'
curl -s 'http://localhost:41238/sentinel?n=2'
```

`sink.mjs` is `_toolbox/qs/sink.mjs` extended to keep the full `check_in` payload
(`check_in_id`, `monitor_slug`, `status`, `duration`, `monitor_config`, `contexts`), the per-span
`op`, `trace_id` and full attribute map, and the event's `contexts.cloud_resource`/`contexts.runtime`.

## Expected

Recorded verdict: **works**.

The `withSentry`-wrapped scheduled handler emits a segment span named `Scheduled Cron * * * * *`
with op `function` (source `task`, origin `auto.faas.cloudflare.scheduled`, `faas.cron`/`faas.time`/
`faas.trigger` attributes) as a `span` envelope (stream lifecycle). `withMonitor` sends `check_in`
`in_progress` then `ok` on run 1, and `in_progress` then `error` on run 2, all carrying
`monitor_config.schedule` and a trace context. The thrown error on run 2 is captured as an unhandled
event with mechanism `auto.faas.cloudflare.scheduled`, the segment span status becomes `error`, and
the exception is rethrown (wrangler returns 500 on `/__scheduled`). Every scheduled invocation gets
its own `trace_id`.

Recorded evidence lines:

```
{"type":"check_in","payload":{"check_in_id":"d6e2d44cb07a455f8343adcd9380c20c","monitor_slug":"probe-cron","status":"in_progress","monitor_config":{"schedule":{"type":"crontab","value":"* * * * *"}},"contexts":{"trace":{"span_id":"a3bfb0276d995e2e","trace_id":"e3cefab9e2944c78899c73da8d6fc5da"}}}}
{"type":"check_in","payload":{"check_in_id":"d6e2d44cb07a455f8343adcd9380c20c","monitor_slug":"probe-cron","status":"ok","duration":0.05099987983703613,"contexts":{"trace":{"span_id":"a3bfb0276d995e2e","trace_id":"e3cefab9e2944c78899c73da8d6fc5da"}}}}
{"type":"span","items":[{"name":"Scheduled Cron * * * * *","op":"function","status":"ok","is_segment":true,"trace_id":"e3cefab9e2944c78899c73da8d6fc5da","attrs":{"sentry.origin":"auto.faas.cloudflare.scheduled","sentry.op":"function","sentry.segment.name.source":"task","sentry.sample_rate":1,"faas.cron":"* * * * *","faas.time":"2026-09-04T08:19:58.959Z","faas.trigger":"timer","sentry.trace_lifecycle":"stream","sentry.segment.name":"Scheduled Cron * * * * *",...,"sentry.sdk.version":"10.67.0","cloud.provider":"cloudflare"}}]}
{"type":"check_in","payload":{"check_in_id":"dd44e9aed47543da80128d97d60ca823","monitor_slug":"probe-cron","status":"in_progress","monitor_config":{"schedule":{"type":"crontab","value":"* * * * *"}},"contexts":{"trace":{"span_id":"bf782bd7731630e0","trace_id":"843af2f222194e7c97bbee5512699a2b"}}}}
{"type":"check_in","payload":{"check_in_id":"dd44e9aed47543da80128d97d60ca823","monitor_slug":"probe-cron","status":"error","duration":0.05200004577636719,"contexts":{"trace":{"span_id":"bf782bd7731630e0","trace_id":"843af2f222194e7c97bbee5512699a2b"}}}}
{"type":"event","exception":"cron boom run 2","mechanism":"auto.faas.cloudflare.scheduled","handled":false,"sdk":"sentry.javascript.cloudflare","trace_id":"843af2f222194e7c97bbee5512699a2b","cloud_resource":{"cloud.provider":"cloudflare"},"runtime":{"name":"cloudflare"}}
{"type":"span","items":[{"name":"Scheduled Cron * * * * *","op":"function","status":"error","is_segment":true,"trace_id":"843af2f222194e7c97bbee5512699a2b","attrs":{"sentry.status.message":"internal_error","sentry.origin":"auto.faas.cloudflare.scheduled","sentry.op":"function","sentry.segment.name.source":"task",...}}]}
app.log: [wrangler:info] GET /__scheduled 200 OK (59ms) / Uncaught Error: cron boom run 2 / [wrangler:info] GET /__scheduled 500 Internal Server Error (57ms)
runs 3+4 (separate trace ids per invocation): check_in in_progress 13788e4e... trace 706f668859bc465d84ae7e8d43b04543 / check_in in_progress 075559af... trace e818d13516c94d3d81b49d6f3aff73d9
```

Recorded side notes kept for context: the scheduled segment has no child spans (`spans: []`);
the SDK still flushes the check-in, the error event and the span through `ctx.waitUntil` even though
the error is rethrown; and the ordering of the two check-ins over the wire is not guaranteed.

## Observed on 2026-09-07

Matches the recorded verdict. Full output in `items.json` (runs 1+2 + sentinel) and
`items-runs34.json` (runs 3+4 + sentinel); trimmed:

```
{"type":"check_in","payload":{"check_in_id":"7693153e87244093b64843ae6887180d","monitor_slug":"probe-cron","status":"in_progress","monitor_config":{"schedule":{"type":"crontab","value":"* * * * *"}},"contexts":{"trace":{"span_id":"885a39d883fa7446","trace_id":"faa4b4ab4918410c8f3025bc90a65e10"}}}}
{"type":"check_in","payload":{"check_in_id":"7693153e87244093b64843ae6887180d","monitor_slug":"probe-cron","status":"ok","duration":0,"contexts":{"trace":{"span_id":"885a39d883fa7446","trace_id":"faa4b4ab4918410c8f3025bc90a65e10"}}}}
{"type":"span","trace_id":"faa4b4ab4918410c8f3025bc90a65e10","items":["function Scheduled Cron * * * * *"],"raw":[{"name":"Scheduled Cron * * * * *","op":"function","status":"ok","is_segment":true,"trace_id":"faa4b4ab4918410c8f3025bc90a65e10","attrs":{"sentry.origin":"auto.faas.cloudflare.scheduled","sentry.op":"function","sentry.segment.name.source":"task","sentry.sample_rate":1,"faas.cron":"* * * * *","faas.time":"2026-09-07T08:54:42.712Z","faas.trigger":"timer","sentry.trace_lifecycle":"stream","sentry.segment.name":"Scheduled Cron * * * * *","sentry.segment.id":"885a39d883fa7446","sentry.sdk.name":"sentry.javascript.cloudflare","sentry.sdk.version":"10.67.0","sentry.environment":"production","cloud.provider":"cloudflare","sentry.sdk.integrations":[...]}}]}
{"type":"check_in","payload":{"check_in_id":"95f93392d95240abb88f8d545b7e304f","monitor_slug":"probe-cron","status":"in_progress","monitor_config":{"schedule":{"type":"crontab","value":"* * * * *"}},"contexts":{"trace":{"span_id":"8d40073a34934a8b","trace_id":"4ffbe77baf944a799b9b447c94c28071"}}}}
{"type":"check_in","payload":{"check_in_id":"95f93392d95240abb88f8d545b7e304f","monitor_slug":"probe-cron","status":"error","duration":0.0009999275207519531,"contexts":{"trace":{"span_id":"8d40073a34934a8b","trace_id":"4ffbe77baf944a799b9b447c94c28071"}}}}
{"type":"event","exception":"Error: cron boom run 2","mechanism":"auto.faas.cloudflare.scheduled","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","trace_id":"4ffbe77baf944a799b9b447c94c28071","cloud_resource":{"cloud.provider":"cloudflare"},"runtimeContext":{"name":"cloudflare"}}
{"type":"span","trace_id":"4ffbe77baf944a799b9b447c94c28071","items":["function Scheduled Cron * * * * *"],"raw":[{"name":"Scheduled Cron * * * * *","op":"function","status":"error","is_segment":true,"trace_id":"4ffbe77baf944a799b9b447c94c28071","attrs":{"sentry.status.message":"internal_error","sentry.origin":"auto.faas.cloudflare.scheduled","sentry.op":"function","sentry.segment.name.source":"task","sentry.sample_rate":1,"faas.cron":"* * * * *","faas.time":"2026-09-07T08:54:42.729Z","faas.trigger":"timer",...}}]}
{"type":"event","message":"sentinel 1","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare","trace_id":"60b735bae3a5418484692e44e9440956"}

app.log: [wrangler:info] GET /__scheduled 200 OK (9ms) / Uncaught Error: cron boom run 2 / [wrangler:info] GET /__scheduled 500 Internal Server Error (5ms)

runs 3+4 (items-runs34.json, separate trace ids per invocation):
check_in in_progress 84750819d8f14ac1b57986285aadf398 trace 98aea691ccac4b25bae7f4613e539dfe
check_in ok          84750819d8f14ac1b57986285aadf398 trace 98aea691ccac4b25bae7f4613e539dfe
check_in ok          0766ee8a9b064e7b9f804814483e0ec4 trace 467a4f65d15d4456817a1dafae9a44ab
check_in in_progress 0766ee8a9b064e7b9f804814483e0ec4 trace 467a4f65d15d4456817a1dafae9a44ab
```

Every recorded element reproduced: span name `Scheduled Cron * * * * *` with op `function`, source
`task`, origin `auto.faas.cloudflare.scheduled` and the three `faas.*` attributes; the
`in_progress`/`ok` and `in_progress`/`error` check-in pairs with `monitor_config.schedule` and a
trace context; the unhandled event with mechanism `auto.faas.cloudflare.scheduled` and
`handled: false`; the segment span flipping to `status: error` with
`sentry.status.message: internal_error`; the 200 then 500 on `/__scheduled` with the `Uncaught Error`
line in between; and a distinct `trace_id` for every one of the four invocations.

Differences, none of them behavioural: the ids, timestamps and durations are per-run (run 1's
`duration` came out as exactly `0` here rather than `0.05099987983703613`); the sink used here keeps
`exception` as `"<type>: <value>"`, so the event reads `Error: cron boom run 2` where the record
trimmed it to `cron boom run 2`; and runs 3+4 arrived with the `ok` check-in ahead of its
`in_progress` for the second of the two, which is the ordering quirk the record already noted.

## Files

- `src/index.ts` - the Worker: `withSentry` over `fetch` (`/sentinel`) and `scheduled` (`withMonitor`)
- `wrangler.jsonc` - `compatibility_date` 2026-05-01, `nodejs_compat`, `* * * * *` cron trigger
- `sink.mjs` - envelope sink extended for `check_in` payloads and full span attributes
- `items.json` - sink output for runs 1+2 and the sentinel
- `items-runs34.json` - sink output for runs 3+4 and the second sentinel
- `app.log`, `sink.log` - wrangler and sink output from the run above

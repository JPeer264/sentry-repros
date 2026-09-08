# N5 — Durable Object websockets, alarms and storage key filtering (Cloudflare)

## What it reproduces

A `wrangler dev` Worker whose Durable Object class `WsDO` is wrapped with
`Sentry.instrumentDurableObjectWithSentry`. The DO accepts hibernatable WebSockets via
`ctx.acceptWebSocket(server)` and handles messages in `webSocketMessage` / closes in
`webSocketClose`; each handler calls `Sentry.setTag('conn', …)` / `setTag('msg', …)`, writes the same
five storage keys (`mine`, `cf_x`, `cf:y`, `__ps_z`, `/w`), then either captures a message or, for the
message `boom`, throws. A `setAlarm` armed through `/arm` fires an `alarm` handler that writes the
same five keys and throws. Two extra routes isolate the storage key filter: `/onlyfw` touches only
reserved-prefix keys (`put cf_x`, `put cf:y`, `put __ps_z`, `put /w`, `get cf_x`, `delete __ps_z`,
`list {prefix:'cf_'}`) and `/onlymine` does put/get/delete/list on the user key `mine`. The probe checks
the span op/origin of the WebSocket and alarm handlers, the error mechanism, tag isolation between two
concurrent connections, that only the non-prefixed key produces a storage span, and which trace ids the
handlers land on. Default `traceLifecycle: 'stream'`, so everything arrives as `span` envelopes.

## Install

```
cd $REPRO/probes/N5 && npm install
```

(installs the develop tarballs from `../../_toolbox/pack`, at 10.67.0, plus `wrangler` and `ws` for the driver)

## Run

```
cd $REPRO/probes/N5
PORT=47205 node sink.mjs > sink.log 2>&1 &
npx wrangler dev --port 53119 --inspector-port 0 > app.log 2>&1 &   # wait for 'Ready on http://localhost:53119'
node drive.mjs 53119 47205 1 > drive.out 2>&1                       # /arm, 2 ws connections, interleaved a1/b1/a2/b2/boom/b3, alarm, closes, /onlyfw, /onlymine, sentinel
curl -s 'http://127.0.0.1:47205/__items?raw=1' > raw.json           # raw payloads: trace/span ids, links, attributes
curl -s -X DELETE http://127.0.0.1:47205/__items                    # clear, then the isolate-lifetime check
node drive.mjs 53119 47205 2 > drive2.out 2>&1                      # second run: two brand-new connections on the same live DO isolate
curl -s 'http://127.0.0.1:47205/__items?raw=1' > raw2.json
```

Kill both background pids when done.

## Expected

Recorded verdict: **works**.

> instrumentDurableObjectWithSentry produces one `websocket webSocketMessage` span per websocket
> message (both hibernatable connections), one `websocket webSocketClose` span per close, one
> `function alarm` span per alarm invocation with the throw captured as mechanism
> `auto.faas.cloudflare.durable_object` / handled=false, and storage spans only for the non-prefixed
> key. Tags set inside a handler stay on that invocation's event/span, no cross-talk between the two
> connections. One caveat that is not a docs claim: every websocket handler invocation shares a single
> trace_id for the lifetime of the DO isolate, across both connections and across a second, later pair
> of connections.

Recorded evidence lines (sink at 127.0.0.1:52413):

```
6 event ws-msg A a1 mech=generic handled=true tags={"conn":"A","msg":"a1"} trace=8d6edc1e
7 span ["db durable_object_storage_put | trace=8d6edc1e","websocket webSocketMessage | trace=8d6edc1e"]
8 event ws-msg A a2 ... tags={"conn":"A","msg":"a2"}
9 span ["db durable_object_storage_put","websocket webSocketMessage"]
10 event ws-msg B b1 ... tags={"conn":"B","msg":"b1"}
11 span ["db durable_object_storage_put","websocket webSocketMessage"]
12 event ws-msg B b2 ... tags={"conn":"B","msg":"b2"}
13 span ["db durable_object_storage_put","websocket webSocketMessage"]
14 event ws boom A mech=auto.faas.cloudflare.durable_object handled=false tags={"conn":"A","msg":"boom"}
16 span ["db durable_object_storage_put","websocket webSocketMessage"]
17 event ws-msg B b3 ... tags={"conn":"B","msg":"b3"}
18 span ["db durable_object_storage_put","websocket webSocketMessage"]
19 event alarm boom mech=auto.faas.cloudflare.durable_object handled=false trace=b6f7ced3
20 span ["db durable_object_storage_put | trace=b6f7ced3","function alarm | trace=b6f7ced3"]
21 event ws-close A 1005 tags={"conn":"A"}
22 span ["websocket webSocketClose"]
23 event ws-close B 1005 tags={"conn":"B"}
24 span ["websocket webSocketClose"]
28 event final-sentinel

Each handler wrote all 5 keys ('mine','cf_x','cf:y','__ps_z','/w') yet exactly ONE
`durable_object_storage_put` span appears per invocation.

Raw span detail (trace/parent/origin/links):
webSocketMessage trace=8d6edc1e span=84ee7370e0fd41a5 parent=- origin=auto.faas.cloudflare.durable_object
webSocketMessage trace=8d6edc1e span=a3204473623ca3b8 parent=- origin=auto.faas.cloudflare.durable_object
(x6, all trace=8d6edc1e, all root)
webSocketClose trace=8d6edc1e span=a66396a473a79c36 parent=- origin=auto.faas.cloudflare.durable_object
alarm trace=b6f7ced3 span=a22b2f20534c621f parent=- origin=auto.faas.cloudflare.durable_object links=[{"span_id":"a9873244effca1f4","trace_id":"a47912ee17004cf4a5a86b0fbe55c68a","sampled":true,...}]
alarm trace=4459428c ... links=[{"span_id":"a9873244effca1f4",...}]   (Cloudflare retried the failing alarm 5x; each retry gets its own trace and links back to the setAlarm span)

Isolated key-filter probe:
span ["http.server GET"]                                    <- /onlyfw, zero storage spans
span ["db durable_object_storage_put","db durable_object_storage_get","db durable_object_storage_delete","db durable_object_storage_list","http.server GET"]   <- /onlymine

Isolate-lifetime trace pinning: after both connections closed, a second driver run with two
brand-new connections still emitted
webSocketMessage:8d6edc1e
webSocketClose:8d6edc1e
(the same trace id as the first run).
```

## Observed on 2026-09-07

Rebuilt and run once (plus the second, isolate-lifetime driver run the record describes). Sink on
47205, worker on 53119. Trimmed `__items` from `drive.out`:

```
0 span ["db durable_object_storage_setAlarm","http.server GET"] trace=b80e3e3c
1 span ["http.server GET"] trace=b80e3e3c
2 span ["http.server GET"] trace=ebb2866f          <- /ws?conn=A (DO)
3 span ["http.server GET"] trace=ebb2866f          <- /ws?conn=A (worker)
4 span ["http.server GET"] trace=d57a289f          <- /ws?conn=B (DO)
5 span ["http.server GET"] trace=d57a289f          <- /ws?conn=B (worker)
6 event "ws-msg A a1" mech=generic handled=true tags={"conn":"A","msg":"a1"} trace=1b28741a
7 span ["db durable_object_storage_put","websocket webSocketMessage"] trace=1b28741a
8 event "ws-msg B b1" mech=generic handled=true tags={"conn":"B","msg":"b1"} trace=1b28741a
9 span ["db durable_object_storage_put","websocket webSocketMessage"] trace=1b28741a
10 event "ws-msg A a2" mech=generic handled=true tags={"conn":"A","msg":"a2"} trace=1b28741a
11 span ["db durable_object_storage_put","websocket webSocketMessage"] trace=1b28741a
12 event "ws-msg B b2" mech=generic handled=true tags={"conn":"B","msg":"b2"} trace=1b28741a
13 span ["db durable_object_storage_put","websocket webSocketMessage"] trace=1b28741a
14 event "Error: ws boom A" mech=auto.faas.cloudflare.durable_object handled=false tags={"conn":"A","msg":"boom"} trace=1b28741a
15 span ["db durable_object_storage_put","websocket webSocketMessage"] trace=1b28741a
16 event "ws-msg B b3" mech=generic handled=true tags={"conn":"B","msg":"b3"} trace=1b28741a
17 span ["db durable_object_storage_put","websocket webSocketMessage"] trace=1b28741a
18 event "Error: alarm boom" mech=auto.faas.cloudflare.durable_object handled=false tags=undefined trace=c0b8d593
19 span ["db durable_object_storage_put","function alarm"] trace=c0b8d593
20 span ["db durable_object_storage_put","function alarm"] trace=05d561fe
21 event "ws-close A 1005" mech=generic handled=true tags={"conn":"A"} trace=1b28741a
22 span ["websocket webSocketClose"] trace=1b28741a
23 event "ws-close B 1005" mech=generic handled=true tags={"conn":"B"} trace=1b28741a
24 span ["websocket webSocketClose"] trace=1b28741a
25 event "Error: alarm boom" mech=auto.faas.cloudflare.durable_object handled=false tags=undefined trace=117290cc
26 span ["db durable_object_storage_put","function alarm"] trace=117290cc
27 span ["http.server GET"] trace=a709654e         <- /onlyfw (DO), zero storage spans
28 span ["http.server GET"] trace=a709654e         <- /onlyfw (worker)
29 span ["db durable_object_storage_put","db durable_object_storage_get","db durable_object_storage_delete","db durable_object_storage_list","http.server GET"] trace=bf73a525   <- /onlymine (DO)
30 span ["http.server GET"] trace=bf73a525         <- /onlymine (worker)
31 event "final-sentinel" mech=generic handled=true tags=undefined trace=401a528b
32 span ["http.server GET"] trace=401a528b
```

Raw span detail from `raw.json`:

```
webSocketMessage op=websocket trace=1b28741a span=a9ed1b94981a799f parent=- seg=true origin=auto.faas.cloudflare.durable_object links=[]
webSocketMessage op=websocket trace=1b28741a span=927be6cfa47bbb9a parent=- seg=true origin=auto.faas.cloudflare.durable_object links=[]
webSocketMessage op=websocket trace=1b28741a span=b323edce31246f7f parent=- seg=true origin=auto.faas.cloudflare.durable_object links=[]
webSocketMessage op=websocket trace=1b28741a span=bc634cfc424afe37 parent=- seg=true origin=auto.faas.cloudflare.durable_object links=[]
webSocketMessage op=websocket trace=1b28741a span=881f3e5b0fa70c27 parent=- seg=true origin=auto.faas.cloudflare.durable_object links=[]
webSocketMessage op=websocket trace=1b28741a span=afd28b6f8d82090d parent=- seg=true origin=auto.faas.cloudflare.durable_object links=[]
webSocketClose   op=websocket trace=1b28741a span=95033753fb9cc571 parent=- seg=true origin=auto.faas.cloudflare.durable_object links=[]
webSocketClose   op=websocket trace=1b28741a span=b0d484321511cda7 parent=- seg=true origin=auto.faas.cloudflare.durable_object links=[]
alarm op=function trace=c0b8d593 span=ae2976d3e6806993 parent=- seg=true origin=auto.faas.cloudflare.durable_object links=[{"span_id":"8e4a12621dd427b0","trace_id":"b80e3e3c21724dafb061467cf64ef79e","sampled":true,"attributes":{"sentry.link.type":{"value":"previous_trace","type":"string"}}}]
alarm op=function trace=05d561fe span=ad28386f306d0056 parent=- seg=true links=[{"span_id":"8e4a12621dd427b0",...}]
alarm op=function trace=117290cc span=8fa414de81cd21d9 parent=- seg=true links=[{"span_id":"8e4a12621dd427b0",...}]
alarm op=function trace=baa5b6a1 span=9961cc1557a5d2b0 parent=- seg=true links=[{"span_id":"8e4a12621dd427b0",...}]
durable_object_storage_setAlarm trace=b80e3e3c21724dafb061467cf64ef79e span=8e4a12621dd427b0 parent=b06b13277d1e197d
```

Isolate-lifetime trace pinning, second driver run (`drive2.out` / `raw2.json`), two brand-new
connections after the first pair had closed:

```
event "ws-msg A a9" tags={"conn":"A","msg":"a9"} trace=1b28741a
durable_object_storage_put op=db trace=1b28741a span=9b98101cbecd9240 parent=a7e158ca5a3f14ef
webSocketMessage op=websocket trace=1b28741a span=a7e158ca5a3f14ef parent=-
event "ws-msg B b9" tags={"conn":"B","msg":"b9"} trace=1b28741a
durable_object_storage_put op=db trace=1b28741a span=8769ff5a9392b181 parent=bff0d73509c7a1bb
webSocketMessage op=websocket trace=1b28741a span=bff0d73509c7a1bb parent=-
event "ws-close A 1005" tags={"conn":"A"} trace=1b28741a
webSocketClose op=websocket trace=1b28741a span=98c4c14a5c85ac5e parent=-
event "ws-close B 1005" tags={"conn":"B"} trace=1b28741a
webSocketClose op=websocket trace=1b28741a span=89c12b422e4d205c parent=-
event "second-run-sentinel" trace=d0bae698
```

Matches the recorded verdict: **yes**. Every recorded claim reproduced: six `websocket
webSocketMessage` spans (one per message, both connections), two `websocket webSocketClose` spans,
`function alarm` spans with the throw captured as `auto.faas.cloudflare.durable_object` /
`handled:false`, origin `auto.faas.cloudflare.durable_object` on all of them, exactly one
`durable_object_storage_put` span per handler invocation although five keys were written, `/onlyfw`
with zero storage spans against `/onlymine` with all four, per-invocation tags with no cross-talk
between A and B, and the isolate-lifetime trace pinning (all websocket handlers on `1b28741a`, still
`1b28741a` for a fresh pair of sockets in the second run). Alarm retries each got their own trace and
all four link back to the same `setAlarm` span `8e4a12621dd427b0`.

Differences from the record, none of them behavioral:

- Per-run trace/span ids and ports (sink 47205, worker 53119 instead of the recorded 52413/56731).
- The record's numbered list shows A's two messages before B's; here the driver interleaved
  a1/b1/a2/b2/boom/b3 and the sink shows that order. Same set, same tags.
- Cloudflare retried the throwing alarm 3 times here (4 `alarm` spans total) instead of the recorded
  5; retry counts are workerd's, not the SDK's. One retry (`05d561fe`) delivered its span but its
  event landed outside the polling window.
- The record's `/onlyfw` and `/onlymine` lines list only the DO-side envelope; this run also shows the
  worker-side `http.server GET` envelope for each, which the record simply did not quote.

Environment: wrangler 4.129.0 with workerd 1.20260903.1, node v26.5.0, `@sentry/cloudflare` 10.67.0
(develop tarball, 6f2da7483d), plain `wrangler dev` (no Vite), SQLite-backed DO
(`new_sqlite_classes`), `compatibility_date` 2026-05-01, `nodejs_compat`.

Not probed, same as the record: real hibernation eviction.

## Files

- `src/index.ts` — worker + `WsDO` Durable Object (websockets, alarm, storage key routes)
- `wrangler.jsonc` — DO binding `DO` -> `WsDO`, `new_sqlite_classes`, `SENTRY_TUNNEL` var
- `sink.mjs` — envelope sink with trace/span ids, links and attributes
- `drive.mjs` — driver; arg 3 selects phase `1` (full run) or `2` (isolate-lifetime re-check)
- `drive.out`, `drive2.out`, `raw.json`, `raw2.json`, `app.log`, `sink.log` — output of the 2026-09-07 run

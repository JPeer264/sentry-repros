# C08 — Durable Objects locally (Cloudflare)

## What it reproduces

A `wrangler dev` Worker whose Durable Object class is wrapped with
`Sentry.instrumentDurableObjectWithSentry` and whose `withSentry` options carry
`rpcTracePropagationBindings: ['DO']`. Hitting `/do-fetch` sends the worker's request through
`stub.fetch('https://do/storage')`, where the DO does `storage.put/get/list/setAlarm`; `/do-rpc`
calls the RPC method `stub.hello()`; `/do-throw` and `/do-rpc-throw` throw inside the DO fetch
handler and inside an RPC method; the alarm scheduled by `setAlarm` fires a second later and writes
once more to storage. The probe checks that the DO fetch span joins the worker's trace as a child of
the worker request span, that the storage spans are children of the DO span, that the RPC span lands
in the worker's trace, that both DO errors are captured with mechanism
`auto.faas.cloudflare.durable_object`, and that the alarm runs in a new trace carrying
`sentry.previous_trace` plus a span link back to the `setAlarm` span. Default `traceLifecycle:
'stream'`, so everything arrives as `span` envelopes.

## Install

```
npm install
```

(installs the develop tarballs from `../../_toolbox/pack`, at 10.67.0, plus wrangler)

## Run

```
cd $REPRO/probes/C08
PORT=41417 node sink.mjs > sink.log 2>&1 &
npx wrangler dev --port 41517 --inspector-port 0 > app.log 2>&1 &   # wait for 'Ready on http://localhost:41517'
node drive.mjs 41517 41417 > drive.out                              # hits /do-fetch /do-throw /do-rpc /do-rpc-throw, waits 4s for the alarm, then /sentinel and polls the sink
curl -s 'http://127.0.0.1:41417/__items?raw=1' > raw.json           # raw payloads, if you want span ids and links
```

Kill both background pids when done.

## Expected

Recorded verdict: **works**.

> With instrumentDurableObjectWithSentry and rpcTracePropagationBindings: ["DO"] on the worker, the DO
> fetch span (op http.server, name GET, url.full https://do/storage) shares the worker's trace_id and
> has the worker span as parent; durable_object_storage_put/get/list/setAlarm spans (op db,
> db.system.name cloudflare.durable_object.storage) are children of the DO span; the RPC call
> stub.hello() yields an op rpc span named hello in the worker's trace; the alarm handler runs as op
> function span named alarm in a NEW trace with sentry.previous_trace and a span link pointing at the
> setAlarm span; errors thrown inside DO fetch and inside the RPC method are captured with mechanism
> auto.faas.cloudflare.durable_object, handled false, on the DO trace. Default stream lifecycle, so
> everything arrives as span envelopes.

Recorded evidence lines:

```
worker: {op:"http.server", name:"GET", trace_id:"51818b88b116415a9932a677a0a796da", span_id:"99e17b37d2fc5962", segment:true, url:"http://127.0.0.1:41517/do-fetch"}
DO fetch: {op:"http.server", name:"GET", origin:"auto.http.cloudflare", trace_id:"51818b88b116415a9932a677a0a796da", span_id:"9f72b1f379c5e867", parent_span_id:"99e17b37d2fc5962", segment:true, url:"https://do/storage"}
storage: {op:"db", name:"durable_object_storage_put", origin:"auto.db.cloudflare.durable_object", trace_id:"51818b88b116415a9932a677a0a796da", parent_span_id:"9f72b1f379c5e867", dbsys:"cloudflare.durable_object.storage", dbop:"put"} plus same for durable_object_storage_get, durable_object_storage_list, durable_object_storage_setAlarm (span_id 9720b8e4704cdb21)
RPC: {op:"rpc", name:"hello", origin:"auto.faas.cloudflare.durable_object", trace_id:"d746bf90ae1e4f9981f9c3eba53e2ea6", parent_span_id:"b9ce3b738ef9b77f"} where worker GET /do-rpc has trace_id d746bf90ae1e4f9981f9c3eba53e2ea6 span_id b9ce3b738ef9b77f
RPC throw: {type:"event", exception:"do rpc boom", mechanism:"auto.faas.cloudflare.durable_object", handled:false, trace_id:"7f8aa5ff01a6468bbb77d97473b2b32b"} and {op:"rpc", name:"fail", status:"error", trace_id:"7f8aa5ff01a6468bbb77d97473b2b32b"}
DO fetch throw: {type:"event", exception:"do fetch boom", mechanism:"auto.faas.cloudflare.durable_object", handled:false, trace_id:"ff75a3832593408aaefedbc38bcb6bff", span_id:"89eacef3af317c46"}; DO span for https://do/throw: trace_id ff75a3832593408aaefedbc38bcb6bff, parent_span_id 9cfeaee6e2b91a42 (= worker GET /do-throw span), status "ok"
alarm: {op:"function", name:"alarm", origin:"auto.faas.cloudflare.durable_object", trace_id:"859142852c874587821f95fb0e42d038", span_id:"92521c5428aae83c", segment:true, previous_trace:"51818b88b116415a9932a677a0a796da-9720b8e4704cdb21-1", links:[{span_id:"9720b8e4704cdb21", trace_id:"51818b88b116415a9932a677a0a796da", sampled:true, attributes:{"sentry.link.type":"previous_trace"}}]} with child {op:"db", name:"durable_object_storage_put", parent_span_id:"92521c5428aae83c"}
sentinel: {type:"event", message:"sentinel"} arrived last
```

Recorded notes worth re-checking: `stub.fetch()` creates no `http.client` span (headers only); the DO
request span for a throwing fetch has status `ok`; the DO request span is named `GET` with `url.full`
as an attribute (stream lifecycle); alarm span links fire under `wrangler dev`.

## Observed on 2026-09-07

Rebuilt and run once. Trimmed sink output (ids are per-run), from `raw.json`:

```
worker:    {op:"http.server", name:"GET", trace_id:"0666947e7f8241dd8a308f792a72f78f", span_id:"bf97f674334d06cc", parent_span_id:null, segment:true, status:"ok", url:"http://127.0.0.1:41517/do-fetch"}
DO fetch:  {op:"http.server", name:"GET", origin:"auto.http.cloudflare", trace_id:"0666947e7f8241dd8a308f792a72f78f", span_id:"a9d342c0fb810bb4", parent_span_id:"bf97f674334d06cc", segment:true, status:"ok", url:"https://do/storage"}
storage:   {op:"db", name:"durable_object_storage_put", origin:"auto.db.cloudflare.durable_object", trace_id:"0666947e7f8241dd8a308f792a72f78f", span_id:"a4dc756d44d4556b", parent_span_id:"a9d342c0fb810bb4", dbsys:"cloudflare.durable_object.storage", dbop:"put"}
           {op:"db", name:"durable_object_storage_get", ..., span_id:"9b4d3c1d63116873", parent_span_id:"a9d342c0fb810bb4", dbop:"get"}
           {op:"db", name:"durable_object_storage_list", ..., span_id:"b8a858f5717e2a12", parent_span_id:"a9d342c0fb810bb4", dbop:"list"}
           {op:"db", name:"durable_object_storage_setAlarm", ..., span_id:"8acc67c37df2059a", parent_span_id:"a9d342c0fb810bb4", dbop:"setAlarm"}
RPC:       {op:"rpc", name:"hello", origin:"auto.faas.cloudflare.durable_object", trace_id:"25f5c8e90b02472b881a3077384d8461", span_id:"ab20ba6960c73b88", parent_span_id:"ba1bec3caec09e44", segment:true, status:"ok"}
           worker GET /do-rpc: trace_id "25f5c8e90b02472b881a3077384d8461", span_id "ba1bec3caec09e44"
RPC throw: {type:"event", exception:"do rpc boom", mechanism:"auto.faas.cloudflare.durable_object", handled:false, trace_id:"6b9e94d8eca74aab9489b8b7730905f8", span_id:"92392ebbdf6ddb53"}
           {op:"rpc", name:"fail", origin:"auto.faas.cloudflare.durable_object", trace_id:"6b9e94d8eca74aab9489b8b7730905f8", span_id:"92392ebbdf6ddb53", parent_span_id:"a97d5c950a3a7627", status:"error"}
DO throw:  {type:"event", exception:"do fetch boom", mechanism:"auto.faas.cloudflare.durable_object", handled:false, trace_id:"8696ca3f289d4b33b6e35a4fee27d791", span_id:"ae8d73e4f511425c"}
           {op:"http.server", name:"GET", trace_id:"8696ca3f289d4b33b6e35a4fee27d791", span_id:"ae8d73e4f511425c", parent_span_id:"9ac26f39c98fd223", status:"ok", url:"https://do/throw"}   (worker GET /do-throw span_id 9ac26f39c98fd223, status "ok")
alarm:     {op:"function", name:"alarm", origin:"auto.faas.cloudflare.durable_object", trace_id:"ff27700eaf684db0b88fa74d4a926856", span_id:"8642bada78a557b8", parent_span_id:null, segment:true, prev:"0666947e7f8241dd8a308f792a72f78f-8acc67c37df2059a-1", links:[{"span_id":"8acc67c37df2059a","trace_id":"0666947e7f8241dd8a308f792a72f78f","sampled":true,"attributes":{"sentry.link.type":{"value":"previous_trace","type":"string"}}}]}
           {op:"db", name:"durable_object_storage_put", trace_id:"ff27700eaf684db0b88fa74d4a926856", span_id:"bd5c683a14d68e04", parent_span_id:"8642bada78a557b8"}
sentinel:  {type:"event", message:"sentinel", trace_id:"29a514b93c6b4ff9a61b6015015e7d33"} arrived last
```

Matches the recorded verdict: **yes**. Every recorded relationship holds — DO fetch parented on the
worker span in the same trace, four storage spans under the DO span, `rpc hello` in the worker trace,
both DO errors with mechanism `auto.faas.cloudflare.durable_object` / `handled:false`, `rpc fail`
with `status:"error"`, the throwing DO fetch span still `status:"ok"`, and the alarm in a new trace
whose `sentry.previous_trace` and span link point at the `setAlarm` span (`8acc67c37df2059a`). The
only differences are the per-run trace/span ids and one immaterial detail the record did not pin: the
`rpc` spans are `is_segment: true` here.

Environment: wrangler 4.129.0 with workerd 1.20260903.1, node v26.5.0, `@sentry/cloudflare` 10.67.0
(develop tarball), plain `wrangler dev` (no Vite), SQLite-backed DO (`new_sqlite_classes`),
`compatibility_date` 2026-05-01, `nodejs_compat`.

## Files

- `src/index.ts` — worker + `MyDO` Durable Object
- `wrangler.jsonc` — DO binding `DO` -> `MyDO`, `new_sqlite_classes`, `SENTRY_TUNNEL` var
- `sink.mjs` — envelope sink with trace/span ids, links and attributes
- `drive.mjs` — driver, sentinel and sink poll
- `drive.out`, `raw.json`, `app.log` — output of the 2026-09-07 run

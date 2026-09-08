# M-solidstart-cf — SolidStart 1.3 (vinxi 0.5 + Nitro, `cloudflare-module`) on Cloudflare Workers

## What it reproduces

SolidStart itself runs on Cloudflare Workers out of the box (`preset: 'cloudflare-module'` builds, and
`/`, `/api/*` and file routes serve correctly under `wrangler dev`), but `@sentry/solidstart` does not:
its server entry is `initNodeSdk` from `@sentry/node` (`packages/solidstart/src/server/sdk.ts:3`) and it
pulls `@sentry/nitro`, neither of which loads on workerd, and there is no `@sentry/solidstart/cloudflare`
export. This app therefore hand-wires the only shape that works today: `@sentry/solidstart` for the
browser, and `@sentry/cloudflare`'s `withSentry` wrapped by hand around the Nitro worker output
(`worker.mjs`), with `rollupConfig: { external: ['@sentry/cloudflare'] }` in `app.config.ts` so Nitro does
not inline a second copy of the SDK. The probe routes then measure what that hand-wiring does and does
not give you: manual captures, request transactions, isolation, trace continuation, outgoing fetch, logs
work; thrown route errors are swallowed by Nitro/h3 and never become events, transaction names stay raw
URLs (`source: "url"`), and `mysql2` cannot even load in the Nitro CJS-interop shim on workerd.

## Install

```
npm install && npm install $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz $REPRO/_toolbox/pack/sentry-solidstart-10.67.0.tgz $REPRO/_toolbox/pack/sentry-solid-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz $REPRO/_toolbox/pack/sentry-nitro-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-bundler-plugins-10.67.0.tgz $REPRO/_toolbox/pack/sentry-replay-10.67.0.tgz $REPRO/_toolbox/pack/sentry-replay-canvas-10.67.0.tgz $REPRO/_toolbox/pack/sentry-feedback-10.67.0.tgz
```

(The SDK under test is `develop` / v11 line, package version 10.67.0. Never install 10.73.0.)

## Run

All commands from this directory. MariaDB must be on `127.0.0.1:3307` (root, no password, db `app`,
table `users`). `.output/` is checked in, so the build step is only needed after editing `src/`.

```
npx vinxi build                      # only after changing src/ or app.config.ts
PORT=53817 node sink2.mjs > sink.log 2>&1 &     # envelope sink, matches the tunnel in worker.mjs
bash run-probe.sh                    # starts recorder (53819) + wrangler dev (53825), runs every probe, stops both
```

`run-probe.sh` writes `observed-items.json` (sink) and `observed-recorder.json` (propagated headers), and
leaves the worker log in `wrangler.log`. It runs exactly these probes:

```
curl -s http://127.0.0.1:53825/api/users/42
curl -s http://127.0.0.1:53825/api/boom
curl -s http://127.0.0.1:53825/api/trace
curl -s "http://127.0.0.1:53825/api/iso?who=alpha" & curl -s "…who=beta" & curl -s "…who=gamma" & wait
curl -s http://127.0.0.1:53825/api/fetchout
curl -s http://127.0.0.1:53825/api/logme
curl -s -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1" \
        -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1" \
        http://127.0.0.1:53825/api/trace
curl -s http://127.0.0.1:53825/api/db
curl -s http://127.0.0.1:53825/api/sentinel     # sentinel; wait for it in the sink before reading
```

Stop the sink afterwards with the pid you captured when you started it.

## Expected (recorded verdict)

| Capability | Verdict |
| --- | --- |
| errors | partial — manual `captureException` reaches Sentry; a thrown route error never becomes an event (Nitro/h3 catches it, returns 500) |
| route names | broken — `GET /api/users/42`, `source: "url"`, not `/api/users/:id` |
| isolation | works — three concurrent requests keep their own tag and trace id |
| incoming trace | works — `sentry-trace` / `baggage` continued on event and transaction |
| outgoing fetch | works — `http.client` child span plus propagated headers |
| db spans | not-run — `mysql2` dies on workerd inside Nitro's CJS interop shim, no query ever runs |
| logs | works — log envelope carries the request trace id |
| client errors | works — `@sentry/solidstart` in `entry-client.tsx` captures an unhandled browser throw |

Recorded evidence lines:

```
{ "type": "transaction", "name": "GET /api/users/42", "op": "http.server", "source": "url", "status": "ok", "trace_id": "1151da6759954a008a6568f728b873d6", "spans": [] }
{ "type": "transaction", "name": "GET /api/boom",     "op": "http.server", "source": "url", "status": "internal_error", "trace_id": "2cc80420950a43c88e592b1033400e99", "spans": [] }

✘ [ERROR] [request error] [unhandled] [GET] http://127.0.0.1:53821/api/boom
   Un [Error]: solidstart-cf boom
      at o (.../.vinxi/build/ssr/boom.js:1:20)
Sentry Logger [log]: [Tracing] Finishing "http.server" root span "GET /api/boom" with ID 8d5fca85d8969a5e
[wrangler:info] GET /api/boom 500 Server Error (5ms)

{ "type": "event", "exception": "trace-probe", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.cloudflare", "trace_id": "cece0f962d06412080bd21f49c6bc77d" }
{ "type": "event", "exception": "iso-alpha", "tags": { "who": "alpha" }, "trace_id": "a993566e812846048ac77ca33a697dae" }
{ "type": "event", "exception": "trace-probe", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "parent_span_id": "bbbbbbbbbbbbbbbb" }
{ "type": "transaction", "name": "GET /api/fetchout", "trace_id": "17b563b8968242ddb69fd63b93baf171", "spans": ["http.client GET http://127.0.0.1:53819/rec"] }
recorder: {"url":"/rec","sentry-trace":"17b563b8968242ddb69fd63b93baf171-a0929cbc2b0df026-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=17b563b8968242ddb69fd63b93baf171,sentry-sampled=true,sentry-sample_rand=0.6157668013125126,sentry-sample_rate=1"}
{ "type": "log", "items": ["info: solidstart-cf log line | trace=eedeb885f6e94d328c02c1f5e2f1ff7d"] }
```

db spans, recorded: `TypeError: _3.hasOwnProperty is not a function` inside
`.output/server/chunks/_/promise.mjs`, so no query ever ran.

## Observed on 2026-09-07

Reproduces. Every capability matches the recorded verdict; only the trace ids differ, and the log line
carries its trace id in the raw envelope rather than in the compact sink rendering.

```
{"type":"transaction","name":"GET /api/users/42","op":"http.server","source":"url","status":"ok","trace_id":"65208176b07b4495b1e1b5531442192e","sdk":"sentry.javascript.cloudflare","spans":[]}
{"type":"transaction","name":"GET /api/boom","op":"http.server","source":"url","status":"internal_error","trace_id":"5fcfe67464d74063b46a774c9c625752","sdk":"sentry.javascript.cloudflare","spans":[]}
{"type":"event","exception":"Error: trace-probe","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","trace_id":"9245c81250f2469cb777eb2e31cde54f"}
{"type":"transaction","name":"GET /api/trace","op":"http.server","source":"url","status":"ok","trace_id":"9245c81250f2469cb777eb2e31cde54f","spans":[]}
{"type":"event","exception":"Error: iso-alpha","tags":{"who":"alpha"},"trace_id":"e97f209bd49649d5916f6d8d3b2316e4"}
{"type":"event","exception":"Error: iso-beta","tags":{"who":"beta"},"trace_id":"67b698ea3a374173a59074923b3e7592"}
{"type":"event","exception":"Error: iso-gamma","tags":{"who":"gamma"},"trace_id":"2ae26f71daa44352a8575e07e44f0beb"}
{"type":"transaction","name":"GET /api/iso","op":"http.server","source":"url","status":"ok","trace_id":"e97f209bd49649d5916f6d8d3b2316e4","spans":[]}
{"type":"transaction","name":"GET /api/iso","op":"http.server","source":"url","status":"ok","trace_id":"67b698ea3a374173a59074923b3e7592","spans":[]}
{"type":"transaction","name":"GET /api/iso","op":"http.server","source":"url","status":"ok","trace_id":"2ae26f71daa44352a8575e07e44f0beb","spans":[]}
{"type":"transaction","name":"GET /api/fetchout","op":"http.server","source":"url","status":"ok","trace_id":"b6e24d4828604da78c1b527d209646b1","spans":["http.client GET http://127.0.0.1:53819/rec"]}
{"type":"log","items":["info: solidstart-cf log line"]}
{"type":"event","exception":"Error: trace-probe","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}
{"type":"transaction","name":"GET /api/trace","op":"http.server","source":"url","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":[]}
{"type":"transaction","name":"GET /api/db","op":"http.server","source":"url","status":"internal_error","trace_id":"266e33871fd343398079f72e72691cbf","spans":[]}
{"type":"event","message":"sentinel","trace_id":"0c40371780894610afe1d09c5fb824bd"}
{"type":"transaction","name":"GET /api/sentinel","op":"http.server","source":"url","status":"ok","trace_id":"0c40371780894610afe1d09c5fb824bd","spans":[]}
```

Recorder (outgoing fetch headers):

```
[{"url":"/rec","sentry-trace":"b6e24d4828604da78c1b527d209646b1-addba9445f2d0e05-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=b6e24d4828604da78c1b527d209646b1,sentry-sampled=true,sentry-sample_rand=0.33585395378278415,sentry-sample_rate=1"}]
```

Raw log envelope (the trace id the compact rendering drops), matching the `/api/logme` transaction
`a5f5b80f2b324e02a770ae9ccf97a6a9`:

```
info solidstart-cf log line {"value":"98c7b71b2e418397","type":"string"} "a5f5b80f2b324e02a770ae9ccf97a6a9"
```

`wrangler.log`, thrown route error — the root span starts and finishes with no `Captured error event`
between them:

```
Sentry Logger [log]: [Tracing] Starting sampled root span
  op: http.server
  name: GET /api/boom
  ID: 9c23a608407e9316
✘ [ERROR] [request error] [unhandled] [GET] http://127.0.0.1:53825/api/boom
   Dn [Error]: solidstart-cf boom
      at o (file:///…/.vinxi/build/ssr/boom.js:1:20)
Sentry Logger [log]: [Tracing] Finishing "http.server" root span "GET /api/boom" with ID 9c23a608407e9316
[wrangler:info] GET /api/boom 500 Server Error (6ms)
```

`wrangler.log`, db probe — identical failure to the recorded one:

```
✘ [ERROR] [request error] [unhandled] [GET] http://127.0.0.1:53825/api/db
   TypeError: _3.hasOwnProperty is not a function
      at requireSafer (file:///…/.output/server/chunks/_/promise.mjs:1:174381)
      at requireLib$1 (file:///…/.output/server/chunks/_/promise.mjs:1:312317)
      at requirePacket (file:///…/.output/server/chunks/_/promise.mjs:1:314493)
```

Client errors were not re-run in this rebuild (no browser probe in `run-probe.sh`); `/clienterr` and the
`Sentry.init` in `src/entry-client.tsx` are in place for it.

# M-reactrouter-cf

React Router 7.18.3 (framework mode, SSR) on Cloudflare Workers, instrumented with the develop
(v11 line, package version 10.67.0) build of `@sentry/cloudflare` + `@sentry/react-router`.

Versions: `@react-router/dev` 7.18.3, vite 7.3.6, `@cloudflare/vite-plugin` 1.54.4,
wrangler 4.129.0 / workerd 1.20260903.1, `compatibility_date` 2026-05-01, `nodejs_compat`.

## What it reproduces

A React Router framework-mode app served by a Cloudflare Worker entry (`workers/app.ts`) wrapped in
`Sentry.withSentry`, built through `@cloudflare/vite-plugin` plus `sentryCloudflareVitePlugin()` and
run with local `wrangler dev`. It exercises the seven server-side capabilities of the runtime audit
(errors, route names, isolation, incoming trace, outgoing fetch, db spans, logs) and shows that all
seven work on this stack, provided two non-obvious pieces of scaffolding are in place:
`future: { v8_viteEnvironmentApi: true }` in `react-router.config.ts` (without it `vite build` dies
with `[commonjs--resolver] id.endsWith is not a function`), and a hand-rolled `export const
handleError` in `app/entry.server.tsx` that calls `Sentry.captureException` — `createSentryHandleError`
is exported only from the node entry, not from `@sentry/react-router/cloudflare`, so without the
hand-rolled export React Router swallows loader errors into the ErrorBoundary and nothing is
reported. `@react-router/node` must also be pinned to `^7.18.3` explicitly, otherwise
`@sentry/react-router`'s peer range `">=7.15.0 || ^8.x"` makes npm pick 8.3.1 and the install aborts
with ERESOLVE.

## Install

```
cd $REPRO/cells/M-reactrouter-cf && npm install --no-audit --no-fund
```

(`package.json` already points every `@sentry/*` dependency at the develop tarballs in
`../../_toolbox/pack/`, so no tarball paths need to be typed. All of them must stay on one
dependency list so npm resolves their `10.67.0` transitive pins.)

Needs MariaDB on `127.0.0.1:3307` (root, no password, db `app`, table `users(id, name)`) for the
`/db` probe.

## Run

```
cd $REPRO/cells/M-reactrouter-cf

# envelope sink and the outgoing-fetch header recorder (plain node, not the worker)
PORT=41207 node sink2.mjs > sink.log 2>&1 &
PORT=41209 node recorder.mjs > rec.log 2>&1 &

# build and run the worker (the sink port is the SINK_PORT constant in workers/app.ts)
npx vite build
npx wrangler dev --config build/server/wrangler.json --port 41211 --inspector-port 0 > app2.log 2>&1 &
# readiness: grep "Ready on" app2.log

# drive
curl -s -X DELETE http://127.0.0.1:41207/__items
curl -s -o /dev/null http://127.0.0.1:41211/boom
curl -s -o /dev/null "http://127.0.0.1:41211/fetchout?target=http%3A%2F%2F127.0.0.1%3A41209%2Frec"
curl -s http://127.0.0.1:41211/db
curl -s http://127.0.0.1:41211/logs
curl -s -o /dev/null -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1" \
  -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public" \
  http://127.0.0.1:41211/users/7
curl -s -o /dev/null http://127.0.0.1:41211/iso/alpha & \
  curl -s -o /dev/null http://127.0.0.1:41211/iso/bravo & \
  curl -s -o /dev/null http://127.0.0.1:41211/iso/charlie & wait
curl -s -o /dev/null http://127.0.0.1:41211/sentinel   # sentinel; wait until it lands, then +7s for logs
curl -s http://127.0.0.1:41207/__items
curl -s http://127.0.0.1:41209/__hits

# lifecycle switch: edit TRACE_LIFECYCLE in workers/app.ts ('static' | 'stream'), then rebuild + restart.
# db-instrumentation-needed check: sentryCloudflareVitePlugin({ buildTimeInstrumentation: false })
# in vite.config.ts, rebuild + restart.
```

Kill the three background pids when done.

## Expected

Recorded verdict, `traceLifecycle: 'static'`:

| capability | verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | works |
| db spans | works |
| logs | works |
| client errors | not-run (server side only, no browser driven) |

Recorded evidence lines (sink `/__items`, ports as they were on the original run):

```
{"type":"event","exception":"rr-deno loader boom","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare","trace_id":"b0e68eeb3bd646a9816e022f081ee668","url":"http://127.0.0.1:52881/boom","hasContextLine":false}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_id":"b0e68eeb3bd646a9816e022f081ee668","spans":[]}
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","trace_id":"df0ad40c46254aa3a0790bb7a159741e","spans":["http.client GET http://127.0.0.1:52883/rec"]}
{"type":"transaction","name":"GET /logs","op":"http.server","source":"route","status":"ok","trace_id":"da1340ec76df4d5eb5cd9fd6a54a3d78","spans":[]}
{"type":"log","items":["info: rr-cf log from loader trace=da1340ec76df4d5eb5cd9fd6a54a3d78"]}
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"0f184d5b401148c6ad21a83ca1452555","spans":["db SELECT id, name FROM users"]}
  page body: <pre>{"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
{"type":"event","exception":"iso-error-alpha","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare","tags":{"iso_tag":"alpha"},"trace_id":"0cf318c8432046d7a47d933fb06b7516","url":"http://127.0.0.1:52881/iso/alpha"}
{"type":"transaction","name":"GET /iso/:tag","op":"http.server","source":"route","status":"ok","trace_id":"0cf318c8432046d7a47d933fb06b7516","tags":{"iso_tag":"alpha"},"spans":[]}
```

Recorded recorder output (`/__hits`):

```
[{"url":"/rec","sentryTrace":"df0ad40c46254aa3a0790bb7a159741e-907e94bd91709b32-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=df0ad40c46254aa3a0790bb7a159741e,sentry-sampled=true,sentry-sample_rand=0.48607969419431374,sentry-sample_rate=1"}]
```

Recorded variant: with `sentryCloudflareVitePlugin({ buildTimeInstrumentation: false })` the `/db`
query still returns real rows but the transaction has `"spans":[]` — the plugin's
`buildTimeInstrumentation` is what produces the db span.

## Observed on 2026-09-07

Rebuilt and run once as described above (sink 41207, recorder 41209, worker 41211),
`traceLifecycle: 'static'`. Matches the recorded verdict on all seven server capabilities.

```
{"type":"event","exception":"Error: rr-deno loader boom","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","hasContextLine":false,"url":"http://127.0.0.1:41211/boom","trace_id":"18262a497c084f4b8666107aeb8af28e"}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_id":"18262a497c084f4b8666107aeb8af28e","sdk":"sentry.javascript.cloudflare","spans":[]}
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","trace_id":"4ef34e637b294819b6dca5ee06b976bd","sdk":"sentry.javascript.cloudflare","spans":["http.client GET http://127.0.0.1:41209/rec"]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"aa26c6bf67a34ff988a2a55553c80b4f","sdk":"sentry.javascript.cloudflare","spans":["db SELECT id, name FROM users"]}
  page body: <pre>{"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
{"type":"transaction","name":"GET /logs","op":"http.server","source":"route","status":"ok","trace_id":"f09cc771b98e49758f81853b92e7159d","sdk":"sentry.javascript.cloudflare","spans":[]}
{"type":"log","items":["info: rr-cf log from loader trace=f09cc771b98e49758f81853b92e7159d"]}
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","sdk":"sentry.javascript.cloudflare","spans":[]}
{"type":"event","exception":"Error: iso-error-alpha","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare","url":"http://127.0.0.1:41211/iso/alpha","trace_id":"24de5a767dae43359f098a87108db932","tags":{"iso_tag":"alpha"}}
{"type":"transaction","name":"GET /iso/:tag","op":"http.server","source":"route","status":"ok","trace_id":"24de5a767dae43359f098a87108db932","sdk":"sentry.javascript.cloudflare","spans":[]}
{"type":"event","exception":"Error: iso-error-bravo","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare","url":"http://127.0.0.1:41211/iso/bravo","trace_id":"ebb996fd180f4617beef001a3b97318e","tags":{"iso_tag":"bravo"}}
{"type":"transaction","name":"GET /iso/:tag","op":"http.server","source":"route","status":"ok","trace_id":"ebb996fd180f4617beef001a3b97318e","sdk":"sentry.javascript.cloudflare","spans":[]}
{"type":"event","exception":"Error: iso-error-charlie","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare","url":"http://127.0.0.1:41211/iso/charlie","trace_id":"1f71b136dcf04754bb520f1d2b9206c4","tags":{"iso_tag":"charlie"}}
{"type":"transaction","name":"GET /iso/:tag","op":"http.server","source":"route","status":"ok","trace_id":"1f71b136dcf04754bb520f1d2b9206c4","sdk":"sentry.javascript.cloudflare","spans":[]}
```

Recorder (`/__hits`), outgoing fetch from the `/fetchout` loader:

```
[{"url":"/rec","sentryTrace":"4ef34e637b294819b6dca5ee06b976bd-875d95c0091b0623-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=4ef34e637b294819b6dca5ee06b976bd,sentry-sampled=true,sentry-sample_rand=0.14477402060617217,sentry-sample_rate=1"}]
```

`injectTraceMetaTags` confirmed in the HTML:

```
<meta name="sentry-trace" content="7df4208ea8094893971f5516658edc54-bed6413057571b38-1"/>
```

Per-capability comparison:

| capability | recorded | observed | match |
| --- | --- | --- | --- |
| errors | works | works | yes |
| route names | works | works | yes |
| isolation | works | works | yes |
| incoming trace | works | works | yes |
| outgoing fetch | works | works | yes |
| db spans | works | works | yes |
| logs | works | works | yes |
| client errors | not-run | not-run | n/a |

Differences from the record: none of substance. Cosmetic only — the sink used here prints the
exception as `"Error: rr-deno loader boom"` (type prefix included) where the record shows
`"rr-deno loader boom"`, ports differ (41207/41209/41211 vs 52881/52883), and the
`buildTimeInstrumentation: false` variant and the `traceLifecycle: 'stream'` variant were not
re-run — only the primary `static` run was made. `/boom` still keeps the loader-error message
string `rr-deno loader boom`, copied verbatim from the record's app.

## Files

- `workers/app.ts` — Worker entry, `Sentry.withSentry` + `createRequestHandler`, `SINK_PORT` and
  `TRACE_LIFECYCLE` constants live here.
- `app/entry.server.tsx` — `wrapSentryHandleRequest`, `injectTraceMetaTags`, hand-rolled `handleError`.
- `app/routes/*.tsx` — one route per capability; `app/db.server.ts` holds the module-scope
  `mysql.createPool`.
- `sink2.mjs` — envelope sink (`/__items`, `DELETE /__items`, `/__raw`).
- `recorder.mjs` — echoes the `sentry-trace` / `baggage` headers of incoming requests at `/__hits`.
- `items.json`, `sink.log`, `rec.log`, `app.log` (first, failed run), `app2.log`, `build2.log` —
  captured output of the run above.

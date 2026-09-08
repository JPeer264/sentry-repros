# M-elysia-deno: Elysia 1.4.30 on Deno 2.9.0 (nodeModulesDir: "manual", Deno.serve + app.fetch)

## What it reproduces

Root cause of the (A) failures is one line in packages/elysia/src/withElysia.ts: `function isBun() { return typeof Bun !== 'undefined'; }` gates the whole root-span / withIsolationScope / continueTrace block. On Deno that is false, so withElysia falls through to the Node branch `const activeSpan = getActiveSpan(); if (activeSpan) rootSpanForRequest.set(...)`, which silently does nothing because @sentry/bun does not instrument Deno.serve. Nothing warns; the app looks instrumented (spans do arrive) but every lifecycle span is its own root segment and the whole process shares one trace and one isolation scope for its entire lifetime. The condition should be "no HTTP-server instrumentation created a root span" rather than "is Bun". @sentry/deno already provides that root span and isolation scope, which is what makes (B) work end to end.

Second bug seen in (A): events are tagged `sdk: sentry.javascript.bun` and `contexts.runtime.name: bun` while running on Deno. In packages/elysia/src/sdk.ts the object `options` is spread from `userOptions` BEFORE `applySdkMetadata(userOptions, 'elysia', ...)` runs, so the elysia metadata never reaches the client and the bun SDK identity survives; `getRuntime()` correctly returns a non-bun runtime but the runtime context is overwritten downstream by @sentry/bun.

Third: withElysia is reachable only through @sentry/elysia's package entry, which re-exports the entirety of @sentry/bun. So the working Deno configuration cannot be written by a user following any public API; it needs a deep import into build/esm/withElysia.js. A `@sentry/elysia/deno` subpath (or re-exporting withElysia from @sentry/deno) would make (B) documentable.

Environment notes: mysql2 is unusable on Deno whenever the @sentry/deno import hook is loaded (K3 confirmed, mysql2/lib/connection_config.js:13 requires a JSON file); mysql@2 works. Ports 43711 (sink), 43712 (app A), 43713 (recorder), 43714 (app B), 41338 (bare) were used; 41337 was already held by another agent. All four processes were killed and node_modules (123M) removed.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Elysia runs on Deno unchanged: `new Elysia().get(...)` mounted with `Deno.serve({port}, app.fetch)`, deno.json `{"nodeModulesDir":"manual"}`, deps installed with npm. Two Sentry wirings exist and they behave very differently.

(A) The wiring a docs page would show today (@sentry/elysia, the documented package):
  npm install elysia@1 mysql@2 $REPRO/_toolbox/pack/sentry-{elysia,bun,node,core,deno,opentelemetry,server-utils,server-runtime-injection}-10.67.0.tgz
  instrument.ts: `import "@sentry/deno/import";` then `import * as Sentry from "@sentry/elysia"; Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: 'static'|'stream' })`
  app.ts: `import "./instrument.ts";` as the first line, `Sentry.withElysia(new Elysia()).get(...)`, `Deno.serve({port,hostname}, app.fetch)`
  run: `deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi app.ts`
  This loads and inits fine but is BROKEN for tracing/isolation: withElysia's `isBun()` guard is false on Deno, so it takes the Node branch that assumes an HTTP-instrumentation root span, and @sentry/bun does not instrument Deno.serve. Result: no root span, no isolation scope, no continueTrace.

(B) The wiring that actually works, but is not reachable through any public export:
  `import "@sentry/deno/import"; import * as Sentry from "@sentry/deno"; Sentry.init({...})` plus
  `import { withElysia } from "./node_modules/@sentry/elysia/build/esm/withElysia.js";`
  @sentry/deno instruments Deno.serve and supplies the root span + isolation scope, and withElysia's Node branch then works exactly as intended. A docs page cannot show this today because @sentry/elysia's package entry re-exports all of @sentry/bun, and @sentry/deno exports no withElysia. Shipping it would need a `@sentry/elysia/deno` subpath or a withElysia re-export from @sentry/deno.

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH
D=$REPRO/cells/M-elysia-deno

# deps (node_modules was deleted afterwards, reinstall to rerun)
cd $D && npm install elysia@1 mysql@2 \
  $REPRO/_toolbox/pack/sentry-elysia-10.67.0.tgz $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz $REPRO/_toolbox/pack/sentry-deno-10.67.0.tgz $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz

# sink + outgoing-fetch recorder
PORT=43711 node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 &
node $D/recorder.mjs > recorder.log 2>&1 &

# viability, no Sentry (port 41338)
deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys $D/bare.ts
curl -s http://127.0.0.1:41338/users/42

# wiring (A), @sentry/elysia (port 43712)
cd $D && LIFECYCLE=static deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi --allow-run app.ts
cd $D && LIFECYCLE=stream deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi --allow-run app.ts
curl -s http://127.0.0.1:43712/users/42; curl -s http://127.0.0.1:43712/boom
for t in aaa bbb ccc; do curl -s "http://127.0.0.1:43712/tag/$t" & done; wait
curl -s -H 'sentry-trace: 12345678901234567890123456789012-1234567890123456-1' \
     -H 'baggage: sentry-trace_id=12345678901234567890123456789012,sentry-public_key=public,sentry-sample_rate=1' \
     http://127.0.0.1:43712/tag/incoming
curl -s http://127.0.0.1:43712/fetchout; curl -s http://127.0.0.1:43712/db; curl -s http://127.0.0.1:43712/log

# wiring (B), @sentry/deno + deep-imported withElysia (port 43714)
cd $D && deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi --allow-run app-denosdk.ts
curl -s http://127.0.0.1:43714/users/42   # same route set

# read results
curl -s http://127.0.0.1:43711/__items
curl -s http://127.0.0.1:43713/__seen
```

Files: `app-denosdk.log`, `app-denosdk.ts`, `app-denosdk2.log`, `app-stream.log`, `app.log`, `app.ts`, `bare.log`, `bare.ts`, `deno.json`, `instrument.ts`, `package-lock.json`, `package.json`, `recorder.log`, `recorder.mjs`, `sink.log`, `t-import.ts`, `t-init.ts`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | works | Both wirings: a throw in a route handler reaches Sentry via withElysia's global onError hook, mechanism `auto.http.elysia.on_error`, handled false, with request url/method/headers and a context line. Elysia converts the throw into a 500 text response, so it is swallowed at the HTTP level but not for Sentry. Both results from traceLifecycle 'static'. |
| route names | broken | Wiring (A): no http.server span at all. Every Elysia lifecycle phase span becomes its own root segment, so the sink sees separate transactions named Request, Parse, Transform, BeforeHandle, Handle, AfterHandle, MapResponse, AfterResponse, each op middleware/handler and source `custom`. In stream lifecycle the handler span is named `/users/:id` but is still is_segment true with no parent server span. Only the isolation-scope transaction name on error events is right (`GET /tag/:t`). Wiring (B) gives the correct `GET /users/:id`, op http.server, source route, with the nine lifecycle spans nested under it. |
| isolation | broken | Wiring (A): three concurrent /tag/:t requests plus a later sentinel all carried the same process-wide trace id (f694377a31684aa6a2a074082b4262e8, unchanged across every request for the process lifetime); the sentinel event inherited `reqtag: bbb` from another request and the `tagged-aaa` event carried transaction `GET /sentinel`. Cause: withElysia only calls withIsolationScope/continueTrace inside its isBun() branch. Wiring (B): correct, three distinct trace ids, each event carrying only its own tag. Static lifecycle. |
| incoming trace | broken | Wiring (A): a request with `sentry-trace: 12345678901234567890123456789012-1234567890123456-1` plus baggage produced events on the process-wide trace f694377a..., not the incoming id; no continueTrace runs on the non-Bun path. Wiring (B): trace continued, transaction trace_id 12345678901234567890123456789012 with parent_span_id 1234567890123456. Static lifecycle. |
| outgoing fetch | partial | No http.client span in either wiring. Headers differ: wiring (A) (@sentry/bun's fetchIntegration patching globalThis.fetch) does attach sentry-trace and baggage to the outgoing request; wiring (B) (@sentry/deno) attaches nothing, matching known finding K2. So on Deno you get propagation-without-a-span at best. Static lifecycle. |
| db spans | works | A module-scope mysql@2 connection queried inside a handler produced a `db SELECT id, name FROM users` span in both wirings. Instrumentation path: the Deno import hook, `import "@sentry/deno/import";` as the first line of the entry, and it was required. It works even when @sentry/elysia/@sentry/bun does the init. mysql2 cannot be used at all: with the hook active it dies at import with `SyntaxError: Unexpected token ':'` from a require of a JSON file (known K3). In (B) the db span nests under the server transaction; in (A) it arrives as its own root transaction. Static lifecycle. |
| logs | works | Sentry.logger.info(...) inside a handler arrived as a log envelope in both wirings (`info: elysia-deno-log-line` for A, `info: denosdk-log-line` for B) after the ~7s flush timer. Static lifecycle. |
| client errors | not-run | No browser surface in this cell; Elysia on Deno is a server-only app and no client bundle was built. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
# bare Elysia on Deno, no Sentry (viability)
$ curl -s http://127.0.0.1:41338/users/42
{"id":"42"}

# (A) @sentry/elysia on Deno, traceLifecycle static: GET /users/42, GET /boom, /sentinel
{"type":"transaction","name":"Request","op":"middleware","source":"custom","trace_id":"f694377a31684aa6a2a074082b4262e8","spans":["middleware sentryOnRequest"]}
{"type":"transaction","name":"Handle","op":"handler","source":"custom","trace_id":"f694377a31684aa6a2a074082b4262e8","spans":[]}
{"type":"transaction","name":"AfterResponse","op":"middleware","source":"custom","trace_id":"f694377a31684aa6a2a074082b4262e8","spans":[]}
{"type":"event","exception":"Error: elysia-deno-boom","mechanism":"auto.http.elysia.on_error","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","transaction":"GET /boom","trace_id":"f694377a31684aa6a2a074082b4262e8","request":{"url":"http://127.0.0.1:43712/boom","method":"GET"}}
(no transaction with op http.server appears anywhere in this run)

# (A) isolation: 3 concurrent /tag/<t> + sentinel
{"ex":"Error: tagged-aaa","tags":{"reqtag":"aaa"},"trace":"f694377a31684aa6a2a074082b4262e8","tx":"GET /sentinel","url":"http://127.0.0.1:43712/tag/aaa"}
{"ex":"Error: tagged-ccc","tags":{"reqtag":"ccc"},"trace":"f694377a31684aa6a2a074082b4262e8","tx":"GET /tag/:t","url":"http://127.0.0.1:43712/tag/ccc"}
{"ex":"Error: tagged-bbb","tags":{"reqtag":"bbb"},"trace":"f694377a31684aa6a2a074082b4262e8","tx":"GET /tag/:t","url":"http://127.0.0.1:43712/tag/bbb"}
{"m":"sentinel","tags":{"reqtag":"bbb"},"trace":"f694377a31684aa6a2a074082b4262e8","tx":"GET /tag/:t","url":"http://127.0.0.1:43712/sentinel"}

# (A) incoming sentry-trace 12345678901234567890123456789012-1234567890123456-1
{"t":"event","n":"Error: tagged-incoming","trace":"f694377a31684aa6a2a074082b4262e8"}   <- not continued

# (A) traceLifecycle stream, GET /users/42 then GET /boom
{"t":"span","items":["middleware sentryOnRequest","middleware Request","middleware Parse","middleware Transform","middleware BeforeHandle","handler /users/:id","middleware sentryOnAfterHandle","middleware AfterHandle","middleware MapResponse","middleware AfterResponse","middleware sentryOnRequest","middleware Request","middleware Parse","middleware Transform","middleware BeforeHandle","handler /boom","middleware sentryOnError","middleware Error","middleware AfterResponse"],"trace":"47a1cafe044e4fdbb67f1c67e88e43b9"}
  raw: {"name":"Request","is_segment":true,"origin":"auto.http.elysia"}, {"name":"/users/:id","is_segment":true,"origin":"auto.http.elysia"}, ... (10 segments per request, no http.server span, both requests share one trace id)

# (A) outgoing fetch: headers yes, span no
recorder: [{"url":"/rec","headers":{"sentry-trace":"f694377a31684aa6a2a074082b4262e8-9b9bbb445962dbd5","baggage":"sentry-environment=production,sentry-release=m-elysia-deno%401,sentry-public_key=public,sentry-trace_id=f694377a31684aa6a2a074082b4262e8"}}]
sink: no item with op http.client

# (A) db + logs
{"t":"transaction","n":"SELECT id, name FROM users","op":"db","spans":[]}
{"t":"log","items":["info: elysia-deno-log-line"]}

# (A) mysql2 with the Deno import hook active
SyntaxError: Unexpected token ':'
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at Module.require (node:module:1609:19)
    at Object.&lt;anonymous&gt; (.../node_modules/mysql2/lib/connection_config.js:13:21)

# (B) @sentry/deno init + deep-imported withElysia, traceLifecycle static
{"t":"transaction","n":"GET /users/:id","op":"http.server","src":"route","spans":["middleware Request","middleware sentryOnRequest","middleware Parse","middleware Transform","middleware BeforeHandle","handler Handle","middleware AfterHandle","middleware sentryOnAfterHandle","middleware MapResponse"],"trace":"d5b0ee9b961949f6a19ea02db96d423e"}
{"t":"transaction","n":"GET /tag/:t","op":"http.server","src":"route","trace":"ce53b38a26344e58be7669f6cb433792"}
{"t":"event","n":"Error: tagged-aaa","tags":{"reqtag":"aaa"},"trace":"ce53b38a26344e58be7669f6cb433792"}
{"t":"transaction","n":"GET /tag/:t","op":"http.server","src":"route","trace":"d12d8d5616274693a86624495dbab286"}
{"t":"event","n":"Error: tagged-ccc","tags":{"reqtag":"ccc"},"trace":"d12d8d5616274693a86624495dbab286"}
{"t":"transaction","n":"GET /tag/:t","op":"http.server","src":"route","trace":"fcf66b1c456e475c800befd79c731d3b"}
{"t":"event","n":"Error: tagged-bbb","tags":{"reqtag":"bbb"},"trace":"fcf66b1c456e475c800befd79c731d3b"}
{"t":"event","n":"Error: denosdk-boom","tx":"GET /boom","trace":"12345678901234567890123456789012"}
{"t":"transaction","n":"GET /boom","op":"http.server","src":"route","trace":"12345678901234567890123456789012","parent":"1234567890123456"}

# (B) db nested, log, fetch
{"t":"transaction","n":"GET /db","op":"http.server","src":"route","spans":[...,"handler Handle","db SELECT id, name FROM users","middleware AfterHandle",...]}
{"t":"log","items":["info: denosdk-log-line"]}
recorder: {"url":"/rec2","headers":{}}   <- no sentry-trace, no baggage, no http.client span
```

## Docs note

No page in ~/dev/sentry-docs mentions Elysia on Deno. The Elysia guide at docs/platforms/javascript/guides/elysia/index.mdx:25 lists prerequisites as "Bun or Node.js 18+ (with @elysiajs/node adapter)" and its install/init snippets have only Bun and Node.js tabs (index.mdx:55, :59, :82, :111). The runtime section in platform-includes/performance/what-instrumentation-provides/javascript.elysia.mdx:11-12 documents exactly two runtimes: "**Bun**: The SDK creates root server spans via Elysia's `.wrap()` API with `continueTrace` for trace propagation" and "**Node.js**: The SDK uses Node's HTTP instrumentation for root spans". Deno is the unlisted third case, and it is the one where neither mechanism fires. grep for "elysia" under docs/platforms/javascript/guides/deno/ returns nothing, and grep for "deno" under docs/platforms/javascript/guides/elysia/ returns nothing.

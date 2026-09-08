# QS-node — plain Node.js getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `6f2da7483d` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack/`. Node `v26.5.0`, macOS.
All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

## What it reproduces

A new user following the Node.js quickstart end to end: install, write `instrument.mjs`, start the app
with `node --import ./instrument.mjs app.mjs`, and run the verify step. The app is a plain `node:http`
server with four routes:

| Route | What it does |
| --- | --- |
| `/debug-sentry` | throws, catches, `Sentry.captureException(e)` (the guide's verify snippet) |
| `/debug-span` | `Sentry.startSpan({op:"test", name:"My First Test Transaction"})` around an outgoing `fetch` to the sink's `/recorder`, which records the inbound `sentry-trace` / `baggage` headers |
| `/debug-log` | `Sentry.logger.info("hello from /debug-log", ...)` |
| `/sentinel` | `Sentry.captureMessage("sentinel")` — the run waits for this in the sink instead of sleeping |

Three alternative ways of loading the instrument file are run as separate variants.

## Install

```bash
cd /Users/janpeer/dev/sentry-runtime-audit-repros/quickstarts/node
P=/Users/janpeer/dev/sentry-runtime-audit-repros/_toolbox/pack
npm install $P/sentry-node-10.67.0.tgz $P/sentry-core-10.67.0.tgz $P/sentry-server-utils-10.67.0.tgz \
            $P/sentry-opentelemetry-10.67.0.tgz $P/sentry-server-runtime-injection-10.67.0.tgz \
            $P/sentry-bundler-plugins-10.67.0.tgz
# only for the library side check in "Variant (b), library check":
npm install express@5 --no-save
```

## Run

```bash
cd /Users/janpeer/dev/sentry-runtime-audit-repros/quickstarts/node
./run.sh import        # node --import ./instrument.mjs app.mjs      -> results-import.json
./run.sh require-cjs   # node --require ./instrument.cjs app.mjs     -> results-require-cjs.json
./run.sh self-import   # node app-import-first.mjs                   -> results-self-import.json
./run.sh node-options  # NODE_OPTIONS="--import ./instrument.mjs"    -> results-node-options.json

./probe-express.sh flag   # express under --import      -> results-express-flag.json
./probe-express.sh self   # express under first-line import -> results-express-self.json
```

Each script starts the sink on `127.0.0.1:41317`, starts one app on `127.0.0.1:41318`, curls the routes,
polls `/__items` until the sentinel event, the sentinel span and the log batch have all arrived, writes
`results-<variant>.json` (sink items + raw span payloads + the headers the downstream server saw), and
kills both processes. Init debug output for a variant is in `app-<variant>.log`.

## Expected (what the guide claims)

- `docs/platforms/javascript/guides/node/index.mdx:16` pulls in `platform-includes/getting-started-node/javascript.mdx`.
- `platform-includes/getting-started-install/javascript.node.mdx:3-5` — `npm install @sentry/node`.
- `platform-includes/getting-started-config/javascript.node.mdx:37-70` — create `instrument.mjs`:
  `import * as Sentry from "@sentry/node";` … `Sentry.init({ dsn: "…", tracesSampleRate: 1.0 });`
- `platform-includes/getting-started-node/javascript.mdx:40` — "create a file named `instrument.(js|mjs)` in the root directory of your project".
- `platform-includes/getting-started-node/javascript.mdx:55` — "Import `instrument.js` before any other modules to ensure Sentry initializes early. If you initialize later, auto-instrumentation and modules like database monitoring, agent tracing, tracing may not work."
- `platform-includes/getting-started-node/javascript.mdx:93-96` — ESM: `node --import ./instrument.mjs app.mjs`.
- `platform-includes/getting-started-use/javascript.node.mdx:1-9` — CommonJS: `require("./instrument");` as the first line of `app.js`.
- `platform-includes/getting-started-verify/javascript.node.mdx:12-20` — verify errors with `try { foo() } catch (e) { Sentry.captureException(e) }`.
- `platform-includes/getting-started-verify/javascript.node.mdx:38-53` — verify tracing with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, …)`.
- `platform-includes/getting-started-node/javascript.mdx:120` — "head over to your project on Sentry.io to view the collected data".
- `docs/platforms/javascript/common/install/esm.mdx:44-48` — `NODE_OPTIONS="--import ./instrument.mjs" npm run start` when the flag is not available.
- `platform-includes/getting-started-prerequisites/javascript.node.mdx:7` — "Node version `18.0.0` or above".

## Observed on 2026-09-08

### Step 1 — Install

`npm install` of the six develop tarballs succeeded with no peer or version complaints
(`added 65 packages, and audited 66 packages in 9s`). `node_modules/@sentry` holds
`bundler-plugins conventions core node opentelemetry server-runtime-injection server-utils`, all `10.67.0`.
`@sentry/conventions` is pulled from the registry as a normal published dependency; no `@sentry/*` SDK
package came from the registry. **Holds.**

### Step 2 — Configure

`instrument.mjs` is the guide's snippet verbatim plus `tunnel` (to reach the local sink) and `debug: true`.
`node --import ./instrument.mjs app.mjs` started and instrumented the app with no warning. **Holds.**

### Step 3 — Verify (variant `import`, `results-import.json`)

Error event, verbatim and trimmed from `/__items`:

```json
{"type":"event","exception":"Error: debug-sentry route failure","mechanism":"generic","handled":true,
 "sdk":"sentry.javascript.node","sdk_version":"10.67.0","runtime":"node","runtime_version":"v26.5.0",
 "hasContextLine":true,"transaction":"GET /debug-sentry","environment":"production",
 "request":{"url":"http://127.0.0.1:41318/debug-sentry","method":"GET","hasData":false,
            "headers":{"host":"127.0.0.1:41318","user-agent":"curl/8.7.1","accept":"*/*"}},
 "user":{"ip_address":"127.0.0.1"}}
```

Note the event's `transaction` is `GET /debug-sentry` (path included), while the span that carries the
same request is named `GET` only — see below.

Server spans, one `span` envelope per request (default `traceLifecycle: 'stream'`; **no `transaction`
envelope was sent for any route**):

```json
{"type":"span","trace_id":"f472…","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"error","is_segment":true,
         "origin":"auto.http.http_server","url":"http://127.0.0.1:41318/debug-sentry"}]}
{"type":"span","trace_id":"ae6a…","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"ok","is_segment":true,
         "origin":"auto.http.http_server","url":"http://127.0.0.1:41318/debug-log"}]}
{"type":"span","trace_id":"06e4…","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"ok","is_segment":true,
         "origin":"auto.http.http_server","url":"http://127.0.0.1:41318/sentinel"}]}
```

`sentry.source` is not set on these streamed segment spans (`"source"` is absent from every `raw` entry).

`/debug-span` — the manual span, the `http.client` span and the server span arrive in one envelope:

```json
{"type":"span","trace_id":"5393eb9d38124fa2865eca3d0a233367",
 "items":["http.client GET 127.0.0.1","test My First Test Transaction","http.server GET"],
 "raw":[{"name":"GET 127.0.0.1","op":"http.client","status":"ok","parent_span_id":"b41e57d76efd508f",
         "is_segment":false,"origin":"auto.http.node_fetch","url":"http://127.0.0.1:41317/recorder?from=debug-span"},
        {"name":"My First Test Transaction","op":"test","status":"ok","parent_span_id":"983c01d667c87885",
         "is_segment":false,"origin":"manual"},
        {"name":"GET","op":"http.server","status":"ok","is_segment":true,"origin":"auto.http.http_server",
         "url":"http://127.0.0.1:41318/debug-span"}]}
```

The downstream server saw both propagation headers (`/__headers`):

```json
{"url":"/recorder?from=debug-span",
 "sentry-trace":"5393eb9d38124fa2865eca3d0a233367-bb8c73b05c70fb06-1",
 "baggage":"sentry-environment=production,sentry-public_key=1234567890abcdef1234567890abcdef,sentry-trace_id=5393eb9d38124fa2865eca3d0a233367,sentry-org_id=0,sentry-sampled=true,sentry-sample_rand=0.7038315530858169,sentry-sample_rate=1",
 "traceparent":null}
```

Log item:

```json
{"type":"log","items":["info: hello from /debug-log"]}
```

Sentinel (also shows that `captureMessage` ships a synthetic stack trace, `attachStacktrace` is on by default):

```json
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,
 "sdk":"sentry.javascript.node","sdk_version":"10.67.0","runtime":"node","runtime_version":"v26.5.0",
 "hasContextLine":true,"transaction":"GET /sentinel"}
```

### Step 4 — Manual setup variants

All four variants produced **byte-for-byte the same set of item shapes**: 2 events, 5 `span` envelopes
(including the readiness probe on `/nope`), 1 `log`, 45 integrations installed, `sentry-trace` and
`baggage` on the outgoing fetch. Diff files: `results-import.json`, `results-require-cjs.json`,
`results-self-import.json`, `results-node-options.json`.

**(a) `node --require ./instrument.cjs app.mjs`** — works, but prints a deprecation banner on stderr
that the docs do not mention (`app-require-cjs.log:1`):

```
[Sentry] Initializing the SDK via the Node `--require` flag is no longer supported, because Node re-runs `--require` preloads on its module loader thread. Use `--import` instead: `node --import ./instrument.js app.js`
```

Despite "no longer supported", every signal was captured: error event, all five server spans, the
`http.client` span with headers, the log. `app-require-cjs.log:77` reports `SDK initialized from CommonJS`.

**(b) `import "./instrument.mjs";` as the first line of `app-import-first.mjs`** — works; nothing is
missing compared to the flag for this app. Same items, and `app-self-import.log` shows the same
`Registered diagnostics-channel injection via Module.registerHooks()` / `SDK initialized from ESM` /
`[Sentry] Runtime hook registered, injected libraries=[]` lines as the `--import` run.

**Variant (b), library check** (`probe-express.sh`, an express 5 app with a `/users/:id` route, because
`node:http` alone cannot show whether third-party module instrumentation was missed):

```
--import ./instrument.mjs (results-express-flag.json):
["handler /users/:id","http.server GET /users/:id"]
["handler /sentinel","http.server GET /sentinel"]

first-line import (results-express-self.json):
["handler /users/:id","http.server GET /users/:id"]
["handler /sentinel","http.server GET /sentinel"]
```

Identical. On develop the instrumentation is registered through `Module.registerHooks()` while
`@sentry/node` is evaluated, and in an ESM graph the first-line import is evaluated before `express`,
so the ordering warning at `javascript.mdx:55` no longer bites for a plain first-line import.
(Express also gives route-named server spans — `GET /users/:id` — which the plain `node:http` app does not.)

**(c) `NODE_OPTIONS="--import ./instrument.mjs" node app.mjs`** — works, identical to the flag,
no warning.

### Step 5 — Init debug output

`debug: true` prints **no SDK name, no SDK version and no runtime version**. The only identity line is:

```
Sentry Logger [log]: Initializing Sentry: process: 30045, thread: main.
```

Those values had to be read off the envelopes instead: `sdk` `sentry.javascript.node`, `sdk_version`
`10.67.0`, `runtime` `node`, `runtime_version` `v26.5.0`.

Loader lines (identical across all four variants):

```
Sentry Logger [log]: Registered diagnostics-channel injection via Module.registerHooks()
Sentry Logger [log]: SDK initialized from ESM        (CommonJS in the --require variant)
Sentry Logger [log]: [Sentry] Runtime hook registered, injected libraries=[]
Sentry Logger [log]: [Sentry] Bundler plugin did not run
```

**45 integrations installed**, in order:

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http
NodeFetch OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess
WorkerThreads ProcessSession Modules Express Fastify Hapi Koa Graphql Mongo Mongoose Mysql Mysql2 Redis
Postgres Prisma Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph VercelAI OpenAI
Anthropic_AI Google_GenAI PostgresJs Firebase SpanStreaming
```

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/node` is all you need (`getting-started-install/javascript.node.mdx:3-5`) | **yes** |
| `instrument.mjs` snippet initializes the SDK (`getting-started-config/javascript.node.mdx:37-70`) | **yes** |
| `node --import ./instrument.mjs app.mjs` instruments the app (`getting-started-node/javascript.mdx:93-96`) | **yes** |
| Init must come before any other module or "auto-instrumentation … may not work" (`getting-started-node/javascript.mdx:55`) | **partial** — still the right advice, but a first-line `import "./instrument.mjs"` is now equivalent to `--import`, including for express |
| `try/catch` + `captureException` produces an issue (`getting-started-verify/javascript.node.mdx:12-20`) | **yes** — `mechanism: "generic"`, `handled: true`, context lines present |
| `Sentry.startSpan({op:"test", name:"My First Test Transaction"})` produces a trace (`getting-started-verify/javascript.node.mdx:38-53`) | **partial** — the span exists, but it ships in a `span` envelope as a child of the `http.server` segment; no `transaction` envelope is sent at all on develop's default `traceLifecycle: 'stream'`, and the guide's "My First Test Transaction" wording implies a transaction |
| The captured data shows up as named transactions in the product (`getting-started-node/javascript.mdx:120`) | **partial** — for a plain `node:http` app the server span is named `GET` with no `sentry.source`, so there is no per-route name; the error event's `transaction` field does carry `GET /debug-sentry` |
| `NODE_OPTIONS="--import ./instrument.mjs"` is an alternative (`install/esm.mdx:44-48`) | **yes** |
| CommonJS setup (`getting-started-use/javascript.node.mdx:1-9`) | **partial** — the documented in-app `require("./instrument")` was not run here; the `--require` *flag* form still works but prints "no longer supported", which no docs page mentions |
| Node `>= 18.0.0` (`getting-started-prerequisites/javascript.node.mdx:7`) | **not tested** — only Node v26.5.0 was available |

## Files

`instrument.mjs`, `instrument.cjs`, `routes.mjs`, `app.mjs`, `app-import-first.mjs`,
`probe-express.mjs`, `probe-express-self-import.mjs`, `run.sh`, `probe-express.sh`,
`sink.mjs` (a copy of `../../_toolbox/sink.mjs` extended with `sdk_version`, `runtime_version`,
span `op`/`url`, a `/recorder` endpoint that records inbound propagation headers, and `/__headers`).

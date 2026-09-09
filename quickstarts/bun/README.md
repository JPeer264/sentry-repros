# QS-bun — plain Bun getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `6f2da7483d` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack/`. Bun `1.4.2`, macOS.
(The audit runs behind `_reports/quick-starts.html` used bun `1.4.0`; this reproduction ran on `1.4.2`.)
All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

## What it reproduces

A new user following the Bun quickstart end to end: install `@sentry/bun`, write `instrument.ts`,
start the app with `bun --preload ./instrument.ts app.ts`, and run the verify step. The app is a plain
`Bun.serve` with `routes`, exactly the shape the proposed quick start shows:

| Route | What it does |
| --- | --- |
| `/users/:id` | `Response.json({ id: req.params.id })` — the quick start's example route |
| `/debug-sentry` | throws `new Error("My first Sentry error!")` out of the route handler |
| `/debug-span` | `Sentry.startSpan({op:"test", name:"My First Test Span"})` around an outgoing `fetch` to the sink's `/recorder`, which records the inbound `sentry-trace` / `baggage` headers |
| `/debug-log` | `Sentry.logger.info("hello from /debug-log", ...)` |
| `/sentinel` | `Sentry.captureMessage("sentinel")` — the run waits for this in the sink instead of sleeping |

Four alternative ways of loading / building the app are run as separate variants, plus one extra build
shape (`bundle-minimal`) that drops `external: ["@sentry/*"]` from the build.

## Install

```bash
cd $REPRO/quickstarts/bun
bun install     # package.json pins every @sentry/* to a tarball in ../../_toolbox/pack/
```

The documented `bun add @sentry/bun` cannot be used against tarballs. Passing the tarballs directly:

```
$ bun add $P/sentry-bun-10.67.0.tgz $P/sentry-core-10.67.0.tgz $P/sentry-server-utils-10.67.0.tgz \
          $P/sentry-node-10.67.0.tgz $P/sentry-opentelemetry-10.67.0.tgz \
          $P/sentry-server-runtime-injection-10.67.0.tgz $P/sentry-bundler-plugins-10.67.0.tgz
bun add v1.4.2 (744846f84)
Resolving dependencies
Resolved, downloaded and extracted [104]
error: No version matching "10.67.0" found for specifier "@sentry/server-runtime-injection" (but package exists)
error: @sentry/server-runtime-injection@10.67.0 failed to resolve
```

Bun resolves the tarballs' transitive `@sentry/*@10.67.0` deps against the registry, where `10.67.0` is
not published. `package.json` therefore carries a `overrides` block mapping every `@sentry/*` to its
tarball, and `bun install` then succeeds (`66 packages installed`). This is a harness artifact of testing
an unpublished build, not a defect in the guide.

## Run

```bash
cd $REPRO/quickstarts/bun
./run.sh preload         # bun --preload ./instrument.ts app.ts            -> results-preload.json
./run.sh bunfig          # preload = ["./instrument.ts"] in bunfig.toml    -> results-bunfig.json
./run.sh self-import     # import "./instrument" first line, bun app.ts    -> results-self-import.json
./run.sh bundle          # build.ts + bun --preload ./instrument.ts dist/app.js
./run.sh bundle-minimal  # build-minimal.ts (no `external`) + same preload
./run.sh watch           # bun --watch --preload ./instrument.ts app.ts    -> results-watch.json
```

Each run starts the sink on `127.0.0.1:41417`, starts one app on `127.0.0.1:41418`, curls the five
routes, polls `/__items` until the sentinel event, the sentinel's server span and the timer-flushed log
batch have all arrived, writes `results-<variant>.json` (sink items + raw span payloads + the headers the
recorder saw), and kills both processes. Init debug output is in `app-<variant>.log`.

`bunfig.toml` in this directory holds the variant `(a)` preload line, so every other variant is started
with `--config=./bunfig-none.toml` to keep that preload out of the way. Note that the space form
`bun -c ./bunfig-none.toml app.ts` silently swallows the entry file (Sentry initializes, the app never
runs); only `--config=./bunfig-none.toml` works. That is a Bun CLI quirk, not an SDK one.

## Expected (what the guide and the quick start claim)

Current guide, `~/dev/sentry-docs/docs/platforms/javascript/guides/bun/index.mdx`:

- `index.mdx:12` pulls in `platform-includes/getting-started-prerequisites/_default.mdx`, which asks only
  for "A Sentry account and project" and "Your application up and running" (`_default.mdx:3-6`). No Bun
  version is stated anywhere in the guide.
- `index.mdx:38` — "`bun add @sentry/bun`".
- `index.mdx:53-54` — "Sentry should be initialized as early in your app as possible. Create a file named
  `instrument.js` in the root directory of your project".
- `index.mdx:59-76` — the `instrument.js` snippet: `import * as Sentry from "@sentry/bun";` +
  `Sentry.init({ dsn, tracesSampleRate: 1.0 })`.
- `index.mdx:88` — "To make sure that Sentry initializes before any other modules, you need to preload your
  instrumentation file using the `--preload` flag."
- `index.mdx:100` — "`bun --preload ./instrument.js app.js`".
- `index.mdx:92` — "Sentry's auto-instrumentation does not work with bundled code, including Bun's
  single-file executables. This is because auto-instrumentation relies on module loading hooks that are
  not available when code is bundled. If you need to bundle your application, you'll need to manually
  instrument your code instead of relying on auto-instrumentation."
- `index.mdx:130-138` — verify errors with `setTimeout(() => { try { foo(); } catch (e) { Sentry.captureException(e); } }, 99)`.
- `index.mdx:156-172` — verify tracing with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, …)`.
- `index.mdx:188` — "head over to your project on Sentry.io to view the collected data".

Proposed quick start, `~/dev/sentry-runtime-audit-repros/_reports/quick-starts.html`, section "Bun":

- `quick-starts.html:45` — "Works with Bun 1.3.14 or later. Runtime spans (errors, `Bun.serve` requests,
  `fetch`, logs) work on every supported Bun version. Library spans (databases, AI SDKs, Express, Koa,
  Hapi) need a bundle built with the Sentry plugin, see step 3."
- `quick-starts.html:48` — step 1: "`bun add @sentry/bun`".
- `quick-starts.html:50` — "Create `instrument.ts` and preload it. Everything the SDK wraps (`Bun.serve`,
  `fetch`, `node:http`, uncaught errors) is patched when `init()` runs, so it has to run before the rest
  of your app loads".
- `quick-starts.html:51-61` — the `instrument.ts` snippet; `quick-starts.html:62-69` — the `app.ts`
  snippet with `Bun.serve({ routes: { "/users/:id": … } })`; `quick-starts.html:70` —
  "`bun --preload ./instrument.ts app.ts`".
- `quick-starts.html:71` — "Or add `preload = ["./instrument.ts"]` to `bunfig.toml` and run `bun app.ts`.
  An `import "./instrument";` as the first line of the entry file also works for `bun app.ts` and
  `bun --watch`".
- `quick-starts.html:73` — "This is enough for: Uncaught errors … An `http.server` span per request …
  Routes declared in `Bun.serve({ routes })` are named by their pattern (`GET /users/:id`); a plain
  `fetch` handler is named by method only. … `http.client` spans with `sentry-trace` and `baggage`
  headers on outgoing `fetch` and `node:http` requests. … Logs from `Sentry.logger.*`".
- `quick-starts.html:75` — "Database drivers, AI SDKs and the Express, Koa and Hapi integrations record
  spans through `node:diagnostics_channel` events that the Sentry bundler plugin injects into those
  packages at build time. `bun run` on unbundled source cannot inject them, so those integrations stay
  silent there."
- `quick-starts.html:76-87` — `build.ts` with `sentryBunPlugin()`; `quick-starts.html:88-89` —
  "`bun run build.ts` / `bun --preload ./instrument.ts dist/app.js`".
- `quick-starts.html:91` — "Development with `bun --watch app.ts` records runtime spans only."
- `quick-starts.html:94-107` — the verify routes; `quick-starts.html:108` — "In Sentry you should see one
  issue, two `http.server` traces (`GET /debug-sentry` with an error, `GET /debug-span` with a child span)
  and one log line."

## Observed on 2026-09-08

### Step 1 — Install

`bun add` of the tarballs fails on transitive resolution (verbatim output under "Install" above); with
`overrides` in `package.json`, `bun install` reports `66 packages installed [373.00ms]`.
`node_modules/@sentry` holds `bun bundler-plugins conventions core node opentelemetry
server-runtime-injection server-utils`, all `10.67.0` except `@sentry/conventions@0.20.0`, which comes
from the registry as a normal published dependency. No `@sentry/*` SDK package came from the registry.
**Holds** for the guide's real path (`bun add @sentry/bun` against a published version); the failure is a
tarball artifact.

### Step 2 — Configure

`instrument.ts` is the guide's / quick start's snippet verbatim plus `tunnel` (to reach the local sink)
and `debug: true`. `bun --preload ./instrument.ts app.ts` started and instrumented the app.

Two warnings appear on every single run, including the plain documented path (`app-preload.log:1` and
`app-preload.log:101`):

```
Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.
```

Neither the guide nor the quick start's step 2 mentions that the documented setup prints two warnings;
the quick start's step 3 explains the underlying limitation but not the warning text. **Partial.**

### Step 3 — Verify (variant `preload`, `results-preload.json`)

Error event, verbatim and trimmed from `/__items`:

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.http.bun.serve",
 "handled":false,"sdk":"sentry.javascript.bun","sdk_version":"10.67.0","runtime":"bun",
 "runtime_version":"1.4.2","hasContextLine":true,
 "trace_id":"b60221ac63e64d85ab88290869713cae","environment":"production",
 "request":{"url":"http://127.0.0.1:41418/debug-sentry","method":"GET","hasData":false,
            "headers":{"host":"127.0.0.1:41418","user-agent":"curl/8.7.1","accept":"*/*"}}}
```

The event has **no `transaction` field** (the key is absent), unlike the Node reproduction, where the same
error carries `"transaction":"GET /debug-sentry"`. The `request.url` still identifies the route. There is
also no `user` object; the Node run had `"user":{"ip_address":"127.0.0.1"}`.

Server spans, one `span` envelope per request (default `traceLifecycle: 'stream'`; **no `transaction`
envelope was sent for any route** — the only item types in the run are `event`, `span` and `log`):

```json
{"type":"span","trace_id":"9fd3f65c466d4aa5a76d5a53fc622623","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"error","is_segment":true,
         "origin":"auto.http.bun.serve","url":"http://127.0.0.1:41418/nope"}]}
{"type":"span","trace_id":"f325498b9c494b71b039c64cdbeaa248","items":["http.server GET /users/:id"],
 "raw":[{"name":"GET /users/:id","op":"http.server","status":"ok","is_segment":true,
         "origin":"auto.http.bun.serve","url":"http://127.0.0.1:41418/users/42"}]}
{"type":"span","trace_id":"b60221ac63e64d85ab88290869713cae","items":["http.server GET /debug-sentry"],
 "raw":[{"name":"GET /debug-sentry","op":"http.server","status":"error","is_segment":true,
         "origin":"auto.http.bun.serve","url":"http://127.0.0.1:41418/debug-sentry"}]}
{"type":"span","trace_id":"20d93e2a0b9a487989f5f17f1790ee7a","items":["http.server GET /debug-log"],
 "raw":[{"name":"GET /debug-log","op":"http.server","status":"ok","is_segment":true,
         "origin":"auto.http.bun.serve","url":"http://127.0.0.1:41418/debug-log"}]}
{"type":"span","trace_id":"5321c8e0d24d42028934f449c9bc50d5","items":["http.server GET /sentinel"],
 "raw":[{"name":"GET /sentinel","op":"http.server","status":"ok","is_segment":true,
         "origin":"auto.http.bun.serve","url":"http://127.0.0.1:41418/sentinel"}]}
```

Route-declared paths are named by their pattern; the unmatched `/nope` request that falls through to the
plain `fetch` handler is named `GET` only. `sentry.source` is not set on these streamed segment spans, but
`sentry.segment.name` (`"GET /users/:id"`), `sentry.segment.name.source` (`"route"`) and `url.template`
(`"/users/:id"`) are, and the routed span carries `url.path.parameter.id`.

`/debug-span` — the manual span, the `http.client` span and the server span arrive in one envelope:

```json
{"type":"span","trace_id":"bb0c271b858643c68c016f2c03654642",
 "items":["http.client GET 127.0.0.1","test My First Test Span","http.server GET /debug-span"],
 "raw":[{"name":"GET 127.0.0.1","op":"http.client","status":"ok","parent_span_id":"bb52ece63038cb6f",
         "is_segment":false,"origin":"auto.http.fetch","url":"http://127.0.0.1:41417/recorder?from=debug-span"},
        {"name":"My First Test Span","op":"test","status":"ok","parent_span_id":"974eda88034db83c",
         "is_segment":false,"origin":"manual"},
        {"name":"GET /debug-span","op":"http.server","status":"ok","is_segment":true,
         "origin":"auto.http.bun.serve","url":"http://127.0.0.1:41418/debug-span"}]}
```

The recorder saw both propagation headers (`/__headers`):

```json
{"url":"/recorder?from=debug-span",
 "sentry-trace":"bb0c271b858643c68c016f2c03654642-b07ce7cfa241f453-1",
 "baggage":"sentry-environment=production,sentry-public_key=1234567890abcdef1234567890abcdef,sentry-trace_id=bb0c271b858643c68c016f2c03654642,sentry-org_id=0,sentry-transaction=GET%20%2Fdebug-span,sentry-sampled=true,sentry-sample_rand=0.33540781334018155,sentry-sample_rate=1",
 "traceparent":null}
```

Log item:

```json
{"type":"log","items":["info: hello from /debug-log"]}
```

Sentinel (`captureMessage` ships a synthetic stack trace, so `attachStacktrace` is on by default):

```json
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic",
 "handled":true,"sdk":"sentry.javascript.bun","sdk_version":"10.67.0","runtime":"bun",
 "runtime_version":"1.4.2","hasContextLine":true,"trace_id":"5321c8e0d24d42028934f449c9bc50d5"}
```

### Step 4 — Variants

Every variant produced **the same set of item shapes**: 2 events, 6 `span` envelopes (including the
readiness probe on `/nope`), 1 `log`, 42 integrations installed, `sentry-trace` and `baggage` on the
outgoing fetch. Result files: `results-preload.json`, `results-bunfig.json`, `results-self-import.json`,
`results-bundle.json`, `results-bundle-minimal.json`, `results-watch.json`.

**(a) `preload = ["./instrument.ts"]` in `bunfig.toml`, plain `bun app.ts`** — works. Trimmed
`results-bunfig.json`:

```
event Error: My first Sentry error!
event sentinel
span http.server GET
span http.server GET /users/:id
span http.server GET /debug-sentry
span http.client GET 127.0.0.1 | test My First Test Span | http.server GET /debug-span
span http.server GET /debug-log
span http.server GET /sentinel
log info: hello from /debug-log
RECORDER [[sentry-trace: true, baggage: true]]
```

**(b) `import "./instrument";` as the first line of the entry, plain `bun app-import-first.ts`** — works,
byte-identical item shapes to (a), 42 integrations installed.

**(c) The guide's bundling claim.** `bun run build.ts` (`Bun.build({ entrypoints:["./app.ts"],
outdir:"./dist", target:"bun", external:["@sentry/*"], sourcemap:"external",
plugins:[sentryBunPlugin()] })`) wrote `dist/app.js` (1174 bytes) and `dist/app.js.map`, with no build
output. `bun --preload ./instrument.ts dist/app.js` then produced **all four signal kinds from the
bundle**:

```
event Error: My first Sentry error!
event sentinel
span http.server GET
span http.server GET /users/:id
span http.server GET /debug-sentry
span http.client GET 127.0.0.1 | test My First Test Span | http.server GET /debug-span
span http.server GET /debug-log
span http.server GET /sentinel
log info: hello from /debug-log
RECORDER [[sentry-trace: true, baggage: true]]
```

So the guide's blanket statement at `index.mdx:92` ("Sentry's auto-instrumentation does not work with
bundled code") does **not** hold for the runtime instrumentation this app exercises: errors, `Bun.serve`
server spans with route names, `http.client` spans with propagation headers, and logs all still arrive.
What is bundle-sensitive is the *channel-based* library instrumentation (databases, AI SDKs, Express,
Koa, Hapi), and there the sign is the other way round: a bundle built with `sentryBunPlugin()` is the only
way to get those, which is exactly what `quick-starts.html:75` says.

The extra `bundle-minimal` run built the literal minimal form (`entrypoints`, `outdir`, `target`,
`plugins`, no `external`, no `sourcemap`). The bundle is 89811 bytes because the SDK is inlined, yet the
run is still identical: all events, spans, fetch headers and the log arrive. The bundled second copy of
the SDK did not shadow the preloaded client in this app.

**(d) `bun --watch --preload ./instrument.ts app.ts`** — works for one request cycle; identical items to
(a), and no `bun` process was left behind after `kill`.

### Step 5 — Init debug output

`debug: true` prints **no SDK name, no SDK version and no runtime version**. The only identity line is
(`app-preload.log:2`):

```
Sentry Logger [log]: Initializing Sentry: process: 66134, thread: main.
```

Those values had to be read off the envelopes instead: `sdk` `sentry.javascript.bun`, `sdk_version`
`10.67.0`, `runtime` `bun`, `runtime_version` `1.4.2` (the span attributes additionally carry
`process.runtime.engine.name` `v8` and `process.runtime.engine.version` `14.6.202.34-node.20`).

Loader lines, identical in every variant (`app-preload.log:1`, `:100`, `:101`):

```
Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
Sentry Logger [log]: SDK initialized from ESM
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. …
```

Unlike the Node run, there is no `Registered diagnostics-channel injection via Module.registerHooks()`,
no `[Sentry] Runtime hook registered, injected libraries=[]` and no `[Sentry] Bundler plugin did not run`
line; the `Bundler plugin did not run` line is also absent from the bundled variants.

**42 integrations installed**, in order:

```
EventFilters FunctionToString LinkedErrors RequestData Console Http Fetch OnUncaughtException
OnUnhandledRejection ContextLines Context Modules ProcessSession Express Fastify Hapi Koa BunServer
BunHttpServer Graphql Mongo Mongoose Mysql Mysql2 Redis Postgres Prisma Tedious GenericPool Kafka
Amqplib LruMemoizer Aws LangChain LangGraph VercelAI OpenAI Anthropic_AI Google_GenAI PostgresJs
Firebase SpanStreaming
```

(The Node run has 45: Bun drops `NodeSystemError`, `ConversationId`, `NodeFetch`, `LocalVariablesAsync`,
`ChildProcess` and `WorkerThreads`, and adds `Fetch`, `BunServer` and `BunHttpServer`.)

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `bun add @sentry/bun` is all you need (`index.mdx:38`, `quick-starts.html:48`) | **yes** for the published path; tarball installs need `overrides` |
| `instrument.js`/`instrument.ts` snippet initializes the SDK (`index.mdx:59-76`, `quick-starts.html:51-61`) | **yes**, but two `[warn]` lines about diagnostics-channel injection are printed that no page mentions |
| `bun --preload ./instrument.ts app.ts` instruments the app (`index.mdx:100`, `quick-starts.html:70`) | **yes** |
| `preload = [...]` in `bunfig.toml` and a first-line `import "./instrument"` are equivalent (`quick-starts.html:71`) | **yes** — both produced identical items |
| Errors from `Bun.serve` routes are captured (`index.mdx:130-138`, `quick-starts.html:73`) | **yes** — `mechanism: "auto.http.bun.serve"`, `handled: false`, context lines present; the event carries no `transaction` field |
| `Sentry.startSpan({op:"test", …})` produces a trace (`index.mdx:156-172`, `quick-starts.html:94-107`) | **partial** — the span exists, but it ships in a `span` envelope as a child of the `http.server` segment; no `transaction` envelope is sent at all on develop's default `traceLifecycle: 'stream'`, and the guide's "My First Test Transaction" wording implies a transaction |
| Routes in `Bun.serve({ routes })` are named by pattern, a plain `fetch` handler by method only (`quick-starts.html:73`) | **yes** — `GET /users/:id` vs `GET` for `/nope`; `sentry.segment.name.source` is `route` |
| `http.client` spans with `sentry-trace` and `baggage` on outgoing `fetch` (`quick-starts.html:73`) | **yes** — both headers reached the recorder |
| `Sentry.logger.*` logs arrive (`quick-starts.html:73`) | **yes** |
| "Auto-instrumentation does not work with bundled code" (`index.mdx:92`) | **no** as written — a `sentryBunPlugin()` bundle kept every runtime signal (errors, route-named server spans, fetch spans with headers, logs); only channel-based library instrumentation is bundle-dependent, and there the bundle is what *enables* it (`quick-starts.html:75`) |
| `bun --watch` records runtime spans (`quick-starts.html:91`) | **yes** for one request cycle |
| The captured data shows up as named transactions in the product (`index.mdx:188`, `quick-starts.html:108`) | **partial** — spans are route-named, but they arrive as streamed `span` items with no `sentry.source`, and the error event has no `transaction` field to group by |
| Prerequisites name no Bun version (`index.mdx:12` -> `_default.mdx:3-6`) | **gap** — the quick start's "Bun 1.3.14 or later" (`quick-starts.html:45`) has no counterpart in the guide; not verified here, only 1.4.2 was run |

## Files

`instrument.ts`, `routes.ts`, `app.ts`, `app-import-first.ts`, `bunfig.toml` (variant a),
`bunfig-none.toml`, `build.ts`, `build-minimal.ts`, `run.sh`, `package.json`,
`sink.mjs` (a copy of `../node/sink.mjs`: the toolbox sink extended with `sdk_version`,
`runtime_version`, span `op`/`url`, a `/recorder` endpoint that records inbound propagation headers, and
`/__headers`).

`node_modules/`, `dist/` and `dist-minimal/` were removed after the run; the Install and Run steps
restore them.

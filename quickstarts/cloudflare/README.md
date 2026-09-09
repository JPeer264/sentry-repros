# QS-cloudflare — plain Cloudflare Workers getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `6f2da7483d` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack/`. `wrangler` 4.129.0 with a local
`workerd 2026-09-03`, `vite` 6.4.3, `@cloudflare/vite-plugin` 1.54.4, macOS 24.6.0.
All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

## What it reproduces

A new user following the plain-Worker path end to end: install `@sentry/cloudflare`, write
`wrangler.jsonc` with `nodejs_compat`, wrap the exported handler with `Sentry.withSentry`, run
`wrangler dev`, and run the verify step. Two texts are followed side by side: the shipped guide
`~/dev/sentry-docs/docs/platforms/javascript/guides/cloudflare/index.mdx` (with
`platform-includes/getting-started-config/javascript.cloudflare.mdx` and
`platform-includes/getting-started-install/javascript.cloudflare.mdx`) and the proposed quick start
`../../_reports/quick-starts.html`, section "Cloudflare", steps 1 to 4.

The Worker (`src/routes.ts`) has six routes:

| Route | What it does |
| --- | --- |
| `/users/:id` | `URLPattern` match, returns `Response.json({ id, name })` — the quick start's example route |
| `/debug-sentry` | throws `new Error("My first Sentry error!")` out of the `fetch` handler |
| `/debug-span` | `Sentry.startSpan({op:"test", name:"My First Test Span"})` around an outgoing `fetch` to the sink's `/recorder`, which records the inbound `sentry-trace` / `baggage` headers |
| `/debug-log` | `Sentry.logger.info("hello from /debug-log", ...)` |
| `/debug-waituntil` | `ctx.waitUntil(Promise.reject(new Error("waitUntil rejection")))` — variant (d) |
| `/sentinel` | `Sentry.captureMessage("sentinel")` — the run waits for this in the sink instead of sleeping |

Five run shapes are exercised as separate variants (`base`, `compat-floor`, `request`, `vite`,
`waituntil`), each writing its own `results-<variant>.json`.

## Install

```bash
cd $REPRO/quickstarts/cloudflare
npm install   # package.json pins every @sentry/* to a tarball and repeats them in `overrides`
```

`package.json` needs the `overrides` block because npm otherwise resolves the tarballs' transitive
`@sentry/*@10.67.0` deps against the registry. `wrangler`, `vite` and `@cloudflare/vite-plugin` are
pinned to exact registry versions (`^4.129.0` now resolves to `wrangler@4.130.0`, whose tarball this
machine's npm proxy blocks). This is a harness artifact, not a defect in the guide.

Installed tree (`node_modules/@sentry`): `cloudflare core opentelemetry server-utils`, all `10.67.0`
from `file:../../_toolbox/pack/…`, plus `@sentry/conventions@0.20.0` from the registry as a normal
published dependency. No `@sentry/*` SDK package came from the registry.

## Run

```bash
cd $REPRO/quickstarts/cloudflare
./run.sh base          # wrangler.jsonc          withSentry, nodejs_compat, compatibility_date 2026-09-01
./run.sh compat-floor  # wrangler-floor.jsonc    same worker, compatibility_date 2024-09-23
./run.sh request       # wrangler-request.jsonc  wrapRequestHandler from @sentry/cloudflare/request, nodejs_als only
./run.sh vite          # vite build, then wrangler dev --config dist/<worker>/wrangler.json, no withSentry in source
./run.sh waituntil     # wrangler.jsonc, drives /debug-waituntil only
```

Each run starts the sink on `127.0.0.1:41501`, starts one `wrangler dev` on `127.0.0.1:41502`
(`--port 41502 --inspector-port 0`), curls the routes, polls `/__items` until the sentinel event and
the timer-flushed log batch have arrived, writes `results-<variant>.json` (sink items, the envelope
item types in order, raw span and transaction payloads, and the headers the recorder saw) and kills
both processes. Init debug output is in `app-<variant>.log`; the Vite build log is `build-vite.log`.

## Expected

What the shipped guide claims (`docs/platforms/javascript/guides/cloudflare/index.mdx` and its includes):

- `getting-started-install/javascript.cloudflare.mdx:1-3` — `npm install @sentry/cloudflare --save`.
- `index.mdx:63` — "Importing Sentry from the `@sentry/cloudflare/nodejs_compat` entrypoint unlocks additional Node.js SDK features on Cloudflare. It requires SDK version `10.64.0` or higher and will become the default in the next major version."
- `getting-started-config/javascript.cloudflare.mdx:5` — "Since the SDK needs access to the `AsyncLocalStorage` API, you need to set the `nodejs_compat` compatibility flag and a `compatibility_date` of `2024-09-23` or later in your `wrangler.(jsonc|toml)` configuration file. We recommend the latest compatibility date, as some integrations depend on newer Cloudflare runtime features".
- `getting-started-config/javascript.cloudflare.mdx:11-16` — the `wrangler.jsonc` snippet: `"compatibility_date": "2024-09-23"`, `"compatibility_flags": ["nodejs_compat"]`.
- `index.mdx:117` — "Wrap your exported handler with `Sentry.withSentry()` to start capturing errors and traces from your Worker", snippet at `index.mdx:122-153` (`dsn`, `dataCollection`, `tracesSampleRate: 1.0`).
- `index.mdx:73` — "We recommend building your Worker with **Vite** and the Sentry Cloudflare Vite plugin. It instruments bundled dependencies (like database clients) at build time".
- `index.mdx:77-92` — `vite.config.ts` with `cloudflare()` and `sentryCloudflareVitePlugin({ _experimental: { useDiagnosticsChannelInjection: true } })`.
- `index.mdx:159` — "If you're using the Sentry Cloudflare Vite plugin, its experimental `autoInstrumentation` option can wrap your Worker for you at build time, so you don't need `withSentry` in your code."
- `index.mdx:212` — "If you don't have access to the `onRequest` middleware API, you can use the `wrapRequestHandler` API instead", with `index.mdx:219` `import * as Sentry from "@sentry/cloudflare";` and `index.mdx:230` `return Sentry.wrapRequestHandler(requestHandlerOptions, () => resolve(event));`.
- `index.mdx:267-280` — verify errors with a `/debug-sentry` route that throws `new Error("My first Sentry error!")`.
- `index.mdx:313-335` — verify tracing with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, …)`.
- `index.mdx:364` — "head over to your project on Sentry.io to view the collected data".
- `index.mdx:372` — "Server-side spans will display `0ms` for their durations."
- `index.mdx:382` — "With the static trace lifecycle, Sentry snapshots the request transaction when the response is returned, so spans that finish later may be missing." `index.mdx:384` — "Set `traceLifecycle: \"stream\"` so the SDK can send each sampled span when it finishes."

What the proposed quick start claims (`../../_reports/quick-starts.html`):

- `:270` — `npm install @sentry/cloudflare`.
- `:272` — "Enable `nodejs_compat` with a `compatibility_date` of `2024-09-23` or later (`withSentry` needs it; the request wrapper from `@sentry/cloudflare/request` boots with `nodejs_als` alone, but on develop pass it `traceLifecycle: \"static\"`, because that entry has no async context strategy under the streaming default)".
- `:273-278` — the `wrangler.jsonc` snippet.
- `:280-297` — the `withSentry` snippet; `:298` — `npx wrangler dev`.
- `:300` — "This is enough for: Errors thrown from `fetch`, `scheduled` and `queue` handlers. … An `http.server` span per request, named by HTTP method. Route names come from a framework. … `http.client` spans with `sentry-trace` and `baggage` headers on outgoing `fetch`. … Logs from `Sentry.logger.*` and console breadcrumbs."
- `:303-304` — "Work you hand to `ctx.waitUntil()` runs after the handler returned, and an error thrown there is not captured. Attach the capture yourself: `ctx.waitUntil(work().catch((e) => Sentry.captureException(e)));`"
- `:308` — "Build with Vite and the Sentry plugin, which injects `node:diagnostics_channel` events into those packages at build time and wraps your Worker entry for you".
- `:309-315` — `vite.config.ts` with a bare `sentryCloudflareVitePlugin()`; `:316-317` — `vite build`, then `--config dist/my-worker/wrangler.json`.
- `:318` — "The plugin also wraps the default export and any Durable Object, Workflow, Agent or `WorkerEntrypoint` class listed in the wrangler config … so with the plugin in place you can leave `withSentry` out of your code."
- `:319` — "On SDK versions before 11.0 the plugin is a no-op unless you pass `sentryCloudflareVitePlugin({ _experimental: { useDiagnosticsChannelInjection: true } })`, and it never wraps your entry, so keep `withSentry`."
- `:321-333` — the verify routes (`/debug-sentry` throws, `/debug-span` wraps a `fetch` in `Sentry.startSpan({ op: "test", name: "My First Test Span" })` and logs).
- `:334` — "In Sentry you should see one issue, two `GET` traces (one with an error, one with a child span and an `http.client` span) and one log line. Spans measure wall time between I/O; CPU-only work shows as `0ms` on Workers."

## Observed on 2026-09-08

### Step 1 — Install

`npm install` of the four develop tarballs plus the pinned registry tooling:
`added 56 packages, and audited 57 packages in 4s`, no peer or version complaints.

The guide's `@sentry/cloudflare/nodejs_compat` entrypoint (`index.mdx:63`) **does not exist on develop**:

```
$ node --input-type=module -e 'import("@sentry/cloudflare/nodejs_compat").then(()=>console.log("resolves"),e=>console.log(e.code))'
ERR_PACKAGE_PATH_NOT_EXPORTED
```

The package's `exports` map has exactly three public entries: `.`, `./request`, `./vite`.

### Step 2 — Configure

`wrangler.jsonc` is the include's snippet with a current compatibility date, `src/index.ts` is the
guide's `withSentry` snippet plus `debug: true` and `tunnel` (to reach the local sink). `wrangler dev`
started with no warning:

```
[wrangler:info] Ready on http://localhost:41502
```

**Holds.**

### Step 3 — Verify (variant `base`, `results-base.json`)

Envelope item types in the order they arrived — **every trace arrives as a `span` envelope; no
`transaction` envelope was sent for any route** (develop's default `traceLifecycle: "stream"`):

```json
["span","event","span","span","log","span","event","span"]
```

Error event, verbatim and trimmed from `/__items`:

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.http.cloudflare","handled":false,
 "sdk":"sentry.javascript.cloudflare","sdk_version":"10.67.0","runtime":"cloudflare",
 "hasContextLine":false,"hasAppFrame":false,
 "appFrames":[{"filename":"$REPRO/quickstarts/cloudflare/.wrangler/tmp/dev-fsyj7x/index.js"}],
 "trace_id":"56a3b615aa264ee9857c76257f11e1e9","user":{"ip_address":"127.0.0.1"},
 "request":{"url":"http://127.0.0.1:41502/debug-sentry","method":"GET","hasData":false,
            "headers":{"accept":"*/*","accept-encoding":"br, gzip","cf-connecting-ip":"127.0.0.1",
                       "host":"127.0.0.1:41502","user-agent":"curl/8.7.1"}},
 "environment":"production"}
```

`mechanism` is `auto.http.cloudflare` with `handled: false`; there are **no context lines**
(`hasContextLine: false`) and every frame points at the wrangler dev bundle
(`.wrangler/tmp/dev-*/index.js`), not at `src/routes.ts`. **`transaction` is absent from every event**
— the key is not in the payload at all. `contexts.runtime` carries `name: "cloudflare"` with no version.

Server spans — one `span` envelope per request, `sentry.op` `http.server`, name `GET` for every route
including `/users/42`, source `url`, origin `auto.http.cloudflare`:

```json
{"type":"span","trace_id":"c43d9c4c527e44f6aa61e1e979123f6d","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"ok","is_segment":true,
         "origin":"auto.http.cloudflare","url":"http://127.0.0.1:41502/users/42"}]}
{"type":"span","trace_id":"56a3b615aa264ee9857c76257f11e1e9","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"ok","is_segment":true,
         "origin":"auto.http.cloudflare","url":"http://127.0.0.1:41502/debug-sentry"}]}
{"type":"span","trace_id":"beabf285d90b44eebe154eb34dc30202","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"ok","is_segment":true,
         "origin":"auto.http.cloudflare","url":"http://127.0.0.1:41502/debug-log"}]}
{"type":"span","trace_id":"8e9eb6b1a1274a9eb986432c14895b4a","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"ok","is_segment":true,
         "origin":"auto.http.cloudflare","url":"http://127.0.0.1:41502/sentinel"}]}
```

The segment attributes are `"sentry.segment.name.source": {"value":"url"}` and
`"sentry.op": {"value":"http.server"}`; the raw span carries `url.path`, `url.full`,
`http.request.method` and the request headers, but no `http.route`. Note the `/debug-sentry` segment
span is reported with `"status":"ok"` even though the handler threw and wrangler answered `500`.

`/debug-span` — the manual span, the `http.client` span and the server span arrive in one envelope:

```json
{"type":"span","trace_id":"1b5060797a26423bb0fb55417d84aa81",
 "items":["http.client GET 127.0.0.1","test My First Test Span","http.server GET"],
 "raw":[{"name":"GET 127.0.0.1","op":"http.client","status":"ok","parent_span_id":"a85aafc88372fd68",
         "is_segment":false,"origin":"auto.http.fetch","url":"http://127.0.0.1:41501/recorder?from=debug-span"},
        {"name":"My First Test Span","op":"test","status":"ok","parent_span_id":"bd2dbddb9edbc8d3",
         "is_segment":false,"origin":"manual"},
        {"name":"GET","op":"http.server","status":"ok","is_segment":true,
         "origin":"auto.http.cloudflare","url":"http://127.0.0.1:41502/debug-span"}]}
```

The recorder saw both propagation headers (`/__headers`):

```json
{"url":"/recorder?from=debug-span",
 "sentry-trace":"1b5060797a26423bb0fb55417d84aa81-9b1f172dec23ed8a-1",
 "baggage":"sentry-environment=production,sentry-public_key=1234567890abcdef1234567890abcdef,sentry-trace_id=1b5060797a26423bb0fb55417d84aa81,sentry-sampled=true,sentry-sample_rand=0.030504761300123695,sentry-sample_rate=1",
 "traceparent":null}
```

Log item:

```json
{"type":"log","items":["info: hello from /debug-log"]}
```

Sentinel (`captureMessage` ships a synthetic stack trace, `attachStacktrace` on by default, again
with no context lines):

```json
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,
 "sdk":"sentry.javascript.cloudflare","sdk_version":"10.67.0","runtime":"cloudflare",
 "hasContextLine":false,"hasAppFrame":false,"trace_id":"8e9eb6b1a1274a9eb986432c14895b4a"}
```

### Step 4 — Variants

**(a) The include's documented `compatibility_date` floor** — `wrangler-floor.jsonc` with
`"compatibility_date": "2024-09-23"` (`getting-started-config/javascript.cloudflare.mdx:13`),
`results-compat-floor.json`, `app-compat-floor.log`. The Worker starts and the item set is
**identical to `base`**:

```json
["span","event","span","span","log","span","event","span"]
span http.server GET
event Error: My first Sentry error!
span http.server GET
span http.client GET 127.0.0.1|test My First Test Span|http.server GET
log info: hello from /debug-log
span http.server GET
event undefined: sentinel
span http.server GET
```

with the same propagation headers on the outgoing fetch:

```json
{"url":"/recorder?from=debug-span","sentry-trace":"c5dda84d95f041d589acaf0b3cc554f2-a1a2ee988c532418-1",
 "baggage":"sentry-environment=production,…,sentry-sample_rate=1","traceparent":null}
```

The floor date costs nothing for this app. Nothing in the debug output mentions a feature that needs a
newer date, so the include's "We recommend the latest compatibility date, as some integrations depend
on newer Cloudflare runtime features" is not observable here either way.

**(b) The `wrapRequestHandler` form with `nodejs_als` only** — `src/request-wrapper.ts`,
`wrangler-request.jsonc` with `"compatibility_flags": ["nodejs_als"]`, `results-request.json`.

The import path the **guide** uses is `import * as Sentry from "@sentry/cloudflare";`
(`index.mdx:219`) followed by `Sentry.wrapRequestHandler(...)` (`index.mdx:230`). **That does not
resolve on develop:**

```
$ node --input-type=module -e 'import * as S from "@sentry/cloudflare"; console.log(typeof S.wrapRequestHandler, typeof S._INTERNAL_wrapRequestHandler)'
undefined function
$ node --input-type=module -e 'import("@sentry/cloudflare/request").then(r=>console.log(typeof r.wrapRequestHandler))'
function
```

The main entry exports only `_INTERNAL_wrapRequestHandler`; the public `wrapRequestHandler` lives at
`@sentry/cloudflare/request`, which is what the quick start (`:272`) names. Using that path plus
`traceLifecycle: "static"` as the quick start says, one request cycle produced envelopes of types:

```json
["transaction","transaction","event","transaction","log","transaction","event","transaction"]
```

Events arrive. Verbatim, trimmed:

```json
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok",
 "trace_id":"0605053f3df44828a7af904683d1a237","sdk":"sentry.javascript.cloudflare","sdk_version":"10.67.0",
 "spans":[],"hasRequestData":false}
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.http.cloudflare","handled":false,
 "sdk":"sentry.javascript.cloudflare","sdk_version":"10.67.0","runtime":"cloudflare",
 "hasContextLine":false,"trace_id":"169d25c743e54fca8975776db4d53c90","environment":"production"}
{"type":"transaction","name":"GET /debug-span","op":"http.server","source":"url","status":"ok",
 "trace_id":"a6fb21c9cc014a8ea19fc47207b8bd0a","spans":["test My First Test Span","http.client GET http://127.0.0.1:41501/recorder"],
 "hasRequestData":false}
{"type":"log","items":["info: hello from /debug-log"]}
```

Two differences from `withSentry` under `nodejs_compat` that a reader should know about: with
`traceLifecycle: "static"` the envelope type is `transaction` with nested `spans[]`, and the
transaction **name carries the path** (`GET /users/42`, `GET /debug-span`) where the streamed segment
span is named `GET` only. `hasRequestData` is `false` and the event carries no `request` object, so
the request context that `withSentry` attaches is missing here. The worker log shows the
non-ALS async context strategy in use, which is what the quick start's `traceLifecycle: "static"`
note is about:

```
at AsyncContextStack.withScope (…/node_modules/@sentry/core/src/asyncContext/stackStrategy.ts:50:28)
```

**(c) The Vite build from the quick start's step 3** — `vite.config.ts`, `wrangler-vite.jsonc` with
`"main": "src/vite-entry.ts"`, and `src/vite-entry.ts` which exports a **plain** `{ fetch }` object
with no `withSentry` anywhere. `results-vite.json`, `build-vite.log`, `app-vite.log`.

```
$ ./node_modules/.bin/vite build
vite v6.4.3 building SSR bundle for production...
✓ 464 modules transformed.
dist/qs_cloudflare_vite/wrangler.json         1.36 kB
dist/qs_cloudflare_vite/index.js            395.47 kB
✓ built in 439ms
```

The plugin wrapped the entry at build time (from `dist/qs_cloudflare_vite/index.js`):

```js
const __SENTRY_OPTIONS_CALLBACK__ = () => ({
const viteEntry = withSentry(__SENTRY_OPTIONS_CALLBACK__, __SENTRY_DEFAULT_EXPORT__);
```

and `wrangler dev --config dist/qs_cloudflare_vite/wrangler.json` produced **the same item set as
`base`**, with no `withSentry` in the source:

```json
["span","event","span","span","log","span","event","span"]
span http.server GET
event Error: My first Sentry error!
span http.server GET
span http.client GET 127.0.0.1|test My First Test Span|http.server GET
log info: hello from /debug-log
span http.server GET
event undefined: sentinel
span http.server GET
```
```json
{"url":"/recorder?from=debug-span","sentry-trace":"25e54cf11aeb49d898d6c3ade23b90c4-af7480c7dcce4898-1",
 "baggage":"sentry-environment=production,…,sentry-sample_rate=1","traceparent":null}
```

Same 10 integrations as `base`. Two things the quick start does not say:

1. The options callback is not invented by the plugin. It looks for an `instrument.server.{ts,mts,js,mjs,cjs}`
   next to the wrangler `main` and imports its **default export** as the options callback; without that
   file the callback falls back to `() => undefined` (`node_modules/@sentry/cloudflare/build/esm/prod/vite/instrumentFile.js`,
   `ENV_FALLBACK_OPTIONS_FN`). This reproduction therefore carries `src/instrument.server.ts`.
   Neither `index.mdx:159` nor `quick-starts.html:318` mentions the file, so a reader who removes
   `withSentry` on the strength of that sentence gets a Worker with no DSN and no warning.
2. The bare `sentryCloudflareVitePlugin()` of `quick-starts.html:314` only finds the wrangler config
   when it has a default name. This directory holds several configs, so both plugins are pointed at
   the file explicitly (`cloudflare({ configPath })` and `sentryCloudflareVitePlugin({ wranglerConfigPath })`).
   With the wrong config the plugin silently instruments nothing: the first run of this variant, before
   `wranglerConfigPath` was passed, produced `"items": []`, an uncaught `Error: My first Sentry error!`
   in the worker log and `{"sentry-trace":null,"baggage":null}` at the recorder. That is a harness
   artifact of the multi-config layout, but it shows the failure mode is silent.

**(d) `ctx.waitUntil(Promise.reject(new Error(...)))`** — `results-waituntil.json`, `app-waituntil.log`.
The run drives `/debug-waituntil` and then `/sentinel`. Envelope types and items:

```json
["span","event","span"]
span http.server GET
event undefined: sentinel
span http.server GET
```

The only event is the sentinel. **The `waitUntil` rejection is not captured** — no `event` item for
`waitUntil rejection` exists in the sink, while workerd itself logged it:

```
✘ [ERROR] Uncaught Error: waitUntil rejection Error
      at handleCallbackErrors.status.status (…/@sentry/core/src/tracing/trace.ts:672:13)
✘ [ERROR] Uncaught Error: waitUntil rejection
▲ [WARNING] NOSENTRY reporting trace with exceptions, but no exception outcome; trace->eventInfo = FetchEventInfo: GET, http://127.0.0.1:41502/debug-waituntil
[wrangler:info] GET /debug-waituntil 200 OK (15ms)
```

The `http.server GET` span for `/debug-waituntil` was still recorded, with `"status":"ok"`.

### Step 5 — Init debug output

`debug: true` prints **no SDK name, no SDK version, no runtime name and no runtime version** — there
is no "Initializing Sentry" banner on Cloudflare. Those values had to be read off the envelopes:
`sdk` `sentry.javascript.cloudflare`, `sdk_version` `10.67.0`, `runtime` `cloudflare`, and **no
runtime version at all** (`contexts.runtime.version` is absent, unlike Node's `v26.5.0` and Deno's
`2.9.0`).

The only non-integration line at init is:

```
Sentry Logger [log]: Cleared AI provider skip registrations
```

There is no warning of any kind at init — nothing about missing build-time instrumentation, nothing
about libraries the Workers runtime cannot patch.

**10 integrations installed**, identical in `base`, `compat-floor` and `vite`:

```
Dedupe EventFilters FunctionToString ConversationId LinkedErrors Fetch HttpServer RequestData Console SpanStreaming
```

Per-request debug output looks like this (`app-base.log`):

```
Sentry Logger [log]: [Tracing] Starting sampled root span
  op: http.server
  name: GET
  ID: b9b407d86b41f28b
Sentry Logger [log]: [Tracing] Finishing "http.server" root span "GET" with ID b9b407d86b41f28b
Sentry Logger [log]: Flushing span tree map with 1 traces
Sentry Logger [log]: Sending span envelope for trace c43d9c4c527e44f6aa61e1e979123f6d with 1 spans
```

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/cloudflare` is all you need (`getting-started-install/javascript.cloudflare.mdx:1-3`, `quick-starts.html:270`) | **yes** |
| `@sentry/cloudflare/nodejs_compat` entrypoint exists (`index.mdx:63`) | **no** — `ERR_PACKAGE_PATH_NOT_EXPORTED`; develop exports only `.`, `./request`, `./vite` |
| `nodejs_compat` + `compatibility_date` `2024-09-23` or later (`getting-started-config/javascript.cloudflare.mdx:5,13`, `quick-starts.html:272`) | **yes** — the documented floor date behaves identically to a current date, variant (a) |
| `Sentry.withSentry()` around the exported handler captures errors and traces (`index.mdx:117-153`, `quick-starts.html:280-297`) | **yes** — `mechanism: "auto.http.cloudflare"`, `handled: false`, one `http.server` span per request |
| Errors thrown from `fetch` are captured (`quick-starts.html:300`) | **yes**; `scheduled` and `queue` were not exercised here |
| One `http.server` span per request, named by HTTP method (`quick-starts.html:300`) | **yes** — `GET` for all routes including `/users/:id`, `sentry.segment.name.source: "url"` |
| `http.client` spans with `sentry-trace` and `baggage` on outgoing `fetch` (`quick-starts.html:300`) | **yes** — `http.client GET 127.0.0.1`, both headers at the recorder |
| Logs from `Sentry.logger.*` need no option (`quick-starts.html:300`) | **yes** — one `log` envelope, `info: hello from /debug-log` |
| `try/throw` in `/debug-sentry` produces an issue (`index.mdx:267-280`) | **partial** — the issue arrives, but with **no context lines** and every frame pointing at the wrangler dev bundle, so the stack trace is unreadable without source maps (`index.mdx:240` offers those as "Optional") |
| `Sentry.startSpan({op:"test", name:"My First Test Transaction"})` produces a trace (`index.mdx:313-335`) | **partial** — the span exists, but it ships in a `span` envelope as a child of the `http.server` segment; no `transaction` envelope is sent under develop's default `traceLifecycle: "stream"`, so the guide's "Transaction" wording no longer matches |
| Captured data shows up as named transactions (`index.mdx:364`) | **partial** — every server span is named `GET` with source `url`, and events carry **no `transaction` field at all**, so there is no per-route name anywhere in a `withSentry` run |
| "two `GET` traces (one with an error, one with a child span and an `http.client` span) and one log line" (`quick-starts.html:334`) | **yes** — exactly that shape, plus the extra traces for the routes this repro adds |
| `Sentry.wrapRequestHandler` from `@sentry/cloudflare` (`index.mdx:219,230`) | **no** — the main entry exports only `_INTERNAL_wrapRequestHandler`; the working import is `@sentry/cloudflare/request`, as `quick-starts.html:272` says |
| The request wrapper boots with `nodejs_als` alone, with `traceLifecycle: "static"` (`quick-starts.html:272`) | **yes** — events, `transaction` envelopes and the log all arrive; transaction names carry the path (`GET /users/42`), but events lose the `request` object |
| Vite plugin wraps the entry so `withSentry` can be left out (`index.mdx:159`, `quick-starts.html:318`) | **partial** — the wrapping works and the item set is identical to `withSentry`, but only if an `instrument.server.*` file sits next to the wrangler `main`; neither text mentions it, and without it the options callback is `() => undefined` with no warning |
| The plugin needs `_experimental.useDiagnosticsChannelInjection` (`index.mdx:77-92`) | **no on develop** — a bare `sentryCloudflareVitePlugin()` already injects and wraps; the flag is only needed before 11.0, which is what `quick-starts.html:319` says |
| A `ctx.waitUntil` error is not captured; attach the capture yourself (`quick-starts.html:303-304`) | **yes** — confirmed, only the sentinel event arrived; the guide's `waitUntil` section (`index.mdx:376-424`) discusses missing *spans* but never says the *error* is dropped |
| Spans show `0ms` for CPU-only work (`index.mdx:372`, `quick-starts.html:334`) | **yes** — the segment span durations in `results-base.json` are `/users/42` 1.0ms, `/debug-sentry` **0.0ms**, `/debug-span` 9.0ms (the one route that does I/O), `/debug-log` 1.0ms, `/sentinel` 1.0ms |

## Files

`package.json`, `wrangler.jsonc`, `wrangler-floor.jsonc`, `wrangler-request.jsonc`,
`wrangler-vite.jsonc`, `vite.config.ts`, `src/config.ts`, `src/routes.ts`, `src/index.ts`,
`src/request-wrapper.ts`, `src/vite-entry.ts`, `src/instrument.server.ts`, `run.sh`, and `sink.mjs`
(a copy of `../../_toolbox/sink.mjs` by way of `../deno/sink.mjs`, with `sdk_version`,
`runtime_version`, span `op`/`url`/`source`, a `/recorder` endpoint that records inbound propagation
headers, and `/__headers`).

`node_modules`, `dist` and `.wrangler` are removed after the run; the **Install** and **Run** lines
restore them.

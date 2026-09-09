# QS-cloudflare-pages, the Cloudflare Pages getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `wrangler` 4.130.0
(registry, current major) with `workerd 1.20260908.1`, Node 26.5.0, npm 11.17.0, macOS 24.6.0.
All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

The Workers path (install, `withSentry`, the Vite plugin, the `/request` wrapper, `ctx.waitUntil`
rejections, the compatibility-date floor, the missing `@sentry/cloudflare/nodejs_compat` entrypoint)
is covered by `../cloudflare/README.md` and is not repeated here; where a Pages run shows the same
behaviour it is cited. This tarball still exports exactly `.`, `./request` and `./vite`, so
`index.mdx:63` is still wrong on `03aaf42455`.

## What it reproduces

A new user following the Pages tabs of the Cloudflare guide end to end, with every snippet copied
verbatim: `npm install @sentry/cloudflare`, `wrangler.jsonc` with `nodejs_compat`, a root
`functions/_middleware.js` with `Sentry.sentryPagesPlugin`, and the two Pages verify routes, served
with `wrangler pages dev public`. The texts followed, with the file each step really renders from:

| Step | Renders from |
| --- | --- |
| Install | `platform-includes/getting-started-install/javascript.cloudflare.mdx:1-3` |
| Wrangler configuration (`nodejs_compat`, date floor) | `platform-includes/getting-started-config/javascript.cloudflare.mdx:5,11-21` |
| Pages setup sentence and middleware intro | `docs/platforms/javascript/guides/cloudflare/index.mdx:167,169` and `includes/cloudflare-pages-middleware-intro.mdx:1` |
| `functions/_middleware.js` snippet | `index.mdx:174-201` |
| Verify, Issues, Pages | `index.mdx:292` (text), `index.mdx:297-301` (`debug-sentry.js` throws) |
| Verify, Tracing, Pages | `index.mdx:309` (text), `index.mdx:339-352` (`debug-sentry.js` with `Sentry.startSpan`) |
| Verify, Logs | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13` |
| Spans in `waitUntil()` | `index.mdx:376-401` (Worker code only) |

Project layout (`functions/` and `public/` at the project root, as the include says):

| Route | File | What it does |
| --- | --- | --- |
| `/`, `/style.css` | `public/index.html`, `public/style.css` | static assets, no function |
| `/debug-sentry` | `functions/debug-sentry.js` | the tracing verify snippet **verbatim**, which has no `import` line |
| `/debug-sentry-import` | `functions/debug-sentry-import.js` | the same snippet with `import * as Sentry from "@sentry/cloudflare"` added |
| `/api/error` | `functions/api/error.js` | throws `new Error("api error")` |
| `/api/users/:id` | `functions/api/users/[id].js` | parameterized route, `Response.json({ id: context.params.id })` |
| `/api/fetch` | `functions/api/fetch.js` | outgoing `fetch` to the recorder, which records `sentry-trace` / `baggage` |
| `/api/log` | `functions/api/log.js` | `Sentry.logger.info("hello from /api/log", …)` |
| `/api/waituntil` | `functions/api/waituntil.js` | `context.waitUntil(Sentry.startSpan({ name: "background.task", op: "task" }, () => fetch(recorder)))` |
| `/api/waituntil-reject` | `functions/api/waituntil-reject.js` | `context.waitUntil(Promise.reject(new Error("waitUntil rejection")))` |
| `/api/sentinel` | `functions/api/sentinel.js` | `Sentry.startSpan({ op: "test", name: "sentinel span" })` around a fetch, then `Sentry.captureMessage("sentinel")`; the run waits for both instead of sleeping |

`functions/_middleware.js` is `index.mdx:174-201` with the DSN placeholder filled in and two harness
lines added (`tunnel` to the sink, `debug: true`).

## Install

```bash
cd $REPRO/quickstarts/cloudflare-pages
npm install   # package.json pins every @sentry/* to a tarball and repeats them in `overrides`
```

`added 42 packages in 9s`. `package-lock.json` resolves `@sentry/cloudflare`, `@sentry/core`,
`@sentry/opentelemetry` and `@sentry/server-utils` to `file:../../_toolbox/pack-develop-03aaf424/…`;
the only registry `@sentry/*` package is `@sentry/conventions@0.20.0`, a normal published dependency.
npm 11 printed an `allow-scripts` warning for the `esbuild` and `workerd` postinstall scripts; both
packages work without them (their binaries come from optional dependencies).

## Run

```bash
cd $REPRO/quickstarts/cloudflare-pages
./run.sh base            # wrangler.jsonc, root functions/_middleware.js (the guide's layout)
./run.sh scoped          # the same file moved to functions/api/_middleware.js (DOC-R19)
./run.sh include-config  # wrangler.jsonc swapped for wrangler-include.jsonc (the include's snippet verbatim, no pages_build_output_dir)
./run.sh no-flag         # wrangler-noflag.jsonc: compatibility_date 2026-09-01, no compatibility_flags
./run.sh no-flag-floor   # wrangler-noflag-floor.jsonc: compatibility_date 2024-09-23, no compatibility_flags
```

Each run starts the sink on `127.0.0.1:4747` (`sink.mjs`, with the recorder from `recorder.mjs` on
the same port), one `wrangler pages dev public --port 4748 --inspector-port 4749`, requests the
eleven routes above in order, then polls `/__items` until the sentinel event, the sentinel span and a
log item have arrived (60 s deadline, no sleeps), writes `results-<variant>.json` (steps with HTTP
status, console summary, envelope item types in order, compact items, raw span payloads, recorder
headers, verdict) and kills both processes. Wrangler output is in `app-<variant>.log`. The `scoped`,
`include-config` and `no-flag*` variants move files into place for the run and restore the base
layout on exit.

## Expected

What the guide claims:

- `getting-started-install/javascript.cloudflare.mdx:1-3`: `npm install @sentry/cloudflare --save`.
- `getting-started-config/javascript.cloudflare.mdx:5`: "Since the SDK needs access to the `AsyncLocalStorage` API, you need to set the `nodejs_compat` compatibility flag and a `compatibility_date` of `2024-09-23` or later in your `wrangler.(jsonc|toml)` configuration file."
- `getting-started-config/javascript.cloudflare.mdx:11-16`: a `wrangler.jsonc` containing only `compatibility_date` and `compatibility_flags`.
- `index.mdx:167`: "add the `sentryPagesPlugin` as middleware to your Cloudflare Pages application"; `cloudflare-pages-middleware-intro.mdx:1`: "Create a `_middleware.js` file in your `functions` directory".
- `index.mdx:174-201`: the middleware snippet with `dsn`, `dataCollection`, `tracesSampleRate: 1.0`, comment "Make sure Sentry is the first middleware".
- `index.mdx:292,297-301`: a `functions/debug-sentry.js` whose `onRequest` throws `new Error("My first Sentry error!")`.
- `index.mdx:309,339-352`: "update the previous code snippet" to `await Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, …)`; the snippet shows no import.
- `index.mdx:382-384`: "With the static trace lifecycle, Sentry snapshots the request transaction when the response is returned, so spans that finish later may be missing. Set `traceLifecycle: "stream"` so the SDK can send each sampled span when it finishes."
- Nothing in the Pages section says which requests the root middleware handles, how request spans are named, what envelope shape tracing produces, or how `context.waitUntil` behaves.

## Observed on 2026-09-09

### Step 1, Install

Holds (see above).

### Step 2, Configure

`wrangler.jsonc` is the include's snippet plus `pages_build_output_dir: "public"`, a `name`, and a
current date (`2026-09-01`). `wrangler pages dev public` starts with no warning:

```
✨ Compiled Worker successfully
[wrangler:info] Ready on http://localhost:4748
```

**Holds.** Variant `include-config` runs the include's snippet **verbatim** (no
`pages_build_output_dir`, date `2024-09-23`): wrangler 4.130.0 reads it, prints no warning and the
item set is identical to `base` (`results-include-config.json`).

### Step 3, Verify (variant `base`, `results-base.json`)

Envelope item types in arrival order, **every trace arrives as `span` items, no `transaction`
item was sent for any request** (develop's default `traceLifecycle: "stream"`):

```json
["span","span","event","span","event","span","event","span","span","span","log","span","span","span","span","span","event","span"]
```

**Static assets are spanned by the root middleware.** The first two items are the requests for
`/` and `/style.css`, which have no function at all:

```json
{"name":"GET /","op":"http.server","status":"ok","is_segment":true,"segment_name_source":"route","url_path":"/","status_code":200,"origin":"auto.http.cloudflare"}
{"name":"GET","op":"http.server","status":"ok","is_segment":true,"segment_name_source":"url","url_path":"/style.css","status_code":200,"origin":"auto.http.cloudflare"}
```

This is exactly the DOC-R19 claim: the root span is `GET /` (source `route`), everything else is a
bare `GET` (source `url`) with the path in `url.path`.

**The tracing verify snippet does not run as printed.** `functions/debug-sentry.js` is
`index.mdx:339-352` verbatim; it references `Sentry` without importing it, and unlike the Workers
snippet it lives in a new file that has never imported the SDK:

```
[wrangler:error] ReferenceError: Sentry is not defined
    at onRequest ($REPRO/quickstarts/cloudflare-pages/functions/debug-sentry.js:4:3)
[wrangler:info] GET /debug-sentry 500 Internal Server Error (21ms)
```

The middleware captured that instead of the intended error:

```json
{"type":"event","exception":"ReferenceError: Sentry is not defined","mechanism":"auto.http.cloudflare","handled":false,
 "sdk":"sentry.javascript.cloudflare","sdk_version":"10.67.0","runtime":"cloudflare","hasContextLine":false,
 "request":{"url":"http://127.0.0.1:4748/debug-sentry","method":"GET"},"user":{"ip_address":"127.0.0.1"}}
```

With the one-line import added (`/debug-sentry-import`) the snippet does what the text promises:
one error event plus one span envelope holding the manual span and the request segment. Note the
manual span is named `My First Test Transaction` but arrives as a non-segment `span` item with
`status: "error"`, not as a transaction:

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.http.cloudflare","handled":false}
{"type":"span","items":["test My First Test Transaction","http.server GET"],
 "raw":[{"name":"My First Test Transaction","op":"test","status":"error","is_segment":false,"origin":"manual"},
        {"name":"GET","op":"http.server","status":"ok","is_segment":true,"segment_name_source":"url","url_path":"/debug-sentry-import"}]}
```

Error events carry **no `transaction` field**, no context lines, and every in-app frame points at
`.wrangler/tmp/dev-*/functionsWorker-*.js`; `contexts.runtime` is `{name: "cloudflare"}` with no
version. Same as `../cloudflare/README.md`, step 3.

`/api/error`: `Error: api error`, mechanism `auto.http.cloudflare`, `handled: false`; its
`http.server` segment is reported `"status":"ok"` with no `http.response.status_code`, although
wrangler answered `500` (also seen on Workers).

`/api/users/42`, the parameterized route (`functions/api/users/[id].js`): segment `GET`, source
`url`, `url.path` `/api/users/42`, **no `http.route`**. `context.params` is not used for naming, so
Pages file routes are not visible as routes in Sentry; the only distinguishing attribute is the raw
path.

`/api/fetch`: the `http.client` span and the segment arrive in one envelope, and the recorder saw
both propagation headers:

```json
{"type":"span","items":["http.client GET 127.0.0.1","http.server GET"]}
{"url":"/recorder?from=api-fetch","sentry-trace":"022c8493b7704b2ca82a37cd0f49252b-93e87f1c0f473c65-1",
 "baggage":"sentry-environment=production,sentry-public_key=…,sentry-trace_id=022c8493…,sentry-org_id=1,sentry-sampled=true,sentry-sample_rand=0.837…,sentry-sample_rate=1","traceparent":null}
```

`/api/log`: `{"type":"log","items":["info: hello from /api/log"]}`, one `log` envelope, arrived
within the sentinel window without any flush call.

`/api/waituntil`: the segment is sent when the response is returned, and the `http.client` child and
the `background.task` span follow as two further `span` envelopes for the same trace once the
deferred work finishes. Under the default stream lifecycle the spans in `context.waitUntil` **are
not missing**, without setting `traceLifecycle` at all:

```json
{"type":"span","trace_id":"cf46f403…","items":["http.server GET"]}
{"type":"span","trace_id":"cf46f403…","items":["http.client GET 127.0.0.1"]}
{"type":"span","trace_id":"cf46f403…","items":["task background.task"]}
```

`index.mdx:382-384` still describes static as the lifecycle in effect and stream as the thing to
opt into; on develop it is the other way round.

`/api/waituntil-reject`: **not captured**. The sink holds only the `http.server GET` segment
(`status: "ok"`); workerd logged `✘ [ERROR] Uncaught Error: waitUntil rejection` and
`▲ [WARNING] NOSENTRY reporting trace with exceptions, but no exception outcome`. Identical to the
Workers variant (d) in `../cloudflare/README.md`; the Pages `EventContext.waitUntil` behaves the
same and the guide has no Pages text about it.

Sentinel: `{"type":"event","message":"sentinel","mechanism":"generic","handled":true}` plus one
span envelope with `http.client GET 127.0.0.1`, `test sentinel span` and `http.server GET`.

### Step 4, Variants

**(a) Scoped middleware (`scoped`, `results-scoped.json`)**, the same file moved to
`functions/api/_middleware.js`, as DOC-R19 recommends. Item types:

```json
["event","span","span","span","log","span","span","span","span","span","event","span"]
```

`/`, `/style.css`, `/debug-sentry` and `/debug-sentry-import` produce **nothing**: no span, and
their errors (`ReferenceError`, `My first Sentry error!`) are printed by wrangler but not captured.
Everything under `/api/` behaves exactly as in `base` (same names, same headers at the recorder, same
log item). So scoping works, and it silently un-instruments the guide's own verify route
`functions/debug-sentry.js`, which sits at the functions root.

**(b) The include's verbatim config (`include-config`)**: see step 2, identical to `base`.

**(c) No `nodejs_compat` flag at a current date (`no-flag`, `results-no-flag.json`)**:
`compatibility_date: "2026-09-01"` and no `compatibility_flags` at all. The bundle imports
`node:async_hooks` twice (`wrangler pages functions build` output), wrangler prints no warning, and
the item set is identical to `base`. At this date the flag is not what makes the SDK run.

**(d) No flag at the documented floor (`no-flag-floor`, `results-no-flag-floor.json`)**:
`compatibility_date: "2024-09-23"`, no flags. Seven `▲ [WARNING] The package "node:…" wasn't found
on the file system but is built into node` lines, then:

```
✘ [ERROR] service core:user:qs-cloudflare-pages: Uncaught Error: No such module "node:async_hooks".
✘ [ERROR] The Workers runtime failed to start.
```

No `Ready`, nothing at the sink. So the include's sentence is right at its floor date and redundant
at a current one; it does not say that the requirement depends on the date.

### Step 5, Init debug output

`debug: true` prints no SDK name, version or runtime version (read off the envelopes:
`sentry.javascript.cloudflare` `10.67.0`, runtime `cloudflare`). Per request the SDK re-runs init and
prints the same **10 integrations** in every variant:

```
Dedupe EventFilters FunctionToString ConversationId LinkedErrors Fetch HttpServer RequestData Console SpanStreaming
```

Wrangler itself printed no warning in `base`, `scoped`, `include-config` or `no-flag`; the only
`▲ [WARNING]` lines in those runs are workerd's `NOSENTRY reporting trace with exceptions` for the
`waitUntil` rejection.

## Findings

| # | Severity | Kind | Docs | Observed |
| --- | --- | --- | --- | --- |
| 1 | P0 | docs wrong | `index.mdx:339-352` | The Pages tracing verify snippet references `Sentry` in a new file with no import; copied verbatim it throws `ReferenceError: Sentry is not defined` and the captured issue is that, not "My first Sentry error!". Fix: add `import * as Sentry from "@sentry/cloudflare";` to the Pages snippet (the Workers one at `:313-335` is in a file that already imports it). |
| 2 | P1 | docs wrong | `index.mdx:167-201`, `cloudflare-pages-middleware-intro.mdx:1` | A root `functions/_middleware.js` spans every request, static assets included (`GET /` and `GET` with `url.path` `/style.css`), so a Pages site sends one `http.server` span per asset. Fix: say so and point at `functions/<dir>/_middleware.js` for function-only instrumentation, noting that this also excludes a root `functions/debug-sentry.js` (DOC-R19). |
| 3 | P2 | docs wrong | `index.mdx:382-384` | Text presents static as the lifecycle in effect and `traceLifecycle: "stream"` as the fix; on develop stream is the default, `waitUntil` spans arrive with no option set, and every trace is `span` items, not a transaction. The Pages verify snippet still names its span "My First Test Transaction". Fix: rewrite the paragraph around the stream default and keep the static note as the opt-out. |
| 4 | P2 | docs wrong | `getting-started-config/javascript.cloudflare.mdx:5` | "you need to set the `nodejs_compat` compatibility flag": required at the floor date 2024-09-23 (workerd: `No such module "node:async_hooks"`), not at 2026-09-01, where the same bundle runs with no flags. Fix: state that the flag is needed for dates before Node.js compatibility became the default and is otherwise redundant. |
| 5 | P2 | SDK limit | `index.mdx:292-301` (silent) | Pages function routes are named by method only (`GET`, source `url`); a parameterized route `functions/api/users/[id].js` yields no `http.route` and `context.params` is unused, so file routes are not visible as routes in Sentry. Fix: say that Pages request spans are named `GET` with the path in `url.path`. |
| 6 | P2 | SDK limit | `index.mdx:376-401` (Worker code only) | `context.waitUntil(Promise.reject(…))` on Pages is not captured, same as `ctx.waitUntil` on Workers; the guide has no Pages `waitUntil` text. Fix: add a Pages line to the `waitUntil` section with the `.catch(Sentry.captureException)` pattern. |

Not repeated from `../cloudflare/README.md`: the missing `@sentry/cloudflare/nodejs_compat`
entrypoint (`index.mdx:63`, still absent on `03aaf42455`), the Vite plugin, the `/request` wrapper,
the Workers `waitUntil` rejection, the compatibility-date floor with the flag set, the missing
`transaction` field on events and the absent context lines.

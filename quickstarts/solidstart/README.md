# QS-solidstart, the SolidStart getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/solidstart`
pulls `@sentry/core`, `@sentry/nitro`, `@sentry/node`, `@sentry/server-runtime-injection`,
`@sentry/server-utils`, `@sentry/solid`, `@sentry/bundler-plugins` and `@sentry/conventions@0.20.0`, and
declares peers `@solidjs/start: ^1.0.0 || ^2.0.0` and `@solidjs/router: >=0.13.4 <2.0.0-0` (optional).
Its `exports` are `.`, `./solidrouter` and `./vite` (no `./middleware`).

Node `v26.5.0`, Google Chrome 153.0.8010.37 driven by `playwright-core` 1.55.0
(`chromium.launch({ channel: 'chrome', headless: true })`, no browser download), macOS 15 (Darwin 24.6.0).
`@solidjs/start` 2.0.4 (the registry's `latest`; the guide names no major), `@solidjs/router` 1.0.0,
`solid-js` 1.9.15, `vite` 8.2.2, `nitro` 3.0.260903-beta (the registry's `latest`, SolidStart 2 needs it for
`nitro/vite`), all from the registry. Client envelopes go to a local sink through the `tunnel` option, server
envelopes through a `dsn` pointing at the sink; nothing leaves the machine.

## What it reproduces

The task named `guides/solidstart/manual-setup.mdx`; that file does not exist. The manual setup is the
guide's index page, `docs/platforms/javascript/guides/solidstart/index.mdx` (frontmatter
`sdk: sentry.javascript.solidstart`, `categories: [browser, server]`, index.mdx:4-7), plus the pages it links:
`install/index.mdx`, `install/cli-import.mdx`, `install/limited-server-tracing.mdx`,
`install/dynamic-import.mdx`, `features/middleware.mdx`, `features/error-boundary.mdx`,
`features/solid-router.mdx`. There is no wizard step on the page.

The page describes SolidStart 1: `app.config.ts` with `defineConfig` from `@solidjs/start/config` wrapped in
`withSentry` (index.mdx:214-231), `vinxi build` (cli-import.mdx:29) and `vinxi start` (index.mdx:297), and a
`.output/server/instrument.server.mjs` that `withSentry` writes (index.mdx:277-283). `npm install @solidjs/start`
today gives **2.0.4**, which has no `app.config.ts`, no vinxi, and is configured in `vite.config.ts` with the
`solidStart()` and `nitro()` Vite plugins. This run is that user: SolidStart 2 with the `node-server` Nitro
preset, `vite build` with `NODE_ENV=production`, the page's snippets copied verbatim wherever SolidStart 2 has a
place for them, and the develop-only `sentrySolidStart` plugin from `@sentry/solidstart/vite`
(`build/types/vite/sentrySolidStart.d.ts`, "Requires SolidStart 2. On SolidStart 1, use `withSentry` in
`app.config.ts` instead") where the page's `withSentry` has none. SolidStart 1 with vinxi was not run.

Where each rendered include really comes from (`javascript.solidstart.mdx`, else `javascript.mdx`, else
`_default.mdx`):

| Reference in the guide | Renders from |
| --- | --- |
| `<PlatformContent includePath="getting-started-prerequisites" />` (index.mdx:21) | `platform-includes/getting-started-prerequisites/_default.mdx:1-6` |
| `<Include name="quick-start-features-expandable" />` (index.mdx:38) | `includes/quick-start-features-expandable.mdx` |
| `<PlatformContent includePath="getting-started-capture-errors" />` (index.mdx:318, error-boundary.mdx:11) | `platform-includes/getting-started-capture-errors/javascript.solidstart.mdx:1-15` |
| `<Include name="vite-loadenv-hint-splitlayout.mdx" />` (index.mdx:391) | `includes/vite-loadenv-hint-splitlayout.mdx:1-35` (a `sentryVitePlugin` example, not `withSentry`) |
| `<PlatformContent includePath="getting-started-tunneling" />` (index.mdx:395) | `platform-includes/getting-started-tunneling/javascript.mdx:1-22` |
| `<PlatformContent includePath="getting-started-data-collection" />` (index.mdx:399) | `platform-includes/getting-started-data-collection/javascript.mdx` (not run) |
| `<PlatformContent includePath="getting-started-browser-sandbox-warning" />` (index.mdx:418) | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `<Include name="quick-start-locate-data-expandable" />` (index.mdx:505) | `includes/quick-start-locate-data-expandable.mdx` |

Snippets copied verbatim: install (index.mdx:52), `src/entry-client.tsx` (index.mdx:93-140, all four product
options, plus `tunnel` from getting-started-tunneling/javascript.mdx:16 and a repro-only `debug: true`),
`src/instrument.server.ts` (index.mdx:157-172, plus `debug: true`), `src/middleware.ts` (index.mdx:191-201),
`app.config.ts` (index.mdx:214-231, kept as a file and evaluated by `check-config.mjs` because SolidStart 2 never
reads it), the router wrapper in `src/app.tsx` (index.mdx:250-264, plus the `root` Suspense boundary of the
SolidStart 2 template), the `package.json` scripts (index.mdx:294-301), the error boundary
(javascript.solidstart.mdx:2-14), the verify buttons (index.mdx:423-431 and 467-487) and the API route
`src/routes/sentry-test.tsx` (index.mdx:449-453). `features/middleware.mdx:10-20` is in
`src/middleware-subpath.ts` for the import-path check only. Repro-only: `src/routes/users/[id].tsx` (a
parameterized route with a `"use server"` function), the `"use server"` function that throws on the home page,
`src/routes/server-fetch.ts` (a server-side `fetch` to the sink's recorder) and `src/routes/sentinel.ts`.

## Install

```bash
cd $REPRO/quickstarts/solidstart
npm install                      # fails: ERESOLVE, see below
npm install --legacy-peer-deps   # what the repro used
```

Plain `npm install` fails with `ERESOLVE unable to resolve dependency tree`: `@sentry/nitro@10.67.0` declares
`peer nitro@">=3.0.0-0 <4.0.0 || 3.0.260311-beta || 3.0.260415-beta"` and the current nitro 3 beta
(`3.0.260903-beta`, the registry's `latest`, needed by SolidStart 2 for `nitro/vite`) is a prerelease of a
different patch, so it satisfies none of the three. `--legacy-peer-deps` installs (`added 205 packages in 17s`).
`node_modules/@sentry` holds `browser browser-utils bundler-plugins conventions core feedback nitro node
opentelemetry replay replay-canvas server-runtime-injection server-utils solid solidstart`, all `10.67.0`
from the toolbox; `package-lock.json` has no registry-resolved `@sentry/*` entry except `@sentry/conventions@0.20.0`.

Exports the snippets use, checked against `node_modules/@sentry/solidstart/build/types`:

| Export | Status on develop |
| --- | --- |
| `init`, `replayIntegration`, `feedbackIntegration`, `startSpan`, `captureMessage`, `flush`, `getClient` | exist (`index.types.d.ts`, re-exports of `@sentry/solid` and `@sentry/node`) |
| `solidRouterBrowserTracingIntegration`, `withSentryRouterRouting` from `@sentry/solidstart/solidrouter` (index.mdx:97, 253) | exist |
| `sentryBeforeResponseMiddleware` from `@sentry/solidstart` (index.mdx:192) | exists (`server/middleware.d.ts`: "adds tracing data as `<meta>` tags to a page on pageload") |
| `sentryBeforeResponseMiddleware` from `@sentry/solidstart/middleware` (features/middleware.mdx:11) | **subpath does not exist**: `ERR_PACKAGE_PATH_NOT_EXPORTED` (`results-check-config.json`) |
| `withSentry` from `@sentry/solidstart` (index.mdx:215, 336; install pages) | exists (`config/withSentry.d.ts`), typed for SolidStart 1's `defineConfig` |
| `withSentryErrorBoundary` (javascript.solidstart.mdx:6) | exists |
| `sentrySolidStart` from `@sentry/solidstart/vite` | exists, SolidStart 2 only; no docs page prints it |
| `sentrySolidStartVite` (`vite/sentrySolidStartVite.d.ts`) | internal, not exported by `vite/index.d.ts` or the package root |
| `withServerActionInstrumentation` | exists, no docs page mentions it |

No export in `@sentry/solidstart` or `@sentry/solid` types is marked `@deprecated`.

## Run

```bash
cd $REPRO/quickstarts/solidstart
./run.sh import-flag    # vite build, then index.mdx:298 `node --import ./.output/server/instrument.server.mjs .output/server/index.mjs`
./run.sh import-src     # `node --import ./src/instrument.server.ts .output/server/index.mjs` (Node type stripping loads the page's TS file)
./run.sh check-config   # evaluates the page's config-time imports on what npm install gives, no server
SKIP_BUILD=1 ./run.sh <variant>   # reuse .output
```

`run.sh` refuses to start if 4764 (sink) or 4765 (app) is in use, builds with `NODE_ENV=production timeout 170
npx vite build` into `build.log`, lists `.output/server/*.mjs` into `output-server-listing.txt`, starts
`sink.mjs` (copied unchanged from `../react/`) and the app, and runs `drive.mjs`: one headless Chrome opens
`/`, clicks the two verify buttons, the boundary button, the server-function button, the server-fetch button,
navigates to `/users/42` and back, fires the client sentinel (`captureMessage('sentinel')` plus a
`sentinel-span`), requests `/sentinel` (the server sentinel, which also returns the server SDK metadata), and
polls the sink for both with a 60 s deadline; nothing sleeps. Results go to `results-<variant>.json`, the
server's stdout/stderr (SDK debug lines) to `app-<variant>.log`. `home-headers.txt` holds the response headers
of `GET /`.

## Expected (what the guide claims)

- index.mdx:52, `npm install @sentry/solidstart --save`.
- index.mdx:83-140, init in `src/entry-client.tsx` with `solidRouterBrowserTracingIntegration()`, replay, feedback, `tracesSampleRate: 1.0` ("capture 100% of transactions").
- index.mdx:152-172, `src/instrument.server.ts` with `Sentry.init({ dsn, tracesSampleRate: 1.0 })`.
- index.mdx:184-201, `sentryBeforeResponseMiddleware` in `src/middleware.ts` "enabling distributed tracing between the client and server".
- index.mdx:208-231, wrap `app.config.ts` in `withSentry` "so that the instrumentation file gets included in your build output", `middleware: "./src/middleware.ts"`, optional `instrumentation` path.
- index.mdx:245-264, `withSentryRouterRouting(Router)` "to collect navigation spans".
- index.mdx:277-283, `--import` the file "created by the build output: `.output/server/instrument.server.mjs`"; the build log prints "`[Sentry SolidStart withSentry] Successfully created /my/project/path/.output/server/instrument.server.mjs.`".
- index.mdx:294-301, `start:vinxi` (`NODE_OPTIONS='--import ...' vinxi start`) and `start:node` (`node --import ./.output/server/instrument.server.mjs .output/server/index.mjs`); cli-import.mdx:25-48 the same.
- index.mdx:313, wrap `ErrorBoundary` with `withSentryErrorBoundary` "to automatically report exceptions from inside a component tree".
- index.mdx:330-352, source maps: `org`, `project`, `authToken` in the `withSentry` options.
- index.mdx:411-431, the button that throws "Sentry Test Error" creates an issue.
- index.mdx:444-462, `src/routes/sentry-test.tsx` `GET` throws; clicking the second button triggers "a frontend error, an error in the API route, and a trace".
- install/index.mdx:7-10, SolidStart "uses ES Modules for server-side builds, which requires Sentry to register Node customization hooks" before the app.
- features/middleware.mdx:11, import from `@sentry/solidstart/middleware`.
- features/solid-router.mdx:7, Solid Router 0.13.4 and up.

## Observed on 2026-09-09

### Build (`build.log`, shared by both server variants)

`vite build` succeeds (client 345 modules, ssr 108, nitro 1050; `preset: node-server`). Sentry lines:
`[@sentry/nitro] Enabled hidden source map generation for Sentry. Source map files will be deleted after upload.`,
`[Sentry] Automatically setting sourcemaps.filesToDeleteAfterUpload: ["./**/*.map"] ...`,
`[sentry-vite-plugin] Warning: No auth token provided. Will not create release.` / `Will not upload source maps.`
(three times, once per Vite environment), then 3,543 `Debug: Deleting asset after upload:` lines. **3,519 of the
deleted files are under `node_modules/`** (`web-vitals/dist/*.map`, `path-to-regexp/dist/index.js.map`,
`oniguruma-parser`, `vfile`, `shiki`'s dependencies, ...), 24 under `.output/`. After the first build 7 `.map`
files remained in `node_modules` (a fresh `npm install` had thousands); the second build deleted only the 24 new
`.output` maps. Nothing was uploaded (no auth token) and no docs page says the plugin deletes anything outside
the build output. No `[Sentry SolidStart withSentry] Successfully created ...` line (index.mdx:283), no
orchestrion line, no warning that `withSentry`/`app.config.ts` were ignored. `.output/server/` holds `index.mjs`
and one route chunk; **no `instrument.server.mjs`** (`output-server-listing.txt`).

### `import-flag` (the page's start command), `results-import-flag.json`: **broken**

`node --import ./.output/server/instrument.server.mjs .output/server/index.mjs` exits immediately:
`Error [ERR_MODULE_NOT_FOUND]: Cannot find module '$REPRO/quickstarts/solidstart/.output/server/instrument.server.mjs'`
(`app-import-flag.log`). The server never listens; nothing reaches the sink. `start:vinxi` (index.mdx:297) cannot
run either: `vinxi` is not installed by `@solidjs/start@2` (`results-check-config.json`).

### `import-src` (`node --import ./src/instrument.server.ts`), `results-import-src.json`: **works, with gaps**

Node's type stripping loads the page's TypeScript file as-is. Server: `sentry.javascript.solidstart` `10.67.0`
(`npm:@sentry/solidstart`, `npm:@sentry/node`), 46 integrations (`EventFilters ... Http NodeFetch ... Express
Fastify Hapi Koa Graphql Mongo ... SpanStreaming`, the same list as the plain Node runs). Client:
`sentry.javascript.solidstart` `10.67.0` (`npm:@sentry/solidstart`, `npm:@sentry/solid`), 14 integrations
(`EventFilters FunctionToString ConversationId BrowserApiErrors Breadcrumbs GlobalHandlers LinkedErrors Dedupe
HttpContext CultureContext BrowserSession BrowserTracing Replay Feedback`); the feedback widget renders.
26 sink items: `span` x19, `event` x5, `session` x2. **No `transaction` item on either side**; every lifecycle
span is a `span` envelope item, while the page talks about "transactions" (index.mdx:121-122, 474).

| Step | What arrived |
| --- | --- |
| `#btn-throw` (index.mdx:423-431) | client `event` `Error: Sentry Test Error`, mechanism `auto.browser.global_handlers.onerror`, handled `false`, transaction `/` |
| `#btn-span` (index.mdx:467-487) | `GET /sentry-test` answers `500 {"status":500,"unhandled":true,"message":"HTTPError"}`; client `event` `Error: Sentry Test Error`, mechanism `auto.browser.global_handlers.onunhandledrejection`; client spans `test My First Test Transaction` (status error) and `http.client GET localhost` (500), both children of the pageload; server spans for `/sentry-test` in the **same trace** (`http.server` segment `GET`, status error, 500). **No server `event` for `Sentry Example API Route Error`**: the server log prints the error twice (h3's own stderr output) with no `captureException` or `Sending` line |
| `#btn-boundary` (javascript.solidstart.mdx:6-12) | fallback `Error: Sentry Test Render Error` renders; client `event`, mechanism `auto.function.solid.error_boundary`, handled `true` |
| `#btn-server-fn` (`"use server"` throws) | the client receives `caught: Sentry Test Server Function Error`; server spans `POST /_server` (200) in the pageload's trace; **no server `event`** |
| `#btn-server-fetch` | the recorder received `sentry-trace: <pageload trace id>-<span>-1` and a `baggage` header (`sentry-environment=production, sentry-public_key=public, sentry-trace_id=..., sentry-sampled=true, sentry-sample_rate=1, sentry-replay_id=...`); server span `http.client GET localhost` (`auto.http.node_fetch`) under the `GET /server-fetch` segment |
| `#nav-user` (`/users/42`) | client `navigation` segment named **`/users/:id`**, source `route`, origin `auto.navigation.solidstart.solidrouter`; the route's server function `POST /_server` runs in the navigation's trace |
| `#nav-home` | second `navigation` segment `/`, source `route` |
| pageload | `pageload` segment `/`, source `route`, origin `auto.pageload.browser`, status error (from the unhandled error), with `browser.*`, `resource.*`, `ui.webvital.lcp`/`cls` children |
| sentinels | client `sentinel` + `sentinel-span`, server `server-sentinel` (transaction `GET /sentinel`) + `server-sentinel-span`, all within the deadline |
| sessions / replay / logs | two client `session` items (`init` ok, then `unhandled`, errors 1); no `replay_event` in this run (the buffered error replay needs `minReplayDuration`; the first run, which waited 60 s on a wrong predicate, received 2 `replay_event` + 2 `replay_recording`); no `log` items (the page has no logs step) |

Server span shape, per request (`/sentinel`): one `middleware` span `GET /sentinel` (`auto.http.nitro.h3`) and
**three `http.server` spans**: `GET /sentinel` (`auto.http.nitro.h3`), `GET` (`auto.http.nitro.srvx`) and the
segment `GET` (`auto.http.http_server`, source `url`). Every server segment is named by method only (`GET`,
`POST`), with the path in `url.path`; no `http.route` is set for file routes or `_server` calls. Static assets
(`/_build/assets/*`, `/favicon.ico`) get their own `GET` segments (`auto.http.nitro.srvx`), 8 of the 19 span
envelopes.

Distributed tracing: the pageload's trace id equals the server's `GET /` segment trace id, and the navigation's
trace id equals its `POST /_server` segment trace id. The HTML of `/` contains **no `<meta name="sentry-trace">`
or `<meta name="baggage">`** (`home-headers.txt`, `htmlMeta` in the results); the trace reached the browser
through the response header `server-timing: sentry-trace;desc="...", baggage;desc="..."` that `@sentry/nitro`'s
runtime plugin sets, not through the page's middleware.

### `check-config`, `results-check-config.json`

On `@solidjs/start@2.0.4`: `@solidjs/start/config` exports `solidStart` (the Vite plugin) and **no
`defineConfig`** (`typeof defineConfig === 'undefined'`), so the page's `app.config.ts` (index.mdx:214-231)
would throw `defineConfig is not a function` if anything evaluated it; SolidStart 2 reads `vite.config.ts` only,
so the file is simply ignored during `vite build`. `withSentry` itself is callable and returns
`{ middleware, vite, server }`. `@sentry/solidstart/middleware` (features/middleware.mdx:11) fails with
`ERR_PACKAGE_PATH_NOT_EXPORTED`. `@sentry/solidstart/vite` and `@sentry/solidstart/solidrouter` resolve. `vinxi`
is not installed.

## Findings

| # | Sev | Kind | Docs | Claim | Observed | Docs-side fix |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | P0 | docs wrong | index.mdx:277-301, cli-import.mdx:25-48, limited-server-tracing.mdx:43 | the build creates `.output/server/instrument.server.mjs`; start with `--import` on it (or `vinxi start`) | on SolidStart 2 (registry `latest`) no such file exists, `node --import` exits with `ERR_MODULE_NOT_FOUND`; `vinxi` is not installed | give SolidStart 2 its own run step (`vite build`, then `node --import ./src/instrument.server.ts .output/server/index.mjs` or the `nitro` plugin the SDK's e2e app uses) and label the current one SolidStart 1 |
| 2 | P0 | docs wrong | index.mdx:208-231, 335-352; install/*.mdx | wrap `app.config.ts` in `withSentry` so the instrument file and source-map options apply | SolidStart 2 has no `app.config.ts` and `@solidjs/start/config` has no `defineConfig` (only `solidStart`); the file is ignored, the SDK's SolidStart 2 plugin is `sentrySolidStart` from `@sentry/solidstart/vite` in `vite.config.ts`, which no page prints | add the `vite.config.ts` snippet (`solidStart()`, `sentrySolidStart({ org, project, authToken })`, `nitro()`) next to the SolidStart 1 one |
| 3 | P0 | docs wrong | features/middleware.mdx:11 | `import { sentryBeforeResponseMiddleware } from '@sentry/solidstart/middleware'` | `ERR_PACKAGE_PATH_NOT_EXPORTED`; index.mdx:192 imports it from `@sentry/solidstart`, which works | change the import to `@sentry/solidstart` |
| 4 | P1 | SDK limit | index.mdx:330-352 (silent on deletion) | source maps are uploaded with `org`/`project`/`authToken` | with no auth token the plugin uploads nothing but still deletes 3,519 `*.map` files under `node_modules/` (auto `filesToDeleteAfterUpload: ["./**/*.map"]`) | say the plugin deletes every `*.map` under the project, including `node_modules`, unless `sourcemaps.filesToDeleteAfterUpload` is set, and set `sourcemaps.disable: true` when no token is configured |
| 5 | P1 | SDK limit | index.mdx:52 (silent) | `npm install @sentry/solidstart --save` | plain `npm install` ends in `ERESOLVE`: `@sentry/nitro`'s peer range rejects the current nitro 3 beta that SolidStart 2 needs; `--legacy-peer-deps` is required | note the nitro peer range and the `--legacy-peer-deps` workaround until the range is widened |
| 6 | P1 | docs wrong | index.mdx:444-462 | clicking the button triggers "an error in the API route" that Sentry captures | the API route's throw becomes a 500 and a server span with status error, but no server `event`; only the client's `Sentry Test Error` arrives | say the API-route error is visible as an errored server span only, or document capturing it manually |
| 7 | P2 | docs wrong | index.mdx:184-201 | the middleware enables distributed tracing between client and server (types: via `<meta>` tags) | no `sentry-trace`/`baggage` meta tags in the HTML; the trace continues through the `server-timing` header set by the Nitro runtime plugin | describe the header-based continuation for SolidStart 2 and drop the meta-tag wording |
| 8 | P2 | SDK limit | index.mdx:184 (silent) | server-side data "enhanced" by the SDK | every server segment is named `GET`/`POST` (source `url`), three `http.server` spans plus one `middleware` span per request, static assets get their own segments | none docs-side; note that server spans carry the path in `url.path`, not in the name |
| 9 | P2 | SDK limit | index.mdx (silent), features pages (silent) | | `"use server"` function errors are not captured on the server; `withServerActionInstrumentation` exists but no page mentions it | document `withServerActionInstrumentation` for server functions |
| 10 | P2 | docs wrong | index.mdx:121-122, 164-165, 474 | "capture 100% of transactions", "My First Test Transaction" | under v11 everything arrives as `span` envelope items; no `transaction` item was sent by either side | say "spans" / "traces" |
| 11 | P2 | docs wrong | index.mdx:283 | the build log prints `[Sentry SolidStart withSentry] Successfully created ...instrument.server.mjs.` | no such line on SolidStart 2 (`build.log`) | scope the sentence to SolidStart 1 |

## Notes

- `withSentryErrorBoundary`, `solidRouterBrowserTracingIntegration` and `withSentryRouterRouting` work as the
  page says: parameterized navigation segments are named `/users/:id` with source `route`.
- Replay and feedback initialise from the page's client snippet; the error replay only lands after
  `minReplayDuration`, so a fast run sees `session` items but no `replay_event`.
- `debug: true` on both sides is a repro addition; the page has no debug step. The server's debug output is in
  `app-import-src.log` (`app-import-src-run1.log` is the first run, before the driver's sentinel predicate was
  fixed; its captured data is the same).
- Not run: SolidStart 1 with vinxi (the page's own shape), `limited-server-tracing.mdx` and
  `dynamic-import.mdx` (`autoInjectServerSentry` is a `withSentry` option, so it has no effect on SolidStart 2),
  the `no-import` start (no preload at all).

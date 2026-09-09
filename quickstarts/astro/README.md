# QS-astro, the Astro getting-started path (manual setup, Node adapter), against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/astro` pulls
`@sentry/browser`, `@sentry/core`, `@sentry/node`, `@sentry/server-runtime-injection`, `@sentry/server-utils`,
`@sentry/bundler-plugins` and `@sentry/conventions@^0.20.0`, and declares the peer `astro: >=4.0.0-beta || >=7.0.0-beta`.

Astro `7.3.2` and `@astrojs/node` `11.1.5` (standalone mode) from the registry (the page names no major; `npm
install astro` gives 7, whose adapter peer is `astro ^7.2.1`). Node `v26.5.0`, macOS 15.7.7 (Darwin 24.6.0), Google
Chrome 153.0.8010.37 driven by `playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome', headless: true })`,
no browser download). Client envelopes go to a local sink through the `tunnel` option, server envelopes through a
`dsn` that points at the same sink; the bundler plugin runs with `telemetry: false` and no auth token. Nothing leaves
the machine.

## What it reproduces

A new user following the Astro guide end to end with every snippet copied verbatim. The path given for this run,
`docs/platforms/javascript/guides/astro/manual-setup.mdx`, **does not exist** in the docs checkout: the guide folder
holds only `index.mdx` (51 lines) and `profiling/`. `index.mdx` carries the frontmatter (`sdk: sentry.javascript.astro`,
categories `javascript, browser, server, server-node`, index.mdx:4-9), the prerequisites (index.mdx:12-19), the
runtime warning (index.mdx:21-29) and one content step, `<PlatformContent includePath="getting-started-complete" />`
(index.mdx:49). Everything a user copies renders from that include.

Where each rendered include really comes from (`javascript.astro.mdx`, else `javascript.mdx`, else `_default.mdx`):

| Reference in the guide | Renders from |
| --- | --- |
| `<Include name="quick-start-features-expandable" />` (index.mdx:47) | `includes/quick-start-features-expandable.mdx:5-16`, the `javascript.astro` section: issues, tracing, profiling, sessionReplay, logs, userFeedback |
| `<PlatformContent includePath="getting-started-complete" />` (index.mdx:49) | `platform-includes/getting-started-complete/javascript.astro.mdx:1-593`; the `PlatformSection notSupported={["javascript.cloudflare"]}` branches apply here |
| `getting-started-complete/javascript.astro.mdx:423` `<Include name="vite-loadenv-hint-splitlayout.mdx" />` | `includes/vite-loadenv-hint-splitlayout.mdx:1-35` (read only) |
| `getting-started-complete/javascript.astro.mdx:429` `getting-started-tunneling` | `platform-includes/getting-started-tunneling/javascript.mdx:1-22` (no astro variant; `tunnel: "/tunnel"` at :14-17) |
| `getting-started-complete/javascript.astro.mdx:435` `getting-started-data-collection` | `platform-includes/getting-started-data-collection/javascript.mdx:1-29` (not run) |
| `getting-started-complete/javascript.astro.mdx:447` `getting-started-browser-sandbox-warning` | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `getting-started-complete/javascript.astro.mdx:301` "APIs page" link (`/configuration/apis/#server-request-instrumentation`) | `docs/platforms/javascript/common/configuration/apis.mdx:1462-1510`, the `handleRequest()` middleware, its `trackClientIp` option and the `src/middleware.(js|ts)` example at :1493-1503 |
| `apis.mdx:1486` "disable automatic instrumentation" link | `docs/platforms/javascript/common/tracing/instrumentation/automatic-instrumentation.mdx:41-63`, `autoInstrumentation: { requestHandler: false }` |
| `getting-started-complete/javascript.astro.mdx:558` `quick-start-locate-data-expandable` | `includes/quick-start-locate-data-expandable.mdx` (read only) |
| source maps follow-up | `platform-includes/sourcemaps/overview/javascript.astro.mdx:1-65` (read only) |
| v11 changes to the integration options | `docs/platforms/javascript/common/migration/v10-to-v11/index.mdx:1128-1152` (`sourceMapsUploadOptions` removed) and `:1192-1224` (runtime options moved to the config files) |

Snippets copied verbatim: `astro.config.mjs` (`integrations: [sentry()]`, javascript.astro.mdx:189-196, then the
source maps form with `org`, `project`, `authToken: process.env.SENTRY_AUTH_TOKEN`, :384-398),
`sentry.client.config.js` (:214-251, all four client product options), `sentry.server.config.js` (:308-336 without
the profiling lines), the verify page `src/pages/test.astro` (:454-473), the endpoint `src/pages/api/test-error.js`
(:487-491), the tracing verify page as `src/pages/test-tracing.astro` (:510-532, it reuses the `one` button id, so it
gets its own page), and the middleware `variants/middleware.ts` (apis.mdx:1493-1503). The `npx astro add
@sentry/astro` step (:14-16) was **not run**: it installs from the registry, so the tarball install plus the manual
`astro.config.mjs` edit that `astro add` would make replaced it.

Repro-only additions, all marked in the files: `src/layouts/Base.astro` (exposes `window.Sentry`, a sentinel helper
and the injected meta tags), `src/pages/index.astro`, `src/pages/users/[id].astro` (parameterized SSR route),
`src/pages/vt/` (the same two pages with `<ClientRouter />` from `astro:transitions`), `src/pages/ssr-throw.astro`
(frontmatter throws), `src/pages/fetch-recorder.astro` (server-side `fetch` to the sink's recorder),
`src/pages/api/sentinel.js` (server sentinel), `output: "server"`, the Node adapter, `outDir` per build variant,
`telemetry: false`, the `tunnel` and `debug: true` lines in both config files.

## Install

```bash
cd $REPRO/quickstarts/astro
npm install   # package.json pins twelve @sentry/* tarballs from ../../_toolbox/pack-develop-03aaf424/ and repeats them in `overrides`
```

`added 266 packages in 37s`. `node_modules/@sentry` holds `astro browser browser-utils bundler-plugins conventions
core feedback node opentelemetry replay replay-canvas server-runtime-injection server-utils`, all `10.67.0` from the
tarballs; the only registry-resolved `@sentry/*` entry in `package-lock.json` is `@sentry/conventions@0.20.0`.
`astro` 7.3.2, `@astrojs/node` 11.1.5, `playwright-core` 1.55.0 from the registry. npm printed an `allow-scripts`
notice for `esbuild@0.28.2`'s postinstall; the prebuilt `@esbuild/darwin-arm64` binary is present and every build ran.

Exports and options the snippets use, checked in `node_modules/@sentry/astro/build/types/`:

| Export / option | Status on develop |
| --- | --- |
| `sentry()` default export (`index.types.d.ts:38`, `sentryAstro`) | exists |
| `sentry({ org, project, authToken })` (javascript.astro.mdx:384-398) | exist as top-level build options (`integration/types.d.ts:65`, `SentryOptions = BuildTimeOptionsBase & ...`) |
| `sentry({ clientInitPath, serverInitPath })` (:276-277) | exist (`integration/types.d.ts:11,19`) |
| `sentry({ autoInstrumentation: { requestHandler } })` (automatic-instrumentation.mdx:54-56) | exists (`integration/types.d.ts:25-36`) |
| `sentry({ sourcemaps: { assets, disable } })`, `telemetry` (sourcemaps/overview:34-50, 65) | exist through `BuildTimeOptionsBase` |
| `sentry({ sourceMapsUploadOptions })` (v10 shape) | **removed**: the build logs `[WARN] [@sentry/astro] [Sentry] Removed in v11 and ignored: sourceMapsUploadOptions. Set bundler plugin options directly on the Sentry build options.` and continues (`results-build-removed-option.json`) |
| `Sentry.init`, `browserTracingIntegration`, `replayIntegration`, `feedbackIntegration`, `startSpan`, `captureMessage` | exist (`index.client.d.ts` re-exports `@sentry/browser`, overrides `browserTracingIntegration` with the Astro version; `index.server.d.ts` re-exports the Node SDK) |
| `Sentry.handleRequest({ trackClientIp })` (apis.mdx:1469-1503) | exists (`server/middleware.d.ts:17`); its d.ts says `trackClientIp` defaults to `dataCollection.userInfo` (`true` unless disabled), see finding 2 |
| `@sentry/astro/middleware` subpath | exists (package `exports`: `.`, `./middleware`, `./import`); it is what the integration auto-adds |
| `@deprecated` markers in `index.client.d.ts`, `index.server.d.ts`, `server/middleware.d.ts`, `client/*.d.ts` | **none** |

## Run

```bash
cd $REPRO/quickstarts/astro
./run.sh build base              # astro build -> dist/                      (results-build-base.json, build-base.log)
./run.sh build middleware        # src/middleware.ts + autoInstrumentation.requestHandler:false -> dist-middleware/
./run.sh build static-default    # Astro's default output, only the two verify files (variants/src-static/) -> fails, see below
./run.sh build removed-option    # sentry({ sourceMapsUploadOptions }) -> dist-removed-option/ (build-time warning)
./run.sh base                    # headless Chrome: /test buttons, /test-tracing button, /users/42 -> /users/43 (full loads)   -> results-base.json
./run.sh view-transitions        # headless Chrome: /vt/ -> /vt/users/7 -> /vt/users/8 under <ClientRouter />              -> results-view-transitions.json
./run.sh server                  # plain fetches: /users/42, /api/test-error, /ssr-throw, /fetch-recorder, trace continuation, /api/sentinel -> results-server.json
./run.sh server-middleware       # the server steps against dist-middleware/                                                -> results-server-middleware.json
```

Each run checks that `127.0.0.1:4756` (sink) and `127.0.0.1:4757` (app) are free, starts `sink.mjs` (copied from
`../react/`, plus a `via` field per item so `/tunnel` client envelopes and `/api/1/envelope/` server envelopes can
be told apart) and `HOST=127.0.0.1 PORT=4757 node ./dist/server/entry.mjs`, runs `drive.mjs`, and kills both. Every
wait is a condition on the sink with a hard 60 s deadline: the browser side ends with `window.__qsSentinel('sentinel')`
(`captureMessage` plus a `sentinel-span`), the server side with `GET /api/sentinel` (`sentinel-server` plus
`sentinel-server-span`), and the run polls for those; pageload spans, which end on the idle timeout, get their own
polled wait. `results-<variant>.json` holds `verdict`, `meta` (from `Sentry.getClient()`), `steps`, `waits`,
`summary`, `console` (browser console, page errors, the Sentry lines of `server-<variant>.log`, the whole
`build-<variant>.log`), the compact sink items, the recorder headers and the raw envelopes. Machine paths are
replaced by `$REPRO`. `ASTRO_TELEMETRY_DISABLED=1` is set for every command.

## Expected (what the docs claim)

- index.mdx:18, "Astro `3.0.0` or above"; index.mdx:23-25, Node runtimes only.
- javascript.astro.mdx:9-16, install with `npx astro add @sentry/astro`; :184-196, register `sentry()` in `integrations`.
- :209 and :297, create `sentry.client.config.(ts|js)` and `sentry.server.config.(ts|js)` in the project root; :265, the
  integration "automatically detects" them.
- :299-303, only "for Astro versions below `3.5.2`" is the middleware needed; apis.mdx:1464, "Astro server requests are
  automatically instrumented starting from Astro version `3.5.2`"; apis.mdx:1481, `trackClientIp` "Defaults to `false`";
  apis.mdx:1486, when adding the middleware manually you "must disable automatic instrumentation".
- automatic-instrumentation.mdx:45-60, `autoInstrumentation: { requestHandler: false }` turns the server
  instrumentation off.
- :355, source maps upload needs `org`, `project`, `authToken` in the `sentry` options; :408, keep the token in
  `SENTRY_AUTH_TOKEN`; sourcemaps/overview:38, the integration looks for maps "depending on your `outDir`, `rootDir` and
  `adapter` configuration".
- :427-429 and getting-started-tunneling/javascript.mdx:14-17, `tunnel: "/tunnel"` avoids ad blockers.
- :448-482, the verify page with two buttons plus `src/pages/api/test-error.(js|ts)` creates a frontend error and an
  API route error; :505, the tracing snippet creates "a custom span to measure the time it takes for the API request".
- v10-to-v11/index.mdx:1128-1152, `sourceMapsUploadOptions` was removed, its fields are top-level now; :1196, runtime
  options can no longer be passed to `sentryAstro()`.

## Observed on 2026-09-09

### Build (`results-build-*.json`)

`astro build` with the base config took about a second of Vite time and exited 0. Output of the Sentry side, per Vite
pass (server, client, prerender): `[sentry-vite-plugin] Warning: No auth token provided. Will not create release.` and
`... Will not upload source maps.`; nothing else from the integration. Astro printed `[WARN] [vite] [plugin
astro:transitions] [SOURCEMAP_BROKEN] Sourcemap is likely to be incorrect` because the integration switched
`vite.build.sourcemap` to `hidden` (`build/esm/integration/index.js:228-231`, only logged under `debug`). `dist/` ends
up with **0** `.map` files: the integration also sets `sourcemaps.filesToDeleteAfterUpload` to
`["./dist/**/client/**/*.map", "./dist/**/server/**/*.map"]` (`index.js:53-54`) and the plugin deletes them although
nothing was uploaded. The `middleware` and `removed-option` builds use `outDir: ./dist-middleware` / `./dist-removed-option`
and keep **27** and **26** `.map` files, because that delete glob is hardcoded to `./dist/`. Events from every build
carry `release: aa82f8f7…` (the git SHA of this checkout, injected by the plugin) and `environment: production` although
neither appears in any snippet.

`static-default` (Astro's default `output`, no `output` option, only `test.astro` and `api/test-error.js`): exit 1.
During "prerendering static routes" Astro executes the verify endpoint and the docs' own error kills the build:
`[ERROR] [build] Caught error rendering /api/test-error: Error: Sentry Example API Route Error` (build-static-default.log:21-29).
The server SDK initialised inside the prerender process (46 `Integration installed` lines in the same log).

### Client, base variant (`results-base.json`, `verdict.status: works`)

- Boot on `/test`: `Sentry.getClient()` present, `sdk.name: sentry.javascript.astro`, `10.67.0`, packages
  `npm:@sentry/astro` + `npm:@sentry/browser`; 16 integrations: `EventFilters FunctionToString ConversationId
  BrowserApiErrors Breadcrumbs GlobalHandlers LinkedErrors Dedupe HttpContext CultureContext BrowserSession
  BrowserTracing Replay Feedback SpanStreaming WebVitals`; the feedback widget button is in the DOM. The server
  injected `<meta name="sentry-trace">`, `<meta name="baggage">` and `<meta name="sentry-route-name" content="%2Ftest">`.
- Click `#one`: `event` via `/tunnel` in 2 ms, `Error: Sentry Example Frontend Error`, mechanism
  `auto.browser.browserapierrors.addEventListener`, `handled: false`, `transaction: /test`, top frame
  `HTMLButtonElement.n` in `http://127.0.0.1:4757/test` (inlined page script, minified). A `session` item follows with
  `status: unhandled, errors: 1`.
- Click `#two`: the browser fetch gets a 500, no client event (correct); the **server** sends `Error: Sentry Example API
  Route Error`, mechanism `auto.middleware.astro`, `handled: false`, `transaction: GET /api/test-error`,
  `request.headers` carrying the browser's `sentry-trace` and `baggage`, `user.ip_address: 127.0.0.1`, plus a server
  `session` with `status: crashed`. Same trace id as the client pageload (`8ea021d8…`).
- Pageload segment `/test`: `op: pageload`, `is_segment`, source `route`, origin `auto.pageload.astro`, parent span id =
  the server's `sentry-trace` meta (the page continues the server trace), status `error` (the `http.client GET
  127.0.0.1` child got the 500). Children: `browser.*` timings, `resource.script` x4, `browser.paint` x2,
  `ui.interaction.click`, `ui.webvital.lcp`, `ui.webvital.cls`.
- `/test-tracing`, click `#one`: a `test` span named `Example Frontend Span` (origin `manual`) arrives as a child of the
  `/test-tracing` pageload, with the `http.client` child and a second server `GET /api/test-error` error event.
- `/users/42`: server segment `GET /users/[id]` (`http.server`, source `route`, `http.route: /users/[id]`,
  `url.path: /users/42`), client pageload named `/users/[id]` (source `route`, from the meta tag). The full-load link
  to `/users/43` produced a second `/users/[id]` pageload and, correctly, no `navigation` span.
- Sentinel: `sentinel` event and `sentinel-span` segment (source `custom`) in 631 ms. No wait hit its deadline.
- Envelope item types over the run: `span` (14 envelopes, client and server), `event` (4), `session` (7). **No
  `transaction` item anywhere**, on either side. No `replay_event` (buffer mode, `minReplayDuration` 5 s, each page
  lived about 1.5 s), no `log` item (the Astro snippets have no logs option), no `client_report` on the client.
- Browser console: the 16 `Integration installed` lines, `[Tracing] Using route name from Sentry HTML meta-tag: /test`,
  `Starting sampled root span op: pageload name: /test parent ID: bc7af9ab…`, `[Replay] Starting replay in buffer
  mode`; page errors: `Sentry Example Frontend Error` (the uncaught click error, expected).

### Client, view transitions (`results-view-transitions.json`, `works`)

- `/vt/` pageload named `/vt` (route, meta tag).
- Click to `/vt/users/7`: a client-side navigation. Segment `op: navigation`, **name `Navigation`**, source `url`, origin
  `auto.navigation.browser`, `url.path: /vt/users/7`, arrived 1.4 s after the click. The swapped document carries
  `sentry-route-name=/vt/users/[id]` (read from the DOM after the navigation) but the span does not use it. The second
  navigation (`/vt/users/8`) is the same, with `previous_trace` links logged between the three traces.
- The ClientRouter's document fetches show up on the server as `GET /vt/users/[id]` segments in the navigation's trace
  (`83dd54c5…` shared by `Navigation` and `GET /vt/users/[id]`); prefetching produced extra server requests
  (`/vt/users/8` twice, `/vt/users/9`). When no navigation span is active, the document fetch becomes its own client
  segment `GET 127.0.0.1` (`http.client`).
- Sentinel in 619 ms, 16 items (`span` 13, `session` 2, `event` 1), no `transaction`.

### Server (`results-server.json`, `works`; `results-server-middleware.json`, `works`)

| Step | Response | What arrived via `/api/1/envelope/` |
| --- | --- | --- |
| `GET /users/42` | 200, HTML with `sentry-trace`, `baggage` (`sentry-transaction=GET /users/[id]`), `sentry-route-name=/users/[id]` metas | segment `GET /users/[id]`, `http.server`, source `route`, origin `auto.http.astro`, status `ok`, `http.response.status_code: 200` |
| `GET /api/test-error` | 500, empty body | `event` `Error: Sentry Example API Route Error`, mechanism `auto.middleware.astro`, `handled: false`, `transaction: GET /api/test-error`, `user.ip_address: 127.0.0.1`; segment `GET /api/test-error` status `error`; `session` `crashed` |
| `GET /ssr-throw` | 500 | `event` `Error: Sentry Example SSR Page Error`, same shape, `transaction: GET /ssr-throw` |
| `GET /fetch-recorder` | 200 | the server-side `fetch` reached the recorder **with** `sentry-trace: ed99c6aa…-a19fe37f…-1` and `baggage` (`sentry-transaction=GET /fetch-recorder`, release, environment); child span `http.client GET 127.0.0.1`, origin `auto.http.node_fetch` |
| `GET /users/42` with incoming `sentry-trace`/`baggage` | 200 | segment in the incoming trace (`aaaa…`), and the injected metas carry that trace id plus the incoming `sentry-environment=qs` |
| `GET /api/sentinel` | 200 | `sentinel-server` event (`generic`, handled) and `sentinel-server-span` child of the `GET /api/sentinel` segment, both in 631 ms |

Also sent: one `sessions` aggregate (`exited: 3, crashed: 2`) and one `client_report` (`ignored`, category `span`,
quantity 5). Server console: 46 `Integration installed` lines (`EventFilters FunctionToString LinkedErrors RequestData
NodeSystemError ConversationId Console Http NodeFetch OnUncaughtException OnUnhandledRejection ContextLines
LocalVariablesAsync Context ChildProcess WorkerThreads ProcessSession Modules Express Fastify Hapi Koa Graphql Mongo
Mongoose Mysql Mysql2 Redis Postgres Prisma Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph Mastra
VercelAI OpenAI Anthropic_AI Google_GenAI PostgresJs Firebase SpanStreaming`), `Captured error event ...` per error and
Astro's own `[ERROR] Error: Sentry Example API Route Error` with the `dist/server/chunks/test-error_*.mjs` frame.

The `middleware` build (`src/middleware.ts` = apis.mdx:1493-1503, `autoInstrumentation: { requestHandler: false }`;
`dist-middleware/server/virtual_astro_middleware.mjs` contains the user middleware and not `@sentry/astro/middleware`)
produced the **same** names, mechanisms, origins and `user.ip_address` as the automatic build. Without any
`src/middleware.ts`, the base build's `virtual_astro_middleware.mjs` imports `@sentry/astro/middleware`, so no
middleware file is needed on Astro 7. Both hold.

## Findings

| # | Severity | Kind | Docs | Claim | Observed | Docs-side fix |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | P1 | docs wrong | `getting-started-complete/javascript.astro.mdx:480-491` (with index.mdx:17 "Your application up and running") | Create `src/pages/api/test-error.(js|ts)` whose `GET` throws, open the test page, click the buttons | On Astro's default output (`static`, what `npm create astro` gives) the endpoint is prerendered and `astro build` fails with `Caught error rendering /api/test-error: Error: Sentry Example API Route Error` (`results-build-static-default.json`); the page never says the route, or the app, must be server-rendered | Add that the verify endpoint needs on-demand rendering: `export const prerender = false;` in `test-error.js`, or `output: "server"` plus an adapter |
| 2 | P2 | docs wrong | `configuration/apis.mdx:1481` | `trackClientIp` "Defaults to `false`" | `server/middleware.d.ts:13` says `@default dataCollection.userInfo (true unless disabled)`; every server error event of the automatic run, which calls `handleRequest()` with no options, carries `user.ip_address: 127.0.0.1` | State that the default follows `dataCollection.userInfo` (on unless disabled) and how to turn it off |
| 3 | P2 | docs wrong | `guides/astro/index.mdx:18`, `getting-started-complete/javascript.astro.mdx:299-303`, `apis.mdx:1464-1466` | Astro `3.0.0` or above; below `3.5.2` add the middleware manually | The tarball's peer is `astro: >=4.0.0-beta || >=7.0.0-beta` and `v10-to-v11/index.mdx:96` says the minimum is 4; on Astro 7 no middleware file is needed | Say Astro 4+ and drop the `<3.5.2` alert and the 3.5.2 sentences |
| 4 | P2 | SDK limit | `tracing/instrumentation/automatic-instrumentation.mdx:41-63`, `performance/automatic-instrumentation-intro/javascript.astro.mdx:1-2` | `BrowserTracing` instruments the browser automatically; nothing is said about span names | Pageloads are named by the parameterized route (`/users/[id]`, source `route`), but client-side navigations under `<ClientRouter />` are named `Navigation` (source `url`, the URL only in `url.path`) although the swapped document carries `sentry-route-name` | Document the two naming rules (route for pageload, `Navigation` for view-transition navigations) so users know what to expect in the trace list |
| 5 | P2 | SDK limit | `sourcemaps/overview/javascript.astro.mdx:36-39` | The integration finds source maps "depending on your `outDir`, `rootDir` and `adapter` configuration" | The upload glob follows `outDir`, the default `sourcemaps.filesToDeleteAfterUpload` does not (`./dist/**/{client,server}/**/*.map`): `dist/` ends with 0 `.map` files, `dist-middleware/` keeps 27 hidden maps that get deployed with the app | Document the default delete glob and tell users with a custom `outDir` to set `sourcemaps.filesToDeleteAfterUpload` |
| 6 | P2 | docs gap | `getting-started-complete/javascript.astro.mdx:349-421` | Add `org`, `project`, `authToken: process.env.SENTRY_AUTH_TOKEN` and set the env var | With the token unset the build prints only the plugin's two warnings, still generates hidden maps, deletes them, and still injects a `release` (git SHA) into every event while saying "Will not create release" | Say what a missing token does (warn, no upload, maps deleted, release still injected), so a user reading a green build does not assume maps went up |
| 7 | P2 | docs gap | `getting-started-complete/javascript.astro.mdx:437-548` | "View Captured Data", "create a custom span" | Spans arrive as `span` envelope items on both sides (client segments `pageload`/`navigation`/custom, server segments `http.server`), never as `transaction` items; the page's text does not say where custom spans show up (`Example Frontend Span` is a child of the pageload segment, not its own trace) | One sentence that the custom span appears inside the page's trace under the pageload, and that the server request shows up as `GET /api/test-error` |

## Notes

- `manual-setup.mdx` for Astro does not exist in this docs checkout; the run used `guides/astro/index.mdx` and the
  `getting-started-complete` include it renders. The Bun, Deno and Cloudflare Astro runs live in the cells.
- The middleware claim holds on Astro 7: automatic instrumentation via the auto-added `@sentry/astro/middleware`, and
  the manual `Sentry.handleRequest()` route with `autoInstrumentation.requestHandler: false` gives identical output.
- Client-to-server trace continuation works through the injected meta tags (pageload parent = server span) and through
  the browser's `sentry-trace` request header (the API route error and the server segment share the pageload's trace
  id); server-side `fetch` propagates `sentry-trace` and `baggage` (origin `auto.http.node_fetch`); an incoming
  `sentry-trace`/`baggage` pair is continued.
- Session Replay is configured by the snippet (buffer mode was started) but no `replay_event` was observed within the
  short runs; that is the 5 s `minReplayDuration`, not a docs error.
- Every Vite pass repeats the two plugin warnings, so a build prints them three times.
- Leftovers on disk: `dist/`, `dist-middleware/`, `dist-removed-option/`, the partial `dist-static-default/`,
  `node_modules/`, the `build-*.log`, `server-*.log`, `sink-*.log` files.

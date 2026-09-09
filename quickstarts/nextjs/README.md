# QS-nextjs, the Next.js manual-setup path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/nextjs` pulls
13 more `@sentry/*` packages (`browser browser-utils bundler-plugins core feedback node opentelemetry react
replay replay-canvas server-runtime-injection server-utils vercel-edge`) plus `@sentry/conventions@^0.20.0`,
and declares the peer `next: ^14.0 || ^15.0.0-rc.0 || ^16.0.0-0`.

Next.js `16.3.4` (what `npm install next` resolves to; the page targets "Next.js 15+ with Turbopack", and
Next 16 builds with Turbopack by default), `react` and `react-dom` `19.2.8`, `typescript` `5.9.3` (pinned to
5.x, the registry's latest is 7.0.2), `@types/*` from the registry. Node `v26.5.0`, npm `11.17.0`, macOS 15.7
(Darwin 24.6.0). Google Chrome 153 driven by `playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome',
headless: true })`, no browser download). `next build` in production configuration, `next start -p 4751`,
envelope sink on `localhost:4750`. `NEXT_TELEMETRY_DISABLED=1`. The Bun and Cloudflare runs of Next.js live in
the cells; this is the Node run.

## What it reproduces

A new user following the App Router page `docs/platforms/javascript/guides/nextjs/manual-setup/index.mdx`
end to end (install, `next.config.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`,
`sentry.edge.config.ts`, `instrumentation.ts` with `register` and `onRequestError`, `app/global-error.tsx`,
the Server Action snippet, the tunnel step, the verify button, the tracing and logs verify snippets), plus the
Pages Router page `manual-setup/pages-router.mdx` (its Turbopack `next.config.ts` tab, `sentry.client.config.ts`,
`pages/_error.tsx` and its verify button). The page's frontmatter carries `sdk: sentry.javascript.nextjs`
(index.mdx:5). Note the App Router page calls the client file `instrumentation-client.ts`
(index.mdx:116, 128), not `sentry.client.config.ts`; only the Pages Router page uses the latter
(pages-router.mdx:140, 152).

Where each rendered include really comes from (`javascript.nextjs.mdx`, else `javascript.mdx`, else
`_default.mdx`):

| Reference | Renders from |
| --- | --- |
| index.mdx:23, pages-router.mdx:17 `getting-started-prerequisites` | `platform-includes/getting-started-prerequisites/javascript.nextjs.mdx:1-6` |
| index.mdx:249 `getting-started-capture-errors/nextjs/app-router-global-error` | `platform-includes/getting-started-capture-errors/nextjs/app-router-global-error/javascript.nextjs.mdx:1-29` (tsx tab), `:31-52` (jsx tab) |
| pages-router.mdx:230 `getting-started-capture-errors/nextjs/pages-router-error` | `platform-includes/getting-started-capture-errors/nextjs/pages-router-error/javascript.nextjs.mdx:1-21` (tsx), `:23-41` (jsx) |
| index.mdx:363, pages-router.mdx:273 `getting-started-data-collection` | `platform-includes/getting-started-data-collection/javascript.mdx:1-29` (not run) |
| index.mdx:378 `getting-started-browser-sandbox-warning` | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |

Snippets copied verbatim (placeholders filled, DSN through the env vars the Tip at index.mdx:120-123 allows):
install (index.mdx:59), `next.config.ts` (index.mdx:89-104 plus the tunnel option from 349-354),
`instrumentation-client.ts` (index.mdx:128-163, all product options), `sentry.server.config.ts`
(index.mdx:165-178), `sentry.edge.config.ts` (index.mdx:180-193), `instrumentation.ts` (index.mdx:219-234),
`app/global-error.tsx` (include above), `app/actions.ts` (index.mdx:264-284), the verify button
(index.mdx:383-392, "Break the world"), the tracing snippet (index.mdx:467-477), the logs snippet
(index.mdx:504-516), `pages/_error.tsx` (include above), the Pages Router verify button
(pages-router.mdx:291-304, "Throw Test Error"), `sentry.client.config.ts` (pages-router.mdx:152-177).

Deviations, all marked in the files: `debug: true` and `tracesSampler: () => 1.0` were added to the client
and server init (the page's `tracesSampleRate` expression is `0.1` under `next build`, the run needs every
trace); `app/actions.ts` defines the `processForm` the snippet calls but never declares; the tracing snippet's
`fetchDataFromAPI` fetches `/api/hello`; the Pages Router verify page lives at `pages/pages-verify.tsx`
because `app/page.tsx` already serves `/`. Both variants are one hybrid app (`app/` plus `pages/`), which
the pages describe as supported (index.mdx:562-573).

Repro-only routes: `app/users/[id]/page.tsx` (parameterized server component), `app/server-throw/page.tsx`
(server component throws), `app/api/route-throw/route.ts` (route handler throws), `app/api/hello/route.ts`
(echoes the incoming `sentry-trace`), `app/api/fetch-recorder/route.ts` (server-side `fetch` to the sink's
`/recorder`), `app/api/sentinel/route.ts` (server sentinel: `captureMessage` plus a `startSpan`),
`app/api/meta/route.ts` (server SDK metadata), `pages/pages-ssr-throw.tsx` (`getServerSideProps` throws),
`pages/api/pages-hello.ts`, `pages/api/pages-throw.ts`. `instrumentation-client.ts` also exposes
`window.Sentry`, `window.__qsMeta()` and `window.__qsSentinel(name)`.

## Install

```bash
cd $REPRO/quickstarts/nextjs
npm install   # every @sentry/* pinned to a pack-develop-03aaf424 tarball, repeated in `overrides`
```

`added 106 packages in 22s`, no peer complaints. `node_modules/@sentry` holds all 14 packages at `10.67.0`
from `file:../../_toolbox/pack-develop-03aaf424/…` plus `@sentry/conventions@0.20.0` from the registry;
`package-lock.json` has no other registry-resolved `@sentry/*` entry.

Exports the snippets use, checked against `node_modules/@sentry/nextjs/build/types`:

- `withSentryConfig` exists only in `build/types/config/index.d.ts:1`, reached through the `./config`
  subpath (`package.json` `exports["./config"]`). `build/types/index.types.d.ts`, `index.server.d.ts` and
  `index.client.d.ts` do not export it. Every page imports it from `"@sentry/nextjs"` (index.mdx:91, 304,
  350; pages-router.mdx:84, 115, 250, 432); that import loads but yields `undefined`, see below.
- `init`, `captureRouterTransitionStart`, `captureRequestError`, `withServerActionInstrumentation`,
  `captureUnderscoreErrorException`, `captureException`, `captureMessage`, `startSpan`, `logger`,
  `replayIntegration`, `feedbackIntegration` all exist and none is `@deprecated`.
- The only `@deprecated` markers in the build options (`build/types/config/types.d.ts:130, 323, 329, 335`)
  are the webpack `reactComponentAnnotation` options; neither page uses them.

## Run

```bash
cd $REPRO/quickstarts/nextjs
./run.sh app-router build && ./run.sh app-router drive      # index.mdx, instrumentation-client.ts
CI=1 ./run.sh pages-router build && ./run.sh pages-router drive   # pages-router.mdx, sentry.client.config.ts
```

`build` copies the variant's client init file from `variants/`, removes the other one, runs `next build` and
writes `build-<variant>.log`. `drive` starts the sink (4750) and `next start -p 4751`, opens one headless
Chrome, clicks the verify buttons on `/`, triggers the client sentinel, waits for the pageload span, navigates
client-side to `/users/42`, fetches the throwing route handler and the Pages API routes, opens
`/server-throw`, `/pages-verify` (clicks "Throw Test Error") and `/pages-ssr-throw`, triggers the server
sentinel, goes back to `/` for a second client sentinel, waits for the replay envelope and writes
`results-<variant>.json` (`meta` for both sides, `steps`, `summary`, the browser `console`, `pageErrors`,
`serverLog`, `buildLog`, the compact sink `items` and the `raw` envelopes). Nothing sleeps: every wait is a
condition on the sink or the page, each sentinel has a 60 s deadline. The browser context aborts and counts
any request to `*.sentry.io`; the counter stayed at 0 in both runs. `CI=1` on the second build only turns
the page's `silent: !process.env.CI` off so the build plugin's messages show.

The `app-router` variant keeps the page's `tunnelRoute: "/sentry-tunnel"` working without leaving the
machine: the client DSN is SaaS-shaped (`https://public@o1.ingest.sentry.io/1`, the SDK only applies the
tunnel to such DSNs) and the build sets `_SENTRY_TUNNEL_DESTINATION_OVERRIDE=http://localhost:4750/tunnel`,
the undocumented override the SDK's own E2E tests use for the rewrite destination. The server DSN points
straight at the sink. The `pages-router` variant points the client DSN at the sink as well.

## Expected

- index.mdx:59 `npm install @sentry/nextjs --save`; index.mdx:84-104 `withSentryConfig` imported from
  `@sentry/nextjs`; index.mdx:114-118 three init files including `instrumentation-client.ts`.
- index.mdx:209 `instrumentation.ts` "imports your server and edge configurations and exports
  `onRequestError` to capture server-side errors"; index.mdx:232 "Capture errors from Server Components,
  middleware, and proxies".
- index.mdx:244 `global-error.tsx` captures "errors that occur anywhere in your App Router application".
- index.mdx:259 wrap Server Actions with `withServerActionInstrumentation()`.
- index.mdx:294 add `authToken` for source maps; index.mdx:328 tunneling "routing them through your Next.js
  server", 352 `tunnelRoute: "/sentry-tunnel"`.
- index.mdx:376 the button throws "Sentry Test Error", 401 "Open Issues in Sentry to see your test error".
- index.mdx:458 "Next.js routes and API calls are automatically instrumented", 462 "Navigate to any page,
  then check Traces"; index.mdx:495 "Logs are enabled by default".
- index.mdx:416-420 Session Replay, 534-536 the feedback widget "bottom-right corner".
- pages-router.mdx:73-77 "Pages Router applications typically use Webpack", 113-128 a Turbopack tab with
  the same `withSentryConfig` call, 140 `sentry.client.config.ts`, 223-225 `pages/_error.tsx` captures SSR
  errors through `getInitialProps`, 286-304 the "Throw Test Error" button.

## Observed

### `app-router` (`results-app-router.json`, `build-app-router.log`, `server-app-router.log`)

**Build.** With the page's `import { withSentryConfig } from "@sentry/nextjs"` (index.mdx:91) `next build`
stops at config load: `TypeError: (0 , _nextjs.withSentryConfig) is not a function`
(`build-app-router-docs-import.log`). With `@sentry/nextjs/config` the build passes: `Next.js 16.3.4
(Turbopack)`, `Experiments: clientTraceMetadata` (enabled by the SDK), `Running next.config.js provided
runAfterProductionCompile`, no other SDK output because `silent: !process.env.CI` is true on a laptop. Next
rewrote `tsconfig.json` (`jsx: react-jsx`, `.next/dev/types` include). The routes manifest carries the two
tunnel rewrites (`/sentry-tunnel(/?)` with `o`/`p` and `o`/`p`/`r` query matchers), the SDK's default
destination being `https://o:orgid.ingest.sentry.io/api/:projectid/envelope/?hsts=0`. Source maps: the
SDK sets `productionBrowserSourceMaps: true` and `sourcemaps.deleteSourcemapsAfterUpload: true` for Turbopack
builds; after the build `.next/static` holds zero `.map` files and the client chunks carry no
`sourceMappingURL`, `.next/server` keeps 23 maps. No auth token means no upload, and the local client maps
are gone anyway.

**Client.** `sdk.name` `sentry.javascript.nextjs` `10.67.0` (`packages`: `npm:@sentry/nextjs`,
`npm:@sentry/react`), integrations `EventFilters FunctionToString ConversationId BrowserApiErrors Breadcrumbs
GlobalHandlers LinkedErrors Dedupe HttpContext CultureContext BrowserSession BrowserTracing
NextjsClientStackFrameNormalization Replay Feedback`, `tracesSampleRate 0.1` (the page's expression under
`next build`), `environment production`, a git-sha `release` injected by the build plugin, the feedback
widget mounted (`#sentry-feedback`). `tunnelRoute` set `options.tunnel` to `/sentry-tunnel?o=1&p=1`; 19
POSTs to it returned 200 and every client envelope reached the sink through the rewrite. Debug output
shows `Integration installed: …`, `[Tracing] Starting sampled root span op: pageload name: /` and so on.

- "Break the world": `event` `Error: Sentry Test Error`, mechanism `auto.browser.global_handlers.onerror`,
  `handled: false`, `transaction: /`; also a `session` update `status: unhandled, errors: 1`.
- Tracing snippet: `span` items `function expensive-operation` (origin `manual`) with a child
  `http.client GET localhost` (the low-cardinality name; `url.full` carries `/api/hello`), inside the pageload
  trace. `/api/hello` received `sentry-trace` and `baggage` from the client (same trace id).
- Logs snippet: one `log` envelope with `info: User clicked checkout button`, `info: Order completed`,
  `warn: Warning message`, `error: Error occurred`, without any `enableLogs` option.
- Recorder: `/api/fetch-recorder`'s server-side `fetch` reached `/recorder?from=server` with `sentry-trace`
  and `baggage` carrying the browser's trace id (`sentry-transaction=/`, `sentry-replay_id`); the
  cross-origin client fetch to `/recorder?from=client-cross-origin` carried neither (default
  `tracePropagationTargets`, same-origin only).
- Server Action: `{"success":true,"data":{"name":"jane"}}` on the page; the sink got a
  `function serverAction/submitForm` segment (origin `auto.function.nextjs.server_action`, source `route`)
  next to the `http.server POST /` segment, both with the browser's trace id.
- `pageload` segment `/` (source `route`, origin `auto.pageload.nextjs.app_router_instrumentation`,
  `url.template /`, status `error` with `internal_error` because the test error was thrown while it was
  open), with the usual `browser.*`, `resource.*`, `ui.long_animation_frame` children. `/` is prerendered
  (`○` in the build table), its HTML has no `sentry-trace` meta tag, so the pageload trace starts in the
  browser; the dynamic `/server-throw` and `/_error` pageloads had a parent (`parent ID` in the debug log)
  and share their trace id with the server events.
- Client-side `Link` to `/users/42`: `navigation` segment named `/users/:id` (source `route`,
  `url.template /users/:id`, `sentry.previous_trace` set) while the server names the same request
  `http.server GET /users/[id]` (`http.route /users/[id]`).
- `/server-throw`: server `event` `Error: Server component throw`, mechanism
  `auto.function.nextjs.on_request_error`, `transaction: GET /server-throw`; the browser rendered Next's
  "Application error: a client-side exception has occurred" and `global-error.tsx` captured
  `Error: Minified React error #441; visit https://react.dev/errors/441 …` (mechanism `generic`,
  `handled: true`, same trace id as the server event), which is what a production build hands the client.
- Session Replay: `replay_event` plus `replay_recording` arrived after the errors (debug log: `[Replay]
  Starting replay in session mode`), `replayId` tag on the events.
- Both client sentinels (`sentinel`, `sentinel-2`, each a `captureMessage` plus a `test` span) arrived.

**Server.** `sdk.name` `sentry.javascript.nextjs` `10.67.0` (`packages`: `npm:@sentry/nextjs`,
`npm:@sentry/node`), 48 integrations (`EventFilters FunctionToString LinkedErrors RequestData
NodeSystemError ConversationId Console NodeFetch OnUncaughtException OnUnhandledRejection ContextLines
LocalVariablesAsync Context ChildProcess WorkerThreads ProcessSession Modules Express Fastify Hapi Koa Graphql
Mongo Mongoose Mysql Mysql2 Redis Postgres Prisma Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain
LangGraph Mastra VercelAI OpenAI Anthropic_AI Google_GenAI PostgresJs Firebase Http DistDirRewriteFrames
SpanStreaming`), `nextRuntime nodejs`. Startup lines: `Initializing SDK...`, `Registered diagnostics-channel
injection via Module.registerHooks()`, 30 `[instrumentation:<pkg>] not injected yet, waiting for the module
to load` lines, `SDK initialized from CommonJS`, `[Sentry] Runtime hook registered, injected libraries=[]`,
`[Sentry] Bundler plugin did not run`, `SDK successfully initialized`.

- Lifecycle spans arrive as `span` envelope items (`sentry.trace_lifecycle: stream`), never as
  `transaction`. Segments: `http.server GET /`, `GET /users/[id]`, `GET /api/hello`,
  `GET /api/fetch-recorder`, `GET /api/route-throw` (status `error`), `GET /api/pages-hello`,
  `GET /api/pages-throw`, `GET /server-throw`, `GET /pages-verify`, `GET /pages-ssr-throw`, `POST /`, all
  source `route`, origin `auto`. Children are Next's own OpenTelemetry spans passed through without an op
  (`resolve page components`, `start response`, `build component tree`, `executing api route (app)
  /api/hello`, `resolve page server component "/users/[id]"` with op `function`), plus `http.client GET
  localhost` (origin `auto.http.node_fetch`) for the recorder fetch. Four `client_report` items discard
  spans with reason `no_parent_span` (3, 3, 12, 2).
- Errors: `Route handler throw` (`GET /api/route-throw`), `Pages API throw` (`GET /api/pages-throw`),
  `Server component throw`, `Pages SSR throw` (`GET /pages-ssr-throw`), every one with mechanism
  `auto.function.nextjs.on_request_error`, `handled: false`, `tags.turbopack: true`, top frame under
  `app:///_next/server/chunks/ssr/…`. `pages/_error.tsx` produced no event of its own:
  `captureUnderscoreErrorException` skips errors already captured, and `onRequestError` got there first.
- Sessions: one server `session` with `status: crashed, errors: 1` plus `sessions` aggregates. The server
  sentinel (`sentinel-server` event plus `sentinel-server-span`) arrived.

### `pages-router` (`results-pages-router.json`, `build-pages-router.log`, `server-pages-router.log`)

The same app built with `sentry.client.config.ts` (pages-router.mdx:140, 152) instead of
`instrumentation-client.ts`. The build passes; with `CI=1` the build plugin prints `Sending telemetry data on
issues and performance to Sentry. To disable telemetry, set options.telemetry to false`, `No auth token
provided. Will not create release` and `No auth token provided. Will not upload source maps`. Nothing
mentions `sentry.client.config.ts`: the deprecation warning that names it lives in the SDK's webpack path
only. Result: no client chunk contains the SDK (`grep -l sentry.javascript.nextjs .next/static/chunks/*.js`
is empty), `window.Sentry` never appears, "Throw Test Error" on `/pages-verify` throws (page error recorded)
and nothing reaches the sink from the browser: no event, no pageload, no replay, no log. The server side is
identical to the App Router run (31 sink items, all `server:*`, the same five error events with
`auto.function.nextjs.on_request_error`, the server sentinel arrived), because `instrumentation.ts` from the
App Router page was still present. `pages-router.mdx` itself has no `instrumentation.ts`, `register` or
`onRequestError` step (grep over the page), so a user following only that page never loads the
`sentry.server.config.ts` it tells them to create.

## Findings

1. **P0, docs wrong.** index.mdx:91 (also 304, 350; pages-router.mdx:84, 115, 250, 432) import
   `withSentryConfig` from `"@sentry/nextjs"`. On develop the package's main entry does not export it (only
   `@sentry/nextjs/config` does, `build/types/config/index.d.ts:1`), and `next build` fails at
   `Failed to load next.config.ts … TypeError: (0 , _nextjs.withSentryConfig) is not a function`.
   Fix: import from `@sentry/nextjs/config` in every `next.config.ts` snippet, with a version note.
2. **P0, docs wrong.** pages-router.mdx:113-128 (Turbopack tab) plus 138-152 tell a Turbopack user to
   create `sentry.client.config.ts`. Under Next 16 (Turbopack) the file is never bundled: no SDK in the client
   chunks, no client events, no warning at build time. The SDK's own warning text ("When using Turbopack
   `sentry.client.config` will no longer work") only prints in webpack builds. Fix: use
   `instrumentation-client.ts` on the Pages Router page (Next 15.3+), keep `sentry.client.config.ts` for the
   webpack tab only.
3. **P1, docs wrong.** pages-router.mdx has no `instrumentation.ts` step: it lists
   `sentry.server.config.ts` and `sentry.edge.config.ts` (140-142, 179-207) but never says that Next only
   loads them through `register()` in `instrumentation.ts`, and it never mentions `onRequestError`, which in
   this run is what captured every server-side error, the Pages API route and `getServerSideProps` ones
   included. Fix: add the `instrumentation.ts` step from index.mdx:219-234 to the Pages Router page.
4. **P1, docs wrong.** pages-router.mdx:223-225 says `pages/_error.tsx` "captures errors that occur during
   server-side rendering". With `onRequestError` in place the SSR error arrived once, via
   `auto.function.nextjs.on_request_error`; `captureUnderscoreErrorException` skipped it as already
   captured. The snippet is not wrong, but the page attributes the capture to the wrong hook and leaves
   `onRequestError` out entirely. Fix: describe `_error.tsx` as the fallback for client-side Pages Router
   errors and point at `instrumentation.ts` for SSR.
5. **P2, docs wrong.** index.mdx:244 says `global-error.tsx` captures "errors that occur anywhere in your
   App Router application". For a server component error a production build hands the client only
   `Minified React error #441`; the real `Server component throw` arrives through `onRequestError`. Fix: say
   `global-error.tsx` reports the client-side render error and that server errors come from
   `onRequestError`.
6. **P2, docs wrong.** index.mdx:328 describes tunneling as "routing them through your Next.js server"
   without saying the SDK only applies `tunnelRoute` to a `oNNN.ingest[.region].sentry.io` DSN
   (`client/tunnelRoute.ts`, debug warning `Provided DSN is not a Sentry SaaS DSN. Will not tunnel events.`)
   and that the rewrite destination is fixed to `https://o:orgid.ingest.sentry.io/…`. Self-hosted users
   configure the route and get no tunnel. Fix: one sentence on the SaaS-only behaviour and the `tunnel`
   init option for self-hosted.
7. **P2, docs wrong.** index.mdx:292-314 (source maps) does not say what happens without `authToken`: the
   Turbopack path enables `productionBrowserSourceMaps` and deletes the client maps after the (skipped)
   upload, so a local `next build` ends with no client maps and no upload, and with `silent: !process.env.CI`
   (index.mdx:102) the plugin's "No auth token provided" warnings are hidden on a laptop. Fix: state the
   generate-then-delete default, name `sourcemaps.deleteSourcemapsAfterUpload` and `sourcemaps.disable`.
8. **P2, docs wrong.** index.mdx:264-284 (`app/actions.ts`) calls `processForm(formData)` without
   declaring it, so the file cannot be used as printed; this run had to add a stub before building (the
   file was not built without it). Fix: declare a stub or comment the call out.
9. **P2, docs wrong.** index.mdx:456-462 (Tracing verify) does not mention that the page's
   `tracesSampleRate` expression (index.mdx:138, 175) is `0.1` under `next build` / `next start`, so the
   "navigate to any page, then check Traces" verify step only shows a trace for one request in ten outside
   `next dev`. Fix: say the verify step assumes `next dev`, or sample at `1.0` while verifying.
10. **P2, SDK limit.** The client names the parameterized navigation `/users/:id` (`url.template
    /users/:id`) while the server names the same route `GET /users/[id]` (`http.route /users/[id]`); the
    docs promise nothing about names, but a user correlating both sides sees two spellings.
11. **P2, SDK limit.** `withServerActionInstrumentation` produced a `function serverAction/submitForm`
    segment (`is_segment: true`) beside the `http.server POST /` segment of the same request and trace,
    rather than a child span of it.
12. **P2, SDK limit.** The build plugin sends its own telemetry to Sentry SaaS whenever `options.url` is
    the default (`@sentry/bundler-plugins` `allowedToSendTelemetry`), auth token or not, and says so only
    when `silent` is false. Neither page sets or mentions `telemetry: false`. This is the one thing in this
    run that may have left the machine (both builds; not captured, inferred from the plugin code and its
    message).

## Notes

- Neither page names the span envelope shape; the build streams every lifecycle span as a `span` item
  (`sentry.trace_lifecycle: stream`) on both sides and never sends a `transaction` item. The pages'
  "Traces" wording is compatible with that.
- `sentry.edge.config.ts` (index.mdx:180-193) was written but never exercised: no route in this app runs on
  the edge runtime.
- The `_SENTRY_TUNNEL_DESTINATION_OVERRIDE` build-time variable and the SaaS-shaped client DSN exist only to
  keep the page's `tunnelRoute` local; a user with a self-hosted or local DSN sees the "Will not tunnel
  events" path from finding 6.
- `results-*.json` had the repository path replaced with `$REPRO` and the machine hostname with `<host>`.
- Leftovers: `node_modules/`, `.next/` (last built for `pages-router`), `next-env.d.ts`, `tsconfig.json` as
  rewritten by Next, `sentry.client.config.ts` (the active client file of the last variant; `run.sh` swaps it
  with `instrumentation-client.ts` from `variants/`).

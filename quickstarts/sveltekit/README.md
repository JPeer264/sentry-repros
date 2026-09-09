# QS-sveltekit, the SvelteKit manual-setup path (Node, adapter-node), against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/sveltekit`
pulls `@sentry/svelte` (browser), `@sentry/node`, `@sentry/cloudflare`, `@sentry/bundler-plugins`,
`@sentry/server-utils`, `@sentry/server-runtime-injection`, `@sentry/core` and their transitives, 14
SDK packages in total, plus `@sentry/conventions@^0.20.0`; peers `@sveltejs/kit: 2.x || ^3.0.0-0`,
`vite: *`.

Google Chrome 153.0.8010.37 driven by `playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome',
headless: true })`, no browser download), node v26.5.0, npm 11.17.0, macOS 15.7.7. `@sveltejs/kit`
2.70.3, `@sveltejs/adapter-node` 5.5.7, `svelte` 5.57.0, `vite` 7.3.2, `@sveltejs/vite-plugin-svelte`
6.2.4 from the registry (the page names SvelteKit `2.0.0+`, recommends `2.31.0+`, and Vite `4.2+`;
kit 2.70 needs vite `^5 || ^6 || ^7 || ^8`, this is the combination the SDK's own `sveltekit-2-otlp`
e2e app pins). The client sends every envelope to a local sink via the `tunnel` option, the server via
a DSN whose host is the sink; nothing leaves the machine. The wizard path is out of scope; the Bun,
Deno and Cloudflare SvelteKit runs live in the cells.

## What it reproduces

A new user following `docs/platforms/javascript/guides/sveltekit/manual-setup.mdx` end to end. That
page is two includes (manual-setup.mdx:7 and :9); everything below cites the include that renders.
There is no `config.yml` in `guides/sveltekit/`, so includes resolve as `javascript.sveltekit`, then
`javascript`, then `_default`.

| Reference | Renders from |
| --- | --- |
| manual-setup.mdx:7 `sentry-init/manual-setup-callout` | `platform-includes/sentry-init/manual-setup-callout/javascript.sveltekit.mdx:1-5`, an info alert pointing to the wizard |
| manual-setup.mdx:9 `getting-started-complete` | `platform-includes/getting-started-complete/javascript.sveltekit.mdx:1-651`, the whole page (cited as `:N` below) |
| `:76` `<Include name="quick-start-features-expandable" />` | `includes/quick-start-features-expandable.mdx:20-27` (issues, tracing, sessionReplay, logs, userFeedback) |
| `:441` `<Include name="vite-loadenv-hint-splitlayout.mdx" />` | `includes/vite-loadenv-hint-splitlayout.mdx` (its snippet calls `sentryVitePlugin`, not `sentrySvelteKit`) |
| `:479` `getting-started-tunneling` | `platform-includes/getting-started-tunneling/javascript.sveltekit.mdx:1-23`, `tunnel: "/tunnel"` in `hooks.client` |
| `:485` `getting-started-data-collection` | `platform-includes/getting-started-data-collection/javascript.mdx` (read only) |
| `:504` `getting-started-browser-sandbox-warning` | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx` |
| `:592` `logs/javascript-quick-start-verify-logs-splitlayout` | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13-24`, only under a `logs` onboarding option that `:60-67` does not offer, so it never renders |
| `:607` `quick-start-locate-data-expandable` | `includes/quick-start-locate-data-expandable.mdx` |
| `:23-29, :33-52, :69-78, :179-189, :231-347, :378-387, :443-481, :600-649` | `PlatformSection` blocks; on `javascript.sveltekit` the `notSupported={["javascript.cloudflare"]}` branches render and the Cloudflare ones (`initCloudflareSentryHandle`, `:310-343`) do not |

Snippets copied verbatim (file:line in the include): install `:95`, `src/hooks.client.ts` `:126-171`
(all four onboarding options), `svelte.config.js` "SvelteKit 2" tab `:201-218`,
`src/instrumentation.server.ts` `:242-258`, `src/hooks.server.ts` `:272-286`, `vite.config.ts`
`:363-372`, the issues verify page `:510-518` (served at `/sentry-example-plain` so both verify
snippets can coexist), the tracing verify route `:536-540` and page `:561-582` (both at
`/sentry-example`). Read only: source maps `:389-439`, adapter override `:456-469`, data collection.
Repro additions, all marked in the files: `adapter: adapter()` in `svelte.config.js` (the snippet has
no adapter), `debug: true` and the sink DSN/`tunnel` in both inits, the `window.__qs*` hooks for the
driver, and these repro-only routes:

| Route | What it does |
| --- | --- |
| `/users/[id]` | `+page.server.ts` load and `+page.ts` universal load, reached by a client-side navigation |
| `/load-throws` | `+page.server.ts` load throws `Sentry Example Load Error` |
| `/server-fetch` | `+server.ts` fetches the sink's `/recorder` once with the global `fetch` and once with `event.fetch` |
| `/api/echo` | `+server.ts` returns the `sentry-trace` and `baggage` headers it received |
| `/sentinel?name=` | `+server.ts`: `captureMessage(name)` plus a `name-span` span |
| `/nope` | no route, to see what an unknown route produces |

## Install

```bash
cd $REPRO/quickstarts/sveltekit
npm install   # package.json pins the 14 develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz
              # and repeats them in `overrides`; `prepare` runs `svelte-kit sync` like a scaffolded project
```

`added 132 packages in 29s`. `node_modules/@sentry`: `browser browser-utils bundler-plugins cloudflare
conventions core feedback node opentelemetry replay replay-canvas server-runtime-injection
server-utils svelte sveltekit`, all `10.67.0` from the tarballs; the only registry-resolved `@sentry/*`
entry in `package-lock.json` is `@sentry/conventions@0.20.0`. npm 11 skipped esbuild's optional
postinstall (`allow-scripts` notice); the platform binary is installed and works.

### Exports the snippets use, checked in `node_modules/@sentry/sveltekit/build/types`

| Export | Status on develop |
| --- | --- |
| `sentrySvelteKit` from `@sentry/sveltekit` (`:365`, `:403`, `:458`) | **missing from the root.** `build/types/index.types.d.ts` re-exports `./client`, `./server`, `./worker` only; the runtime `build/esm/index.server.js` and `index.client.js` contain no `sentrySvelteKit`. It lives in the `./vite` subpath (`package.json` exports: `.`, `./vite`, `./browser-tracing-variant`; `build/types/vite/index.d.ts`), as the migration page says (`common/migration/v10-to-v11/index.mdx:1245-1252`) |
| `sentrySvelteKit(options?)` options (`build/types/vite/types.d.ts`) | `BuildTimeOptionsBase & { autoInstrument?: boolean \| { load?, serverLoad? }, adapter?: 'node' \| 'auto' \| 'vercel' \| 'other', autoUploadSourceMaps?: boolean }` |
| `init`, `handleErrorWithSentry`, `sentryHandle(options?)`, `wrapLoadWithSentry`, `wrapServerLoadWithSentry`, `wrapServerRouteWithSentry`, `initCloudflareSentryHandle`, `replayIntegration`, `feedbackIntegration`, `startSpan` | exist |
| `sentryHandle` options (`build/types/server-common/handle.d.ts`) | `handleUnknownRoutes?: boolean` (default false, "to reduce noise"), `injectFetchProxyScript?: boolean` (default true, only needed for Kit `< 2.16.0`) |
| `@deprecated` | none in `@sentry/sveltekit/build/types` |

## Run

```bash
cd $REPRO/quickstarts/sveltekit
./run.sh verbatim-import   # vite build with the page's import path (vite.config.verbatim.ts), build only -> results-verbatim-import.json
./run.sh base              # vite build with @sentry/sveltekit/vite, PORT=4755 node build, headless Chrome -> results-base.json
SKIP_BUILD=1 ./run.sh base # reuse build/
```

`base` starts the sink on `127.0.0.1:4754` and the adapter-node server on `127.0.0.1:4755` (both
checked free), opens `/sentry-example`, clicks the traced verify button, navigates client-side to
`/sentry-example-plain` (plain button), `/users/42` and `/load-throws`, fetches `/server-fetch`,
`/api/echo` and the cross-origin recorder from the page, GETs `/sentry-example` and `/nope` from node,
then fires the sentinel on both sides (`window.__qsSentinel('sentinel')` and `GET /sentinel`) and
polls the sink for the two `sentinel` messages and the two `sentinel-span` spans (hard deadline 60 s,
no sleeps), waits for the pageload segment, gives Replay one more error with a bounded wait, and writes
`results-<variant>.json` (`meta`, `steps`, `sentinel`, `summary`, `console` with the browser console,
the build log and the server log excerpts, the compact sink items and the raw envelopes). Machine
paths are replaced by `$REPRO`. Both processes and Chrome are killed at the end. The whole `base`
run took 8.5 s.

## Expected (what the page claims)

- `:7-8` SvelteKit `2.0.0+` (`2.31.0` recommended), Vite `4.2` or newer; `:95` `npm install @sentry/sveltekit --save`.
- `:112` init "in three places: the client side, the server side, and your Vite config".
- `:120, :126-171` `hooks.client.(js|ts)`: `Sentry.init` with `tracesSampleRate: 1.0`, `replayIntegration()`, `feedbackIntegration({ colorScheme: "system" })`, replay rates 0.1/1.0, and `export const handleError = Sentry.handleErrorWithSentry(myErrorHandler)`.
- `:181` "Requires SvelteKit 2.31.0 or higher and @sentry/sveltekit 10.8.0 or higher"; `:195-218` `kit.experimental.instrumentation.server: true` and `kit.experimental.tracing.server: true` in `svelte.config.js` (SvelteKit 2); `:220-226` SvelteKit 3 moves it into `sveltekit({ tracing: { server: true } })`.
- `:236, :242-258` `src/instrumentation.server.(js|ts)` with `Sentry.init({ dsn, tracesSampleRate: 1.0 })`.
- `:266, :272-286` `hooks.server.(js|ts)`: `handleErrorWithSentry(myErrorHandler)` and `export const handle = Sentry.sentryHandle()`, "or use `sequence` if you're using your own handler(s): `sequence(Sentry.sentryHandle(), yourHandler())`".
- `:357, :363-372` add `sentrySvelteKit` **before** `sveltekit` in `vite.config` "to automatically upload source maps to Sentry and instrument `load` functions for tracing if it's configured"; `import { sentrySvelteKit } from "@sentry/sveltekit"`.
- `:395-417` source maps need `org`, `project`, `authToken`; `:450` adapter auto-detection, `adapter` option to override.
- `getting-started-tunneling/javascript.sveltekit.mdx:5, :14-17` `tunnel: "/tunnel"` in `hooks.client`.
- `:497, :510-518` a `+page.svelte` button that throws creates an issue; `:530-540` a `+server.(js|ts)` that throws; `:548-555, :561-582` the updated button "triggers two errors: a frontend error, an error within the API route. Additionally, this starts a trace to measure the time it takes for the API request to complete".
- `:134-135` and `:250-251` "Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing" (the page's only mention of transactions).
- `configuration/build/index.mdx:69-71` (linked from `:621`): "SvelteKit doesn't yet offer a hook for universal or server-only `load` function calls. Therefore, the SDK uses a Vite plugin to auto-instrument `load` functions", enabled by default with `sentrySvelteKit()`.
- `common/migration/v10-to-v11/index.mdx:391` SvelteKit router spans are named `Router`; `:1245-1252` `sentrySvelteKit` moved to `@sentry/sveltekit/vite`.

## Observed on 2026-09-09

### Step 1, Install

Holds, see above. The page never says which Vite majors kit 2 accepts (kit 2.70 rejects Vite 4).

### Step 2, Configure Vite with the page's import (`verbatim-import`, P0)

`vite build --config vite.config.verbatim.ts` (`:363-372` verbatim) exits 1 before any bundling:

```
failed to load config from $REPRO/quickstarts/sveltekit/vite.config.verbatim.ts
SyntaxError: The requested module 'file://$REPRO/quickstarts/sveltekit/node_modules/@sentry/sveltekit/build/esm/index.server.js'
  does not provide an export named 'sentrySvelteKit'
```

(`results-verbatim-import.json`, `build-verbatim-import.log`). The same import is printed at `:403`
(source maps) and `:458` (adapter override) on this page and at `configuration/build/index.mdx:88,
111, 136`. With `import { sentrySvelteKit } from "@sentry/sveltekit/vite"` (`vite.config.ts`) the
build passes in 4.4 s. The rest of the page was run with that one-word change.

### Step 3, Build output (`base`)

`build-base.log`: `[sentry-vite-plugin] Info: Sending telemetry data on issues and performance to
Sentry. To disable telemetry, set options.telemetry to false` (printed twice, once per Vite
environment), `✓ 160 modules transformed` (client), `✓ 438 modules transformed` (server),
`.svelte-kit/output/server/instrumentation.server.js` and
`chunks/_sentry-inject-global-values-file.js` emitted, then `[sentry-vite-plugin] Warning: No auth
token provided. Will not create release` and `... Will not upload source maps`. No Kit warning.
`build/index.js` starts with `import './instrumentation.server.js'`, so with adapter-node the server
SDK initializes before the app (the `:15` claim). Without a token the plugin still injected the git
HEAD sha of the checkout as `release` (`aa82f8f7…` on every client and server envelope) and
`environment: production`; the page does not mention either.

### Step 4, Boot

Client: `sentry.javascript.sveltekit` `10.67.0`, packages `npm:@sentry/sveltekit`, `npm:@sentry/svelte`,
16 integrations `EventFilters FunctionToString ConversationId BrowserApiErrors Breadcrumbs
GlobalHandlers LinkedErrors Dedupe HttpContext CultureContext BrowserSession BrowserTracing Replay
Feedback SpanStreaming WebVitals`; the Feedback widget (`#sentry-feedback`) is on the page. Server:
`sentry.javascript.sveltekit` `10.67.0`, packages `npm:@sentry/sveltekit`, `npm:@sentry/node`, 48
integrations (the 46 of the Koa/Node runs plus `RewriteFrames` and `SvelteKitSpansEnhancement`). Server debug log: `Registered diagnostics-channel injection via
Module.registerHooks()`, `Initializing Sentry: process: …, thread: main`, one `Integration installed`
line each, `[instrumentation:<lib>] not injected yet, waiting for the module to load` for every
orchestrion target; no warning, no deprecation (`server-base.log`, 1139 lines, mostly the
`console.error(..., error, event)` dumps of the page's `myErrorHandler`).

`sentryHandle()` injected `<meta name="sentry-trace">` and `<meta name="baggage">` into the HTML
(`sentry-transaction=GET%20%2Fsentry-example`), so the client pageload joined the server trace. No
fetch proxy script was injected (`window._sentryFetchProxy` undefined, Kit 2.70 ≥ 2.16).

### Step 5, Verify

| Action | Sink |
| --- | --- |
| click "Throw error with trace" (`:561-582`) | server `event` `Error: Sentry Example API Route Error`, mechanism `auto.function.sveltekit.handle_error`, **`handled: true`**, `transaction: GET /sentry-example`; client `event` `Error: Sentry Example Frontend Error`, mechanism `auto.browser.global_handlers.onunhandledrejection`, `handled: false`, `transaction: /sentry-example`; both in trace `2ca7d840…` together with the client `pageload /sentry-example` segment (source `route`, origin `auto.pageload.sveltekit`, status `error`, children `test Example Frontend Span` status `error`, `http.client GET localhost` status `error` 500) and the server `http.server GET /sentry-example` segment (source `route`, origin `auto.http.sveltekit`, parent = the client's `http.client` span, child `function sveltekit.resolve` with `http.response.status_code: 500`). The "two errors plus a trace" claim (`:550-555`) holds |
| click "Throw error" (`:510-518`) after a client-side navigation | client `event` `Error: Sentry Example Frontend Error`, mechanism `auto.browser.browserapierrors.addEventListener`, `handled: false`, `transaction: /sentry-example-plain`; the client-side `handleError` hook did not run (0 `An error occurred on the client side` lines, expected: Kit only calls it for navigation and load errors). Both throws show as `pageerror` in Chrome |
| `#nav-user` to `/users/42` | client `navigation /users/[id]` segment (source `route`, `url.template: /users/[id]`, `sentry.sveltekit.navigation.type: link`, `sentry.previous_trace` set), children `router Router` (op `router`, origin `auto.ui.sveltekit`), `function /users/[id]` (origin `auto.function.sveltekit`, `code.function.name: load`, the universal load wrapped by the Vite plugin), `http.client GET localhost` for `__data.json`; server `http.server GET /users/[id]` segment in the same trace `bb7ea888…`, children `function sveltekit.load` (origin `auto.function.sveltekit.load`, `sveltekit.load.node_id: src/routes/users/[id]/+page.server.ts`, Kit's own span) and `function sveltekit.resolve`. No span with the plugin wrapper's origin `auto.function.sveltekit.server` |
| `#nav-load-throws` | server `event` `Error: Sentry Example Load Error`, `auto.function.sveltekit.handle_error`, `handled: true`, `transaction: GET /load-throws` (request `…/load-throws/__data.json`); server segment `GET /load-throws` with `function sveltekit.load` status `error`; the browser rendered Kit's `500 Internal Error` page; no client event |
| `/server-fetch` | both the global `fetch` and `event.fetch` reached the recorder with `sentry-trace` and `baggage` (`sentry-replay_id`, `sentry-transaction=%2Fload-throws`, the browser's current navigation), two `http.client GET 127.0.0.1` spans (origin `auto.http.node_fetch`) under the `GET /server-fetch` segment, in the browser's trace `d7d25694…` |
| `/api/echo` | the server received `sentry-trace` and `baggage` from the browser (same-origin fetch, default `tracePropagationTargets`) |
| cross-origin recorder from the page | no `sentry-trace`, no `baggage` (expected, not a propagation target) |
| node `GET /sentry-example` (`Accept: */*`) | HTTP 500, second server event, own trace; node `GET /nope` HTTP 404, no event (`handleErrorWithSentry` skips 4xx, `server-common/handleError.ts:118`), but a segment named **`sveltekit.handle.root`** (source `custom`, origin `manual`, `http.route: unknown`, child `function sveltekit.resolve` 404). The same segment was sent for Chrome's `/favicon.ico` request |
| sentinel | client `sentinel` + `test sentinel-span`, server `sentinel` (`transaction: GET /sentinel`) + `test sentinel-span` under `GET /sentinel`, all four within the deadline |
| Replay | `[Replay] Session duration (0s) is too short, not sending replay` at the first error, then `replay_event` + `replay_recording` after the extra error (`replaysOnErrorSampleRate: 1.0`, `minReplayDuration`); `sentry.replay_id` is on the client spans and in the baggage the server forwarded |
| sessions | client `session` `init` then `status: unhandled, errors: 1`; server one `session` item `status: ok, errors: 1` (`ProcessSession`) |

25 sink items in total: `client:session ×2, client:event ×5, client:span ×5, client:replay_event,
client:replay_recording, server:session, server:event ×4, server:span ×9`. **No `transaction`
item** and no `log` item was sent by either side; every span arrived as a `span` envelope item
(`sentry.trace_lifecycle: stream`). Server segments carry every request header as
`http.request.header.*`, `user.ip_address: 127.0.0.1`, and `http.url: https://localhost:4755/…` (adapter-node
defaults the protocol to `https` when `ORIGIN` is unset, so `request.url` on server events reads
`https://` although the server is plain HTTP).

## Findings

| # | Severity | Kind | Docs | Claim | Observed | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | P0 | docs wrong | `getting-started-complete/javascript.sveltekit.mdx:365` (also `:403`, `:458`; `configuration/build/index.mdx:88, 111, 136`) | `import { sentrySvelteKit } from "@sentry/sveltekit"` | `vite build` exits 1: `SyntaxError: The requested module '…/@sentry/sveltekit/build/esm/index.server.js' does not provide an export named 'sentrySvelteKit'`; develop exports it only from `@sentry/sveltekit/vite` | Change the import path in all five snippets to `@sentry/sveltekit/vite` |
| 2 | P1 | SDK limit | `:272-286` (`hooks.server` snippet) | `handleErrorWithSentry(myErrorHandler)` captures server errors | every error captured this way is `handled: true` (`server-common/handleError.ts:77` `handled: !!handleError`), including the uncaught `+server.ts` and `load` throws, so they never count as crashes; only the commented-out `handleErrorWithSentry()` form marks them unhandled | Say on the page that passing a custom handler marks the errors handled, or drop the custom handler from the primary snippet |
| 3 | P2 | SDK limit | `:283` `sentryHandle()`; `build/types/server-common/handle.d.ts` `handleUnknownRoutes` "default false to reduce noise" | unknown routes are not monitored by default | with `tracing.server: true` every unrouted request (`/nope`, `/favicon.ico`) still produces a streamed segment `sveltekit.handle.root` (source `custom`, origin `manual`, `http.route: unknown`) | Note under the server config that Kit's root span is still exported for unknown routes and how to drop it (`beforeSendSpan`, or `handleUnknownRoutes: true` to get named ones) |
| 4 | P2 | SDK limit | `:530-540` | the throwing `+server.ts` is captured and traced | the server segment `GET /sentry-example` has status `ok` and no `http.response.status_code`; only the child `sveltekit.resolve` carries `500` | none on the page; worth a note that the segment status does not reflect the 500 |
| 5 | P2 | docs wrong | `configuration/build/index.mdx:69-71` (linked from `:621`), `:357` | "SvelteKit doesn't yet offer a hook for … `load` … Therefore, the SDK uses a Vite plugin to auto-instrument `load` functions" | on Kit 2.70 with `tracing.server: true` the server load span is Kit's own (`sveltekit.load`, origin `auto.function.sveltekit.load`); no plugin-wrapped server load span (`auto.function.sveltekit.server`) appeared; only the universal (client) load span comes from the plugin wrapper | Rewrite the build page's rationale for Kit ≥ 2.31: the plugin wraps universal loads, server loads come from Kit tracing |
| 6 | P2 | docs wrong | `:134-135`, `:250-251` | "capture 100% of transactions for tracing" | no `transaction` envelope item exists under the v11 lifecycle; both sides stream `span` items (`sentry.trace_lifecycle: stream`) | Say "spans" or "traces" in the `tracesSampleRate` comment |
| 7 | P2 | docs wrong | `:7-8` | "Vite version 4.2 or newer" | `@sveltejs/kit@2.70.3` peers `vite: ^5.0.3 \|\| ^6 \|\| ^7 \|\| ^8`; Vite 4 cannot be installed with a current Kit 2 | State the Vite majors current Kit 2 accepts |
| 8 | P2 | docs wrong | `:357-372` | `sentrySvelteKit()` "automatically upload[s] source maps" | without `authToken` every build prints the telemetry notice twice and two warnings (`Will not create release`, `Will not upload source maps`), and still injects the git HEAD sha as `release` on all envelopes | Mention the warnings and the injected release in the Configure Vite step, not only in the optional source maps section |

## Notes

- The page's `:510-518` and `:561-582` snippets both target `src/routes/sentry-example/+page.svelte`; the run keeps the first at `/sentry-example-plain`. Both use `onclick="{throwTestError}"`, which Svelte 5 accepts.
- The pageload segment ended with `sentry.idle_span_finish_reason: cancelled` and status `error` because the traced button's fetch failed inside it; the navigation to `/sentry-example-plain` also ended `error` after the plain throw.
- The browser's `http.client` spans are named `GET localhost` (host only, v11 low-cardinality names); the server's node-fetch spans `GET 127.0.0.1`.
- SvelteKit calls `handleError` for 404s (`SvelteKitError: Not found: /favicon.ico`, `/nope`); the page's `myErrorHandler` logs them, `handleErrorWithSentry` does not send them.
- Not run: the SvelteKit 3 tab (`:220-226`), the source maps upload (no auth token by design), `adapter: "vercel"`, the Cloudflare branch, an errors-only (no `tracesSampleRate`) build.

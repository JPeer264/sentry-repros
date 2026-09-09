Docs changes for the Astro guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/astro/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/astro>), [`cells/M-astro-bun/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-astro-bun>), [`cells/M-astro-deno/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-astro-deno>) in the audit repository.

## Must land

- [ ] **P0** · DOC-F13 · Astro on Bun: the runtime alert says not supported
  The runtime alert at `docs/platforms/javascript/guides/astro/index.mdx:21-29` says the SDK "currently only works on Node runtimes, such as Node adapter or Vercel with Lambda functions" and that other non-Node runtimes are not supported (`:23-27`), which reads as excluding Bun. Nothing under `guides/astro/` mentions Bun, and nothing under `guides/bun/` mentions Astro.
  Verified on Astro 7.3.1 with the `@astrojs/node` ^11.1.5 standalone adapter and `@sentry/astro` 10.67.0 (develop, 6f2da7483d) on Bun 1.4.0 and re-run on 1.4.2: in `astro.config.mjs` set `output: 'server'`, the `node({ mode: 'standalone' })` adapter, `sentry({ sourcemaps: { disable: true }, enabled: { client: false, server: true } })` and `vite: { ssr: { noExternal: ['mysql2'] } }`, which is required for build-time database instrumentation. Put a root `sentry.server.config.mjs` guarded with `Sentry.isInitialized()`, run `astro build`, then `bun --preload ./sentry.server.config.mjs dist/server/entry.mjs`. The preload is required, because the integration injects the init only into `.astro` page chunks, so an app whose first request hits an API route would otherwise run uninstrumented. Install `@sentry/bun` and add its `fetchIntegration()` to the server init, guarded on `typeof globalThis.Bun !== 'undefined'` so Node deployments of the same build do not double-count. Database spans need one more workaround for a Bun bug: Bun's `node:diagnostics_channel` does not keep a channel alive once it has subscribers, so the SDK reads `hasSubscribers = true` while the injected wrapper reads `false`. Pin the channels on `globalThis` next to `Sentry.init()` in `sentry.server.config.mjs` — `globalThis.__sentryPinnedChannels ??= ['mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect', 'orchestrion:mysql:query', 'orchestrion:mysql2:query', 'orchestrion:mysql2:execute'].map(name => dc.tracingChannel(name))` — which is harmless on Node and can be applied unconditionally. Loading the driver early is not a substitute here: it fixes mysql2 and not `mysql`@2.
  Works today:
  - Unhandled endpoint errors via the Astro request middleware, mechanism `auto.middleware.astro`
  - Route names `GET /users/[id]` with source `route` and `http.route`
  - Per-request isolation across concurrent requests
  - Incoming `sentry-trace`/`baggage` continuation
  - Outgoing `fetch` spans and propagation headers, with `fetchIntegration()` added
  - `mysql2` and `mysql`@2 database spans on both lifecycles and both mysql2 code paths, with the channel pin above
  - `Sentry.logger` log envelopes
  Known limits:
  - The build needs a `@sentry/bundler-plugins` matching this SDK line; with an older one `npx astro build` dies with "The requested module @sentry/core does not provide an export named ServerRuntimeClient".
  - `contexts.runtime` reports `node` on Bun, so Bun events cannot be told apart from Node ones in Sentry.
  - ContextLines prints `Failed to read file: native` once per captured event on Bun.
  - Errors thrown while an `.astro` page renders were not exercised; the error probe is an endpoint. Browser-side capture was not exercised either, because the run used `enabled: { client: false, server: true }`.
  **Change:** `guides/astro/index.mdx:21-29`: amend the alert to name Bun as working on the Node adapter output. Add a "Running on Bun" section to that page with the `bun --preload ./sentry.server.config.mjs dist/server/entry.mjs` start command, the `astro.config.mjs` options above, the runtime-gated `fetchIntegration()`, the channel pin and the capability list.
  Draft: [Name Bun in the Astro runtime alert and add a Running on Bun section](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#37-name-bun-in-the-astro-runtime-alert-and-add-a-running-on-bun-section>)
- [ ] **P0** · DOC-F30 · Astro on Deno: the runtime alert says not supported
  `docs/platforms/javascript/guides/astro/index.mdx:21-29` carries an Alert titled "What runtime do you use?" saying the SDK only works on Node runtimes such as the Node adapter or Vercel with Lambda functions, pointing Cloudflare users elsewhere, and calling other non-Node runtimes not supported. That reads as excluding Deno. `grep -rni deno docs/platforms/javascript/guides/astro/` returns zero hits, and `guides/deno/` never mentions Astro.
  Verified on Astro 7.3.1 in SSR mode (`output: 'server'`) with `@deno/astro-adapter` 0.6.0 and `@sentry/astro` 10.67.0 on Deno 2.9.0: install the packages with `npm install` into a real `node_modules` rather than `deno add`, set `deno.json` to `{"nodeModulesDir": "manual"}`, add the `sentry()` integration in `astro.config.mjs`, keep a root `sentry.server.config.js` that calls `Sentry.init()`, add a `src/middleware.ts` whose first line imports that config, build normally and run the built `dist/server/entry.mjs` with Deno. The middleware is a required step, not a convenience: without it `Sentry.init` never runs for requests that only hit `.ts`/`.js` endpoint routes, so those requests produce nothing at all.
  Works today:
  - Route errors, mechanism `auto.middleware.astro`, with request URL and source context.
  - `GET /users/[id]` with source `route`, in both trace lifecycles.
  - Per-request isolation across concurrent requests.
  - Incoming `sentry-trace`/`baggage` continuation.
  - Database spans for `mysql2`, injected by the Vite plugin `@sentry/astro` adds during `astro build`.
  - Logs.
  Known limits:
  - Outgoing `fetch()` is not instrumented on Deno: no `http.client` span and no `sentry-trace`/`baggage` headers, so the downstream service starts a new trace. Adding `fetchIntegration` from `@sentry/cloudflare` in `sentry.server.config.js` restores both, but `@sentry/astro` does not depend on `@sentry/cloudflare`, so that package has to be installed on purpose. Calls made with `node:http`/`node:https` are traced without it, and a call wrapped in `Sentry.startSpan` with headers taken from `Sentry.getTraceData()` also works.
  - A route that only exists as a `.ts`/`.js` endpoint is uninstrumented unless `src/middleware.ts` imports the server config.
  **Change:** `guides/astro/index.mdx:21-29`: amend the Alert to name Deno as a supported runtime and link out. Add a Deno framework page for Astro with the `@deno/astro-adapter` setup, the mandatory middleware import, the `npm install @sentry/cloudflare` step and the `fetchIntegration` snippet. `common/configuration/integrations/fetchIntegration.mdx:10`: it says the integration "only works inside the Cloudflare Workers runtime", which this run disproves.
  Draft: [Correct the Astro runtime note: Deno with @deno/astro-adapter works](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#38-correct-the-astro-runtime-note-deno-with-denoastro-adapter-works>)

## Should land

- [ ] **P1** · DOC-Q99 · The verify endpoint kills the build on the default static output
  `platform-includes/getting-started-complete/javascript.astro.mdx:480-491` creates `src/pages/api/test-error` whose `GET` throws and tells the reader to click the buttons on the test page. On Astro's default static output the endpoint is prerendered, so `astro build` fails with `Caught error rendering /api/test-error: Error: Sentry Example API Route Error`, with the server SDK initialized inside the prerender process; the page never says the route must be server-rendered. With the Node adapter in standalone mode every step works: client and server errors in one trace, route-named pageloads, propagation in every direction.
  **Change:** State that the verify endpoint needs on-demand rendering (`export const prerender = false` in the endpoint, or `output: "server"` with an adapter).
  Draft: [Say on the Astro guide that the verify endpoint needs on-demand rendering](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#144-say-on-the-astro-guide-that-the-verify-endpoint-needs-on-demand-rendering>)

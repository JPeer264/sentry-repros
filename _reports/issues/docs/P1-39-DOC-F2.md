The Bun wiring on the Elysia guide is correct; three statements around it are not. `docs/platforms/javascript/guides/elysia/index.mdx:4-5` declares `sdk: sentry.javascript.elysia` with `fallbackGuide: javascript.bun`, `elysia/index.mdx:23-25` lists the prerequisites, `elysia/index.mdx:56` shows `bun add @sentry/elysia`, and the alert at `elysia/index.mdx:47-50` ("You do **not** need `@elysiajs/opentelemetry`") is confirmed by the run. The defects are in the includes: `platform-includes/performance/what-instrumentation-provides/javascript.elysia.mdx:1` opens this server guide with a `BrowserTracing` paragraph; `javascript.elysia.mdx:5` claims the ops are `request_handler.elysia` and `middleware.elysia` where the observed ops are plain `handler` and `middleware`; and `platform-includes/performance/enable-stream-mode/javascript.elysia.mdx:25` says `'static'` is "the default" where this line defaults to `'stream'`. On top of that, nothing on the page or in its includes says how database and library instrumentation behaves on Bun.

Verified on Elysia 1.4 with `@sentry/elysia` 10.67.0 (develop, 6f2da7483d) on Bun 1.4.0: `Sentry.init` either inline in the entry or in an `instrument.ts` imported first, `Sentry.withElysia(new Elysia())` wrapping the fresh instance before any route is chained, then `bun app.ts`. No `--preload`, no `@elysiajs/opentelemetry`, and no build step for the base capabilities. For libraries that need the plugin build, build with `Bun.build({ entrypoints: ['./app.ts'], outdir: './dist', target: 'bun', sourcemap: 'external', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and run `bun dist/app.js`. Pass no `external` at all, and no `packages: 'external'` or `packages: '*'`: the follow-up run recorded that any of those puts the instrumented packages back outside the bundle and the spans disappear again. `sentryBunPlugin()` is build-only; calling `Bun.plugin(sentryBunPlugin())` from a `--preload` file crashes the app at import.

Works today:

- Unhandled handler errors via the SDK's global `onError` hook
- Route names `GET /users/:id` with source `route`, on the success and error paths
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation, plus response trace headers
- Outgoing `fetch` spans with propagation headers
- `mysql2` database spans under a plain `bun app.ts`; database instrumentation as a whole is recorded partial, and this is the half that works
- `Sentry.logger` log envelopes

Known limits:

- On Bun only libraries that publish `node:diagnostics_channel` events themselves are instrumented under a plain `bun app.ts`; every other instrumented library needs the plugin build above. The failure is silent: with `debug: true` the SDK logs "No available Node API to register diagnostics-channel injection hooks; skipping" and still reports "Integration installed: Mysql", and without `debug` there is no output at all.
- Every event, transaction and span reports `sdk.name: "sentry.javascript.bun"`, never `sentry.javascript.elysia`, under both init placements and both lifecycles.
- Events captured inside a handler carry no transaction name, because the name is set after the handler runs.
- The SDK's own hooks are visible in every trace as `sentryOnRequest`, `sentryOnAfterHandle` and `sentryOnError` spans, and the first pool use adds `db mysql2.pool.connect` and `db mysql2.connect`.

What to change:

- `guides/elysia/index.mdx`: add a "Database and library instrumentation on Bun" section after Configure with the bundle recipe and the "no `external`" rule. Leave the alert at `:47-50` as it is; the run confirms it.
- `platform-includes/performance/what-instrumentation-provides/javascript.elysia.mdx:11`: qualify "No additional runtime instrumentation needed" for the database and library case.
- `platform-includes/performance/what-instrumentation-provides/javascript.elysia.mdx:1`: drop the `BrowserTracing` paragraph from this server guide.
- `platform-includes/performance/what-instrumentation-provides/javascript.elysia.mdx:5`: the observed ops are `handler` and `middleware`, not `request_handler.elysia` and `middleware.elysia`.
- `platform-includes/performance/enable-stream-mode/javascript.elysia.mdx:25`: the `traceLifecycle` default is `'stream'`, not `'static'`. DOC-R1 covers javascript.bun.mdx, javascript.deno.mdx and javascript.cloudflare.mdx, not this file.

---

_From the runtime docs audit of September 2026, item DOC-F2, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._

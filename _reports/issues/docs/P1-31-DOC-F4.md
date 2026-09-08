Nothing documents Fastify on Bun: `docs/platforms/javascript/guides/fastify/index.mdx:4-5` is `sdk: sentry.javascript.node` with `fallbackGuide: javascript.node` and Node-only includes at `fastify/index.mdx:12-14`, while `guides/bun/index.mdx:100` shows only `bun --preload ./instrument.js app.js` and `guides/bun/index.mdx:90-94` carries the "Bundled Code Limitation" alert. The Bun claim already exists in the docs elsewhere — `common/configuration/integrations/fastify.mdx` says "This integration only works in the Node.js and Bun runtimes" — only the guide is missing.

Verified on Fastify 5.7.1 with `@sentry/bun` 10.67.0 (develop, 6f2da7483d) on Bun 1.4.0 and re-run on 1.4.2: install `@sentry/bun` plus `mysql2`, put `Sentry.init` in `instrument.mjs`, import it as the first line of `app.mjs` or pass `bun --preload ./instrument.mjs app.mjs`, and run the app directly. No `Bun.build` step and no `sentryBunPlugin()` are needed for Fastify itself. For drivers that need code injection, build with `Bun.build({ entrypoints: ['./app.mjs'], outdir: './dist', target: 'bun', external: ['@sentry/*'], sourcemap: 'external', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and run `bun dist/app.mjs`; the follow-up run used `external: ['@sentry/bun', 'mysql']` instead, which is equally safe because the plugin removes the packages it instruments from the `external` list again. `sentryBunPlugin()` is build-only: `Bun.plugin(sentryBunPlugin())` in a `--preload` file crashes the app at import, so the bundle is the only route for injected drivers.

Works today:

- Unhandled route-handler errors, attached to the request transaction
- Route names `GET /users/:id` with source `route`, plus two `handler` child spans per request (`handler GET /users/:id` and `handler fastify - route-handler`); the source is directly assertable under `traceLifecycle: 'static'`
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers; the client-span name differs by lifecycle
- `mysql2` 3.20.0+ database spans with no build step, covering `execute()`, the promise wrapper and pool connections. Verified at mysql2 3.24.3 on Fastify 5.12.3 in the follow-up run; the original cell, which used only `mysql`@2, recorded database spans as partial. Unlike injected drivers, mysql2 does not need a module-scope connection: a connection created inside the request still gets spans, because the subscription happens at `Sentry.init()` time.
- `Sentry.logger` log envelopes

Known limits:

- Drivers Sentry instruments by code injection, `mysql`@2 among them, produce no span under a plain run; they need the bundle above, with the connection created at module scope.
- The missing database span is silent: the query succeeds and returns rows, and the SDK says nothing unless `debug: true` is set, so the app looks fully instrumented while it has no database visibility.
- Fastify still answers its own 500 body while the error is reported.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/fastify.mdx` with the `@sentry/bun` and `mysql2` install, `instrument.mjs`, run command and the capability list.
- Rewrite `guides/bun/index.mdx:90-94` into a "Database instrumentation on Bun" section that splits behaviour by driver rather than stating one rule, and says the failure is silent without `debug: true`.

---

_From the runtime docs audit of September 2026, item DOC-F4, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._

Nothing documents Fastify on Bun: `docs/platforms/javascript/guides/fastify/index.mdx:4-5` is `sdk: sentry.javascript.node` with `fallbackGuide: javascript.node` and Node-only includes at `fastify/index.mdx:12-14`, while `guides/bun/index.mdx:106` shows only `bun --preload ./instrument.js app.js` and `guides/bun/index.mdx:96-98` carries the "Bundled Code Limitation" alert.

Verified on Fastify 5.7.1 with `@sentry/bun` 10.67.0 on Bun 1.4.0: install `@sentry/bun`, put `Sentry.init` in `instrument.mjs`, import it as the first line of `app.mjs` or pass `bun --preload ./instrument.mjs app.mjs`, and run the app directly. No `Bun.build` step and no `sentryBunPlugin()` are needed for Fastify itself.

Works today:

- Unhandled route-handler errors, attached to the request transaction
- Route names `GET /users/:id` with source `route`, plus handler child spans
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql2` 3.20.0+ database spans with no build step, including `query()`, `execute()`, the promise wrapper and pool connections
- `Sentry.logger` log envelopes

Known limits:

- Drivers Sentry instruments by code injection, `mysql`@2 among them, produce no span under a plain run; they need the app bundled with `Bun.build({ target: 'bun', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin`, with the connection created at module scope.
- Fastify still answers its own 500 body while the error is reported.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/fastify.mdx` with the install, `instrument.mjs`, run command and the capability list.
- Rewrite `guides/bun/index.mdx:96-98` into a "Database instrumentation on Bun" section that splits behaviour by driver rather than stating one rule.

---

_From the runtime docs audit of September 2026, item DOC-F4, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

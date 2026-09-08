The Elysia guide is already Bun-first and correct as published: `docs/platforms/javascript/guides/elysia/index.mdx:4-5` declares `sdk: sentry.javascript.elysia` with `fallbackGuide: javascript.bun`, `elysia/index.mdx:23-25` lists the prerequisites, and `elysia/index.mdx:56-57` shows `bun add @sentry/elysia`. What it does not cover is how database and library instrumentation behaves on Bun, and the alert at `elysia/index.mdx:47-50` ("The `@sentry/elysia` SDK handles all instrumentation natively") reads as an unconditional promise.

Verified on Elysia 1.4 with `@sentry/elysia` 10.67.0 on Bun 1.4.0: `Sentry.init` either inline in the entry or in an `instrument.ts` imported first, `Sentry.withElysia(new Elysia())` wrapping the fresh instance before any route is chained, then `bun app.ts`. No `--preload`, no `@elysiajs/opentelemetry`, and no build step for the base capabilities.

Works today:

- Unhandled handler errors via the SDK's global `onError` hook
- Route names `GET /users/:id` with source `route`, on the success and error paths
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation, plus response trace headers
- Outgoing `fetch` spans with propagation headers
- `mysql2` database spans with no build step
- `Sentry.logger` log envelopes

Known limits:

- On Bun only libraries that publish `node:diagnostics_channel` events themselves are instrumented under a plain `bun app.ts`; every other instrumented library needs the app bundled with `Bun.build({ target: 'bun', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin`, run as `bun dist/app.js`.
- Events in a handler carry no transaction name, because the name is set after the handler runs.

What to change:

- `guides/elysia/index.mdx`: add a "Database and library instrumentation on Bun" section after Configure with the bundle recipe, and qualify the alert at `:47-50` for Bun.

---

_From the runtime docs audit of September 2026, item DOC-F2, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

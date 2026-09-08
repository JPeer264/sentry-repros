The Hono guide already claims Deno support: `docs/platforms/javascript/guides/hono/index.mdx:12` lists Deno among the runtimes, `:88-89` gives the Deno peer dependency as `deno add npm:@sentry/deno`, and `:320-348` shows the Deno tab with `import { sentry } from "@sentry/hono/deno"`, `app.use(sentry(app, {...}))` and `Deno.serve(app.fetch)`. The page carries no runtime caveats around `:384`, and `docs/platforms/javascript/guides/deno/index.mdx:1-232` never mentions `node_modules`, `nodeModulesDir`, the `@sentry/deno/import` hook or outgoing `fetch`.

Verified on Hono 4.13.7 with `@sentry/hono/deno` 10.67.0 on Deno 2.9.0: install `@sentry/hono` and `@sentry/deno` into a real on-disk `node_modules` (`npm install`, or `deno add npm:@sentry/hono`), set `{"nodeModulesDir": "manual"}` in `deno.json`, put `import "@sentry/deno/import";` as the first line of the entry file when you want database and library spans, then wire the middleware exactly as the current snippet shows and run `deno run --allow-net --allow-env --allow-read --allow-sys main.ts`.

Works today:

- Unhandled route errors, with `transaction: "GET /error"`.
- Parameterized names `GET /users/:id` with source `route`.
- Per-request isolation across concurrent requests.
- Incoming `sentry-trace`/`baggage` continuation.
- Database spans for `mysql` (requires the import hook line).
- Logs.

Known limits:

- Outgoing `fetch()` is not instrumented on Deno: no `http.client` span and no `sentry-trace`/`baggage` headers, so the downstream service starts a new trace.
- `node:http`/`node:https` clients are traced normally.
- Without the import hook line, database and library spans are silently missing.

What to change:

- `guides/hono/index.mdx:88-89`: show the `deno.json` and the npm-based install, not `deno add` alone.
- `guides/hono/index.mdx` near `:320-348`: note the optional `@sentry/deno/import` first line and the permission flags.
- `guides/hono/index.mdx` near `:384`: add a Deno-only caveat for outgoing `fetch`.
- `guides/deno/index.mdx`: add an "Outgoing fetch requests" section stating the same limit.

---

_From the runtime docs audit of September 2026, item s5-deno, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

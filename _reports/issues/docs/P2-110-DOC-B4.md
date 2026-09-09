`guides/bun/index.mdx:12` pulls the `getting-started-prerequisites` include, but no `javascript.bun.mdx` variant of it exists, so the page falls back to `_default.mdx` and states no Bun version floor. `guides/hono/index.mdx:84-85` installs the Bun SDK with `npm install @sentry/bun`, while the Bun guide uses `bun add`. `platform-includes/performance/automatic-instrumentation-intro/javascript.bun.mdx:1` still says the SDK "provides a `Tracing` integration", which is v7 wording.

What was observed: CI runs the Bun SDK against Bun 1.3.14 (`.github/workflows/build.yml:522`), which is the version the SDK is verified on.

What to change:

- Add `platform-includes/getting-started-prerequisites/javascript.bun.mdx` stating the Bun version the SDK is tested against (1.3.14), in the shape of `platform-includes/getting-started-prerequisites/javascript.deno.mdx:7` ("Deno version >= `2.0.0`").
- Change the Bun install tab in `guides/hono/index.mdx:84-85` to `bun add @sentry/bun`.
- Delete the "provides a Tracing integration" sentence from `platform-includes/performance/automatic-instrumentation-intro/javascript.bun.mdx`.

---

_From the runtime docs audit of September 2026, item DOC-B4, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._

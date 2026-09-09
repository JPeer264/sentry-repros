The three stream-mode includes present stream mode as opt-in, in four places. `platform-includes/performance/enable-stream-mode/javascript.bun.mdx:5`, `javascript.deno.mdx:5` and `javascript.cloudflare.mdx:8` (Cloudflare Pages) and `:35` (Cloudflare Workers) all say "Opt in by setting the `traceLifecycle` option to `'stream'`", and each file closes with "set `traceLifecycle` to `'static'` (the default)" (`javascript.bun.mdx:25`, `javascript.deno.mdx:24`, `javascript.cloudflare.mdx:62`).

On develop the default is `'stream'`. `packages/core/src/client.ts:243` (`:242` at the pin) normalizes `traceLifecycle: options.traceLifecycle === 'static' ? 'static' : 'stream'`, and the comment directly above it (`:237-238`) states the same rule: every value except an explicit `'static'` resolves to stream. No runtime overrides it. Cloudflare reads `SENTRY_TRACE_LIFECYCLE` at `packages/cloudflare/src/options.ts:73`, but that read returns `undefined` when the variable is unset (`:107-109`), so it never changes the default, and `packages/deno/src/integrations/deno-serve.ts:28` describes `'stream'` as the default too.

The docs already say this on another page: `docs/platforms/javascript/common/migration/v10-to-v11/index.mdx:23` calls stream mode "the new default", and `:198` tells the reader to set `traceLifecycle: 'static'`, or the `SENTRY_TRACE_LIFECYCLE=static` environment variable, to keep the previous model. The includes contradict the migration guide on the same site.

What to change:

- Reframe all four opt-in sentences as opt-out (`javascript.bun.mdx:5`, `javascript.deno.mdx:5`, `javascript.cloudflare.mdx:8` and `:35`): `'stream'` is the default, `'static'` is what a user sets.
- Replace the `traceLifecycle: "stream"` sample lines with `"static"` examples, or drop them.
- Add the missing comma after `tracesSampleRate: 0.2` in the Pages snippet at `javascript.cloudflare.mdx:19`; the Workers snippet at `:40-56` already parses.
- Match the wording of `migration/v10-to-v11/index.mdx:23` and `:198`, including the `SENTRY_TRACE_LIFECYCLE=static` escape hatch.

---

_From the runtime docs audit of September 2026, item DOC-R1, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._

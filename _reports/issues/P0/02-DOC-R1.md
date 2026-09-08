The three stream-mode includes present stream mode as opt-in. `platform-includes/performance/enable-stream-mode/javascript.bun.mdx:5` (and `javascript.deno.mdx:5`, `javascript.cloudflare.mdx:8`) say "Opt in by setting the `traceLifecycle` option to `'stream'`", and each closes with "set `traceLifecycle` to `'static'` (the default)" (`javascript.bun.mdx:25`, `javascript.deno.mdx:24`, `javascript.cloudflare.mdx:62`).

On develop the default is `'stream'`. `packages/core/src/client.ts:242` normalizes `traceLifecycle: options.traceLifecycle === 'static' ? 'static' : 'stream'`, so every value except an explicit `'static'` resolves to stream. No runtime overrides this, and `packages/deno/src/integrations/deno-serve.ts:28` describes `'stream'` as the default too.

**What to change**

- Reframe all three includes as opt-out: `'stream'` is the default, `'static'` is what a user sets.
- Replace the `traceLifecycle: "stream"` sample lines with `"static"` examples, or drop them.
- Add the missing comma after `tracesSampleRate: 0.2` at `javascript.cloudflare.mdx:19`.

---

_From the runtime docs audit of September 2026, item DOC-R1; the audit page is `_reports/docs-audit.html` in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

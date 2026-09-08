Following `guides/bun/index.mdx:88-106` as written, `bun --preload ./instrument.ts app.ts` with `debug: true` prints `No available Node API to register diagnostics-channel injection hooks; skipping.` at startup and `[Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime --import hook or a bundler plugin before the instrumented modules load.` after the first request. Neither line is mentioned on the Bun guide or the troubleshooting pages, and the guide names no bundler plugin (DOC-B1).

Observed on develop with bun 1.4.2: the warnings are correct. Runtime instrumentation (`Bun.serve`, fetch, errors, logs) works on the documented path, and library instrumentation needs the `Bun.build` with `sentryBunPlugin()`. A reader who sees the warning has no page that says which of the two it refers to.

What to change:

- Quote both lines on the Bun guide next to the run command, say that runtime instrumentation is unaffected, and link the plugin build step from DOC-B1 as the fix for library spans.

---

_From the runtime docs audit of September 2026, item DOC-Q4, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

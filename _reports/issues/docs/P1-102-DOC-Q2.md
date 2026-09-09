`guides/cloudflare/features/vite-plugin.mdx` documents the probing order at `:68` and gives `wranglerConfigPath` its own option entry at `:130-148`, described as the setting for a config at a custom path. What no page says is what happens when the config is not at a custom path but simply not the one the reader means: with several wrangler files in the project, the plugin resolves the first default-named `wrangler.json`, `wrangler.jsonc` or `wrangler.toml` at the Vite root, reads the entry point and classes from that file, and instruments nothing for the Worker actually being built. Nothing is logged, because the plugin only warns when no config parses at all.

Observed on `develop` with a Worker whose source has no `withSentry` call, built in a directory holding more than one wrangler config: before `wranglerConfigPath` was passed, the run produced an empty sink, an uncaught error in the worker log and no trace-propagation headers. With `wranglerConfigPath` set and an `instrument.server.ts` next to the wrangler `main`, the built Worker delivered the same errors, spans, headers and logs as a hand-written `withSentry`, with no experimental flag.

What to change:

- On the Vite plugin page, state that `wranglerConfigPath` is required whenever the project holds more than one wrangler config, not only when the config sits at a custom path, and that a config resolved to the wrong file instruments nothing while the build still succeeds.
- Say how to tell: with auto-instrumentation working, the built entry contains a `withSentry` wrapper; without it there is no wrapper and no plugin output.
- Remove the `_experimental.useDiagnosticsChannelInjection` flag from `guides/cloudflare/index.mdx:77-92`; it is not needed on `develop` (also DOC-C4).

---

_From the runtime docs audit of September 2026, item DOC-Q2, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._

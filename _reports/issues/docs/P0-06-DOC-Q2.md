`guides/cloudflare/features/vite-plugin.mdx` and the proposed quick start step 3 present `sentryCloudflareVitePlugin()` as a drop-in: add it next to `cloudflare()`, build, deploy. Neither says where the SDK options come from when the plugin wraps the entry, and neither says what happens when the wrangler config is not named `wrangler.jsonc` or `wrangler.toml` at the project root.

Observed on develop with a Worker whose source has no `withSentry` call: the plugin wraps the entry at build time (`const viteEntry = withSentry(__SENTRY_OPTIONS_CALLBACK__, __SENTRY_DEFAULT_EXPORT__)` in the built output), and the options callback is taken from an `instrument.server.{ts,js,mjs,cjs}` file next to the wrangler `main`. Without that file the callback falls back to `() => undefined` and the Worker runs with no DSN, silently. With the wrangler config under a non-default name and no `wranglerConfigPath`, the plugin instruments nothing: the run produced an empty sink, an uncaught error in the worker log and no trace headers, with no warning from the plugin. With `wranglerConfigPath` set and the options file present, the built Worker delivered the same errors, spans, headers and logs as a hand-written `withSentry`, with no experimental flag.

What to change:

- On the Vite plugin page, add the `instrument.server.ts` file as a required step when the source has no `withSentry`, with its shape: a default export of the options callback.
- State that `wranglerConfigPath` is required whenever the config is not at the default path, and that the plugin does nothing without it.
- Remove the `_experimental.useDiagnosticsChannelInjection` flag from the page and from `guides/cloudflare/index.mdx:77-92`; it is not needed on develop (also DOC-C4).

---

_From the runtime docs audit of September 2026, item DOC-Q2, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

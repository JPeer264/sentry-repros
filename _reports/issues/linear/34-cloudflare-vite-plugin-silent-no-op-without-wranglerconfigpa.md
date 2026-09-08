# Cloudflare Vite plugin: silent no-op without `wranglerConfigPath`, silent fallback without the options file

Milestone: CF Functionality Gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: High

Two silent paths in `sentryCloudflareVitePlugin()`. With a wrangler config that is not at the default path and no `wranglerConfigPath`, the plugin instruments nothing: the build succeeds, the Worker runs without the SDK, the sink stays empty, and no warning is printed. With `autoInstrumentation` wrapping an entry that has no `withSentry`, the options callback is read from an `instrument.server.{ts,js,mjs,cjs}` file next to the wrangler `main`; without that file the callback is `() => undefined` and the Worker runs with no DSN, again silently. With both in place the built Worker delivered the same errors, spans, headers and logs as a hand-written `withSentry`.

**Work item.** Fail the build, or at least warn, when no wrangler config is found and when the entry is wrapped without an options file. Document the options file (docs item DOC-Q2).

**Evidence.** Getting-started reproduction [`quickstarts/cloudflare/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/cloudflare), run on 2026-09-08 against develop `6f2da7483d` (package 10.67.0); results in `results-*.json` and the README of each directory.

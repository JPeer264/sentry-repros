# The injection diagnostics report a state the build is not in

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Improvement
Priority: Medium

A user cannot tell from the SDK's own output whether instrumentation is active, and the output points both ways. A Remix server built with `sentryRemixVitePlugin`, whose SSR bundle holds ten `diagnostics_channel` injection sites, still logs `[Sentry] Runtime hook registered, injected libraries=[]` and `[Sentry] Bundler plugin did not run` at start-up (DOC-Q98, `results-vite-plugin.json`). Nuxt on Deno logs `Bundler plugin ran, injected libraries=[]` on a build that is instrumented, because that list is only filled during the build (DOC-F28). In the other direction, Koa on Deno prints `[instrumentation:koa] subscribing to channels` and `Integration installed: Koa` on a run where nothing Koa-specific is instrumented (DOC-F22), and Koa on Node prints `Integration installed: Koa` next to an `[instrumentation:koa] not injected yet` that never resolves (`results-self-import.json`).

**Work item.** Make one line at init state what actually happened, build-time injection and runtime injection separately, and stop reporting an integration as installed when its channels never bound. Next to the workerd warning ticket in the Cloudflare milestone and the silent-hook ticket in the Deno milestone.

**Evidence.** Getting-started reproductions [`quickstarts/remix/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/remix), [`quickstarts/koa/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/koa), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory. Also cell records M-nuxt-deno and M-koa-deno in the deep probe report.

# Cloudflare Vite plugin: a wrangler config resolved to the wrong default-named file instruments nothing, silently

Milestone: CF Functionality Gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: High

`sentryCloudflareVitePlugin()` already warns through the Vite logger when no wrangler config parses at all (`packages/cloudflare/src/vite/autoInstrument.ts:34-40`). The case that warning does not cover is a project holding more than one wrangler file: the plugin resolves the first default-named `wrangler.json`, `wrangler.jsonc` or `wrangler.toml` at the Vite root, reads the entry point and classes from that file, and instruments nothing for the Worker actually being built. A config was found, so nothing is logged. The recorded run produced an empty sink, an uncaught error in the worker log and `{"sentry-trace":null,"baggage":null}` at the recorder, with the build reporting success throughout.

Two neighbouring paths turned out not to be defects. The `instrument.server.{ts,js,mjs,cjs}` file is documented at `vite-plugin.mdx:88-99`, and its absence is a deliberate hand-off rather than a silent failure: `ENV_FALLBACK_OPTIONS_FN` (`packages/cloudflare/src/vite/instrumentFile.ts:7`) leaves `packages/cloudflare/src/options.ts:68` to resolve `dsn ?? getEnvVar(env, 'SENTRY_DSN')`, so the Worker runs without a DSN only when `env` carries none either. With `wranglerConfigPath` and the options file in place the built Worker delivered the same errors, spans, headers and logs as a hand-written `withSentry`.

**Work item.** Warn, or fail the build, when the resolved wrangler config is not the one being built, and say how to tell: with auto-instrumentation working the built entry contains a `withSentry` wrapper. The docs half is DOC-Q2, now P1.

**Evidence.** Getting-started reproduction [`quickstarts/cloudflare/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/cloudflare), run on 2026-09-08 against develop `6f2da7483d` (package 10.67.0); results in `results-*.json` and the README of each directory.

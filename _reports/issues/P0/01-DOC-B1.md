The Bun guide at `guides/bun/index.mdx:94` and `:106` tells the user to run `bun --preload ./instrument.js app.js`, and the alert at `:96-100` states that Sentry's auto-instrumentation does not work with bundled code and that bundling requires manual instrumentation. `@sentry/bun/plugin` is not named anywhere on the page, and `logs` is used as an onboarding block at `:182` but is missing from the options at `:20-22`.

What was observed on bun 1.4.0: a bundle built with `Bun.build({ plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` records library and framework spans, while running the same app unbundled with `bun run` records none. `packages/bun/src/plugin.ts:14` states the plugin is build-only. The unbundled diagnostic message is printed only with `debug: true`.

What to change:

- Keep the `--preload` step, described as what guarantees init order.
- Add a "Build with the Sentry plugin" step showing `Bun.build({ entrypoints: [...], plugins: [sentryBunPlugin()] })` imported from `@sentry/bun/plugin`.
- Replace the alert at `:96-100` with a plain statement: library and framework instrumentation requires a build with the plugin; `bun run` on unbundled source records manual spans plus `Bun.serve`, `node:http` and `fetch` spans.
- Add `logs` to the onboarding options at `:20-22`, or remove the block at `:182`.

---

_From the runtime docs audit of September 2026, item DOC-B1; the audit page is `_reports/docs-audit.html` in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

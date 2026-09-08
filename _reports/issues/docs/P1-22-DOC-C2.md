**Note.** v11-gated; file as a sub-issue of Linear SDK-1296.

`guides/cloudflare/features/d1.mdx:6-16` instructs the user to wrap their binding with `instrumentD1WithSentry(env.DB)`.

What was observed: on `develop` that export is gone, and `withSentry` instruments every D1 binding found on `env` (`packages/cloudflare/src/instrumentations/worker/instrumentEnv.ts:64-68`, recorded in `MIGRATION.md:1393-1408`). The automatic path is what `dev-packages/cloudflare-integration-tests/suites/d1` exercises. D1 spans use the `db.query` op, batches get their own span name, and the `cloudflare.d1.*` attributes are set in `instrumentD1.ts:114-116,142-146,178`. On the released line the wrapper already has no effect beyond the automatic instrumentation, and the page does not say so. The page will be wrong when v11 ships.

What to change:

- Rewrite `features/d1.mdx` to state that D1 bindings on `env` are instrumented automatically by `withSentry`, with no per-binding call.
- Document the span op `db.query`, the D1 batch span name, and the `cloudflare.d1.*` attributes listed above.
- Replace the `instrumentD1WithSentry` snippet with a note that the function exists before 11.0 and is not needed.

---

_From the runtime docs audit of September 2026, item DOC-C2, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

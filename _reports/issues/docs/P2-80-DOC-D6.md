`guides/deno/index.mdx:38-46` says to "Import the Sentry Deno SDK directly from the npm registry", and every snippet on the page uses the `npm:@sentry/deno` specifier. `guides/hono/index.mdx:88-89` is the only page showing `deno add npm:@sentry/deno`. The Deno `featureflags` and `enable-stream-mode` includes hardcode `@sentry/deno` and `npm:@sentry/deno` instead of the `___SDK_PACKAGE___` placeholder.

What was observed: every Deno e2e app uses a `deno.json` import map and the bare `@sentry/deno` specifier, which is also the form the `@sentry/deno/import` hook requires. Events reported by the SDK carry `sdk.packages[0].name = "denoland:sentry"`.

What to change:

- In the install step at `guides/deno/index.mdx:38-46`, add `deno add npm:@sentry/deno` and show the resulting `deno.json` import map entry.
- Use the bare `@sentry/deno` specifier in the snippets that follow, since that is the form the hook import needs, and keep `npm:@sentry/deno` documented as the no-import-map alternative.
- Replace the hardcoded package names in the Deno `featureflags` and `enable-stream-mode` includes with `___SDK_PACKAGE___`.

---

_From the runtime docs audit of September 2026, item DOC-D6, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

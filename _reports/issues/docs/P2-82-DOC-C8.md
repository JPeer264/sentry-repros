Several Cloudflare includes show code that does not match the package or the guide's own contract. `platform-includes/tracing/traces-sampler/javascript.cloudflare.mdx` calls `Sentry.browserTracingIntegration()`. `platform-includes/tracing/sample-rate/javascript.cloudflare.mdx` and the `capture-console` and `dedupe` configuration includes show a bare `Sentry.init(...)`. `platform-includes/configuration/contextlines/javascript.cloudflare.mdx` exists but `contextlines.mdx` lists `cloudflare` under `notSupported`, so it never renders. `guides/cloudflare/index.mdx:38-40` and `:352` contain a `logs` onboarding block that is not in the button list. `frameworks/nextjs.mdx:40` and `getting-started-config/javascript.cloudflare.mdx:5` state compatibility dates of 2025-08-16 and 2024-09-23 without saying which applies to whom. `frameworks/astro.mdx:105` links `dataCollection` to the Next.js options page. `frameworks/hydrogen-remix.mdx:59` contains a literal `YOUR_DSN_HERE`.

What was observed: `@sentry/cloudflare` does not export `browserTracingIntegration`; the guide's configuration contract is `withSentry` or `sentryPagesPlugin`; the 2025-08-16 date is OpenNext's `https.request` floor.

What to change:

- Replace `browserTracingIntegration()` in the traces-sampler include.
- Rewrite the bare `Sentry.init(...)` snippets as `withSentry` / `sentryPagesPlugin`.
- Remove `cloudflare` from `notSupported` in `contextlines.mdx` or delete the unreachable include.
- Add `logs` to the onboarding buttons.
- Say on each page which compatibility date applies.
- Fix the Astro `dataCollection` link and replace `YOUR_DSN_HERE` with `___PUBLIC_DSN___`.

---

_From the runtime docs audit of September 2026, item DOC-C8, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

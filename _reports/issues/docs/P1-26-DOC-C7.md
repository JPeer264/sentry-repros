`guides/cloudflare/frameworks/index.mdx:6` says the section is "to instrument your Cloudflare Pages applications", and `guides/cloudflare/index.mdx:16-23` lists eight frameworks. There is no `frameworks/react-router.mdx`. `frameworks/tanstack-start.mdx:54-57` pulls `getting-started-config` for platform `javascript.cloudflare.splitlayout`, for which no include file exists, so the wrangler step renders nothing; the page never installs `@sentry/tanstackstart-react` although its snippets at `:80,137,206` import it. `guides/tanstackstart-react/manual-setup/index.mdx:377` says "This setup doesn't work for Cloudflare deployments." with no link.

What was observed at `6f2da7483d`: of the 21 e2e apps that carry a wrangler config, only `sveltekit-cloudflare-pages` targets Pages. `react-router-8-cloudflare` wires `Sentry.withSentry` in `workers/app.ts:12` and `@sentry/react-router/cloudflare` in `app/entry.server.tsx:1`. `tanstackstart-react-cloudflare` is the reference wiring for TanStack Start. The per-framework Cloudflare items DOC-F35 to DOC-F51 carry the verified wiring for the remaining frameworks, including the ones with no first-party code path.

What to change:

- Add `frameworks/react-router.mdx` from the `react-router-8-cloudflare` wiring, and list React Router at `index.mdx:16-23`.
- Fix the include platform name at `tanstack-start.mdx:54-57` and add the `@sentry/tanstackstart-react` install step.
- Reword `frameworks/index.mdx:6` to cover Workers.
- Link the Cloudflare page from `guides/tanstackstart-react/manual-setup/index.mdx:377`.

---

_From the runtime docs audit of September 2026, item DOC-C7, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._

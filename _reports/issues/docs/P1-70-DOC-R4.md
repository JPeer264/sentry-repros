`docs/platforms/javascript/common/configuration/integrations/globalhandlers.mdx:4-18` lists a `notSupported` set that omits `javascript.cloudflare`, so the page renders on the Cloudflare guide. A Cloudflare reader sees `_Import name: Sentry.globalHandlersIntegration_` at `:27` and "This integration is enabled by default" at `:29` — even though the page's own alert at `:23` says it "only works in the Browser and Deno runtimes".

On develop, `globalHandlers` appears nowhere in `packages/cloudflare/src`, so `Sentry.globalHandlersIntegration` is `undefined` when imported from `@sentry/cloudflare`. Deno is the runtime the alert is right about: `packages/deno/src/index.ts:163` on develop (`:160` at the pin) exports it and `packages/deno/src/sdk.ts:45` installs it by default.

`javascript.cloudflare` is not the only gap in that list: `javascript.vercel-edge` is missing from it too, and `globalHandlers` appears nowhere in `packages/vercel-edge/src` either.

What to change:

- Add `javascript.cloudflare` to the `notSupported` list in `globalhandlers.mdx`.
- While the list is open, walk the other non-browser JavaScript guides and add the ones that are missing, starting with `javascript.vercel-edge`.
- Leave the Deno rendering as is, since the export and the default both exist there.

---

_From the runtime docs audit of September 2026, item DOC-R4, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._

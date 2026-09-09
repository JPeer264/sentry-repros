`platform-includes/getting-started-config/javascript.mdx:116` names `bundle.tracing.min.js` in the CDN tab, and the same snippet adds `Sentry.replayIntegration()` at `:130` and `:133`.

Observed with that combination on the develop CDN build: the console shows `warning: You are using replayIntegration() even though this bundle does not include replay.`, `Replay` still appears in the installed integrations, no event carries a `replayId` tag, and no replay envelope is ever sent. With `bundle.tracing.replay.min.js` the same page records the replay.

What to change:

- Name `bundle.tracing.replay.min.js` in the CDN tab, or remove `replayIntegration()` and the replay sample rates from the CDN variant of the snippet.
- State that a bundle without replay turns `replayIntegration()` into a no-op with a console warning only.

---

_From the runtime docs audit of September 2026, item DOC-Q8, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._

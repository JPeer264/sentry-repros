The logs quick start (`includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13`) tells every browser reader to call `Sentry.logger.info(...)`; the CDN install tab of the browser guide names `bundle.tracing.min.js`. Neither says that the CDN bundles ship a stub logger.

Observed on develop: with the npm package and the CommonJS build the log item arrives. With `bundle.tracing.min.js` and with `bundle.tracing.replay.min.js` no log envelope is produced and nothing warns; in the bundle `Sentry.logger` and `Sentry.metrics` are objects whose methods are empty functions. The v10-to-v11 page mentions the metrics half only (`common/migration/v10-to-v11/index.mdx:1398`).

What to change:

- On the logs pages that render for the browser, say that `Sentry.logger` is a no-op on the CDN bundles that do not include logs, and name the bundle that does.
- Add the same sentence next to the CDN tab of the browser config page.

---

_From the runtime docs audit of September 2026, item DOC-Q9, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._

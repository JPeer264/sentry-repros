The tracing verify step tells the reader to wrap work in `Sentry.startSpan({ op: "test", name: "My First Test Transaction" })` and look for a transaction: `platform-includes/getting-started-verify/javascript.node.mdx:38-53`, `guides/bun/index.mdx:156-172`, `guides/deno/index.mdx:176-190` and `guides/cloudflare/index.mdx:313-335`. The surrounding text on each page says the data appears as named transactions (`getting-started-node/javascript.mdx:120`, `bun/index.mdx:188`, `deno/index.mdx:207`, `cloudflare/index.mdx:364`).

Observed on develop, on all four runtimes with the documented wiring: no `transaction` envelope is sent at all. The manual span arrives as a child item inside a `span` envelope together with the server span, for example `["http.client GET 127.0.0.1", "test My First Test Span", "http.server GET"]`, because the default `traceLifecycle` is `stream`. The trace is complete and the span is visible in the trace view, but nothing on the page matches the word "transaction" a reader is told to look for.

What to change:

- On each of the four verify steps, describe what arrives: a trace with a server segment span and the manual span as its child, no transaction.
- Rename the sample from "My First Test Transaction" to a span name, as the proposed quick starts already do.
- Link the stream lifecycle page, and note that `traceLifecycle: "static"` restores the transaction envelope for readers who look for it.

---

_From the runtime docs audit of September 2026, item DOC-Q1, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

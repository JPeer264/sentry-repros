The tracing verify step tells the reader to wrap work in `Sentry.startSpan({ op: "test", name: "My First Test Transaction" })`: `platform-includes/getting-started-verify/javascript.node.mdx:38-53`, `guides/bun/index.mdx:156-172`, `guides/deno/index.mdx:176-190` and `guides/cloudflare/index.mdx:313-335`. The sentence that follows each one sends the reader to Sentry "to view the collected data" (`getting-started-node/javascript.mdx:120`, `bun/index.mdx:188`, `deno/index.mdx:207`, `cloudflare/index.mdx:364`) and expands the `quick-start-locate-data-expandable` include, which points at the Traces page. The only place the word "Transaction" appears is the sample name inside the snippet.

Observed on `develop`, on all four runtimes with the documented wiring: no `transaction` envelope is sent at all. The manual span arrives as a child item inside a `span` envelope together with the server span, for example `["http.client GET 127.0.0.1", "test My First Test Span", "http.server GET"]`, because `packages/core/src/client.ts:243` normalizes any `traceLifecycle` other than `'static'` to `'stream'`. On the released line there is no such normalization, so `'static'` is the default and a transaction is sent: the pages are correct for the version they serve today and become wrong with v11.

What to change, in the v11 docs update:

- On each of the four verify steps, describe what arrives: a trace with a server segment span and the manual span as its child, no transaction.
- Rename the sample from "My First Test Transaction" to a span name.
- Link the stream lifecycle page, and note that `traceLifecycle: "static"` restores the transaction envelope for readers who look for it.
- Fix the ten `platform-includes/performance/enable-stream-mode/javascript.*.mdx` files whose closing line calls `traceLifecycle` `'static'` "(the default)": node `:36`, cloudflare `:62`, hono `:51`, deno `:24`, and bun, nextjs, nestjs, nitro, gcp-functions and elysia at `:25`.
- Rewrite `guides/cloudflare/index.mdx:382-388`, which frames the static lifecycle as the current model and stream as the opt-in.
- Apply the same rewrite to the framework verify includes: `platform-includes/getting-started-verify/javascript.express.mdx:30` and `:40` name "My First Test Transaction", and the Express run received the span as an `op: test` child of the `http.server` segment inside a span envelope, never a transaction envelope (QS-express, variants import and express5).

---

_From the runtime docs audit of September 2026, item DOC-Q1, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._

No Cloudflare page lists which Worker bindings produce spans. `features/workers-ai.mdx` covers Workers AI, D1 is described as a manual wrapper in `features/d1.mdx`, and `common/tracing/instrumentation/caches-module.mdx` and `queues-module.mdx` are shown for Cloudflare while describing Redis and manual spans only.

What was observed in `instrumentEnv.ts` at `6f2da7483d`: D1 bindings are instrumented automatically with span op `db.query`; R2 is instrumented (`instrumentR2.ts:27-47`) with `object.*` ops; Queues producers are instrumented (`instrumentQueueProducer.ts:20`) with `queue.publish`; `env.AI.run` produces `gen_ai.*` spans; Durable Object namespaces and service bindings get trace-propagation headers and RPC metadata, with RPC instrumented and headers not; the rate limiter binding is not instrumented at that commit. Workers KV, Vectorize, Hyperdrive, Analytics Engine, the Cache API and Assets are not instrumented. The `d1`, `r2`, `queue` and `ratelimit` integration suites pin these.

What to change:

- Add a bindings table to `guides/cloudflare/features/index.mdx` with columns: binding, instrumented, span op, where it is documented, using the rows above.
- State plainly that Workers KV, Vectorize, Hyperdrive, Analytics Engine, the Cache API and Assets produce no spans.
- Adjust the `supported:` lists so the caches and queues common pages are not shown as Cloudflare binding documentation.

---

_From the runtime docs audit of September 2026, item DOC-C6, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

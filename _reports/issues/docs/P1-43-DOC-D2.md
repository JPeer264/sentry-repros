**Note.** the InboundFilters rename in the same table is Linear SDK-1481.

`platform-includes/configuration/integrations/javascript.deno.mdx:5-12` lists eight auto-enabled integrations: `breadcrumbs`, `contextLines`, `dedupe`, `denoContext`, `functionToString`, `globalHandlers`, `inboundFilters`, `linkedErrors`. Row `:21` has five cells instead of six, so `zodErrors` renders a check under the Cron column.

What was observed: the Deno SDK installs 39 integrations at `6f2da7483d` and 40 on develop head, where `mastraIntegration()` joined `getTracingIntegrations()`. Beyond the eight in the table it adds `RequestData`, `DenoServe`, `DenoHttp`, `NormalizePaths`, `Express`, `Fastify`, `Hapi`, `Koa`, `Graphql`, `Mongo`, `Mongoose`, `Mysql`, `Mysql2`, `Redis`, `Postgres`, `Prisma`, `Tedious`, `GenericPool`, `Kafka`, `Amqplib`, `LruMemoizer`, `Aws`, `LangChain`, `LangGraph`, `VercelAI`, `OpenAI`, `Anthropic_AI`, `Google_GenAI`, `PostgresJs`, `Firebase`, `SpanStreaming` and, on develop head, `Mastra`. `DenoServe` and `DenoHttp` produce every Deno transaction. Outgoing `fetch` produces breadcrumbs only. The library integrations need the `@sentry/deno/import` hook. The installed list comes from `packages/deno/src/sdk.ts:28-49`.

What to change:

- Rewrite the table from `packages/deno/src/sdk.ts:28-49` so every installed integration has a row.
- Add a "Requires `@sentry/deno/import`" column and tick the library, messaging and AI rows.
- Add rows for `denoServeIntegration` and `denoHttpIntegration`, noting they produce Deno transactions, and state that outgoing `fetch` yields breadcrumbs only.
- Fix the cell count of row `:21`.
- Remove `javascript.deno` from the `supported:` list of the `modules`, `onuncaughtexception`, `unhandledrejection` and `console` common pages.
- Remove `javascript.deno` from the `notSupported` list of `common/configuration/integrations/breadcrumbs.mdx`: the Deno SDK installs `breadcrumbsIntegration()` (`packages/deno/src/sdk.ts:39`) and exports it (`packages/deno/src/index.ts:164`).

---

_From the runtime docs audit of September 2026, item DOC-D2, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._

`platform-includes/configuration/integrations/javascript.deno.mdx:5-12` lists eight auto-enabled integrations: `breadcrumbs`, `contextLines`, `dedupe`, `denoContext`, `functionToString`, `globalHandlers`, `inboundFilters`, `linkedErrors`. Row `:21` has five cells instead of six, so `zodErrors` renders a check under the Cron column.

What was observed: the Deno SDK installs 39 integrations, adding `RequestData`, `DenoServe`, `DenoHttp`, `NormalizePaths`, `Express`, `Fastify`, `Hapi`, `Koa`, `Graphql`, `Mongo`, `Mongoose`, `Mysql`, `Mysql2`, `Redis`, `Postgres`, `Prisma`, `Tedious`, `GenericPool`, `Kafka`, `Amqplib`, `LruMemoizer`, `Aws`, `LangChain`, `LangGraph`, `VercelAI`, `OpenAI`, `Anthropic_AI`, `Google_GenAI`, `PostgresJs`, `Firebase` and `SpanStreaming`. `DenoServe` and `DenoHttp` produce every Deno transaction. Outgoing `fetch` produces breadcrumbs only. The library integrations need the `@sentry/deno/import` hook. The installed list comes from `packages/deno/src/sdk.ts:28-49`.

What to change:

- Rewrite the table from `packages/deno/src/sdk.ts:28-49` so every installed integration has a row.
- Add a "Requires `@sentry/deno/import`" column and tick the library, messaging and AI rows.
- Add rows for `denoServeIntegration` and `denoHttpIntegration`, noting they produce Deno transactions, and state that outgoing `fetch` yields breadcrumbs only.
- Fix the cell count of row `:21`.
- Remove `javascript.deno` from the `supported:` list of the `modules`, `onuncaughtexception`, `unhandledrejection` and `console` common pages.

---

_From the runtime docs audit of September 2026, item DOC-D2, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._

# Reproduction for getsentry/sentry-javascript#24386

Cloudflare Worker built with Vite and `sentryCloudflareVitePlugin()` that constructs `new Hono()` and `new Mastra()` at module scope, where workerd disallows `diagnostics_channel` publish. Tested with [#24371](https://github.com/getsentry/sentry-javascript/pull/24371) (Hono orchestrion instrumentation) cherry-picked on top.

Without #24386 the worker does not start: `Disallowed operation called within global scope`.

## Getting started

Build the SDK branch and publish `core`, `opentelemetry`, `server-utils` and `cloudflare` with `yarn yalc:publish`, then:

```sh
$ yalc add @sentry/cloudflare @sentry/core @sentry/opentelemetry @sentry/server-utils
$ pnpm i
```

Create `.dev.vars` (untracked):

```sh
SENTRY_DSN="https://<key>@<org>.ingest.sentry.io/<project>"
REPRO_ENV="local"
```

## Running

```sh
$ pnpm build
$ pnpm dev
```

Deploy with `npx wrangler deploy -c dist/repro_24386_hono_mastra/wrangler.json --var "SENTRY_DSN:<dsn>" --var "REPRO_ENV:<env>"`.

Routes:

- `GET /workflow/:id`: runs a Mastra workflow, expect `gen_ai.invoke_agent` (`auto.ai.mastra`) and a Hono `middleware` span
- `GET /hono/:id`: Hono constructor channel subscribers and `app.routes`, the Sentry middleware must be first
- `GET /channels/:id`: Mastra channel subscribers, registered exporters (exactly one `sentry-sdk`) and channel store binding
- `GET /boom/:id`: throws, expect an error event

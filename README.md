# TET-2892 — Vercel AI SDK v7 on Cloudflare

`src/index.ts` is the snippet from
[TET-2892](https://linear.app/getsentry/issue/TET-2892/vercel-ai-sdk-v7-captures-no-genai-spans-on-cloudflare),
verbatim.

## Getting started

```sh
pnpm install
```

Create `.dev.vars` (untracked):

```sh
SENTRY_DSN="https://<key>@<org>.ingest.sentry.io/<project>"
OPENROUTER_API_KEY="sk-or-v1-..."
```

## Running

```sh
pnpm dev          # npx wrangler dev --port 8787

curl localhost:8787/generate
curl localhost:8787/stream
```

# Reproduction for getsentry/sentry-javascript#20099

RPC trace propagation with Cloudflare Agents SDK and `instrumentDurableObjectWithSentry`.

## Getting started

```bash
$ pnpm i
$ cp .env.example .env
```

## Reproduction Steps

1. Add your Sentry DSN to `.env`:
   ```
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```

2. Run the preview locally:
   ```bash
   $ pnpm preview
   ```

3. Open the deployed worker URL in your browser and interact with the Agent.

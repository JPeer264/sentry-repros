# Reproduction for getsentry/sentry-javascript#20409

Root `http.server` span lost on streaming responses exceeding `ctx.waitUntil` 30s budget.

## Getting started

```sh
$ pnpm i
```

## Reproduction Steps

1. Add your Sentry DSN to `wrangler.jsonc`:
   ```jsonc
   "vars": {
     "SENTRY_DSN": "https://xxx@xxx.ingest.sentry.io/xxx"
   }
   ```

2. Deploy the upstream worker first (this one is just having a long stream response):
   ```sh
   $ pnpm run deploy:upstream
   ```

3. Deploy the main worker:
   ```sh
   $ pnpm run deploy
   ```

4. Open the deployed worker URL in your browser (or use curl):
   ```sh
   $ curl "https://temp-cloudflare-20409.<your-subdomain>.workers.dev/"
   ```

5. Wait for the stream to complete (~45 seconds).

6. Check Sentry for the root `http.server` span — it will be missing. And also check Cloudflare for the debug logs


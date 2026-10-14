# Reproduction for getsentry/sentry-javascript#24839

TanStack Start app on Cloudflare Workers, built with `@cloudflare/vite-plugin` (no Nitro), `sentryTanstackStart()` and `sentryCloudflareVitePlugin()`. The `/` loader calls a server function with `.middleware([logMiddleware])`. The middleware runs, but it sends no `middleware` span, because the plugin skips the server function module `src/routes/index.tsx?tss-serverfn-split`: it checks the file extension against the whole id, query included.

## Getting started

```sh
$ pnpm i
```

## Running

```sh
$ pnpm build
[Sentry] Auto-wrapping .middleware( in .../src/routes/index.tsx
[Sentry] Auto-wrapping requestMiddleware in .../@tanstack/start-server-core/dist/esm/createStartHandler.js
[Sentry] Auto-wrapping .middleware( in .../src/routes/index.tsx
$ pnpm start
```

Then request `http://localhost:8787/`. The Worker logs:

```
logMiddleware executed
[span] http.server GET /
```

Expected: the build also logs `Auto-wrapping .middleware( in .../src/routes/index.tsx?tss-serverfn-split`, and the Worker logs `[span] middleware logMiddleware` before the `http.server` span.

Without `SENTRY_DSN` in `.dev.vars`, the spans are logged instead of sent.

Tested with `@sentry/tanstackstart-react` 11.7.0, `@sentry/cloudflare` 11.7.0, `@tanstack/react-start` 1.169.2, Vite 8.3.4, `@cloudflare/vite-plugin` 1.64.0, wrangler 4.151.0, Node.js 22.23.1, pnpm 12.3.4.

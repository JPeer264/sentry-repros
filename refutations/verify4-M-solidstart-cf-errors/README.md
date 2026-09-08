# verify4-M-solidstart-cf-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-solidstart-cf` (see `$REPRO/cells/M-solidstart-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RECIPE-nitro-error-plugin.ts`, `app.config.ts`, `build-b.log`, `build-c.log`, `build-control.log`, `build-d.log`, `build-final.log`, `build-final2.log`, `build1.log`, `build2.log`, `build3.log`, `install-b.log`, `package-lock.json`, `package.json`, `raw-b.jsonl`, `raw-final.jsonl`, `server/`, `sink-b.log`, `sink-b.pid`, `sink.log`, `sink.pid`, `sinkraw.log`, `sinkraw.mjs`, `sinkraw.pid`, `sinkraw2.log`, `sinkraw2.pid`, `src/`, `worker.mjs`, `wr-b.log`, `wr-b.pid`, `wr.pid`, `wrangler.jsonc`, `wrangler1.log`, `wrangler2.log`, `wrangler3.log`, `wrangler4.log`, `wrangler5.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. A thrown route-handler error does become a Sentry event on SolidStart 1.3 + Cloudflare Workers. The missing piece is not a SolidStart hook, it is a **Nitro plugin registering the h3 `error` hook** — the same hook `@sentry/nitro` (packages/nitro/src/runtime/plugins/server.ts:7) and `@sentry/nuxt` (sentry-cloudflare.server.ts:128) register. SolidStart forwards `server.plugins` in `app.config.ts` straight to Nitro, so the hook is available on workerd; the previous probe simply did not register one.

Probe dir: $SCRATCH/deep/verify4-M-solidstart-cf-errors (node_modules removed; `npm install` restores it). Files: app.config.ts, src/server-plugin.ts (= RECIPE-nitro-error-plugin.ts), worker.mjs, wrangler.jsonc, src/routes/api/{boom,trace,sentinel}.ts, src/routes/ssrboom.tsx, sinkraw.mjs, raw-final.jsonl, wr-b.log.

Rerun: `npm install` ; `PORT=47311 node $REPRO/_toolbox/sink.mjs > sink-b.log 2>&1 &` ; `npx vinxi build` ; `npx wrangler dev --config wrangler.jsonc --port 47312 --inspector-port 0` ; `curl -s -o /dev/null http://127.0.0.1:47312/api/boom`.

CONTROL (identical build, only `plugins: ['./src/server-plugin.ts']` removed from app.config.ts) — `GET /api/boom` 500, no event, exactly as reported:
  /api/boom=500
  CONTROL span {"items":[{"name":"GET", ... "status":"e...   <- only the errored server span
  CONTROL event [('trace-probe','generic',True)]            <- manual capture still works
  CONTROL event [('sentinel','generic',True)]

WITH the plugin (traceLifecycle 'static', sink /__items, request/user trimmed):
  {"type": "event", "exception": "Error: solidstart-cf boom", "mechanism": "chained", "handled": true, "sdk": "sentry.javascript.cloudflare", "trace_id": "92b8ab0e54a34586bea8489731033862"}
  {"type": "transaction", "name": "GET /api/boom", "op": "http.server", "source": "url", "status": "internal_error", "trace_id": "92b8ab0e54a34586bea8489731033862", "spans": []}
(the compact sink prints `exception.values[0]`, which is the H3 error's `cause`. The raw envelope, raw-final.jsonl, shows the top-level mechanism is the unhandled one:)
  Error | solidstart-cf boom | {"handled": true, "type": "chained", "source": "cause", "exception_id": 1, "parent_id": 0}
  Error | solidstart-cf boom | {"type": "auto.function.nitro.captureErrorHook", "handled": false, "exception_id": 0}
  contexts.nitro: {"method": "GET", "path": "/api/boom"}
The event shares the request's trace_id with the transaction, carries request URL/headers/user.ip_address, and wrangler logs `Sentry Logger [log]: Captured error event \`solidstart-cf boom\`` right before the `[request error] [unhandled]` line.

Also verified: works identically on the develop default `traceLifecycle: 'stream'` (event + `span` envelope, trace d1bda53e…); the 3xx/4xx guard in the plugin mirrors the SDK's own `captureErrorHook`; `@sentry/cloudflare` must stay in `rollupConfig.external` or the plugin gets a second module instance.

RESIDUAL GAP (new, not in the original report): an error thrown while Solid renders a *page* (src/routes/ssrboom.tsx) still produces no event — only `{"type":"transaction","name":"GET /ssrboom","status":"internal_error"}`. SolidStart's cloudflare path does `renderToStream(...)` then `stream.pipeTo(writable); return readable`, so the render error surfaces inside the detached pipe after the Response was returned; neither Nitro's `error` hook nor `withSentry` ever sees it. Two dead ends tried: `createHandler(fn, { onError })` — solid's `onError` is the seroval *serializer* callback, never fired for render errors; `mode: 'sync'` — swallows the error entirely and returns 200 with partial HTML, which is worse. API routes, server functions and anything else that throws into h3 are covered by the hook.

## Workaround

Add a Nitro plugin and register it in app.config.ts (full file at .../verify4-M-solidstart-cf-errors/RECIPE-nitro-error-plugin.ts):

// src/server-plugin.ts
import * as Sentry from '@sentry/cloudflare';
export default function sentryNitroPlugin(nitroApp: any) {
  nitroApp.hooks.hook('error', (error: any, errorContext: any) => {
    const status = error?.statusCode ?? error?.status;
    if (typeof status === 'number' && status >= 300 && status < 500) return;
    Sentry.captureException(error, {
      captureContext: { contexts: { nitro: { method: errorContext?.event?.method, path: errorContext?.event?.path } } },
      mechanism: { handled: false, type: 'auto.function.nitro.captureErrorHook' },
    });
  });
}

// app.config.ts
export default defineConfig({
  server: {
    preset: 'cloudflare-module',
    plugins: ['./src/server-plugin.ts'],
    rollupConfig: { external: ['@sentry/cloudflare'] },  // required: keeps one module instance
  },
});

Everything else stays as reported: worker.mjs wraps `.output/server/index.mjs` in `Sentry.withSentry`, wrangler.jsonc points `main` at worker.mjs. SDK-side follow-up: `@sentry/solidstart` could ship this as a cloudflare entry the way `@sentry/nuxt` ships `sentryCloudflareNitroPlugin`.

## Docs impact

The SolidStart guide (~/dev/sentry-docs/docs/platforms/javascript/guides/solidstart/ has no Cloudflare page at all) needs a "SolidStart on Cloudflare Workers" section stating: use `@sentry/cloudflare` on the server (`@sentry/solidstart`'s server entry is Node-only), wrap the Nitro output with `Sentry.withSentry` in a hand-written `worker.mjs`, keep `@sentry/cloudflare` in `server.rollupConfig.external`, and — this is the part that is otherwise silently missing — register a Nitro plugin via `server.plugins` that does `nitroApp.hooks.hook('error', error => Sentry.captureException(error, { mechanism: { handled: false, type: 'auto.function.nitro.captureErrorHook' } }))`, because without it Nitro swallows every error thrown from a route handler and Sentry only records a 500 transaction; note that errors thrown while a page renders on the server are still not captured, since SolidStart streams the render through a detached pipe.

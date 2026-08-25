import * as Sentry from '@sentry/cloudflare';
import { DurableObject } from 'cloudflare:workers';

// No Sentry wrappers here: `sentryCloudflareVitePlugin()` wraps the default export with `withSentry`
// and `ReproDO` with `instrumentDurableObjectWithSentry` at build time, options come from
// `./instrument.server.ts`.

export class ReproDO extends DurableObject<Env> {
  // Cheap RPC method for the burst fan-out: the point is the per-call instrumentation, not the body.
  echo(n: number): number {
    return n;
  }

  // The audit span ends in `waitUntil`, AFTER this RPC method returned.
  async recordCheckout(orderId: string): Promise<{ recorded: boolean }> {
    await this.ctx.storage.put(`checkout:${orderId}`, { orderId, ts: Date.now() });

    this.ctx.waitUntil(
      Sentry.startSpan({ name: 'do.audit-flush', op: 'db.audit' }, async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        await this.ctx.storage.put(`audit:${orderId}`, { orderId, flushed: true });
        Sentry.captureMessage(`audit flushed for ${orderId}`, 'info');
      }),
    );

    return { recorded: true };
  }

  // Detached continuation: not awaited, not registered with `waitUntil`. The RPC invocation
  // settles immediately, the captures fire `delayMs` later. Delivered only with `cacheClient: true`,
  // a per-invocation client is already disposed at that point.
  startDetachedWork(delayMs: number, requestId: string): { started: boolean } {
    void (async () => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      await Sentry.startSpan({ name: 'do.detached-task', op: 'task' }, async () => {
        Sentry.captureException(new Error(`captured from detached DO work: ${requestId}`));
        Sentry.logger.info('detached DO log', { requestId });
        Sentry.metrics.count('do.detached', 1);
      });
    })();
    return { started: true };
  }
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    Sentry.getActiveSpan()?.setAttribute('repro.request_id', requestId);
    const stub = env.REPRO_DO.get(env.REPRO_DO.idFromName('repro'));

    switch (url.pathname) {
      case '/health':
        return new Response('ok');

      // N sequential DO RPC calls in one trace.
      case '/burst': {
        const n = Math.min(Number(url.searchParams.get('n')) || 20, 500);
        let sum = 0;
        for (let i = 0; i < n; i++) {
          sum += await stub.echo(i);
        }
        return Response.json({ calls: n, sum });
      }

      // Critical work synchronously, the rest deferred with `waitUntil` and finishing AFTER the response.
      case '/checkout': {
        const orderId = crypto.randomUUID();
        const result = await stub.recordCheckout(orderId);

        ctx.waitUntil(
          Sentry.startSpan({ name: 'checkout.post-response', op: 'task' }, async () => {
            Sentry.captureMessage(`checkout analytics sent for ${orderId}`, 'info');
            Sentry.logger.info('checkout post-response log', { orderId });
            Sentry.metrics.count('checkout.processed', 1);
            await new Promise(resolve => setTimeout(resolve, 100));

            await Sentry.startSpan({ name: 'checkout.notify-webhook', op: 'http.client' }, async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
              Sentry.captureException(new Error(`Webhook delivery failed for ${orderId}`));
            });
          }),
        );

        return Response.json({ orderId, ...result });
      }

      // The response returns at once; the DO captures ~500ms later, after worker request and RPC settled.
      case '/detached':
        return Response.json(await stub.startDetachedWork(500, requestId));

      default:
        return new Response('Not found', { status: 404 });
    }
  },
} satisfies ExportedHandler<Env>;

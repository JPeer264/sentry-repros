import * as Sentry from '@sentry/cloudflare';
import { DurableObject, WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';

const ISOLATE_ID = Math.random().toString(36).slice(2, 10);

// EDGE_CASES=false removes every post-response and detached capture, so an SDK without eager
// delivery emits exactly the same telemetry as one with it (1:1 CPU comparisons).
const edgeCases = (env: Env): boolean => env.EDGE_CASES !== 'false';

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export class ReproDO extends DurableObject<Env> {
  // Cheap RPC method for the burst fan-out: the point is the per-call instrumentation, not the body.
  echo(n: number): number {
    return n;
  }

  add(a: number, b: number): number {
    return a + b;
  }

  greet(name: string): string {
    return `Hello, ${name}!`;
  }

  processData(data: Record<string, unknown>): Record<string, unknown> {
    return { ...data, processed: true, keys: Object.keys(data).length };
  }

  fibonacci(n: number): number {
    let a = 0;
    let b = 1;
    for (let i = 0; i < n; i++) {
      [a, b] = [b, a + b];
    }
    return a;
  }

  // Scope-leak probe: what this RPC invocation sees on its isolation scope. A leaked caller scope
  // shows the worker's `probe.owner` tag, a leaked previous invocation shows its `probe.do.*` tag.
  probeScope(label: string): Record<string, unknown> {
    const tagsSeenAtEntry = { ...Sentry.getIsolationScope().getScopeData().tags };
    Sentry.setTag(`probe.do.${label}`, 'seen');
    return { label, tagsSeenAtEntry };
  }

  // The audit span ends in `waitUntil`, AFTER this RPC method returned.
  async recordCheckout(orderId: string): Promise<{ recorded: boolean }> {
    await this.ctx.storage.put(`checkout:${orderId}`, { orderId, ts: Date.now() });

    if (!edgeCases(this.env)) {
      return { recorded: true };
    }

    this.ctx.waitUntil(
      Sentry.startSpan({ name: 'do.audit-flush', op: 'db.audit' }, async () => {
        await sleep(150);
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
    if (!edgeCases(this.env)) {
      return { started: false };
    }
    void (async () => {
      await sleep(delayMs);
      await Sentry.startSpan({ name: 'do.detached-task', op: 'task' }, async () => {
        Sentry.captureException(new Error(`captured from detached DO work: ${requestId}`));
        Sentry.logger.info('detached DO log', { requestId });
        Sentry.metrics.count('do.detached', 1);
      });
    })();
    return { started: true };
  }
}

interface ClientProbe {
  isolateId: string;
  clientId: string | null;
  isCachedClient: boolean | null;
  tracesSampleRate: number | null;
  environment: string | null;
  hasDedupe: boolean;
  integrations: string[];
  isolationTag?: string | null;
}

// Which client and isolate the current code runs on; the fetch handler and the workflow both
// report it so the two can be compared per request id.
function clientProbe(): ClientProbe {
  const client = Sentry.getClient() as
    | (ReturnType<typeof Sentry.getClient> & { __probeClientId?: string; isCachedClient?: boolean })
    | undefined;
  if (client && !client.__probeClientId) {
    client.__probeClientId = Math.random().toString(36).slice(2, 10);
  }
  const options = client?.getOptions();
  return {
    isolateId: ISOLATE_ID,
    clientId: client?.__probeClientId ?? null,
    isCachedClient: client?.isCachedClient ?? null,
    tracesSampleRate: options?.tracesSampleRate ?? null,
    environment: options?.environment ?? null,
    hasDedupe: Boolean(client?.getIntegrationByName('Dedupe')),
    integrations: (options?.integrations ?? []).map(integration => integration.name),
  };
}

// Two identical errors from the same line: the dedupe integration drops the second one, so the
// delivered count tells whether dedupe is active.
function captureDuplicatePair(label: string, requestId: string): void {
  const makeError = (): Error => new Error(`${label} dup ${requestId}`);
  for (let i = 0; i < 2; i++) {
    Sentry.captureException(makeError());
  }
}

export class ReproWorkflow extends WorkflowEntrypoint<Env, { requestId: string }> {
  async run(event: WorkflowEvent<{ requestId: string }>, step: WorkflowStep): Promise<ClientProbe & { requestId: string }> {
    const requestId = event.payload.requestId;
    // Written on the run's isolation scope; visible inside a step only if the step callback
    // still runs in the run's async context.
    Sentry.setTag('wf.run', requestId);

    const probe = await step.do(`probe-${requestId}`, async () => {
      const info = {
        ...clientProbe(),
        isolationTag: (Sentry.getIsolationScope().getScopeData().tags['wf.run'] as string | undefined) ?? null,
      };
      captureDuplicatePair('wf', requestId);
      Sentry.logger.info('wf step log', { requestId });
      Sentry.metrics.count('wf.step', 1, { attributes: { requestId } });
      await Sentry.startSpan({ name: 'wf.inner', op: 'task' }, span => {
        span.setAttribute('repro.request_id', requestId);
      });
      return info;
    });

    await step.do(`detach-${requestId}`, async () => {
      // Continuations that end after `run` returned. The Workflows engine finalizes the instance
      // when `run` resolves, so neither variant is expected to be delivered; they are kept to
      // detect a change in that behaviour.
      setTimeout(() => {
        Sentry.startSpan({ name: 'wf.detached', op: 'task' }, span => {
          span.setAttribute('repro.request_id', requestId);
        });
        Sentry.logger.info('wf detached log', { requestId });
        Sentry.captureMessage(`wf detached ${requestId}`);
      }, 2500);
      this.ctx.waitUntil(
        sleep(2500).then(() => {
          Sentry.startSpan({ name: 'wf.detached-waituntil', op: 'task' }, span => {
            span.setAttribute('repro.request_id', requestId);
          });
          Sentry.logger.info('wf detached-waituntil log', { requestId });
          Sentry.captureMessage(`wf detached-waituntil ${requestId}`);
        }),
      );
      return { scheduled: true };
    });

    return { requestId, ...probe };
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

        if (!edgeCases(env)) {
          return Response.json({ orderId, ...result });
        }

        ctx.waitUntil(
          Sentry.startSpan({ name: 'checkout.post-response', op: 'task' }, async () => {
            Sentry.captureMessage(`checkout analytics sent for ${orderId}`, 'info');
            Sentry.logger.info('checkout post-response log', { orderId });
            Sentry.metrics.count('checkout.processed', 1);
            await sleep(100);

            await Sentry.startSpan({ name: 'checkout.notify-webhook', op: 'http.client' }, async () => {
              await sleep(50);
              Sentry.captureException(new Error(`Webhook delivery failed for ${orderId}`));
            });
          }),
        );

        return Response.json({ orderId, ...result });
      }

      // The response returns at once; the DO captures ~500ms later, after worker request and RPC settled.
      case '/detached':
        return Response.json(await stub.startDetachedWork(500, requestId));

      // Two independent background jobs, each in its OWN trace, whose spans end in the SAME
      // synchronous turn after the invocation's flush point. A per-invocation flush debounce delivers
      // only the first trace; run this sparsely (>= 7s apart) so a later invocation cannot rescue the second.
      case '/multi-trace':
        ctx.waitUntil(
          (async () => {
            await sleep(100);
            await Promise.all(
              ['bg.job-a', 'bg.job-b'].map(name =>
                Sentry.startNewTrace(() =>
                  Sentry.startSpan({ name, op: 'task' }, span => {
                    span.setAttribute('repro.request_id', requestId);
                  }),
                ),
              ),
            );
          })(),
        );
        return Response.json({ requestId });

      // Async-gap probe: captures separated by real awaits around the invocation's flush point.
      // Everything before the boundary flush rides it; every capture after it lands in a DIFFERENT
      // turn (timers in between), so each needs its own eager drain and its own `waitUntil`
      // registration. The detached chain is not registered with waitUntil at all; it overlaps the
      // waitUntil window, so with a cached client its captures must survive.
      case '/async-probe': {
        Sentry.logger.info('ap sync log', { requestId });
        Sentry.metrics.count('ap.sync', 1, { attributes: { requestId } });
        Sentry.startSpan({ name: 'ap.sync', op: 'task' }, span => span.setAttribute('repro.request_id', requestId));

        ctx.waitUntil(
          (async () => {
            await sleep(50);
            Sentry.logger.info('ap wu1 log', { requestId });
            await sleep(50);
            Sentry.metrics.count('ap.wu2', 1, { attributes: { requestId } });
            await sleep(50);
            await Sentry.startSpan({ name: 'ap.wu-span', op: 'task' }, async span => {
              span.setAttribute('repro.request_id', requestId);
              await sleep(50);
              Sentry.logger.info('ap wu3 log', { requestId });
            });
            // Keeps the invocation alive until the detached chain below has fired.
            await sleep(150);
          })(),
        );

        void (async () => {
          await sleep(100);
          Sentry.logger.info('ap detached log', { requestId });
          await sleep(50);
          await Sentry.startSpan({ name: 'ap.detached-span', op: 'task' }, span =>
            span.setAttribute('repro.request_id', requestId),
          );
          Sentry.metrics.count('ap.detached', 1, { attributes: { requestId } });
        })();

        return Response.json({ requestId });
      }

      // Exactly one log, `delay` ms after the response, inside waitUntil, and nothing after it. The
      // boundary flush is already waiting on the network by then; a capture landing in that window
      // must be delivered on its own, no later capture will drain it.
      case '/single-capture': {
        const delay = Math.min(Number(url.searchParams.get('delay')) || 20, 5000);
        ctx.waitUntil(
          sleep(delay).then(() => {
            Sentry.logger.info('single capture log', { requestId, delay });
          }),
        );
        return Response.json({ requestId, delay });
      }

      // Does a DO RPC invocation run on the caller's isolation scope, and do two RPC calls in one
      // parent invocation share a scope with each other?
      case '/scope-probe': {
        Sentry.setTag('probe.owner', `worker-${requestId}`);
        const first = await stub.probeScope('call1');
        const second = await stub.probeScope('call2');
        const workerTagsAfter = { ...Sentry.getIsolationScope().getScopeData().tags };
        return Response.json({ requestId, first, second, workerTagsAfter });
      }

      // Sizes of the scopes visible to a request: nothing may accumulate across invocations on a
      // long-lived client.
      case '/scope-size': {
        const size = (scope: ReturnType<typeof Sentry.getCurrentScope>): Record<string, number> => {
          const data = scope.getScopeData();
          return {
            breadcrumbs: data.breadcrumbs.length,
            eventProcessors: data.eventProcessors.length,
            attachments: data.attachments.length,
            contexts: Object.keys(data.contexts).length,
            tags: Object.keys(data.tags).length,
            extra: Object.keys(data.extra).length,
            sdkProcessingMetadata: Object.keys(data.sdkProcessingMetadata).length,
          };
        };
        return Response.json({
          current: size(Sentry.getCurrentScope()),
          isolation: size(Sentry.getIsolationScope()),
          global: size(Sentry.getGlobalScope()),
        });
      }

      // Different RPC methods and argument shapes.
      case '/call': {
        const method = url.searchParams.get('method') || 'add';
        const calls: Record<string, () => Promise<unknown>> = {
          add: () => stub.add(1, 2),
          greet: () => stub.greet('repro'),
          processData: () => stub.processData({ key: 'value', nested: { a: 1, b: 2 } }),
          fibonacci: () => stub.fibonacci(20),
        };
        const call = calls[method];
        if (!call) {
          return new Response(`Unknown method: ${method}`, { status: 400 });
        }
        return Response.json({ method, result: await call() });
      }

      // The handler and the workflow both report their client and isolate.
      case '/wf-probe': {
        const handler = clientProbe();
        captureDuplicatePair('handler', requestId);
        const instance = await env.REPRO_WORKFLOW.create({ id: `wf-${requestId}`, params: { requestId } });

        let workflow: unknown = 'timeout';
        for (let i = 0; i < 60; i++) {
          try {
            const status = await instance.status();
            if (status.status === 'complete' || status.status === 'errored') {
              workflow = status;
              break;
            }
          } catch {
            // status() may not be available yet
          }
          await sleep(500);
        }
        return Response.json({ requestId, handler, workflow });
      }

      default:
        return new Response('Not found', { status: 404 });
    }
  },
} satisfies ExportedHandler<Env>;

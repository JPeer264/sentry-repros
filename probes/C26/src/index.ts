import * as Sentry from '@sentry/cloudflare';
import { instrumentWorkflowWithSentry, withSentry } from '@sentry/cloudflare';
import { WorkflowEntrypoint } from 'cloudflare:workers';

interface Env {
  PROBE: Workflow;
  PLAIN: Workflow;
  SENTRY_DSN: string;
  SENTRY_TUNNEL: string;
}

interface Params {
  throwTimes: number;
  limit: number;
}

const sentryOptions = (env: Env) => ({
  dsn: env.SENTRY_DSN,
  tunnel: env.SENTRY_TUNNEL,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});

class ProbeWorkflowBase extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<unknown> {
    const throwTimes = Number(event.payload?.throwTimes ?? 0);
    const limit = Number(event.payload?.limit ?? 3);

    const one = await step.do('step-one', async () => {
      return { hello: 'world' };
    });

    const two = await step.do(
      'step-two',
      { retries: { limit, delay: '1 second', backoff: 'constant' }, timeout: '10 minutes' },
      async (ctx: any) => {
        const attempt = Number(ctx?.attempt ?? 0);
        console.log('step-two ctx:', JSON.stringify(ctx), 'attempt#', attempt);
        if (attempt <= throwTimes) {
          throw new Error(`step-two boom ${event.instanceId}`);
        }
        return { ok: true, attempts: attempt };
      },
    );

    return { one, two };
  }
}

/** Control class with the same steps, deliberately not wrapped by the SDK. */
export class PlainWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<unknown> {
    const throwTimes = Number(event.payload?.throwTimes ?? 0);
    const limit = Number(event.payload?.limit ?? 3);

    const one = await step.do('step-one', async () => {
      return { hello: 'world' };
    });

    const two = await step.do(
      'step-two',
      { retries: { limit, delay: '1 second', backoff: 'constant' }, timeout: '10 minutes' },
      async (ctx: any) => {
        const attempt = Number(ctx?.attempt ?? 0);
        console.log('plain step-two ctx:', JSON.stringify(ctx), 'attempt#', attempt);
        if (attempt <= throwTimes) {
          throw new Error(`plain step-two boom ${event.instanceId}`);
        }
        return { ok: true, attempts: attempt };
      },
    );

    return { one, two };
  }
}

export const ProbeWorkflow = instrumentWorkflowWithSentry(sentryOptions, ProbeWorkflowBase);

export default withSentry(sentryOptions, {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const binding = url.searchParams.get('plain') ? env.PLAIN : env.PROBE;

    if (url.pathname === '/trigger') {
      const id = url.searchParams.get('id') ?? crypto.randomUUID();
      const instance = await binding.create({
        id,
        params: {
          throwTimes: Number(url.searchParams.get('throwTimes') ?? 0),
          limit: Number(url.searchParams.get('limit') ?? 3),
        },
      });
      return Response.json({ id: instance.id });
    }

    if (url.pathname.startsWith('/status/')) {
      const instance = await binding.get(decodeURIComponent(url.pathname.slice('/status/'.length)));
      return Response.json(await instance.status());
    }

    if (url.pathname === '/sentinel') {
      Sentry.captureMessage(url.searchParams.get('msg') ?? 'sentinel 1');
      return new Response('ok');
    }

    return new Response('not found', { status: 404 });
  },
});

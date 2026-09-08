import { DurableObject, WorkerEntrypoint, WorkflowEntrypoint } from 'cloudflare:workers';
import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import mysql from 'mysql';

// This file deliberately contains NO `Sentry.*` call and no import of
// `@sentry/cloudflare`. Everything below is wrapped at build time by
// `sentryCloudflareVitePlugin()`, which reads wrangler.jsonc, wraps the default
// export with `withSentry`, the Durable Object with
// `instrumentDurableObjectWithSentry`, the Workflow with
// `instrumentWorkflowWithSentry` and the self-bound WorkerEntrypoint with
// `withSentry`, and adds COUNTER / SELF to `rpcTracePropagationBindings`.

// Module scope on purpose: a driver whose module first loads inside a request
// gets no channel event. In workerd the socket is bound to the first request's
// I/O context, so only the FIRST /db of a fresh isolate answers.
const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
});

function query(sql: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err: unknown, rows: unknown) => (err ? reject(err) : resolve(rows)));
  });
}

export class Counter extends DurableObject {
  private n = 0;

  async bump(): Promise<string> {
    this.n += 1;
    return 'bumped';
  }
}

export class MyWorkflow extends WorkflowEntrypoint<Env> {
  async run(_event: WorkflowEvent<unknown>, step: WorkflowStep): Promise<string> {
    return step.do('one', async () => 'done');
  }
}

export class Api extends WorkerEntrypoint<Env> {
  async ping(): Promise<string> {
    return 'pong';
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/db') {
      return Response.json(await query('SELECT * FROM users'));
    }

    if (url.pathname === '/do') {
      const stub = env.COUNTER.get(env.COUNTER.idFromName('a'));
      return Response.json({ do: await stub.bump() });
    }

    if (url.pathname === '/rpc') {
      return Response.json({ rpc: await env.SELF.ping() });
    }

    if (url.pathname === '/injected') {
      const marker = (globalThis as Record<string, any>).__SENTRY_ORCHESTRION__;
      return Response.json({
        integrations: marker?.integrations ? [...marker.integrations.keys()] : [],
        bundler: marker?.bundler ? [...marker.bundler] : null,
      });
    }

    if (url.pathname === '/error') {
      throw new Error('route boom');
    }

    if (url.pathname === '/sentinel') {
      // The plugin never touches this route: the sentinel is a plain request
      // span, which is enough to know everything before it has been flushed.
      return Response.json({ sentinel: true });
    }

    return Response.json({ ok: true });
  },
} satisfies ExportedHandler<Env>;

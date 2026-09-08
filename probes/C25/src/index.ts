import * as Sentry from '@sentry/cloudflare';
import { WorkerEntrypoint } from 'cloudflare:workers';

interface Env {
  SINK: string;
  RPC_PROPAGATION: string;
  SELF: Service<Api>;
}

type Service<T> = {
  fetch: (input: string | Request, init?: RequestInit) => Promise<Response>;
} & { [K in keyof T]: T[K] };

function sentryOptions(env: Env): Record<string, unknown> {
  return {
    dsn: 'https://public@example.invalid/1',
    tunnel: env.SINK,
    tracesSampleRate: 1.0,
    ...(env.RPC_PROPAGATION === 'off' ? {} : { rpcTracePropagationBindings: ['SELF'] }),
  };
}

class ApiEntrypoint extends WorkerEntrypoint<Env> {
  async hello(name: string): Promise<string> {
    if (name === 'boom') {
      throw new Error('rpc boom');
    }
    return `hello ${name}`;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    return new Response(`api fetch ${url.pathname} sentry-trace=${request.headers.get('sentry-trace')}\n`);
  }
}

export const Api = Sentry.withSentry(sentryOptions, ApiEntrypoint);
export type Api = ApiEntrypoint;

export default Sentry.withSentry(sentryOptions, {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/rpc') {
      const result = await env.SELF.hello('x');
      return new Response(`${result}\n`);
    }

    if (url.pathname === '/rpc-error') {
      try {
        await env.SELF.hello('boom');
      } catch (e) {
        return new Response(`caught ${(e as Error).message}\n`);
      }
      return new Response('no error\n');
    }

    if (url.pathname === '/svc-fetch') {
      const res = await env.SELF.fetch('http://api.invalid/inner');
      return new Response(await res.text());
    }

    if (url.pathname === '/sentinel') {
      Sentry.captureMessage('sentinel');
      return new Response('sentinel\n');
    }

    return new Response('ok\n');
  },
});

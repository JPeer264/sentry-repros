import { DurableObject } from 'cloudflare:workers';
import * as Sentry from '@sentry/cloudflare';

interface Env {
  DO: DurableObjectNamespace<MyDO>;
  SENTRY_TUNNEL: string;
}

const sentryOptions = (env: Env) => ({
  dsn: 'https://public@example.invalid/1',
  tunnel: env.SENTRY_TUNNEL,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});

class MyDOBase extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/throw') {
      throw new Error('do fetch boom');
    }

    await this.ctx.storage.put('k', 'v');
    const value = await this.ctx.storage.get('k');
    await this.ctx.storage.list();
    await this.ctx.storage.setAlarm(Date.now() + 1000);

    return new Response(`stored ${value}`);
  }

  async alarm(): Promise<void> {
    await this.ctx.storage.put('alarm-ran', Date.now());
  }

  async hello(): Promise<string> {
    return 'hello from do';
  }

  async fail(): Promise<string> {
    throw new Error('do rpc boom');
  }
}

export const MyDO = Sentry.instrumentDurableObjectWithSentry(sentryOptions, MyDOBase);

export default Sentry.withSentry(
  (env: Env) => ({ ...sentryOptions(env), rpcTracePropagationBindings: ['DO'] }),
  {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);
      const stub = env.DO.get(env.DO.idFromName('probe-c08'));

      if (url.pathname === '/do-fetch') {
        return stub.fetch('https://do/storage');
      }

      if (url.pathname === '/do-throw') {
        return stub.fetch('https://do/throw');
      }

      if (url.pathname === '/do-rpc') {
        return new Response(await stub.hello());
      }

      if (url.pathname === '/do-rpc-throw') {
        return new Response(await stub.fail());
      }

      if (url.pathname === '/sentinel') {
        Sentry.captureMessage('sentinel');
        return new Response('sentinel');
      }

      return new Response('ok');
    },
  } satisfies ExportedHandler<Env>,
);

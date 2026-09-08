import { DurableObject } from 'cloudflare:workers';
import * as Sentry from '@sentry/cloudflare';

interface Env {
  DO: DurableObjectNamespace<WsDO>;
  SENTRY_TUNNEL: string;
}

const sentryOptions = (env: Env) => ({
  dsn: 'https://public@example.invalid/1',
  tunnel: env.SENTRY_TUNNEL,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});

// One user key plus the four reserved framework prefixes the SDK filters out.
const ALL_KEYS = ['mine', 'cf_x', 'cf:y', '__ps_z', '/w'];

class WsDOBase extends DurableObject<Env> {
  async writeAllKeys(value: string): Promise<void> {
    for (const key of ALL_KEYS) {
      await this.ctx.storage.put(key, value);
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/arm') {
      await this.ctx.storage.setAlarm(Date.now() + Number(url.searchParams.get('in') ?? 6000));
      return new Response('armed');
    }

    if (url.pathname === '/onlyfw') {
      await this.ctx.storage.put('cf_x', 1);
      await this.ctx.storage.put('cf:y', 1);
      await this.ctx.storage.put('__ps_z', 1);
      await this.ctx.storage.put('/w', 1);
      await this.ctx.storage.get('cf_x');
      await this.ctx.storage.delete('__ps_z');
      await this.ctx.storage.list({ prefix: 'cf_' });
      return new Response('onlyfw');
    }

    if (url.pathname === '/onlymine') {
      await this.ctx.storage.put('mine', 1);
      await this.ctx.storage.get('mine');
      await this.ctx.storage.delete('mine');
      await this.ctx.storage.list({ prefix: 'mine' });
      return new Response('onlymine');
    }

    if (url.pathname === '/ws') {
      const conn = url.searchParams.get('conn') ?? '?';
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ conn });
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('do ok');
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const conn = (ws.deserializeAttachment() as { conn?: string } | null)?.conn ?? '?';
    const msg = typeof message === 'string' ? message : '<binary>';

    Sentry.setTag('conn', conn);
    Sentry.setTag('msg', msg);

    await this.writeAllKeys(`${conn}:${msg}`);

    if (msg === 'boom') {
      throw new Error(`ws boom ${conn}`);
    }

    Sentry.captureMessage(`ws-msg ${conn} ${msg}`);
    ws.send(`ack ${conn} ${msg}`);
  }

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    const conn = (ws.deserializeAttachment() as { conn?: string } | null)?.conn ?? '?';
    Sentry.setTag('conn', conn);
    Sentry.captureMessage(`ws-close ${conn} ${code}`);
  }

  async alarm(): Promise<void> {
    await this.writeAllKeys('alarm');
    throw new Error('alarm boom');
  }
}

export const WsDO = Sentry.instrumentDurableObjectWithSentry(sentryOptions, WsDOBase);

export default Sentry.withSentry(
  (env: Env) => ({ ...sentryOptions(env), rpcTracePropagationBindings: ['DO'] }),
  {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);
      const stub = env.DO.get(env.DO.idFromName('probe-n5'));

      if (url.pathname === '/final') {
        Sentry.captureMessage(url.searchParams.get('name') ?? 'final-sentinel');
        return new Response('sentinel');
      }

      return stub.fetch(request);
    },
  } satisfies ExportedHandler<Env>,
);

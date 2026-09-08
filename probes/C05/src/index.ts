import * as Sentry from '@sentry/cloudflare';

interface Env {
  Q: Queue<{ n: number }>;
  SENTRY_TUNNEL: string;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://public@example.invalid/1',
    tracesSampleRate: 1.0,
    tunnel: env.SENTRY_TUNNEL,
  }),
  {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === '/send') {
        await env.Q.send({ n: 1 });
        await env.Q.sendBatch([{ body: { n: 2 } }, { body: { n: 3 } }]);
        return new Response('sent');
      }

      if (url.pathname === '/send-bad') {
        await env.Q.send({ n: 99 });
        return new Response('sent-bad');
      }

      if (url.pathname === '/send-sentinel') {
        await env.Q.send({ n: 7 });
        return new Response('sent-sentinel');
      }

      return new Response('ok');
    },

    async queue(batch: MessageBatch<{ n: number }>): Promise<void> {
      for (const message of batch.messages) {
        const n = message.body?.n;

        if (n === 99) {
          throw new Error(`consumer boom n=99 attempt=${message.attempts}`);
        }

        if (n === 7) {
          Sentry.captureMessage('sentinel-queue');
        }

        message.ack();
      }
    },
  } satisfies ExportedHandler<Env>,
);

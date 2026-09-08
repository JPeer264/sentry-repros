import * as Sentry from '@sentry/cloudflare';

interface Env {
  BUCKET: R2Bucket;
  KV: KVNamespace;
  SENTRY_TUNNEL: string;
  TRACE_LIFECYCLE: string;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://public@example.invalid/1',
    tracesSampleRate: 1.0,
    tunnel: env.SENTRY_TUNNEL,
    traceLifecycle: env.TRACE_LIFECYCLE === 'static' ? 'static' : 'stream',
  }),
  {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === '/r2') {
        await env.BUCKET.put('probe/k1', 'hello r2');
        const got = await env.BUCKET.get('probe/k1');
        const text = got ? await got.text() : null;
        const head = await env.BUCKET.head('probe/k1');
        const listed = await env.BUCKET.list({ prefix: 'probe/' });
        await env.BUCKET.delete('probe/k1');

        return Response.json({
          text,
          headSize: head?.size ?? null,
          listed: listed.objects.map(o => o.key),
        });
      }

      if (url.pathname === '/kv') {
        await env.KV.put('probe-k1', 'hello kv');
        const value = await env.KV.get('probe-k1');
        const listed = await env.KV.list({ prefix: 'probe-' });
        await env.KV.delete('probe-k1');

        return Response.json({ value, listed: listed.keys.map(k => k.name) });
      }

      if (url.pathname === '/sentinel') {
        Sentry.captureMessage('sentinel');
        return new Response('sentinel');
      }

      return new Response('ok');
    },
  },
);

import './instrument';
import * as Sentry from '@sentry/bun';

const port = Number(process.env.PORT);

Bun.serve({
  port,
  hostname: '127.0.0.1',
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/ping') {
      return new Response('ok');
    }

    if (url.pathname === '/sentinel') {
      Sentry.captureMessage('sentinel');
      await Sentry.flush(3000);
      return new Response('ok');
    }

    const tag = url.searchParams.get('tag') ?? '';
    Sentry.setTag('req', tag);

    // yield so the five in-flight requests interleave inside the handler
    await new Promise(resolve => setTimeout(resolve, 60));

    Sentry.captureException(new Error('a'));
    const seen = Sentry.getIsolationScope().getScopeData().tags;

    return Response.json({ tag, seen });
  },
});

console.log(`serve listening ${port}`);

import { createServer } from 'node:http';
const Sentry = globalThis.__S;
const MODE = process.env.MODE || 'bare';

async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/tag') {
    const tag = url.searchParams.get('tag');
    Sentry.setTag('probe_tag', tag);
    await new Promise(r => setTimeout(r, 250));
    Sentry.captureException(new Error(`boom-${tag}`));
    res.end(JSON.stringify({ tag, trace: Sentry.getTraceData() }));
    return;
  }
  if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    await Sentry.flush(3000);
    res.end('ok');
    return;
  }
  res.end('ok');
}

createServer((req, res) => {
  if (MODE === 'iso') {
    Sentry.withIsolationScope(async () => {
      await Sentry.continueTrace({ sentryTrace: req.headers['sentry-trace'], baggage: req.headers['baggage'] }, async () => {
        await handle(req, res);
      });
    });
  } else {
    handle(req, res);
  }
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('app listening', process.env.PORT));

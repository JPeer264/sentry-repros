import * as Sentry from '@sentry/node';
import { getDefaultIsolationScope } from '@sentry/core';

Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: 'http://127.0.0.1:38417/',
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
});

const http = await import('node:http');

let n = 0;
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const i = ++n;
  const iso = Sentry.getIsolationScope();
  const isDefault = iso === getDefaultIsolationScope();
  if (url.pathname === '/iso') {
    const tag = url.searchParams.get('tag');
    Sentry.setTag('probe-tag', tag);
    await new Promise(r => setTimeout(r, 150));
    Sentry.captureException(new Error(`iso-${tag}`));
  } else if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
  }
  const defTags = JSON.stringify(getDefaultIsolationScope().getScopeData().tags);
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ req: i, path: url.pathname, isolationScopeIsDefault: isDefault, defaultScopeTags: defTags }) + '\n');
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('listening', process.env.PORT));

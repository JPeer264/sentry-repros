import * as Sentry from '@sentry/node';
import { createServer } from 'node:http';

Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: process.env.SINK,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
});

const DEFAULT_ISO = Sentry.getIsolationScope();
DEFAULT_ISO.__probeId = 'DEFAULT';

let n = 0;
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const iso = Sentry.getIsolationScope();
  if (!iso.__probeId) iso.__probeId = `fork-${++n}`;
  const info = {
    path: url.pathname,
    isoId: iso.__probeId,
    isDefault: iso === DEFAULT_ISO,
    defaultTags: DEFAULT_ISO.getScopeData().tags,
  };
  if (url.pathname === '/iso') {
    const tag = url.searchParams.get('tag') || 'none';
    Sentry.setTag('probe-tag', tag);
    await new Promise(r => setTimeout(r, 150));
    Sentry.captureException(new Error(`iso-${tag}`));
  } else if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
  }
  info.isoTagsAfter = Sentry.getIsolationScope().getScopeData().tags;
  info.defaultTagsAfter = DEFAULT_ISO.getScopeData().tags;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(info));
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('mini listening', process.env.PORT));

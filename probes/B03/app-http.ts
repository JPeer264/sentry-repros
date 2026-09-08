import './instrument';
import * as Sentry from '@sentry/bun';
import { createServer } from 'node:http';

const port = Number(process.env.PORT);

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);

  if (url.pathname === '/ping') {
    res.end('ok');
    return;
  }

  if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    await Sentry.flush(3000);
    res.end('ok');
    return;
  }

  const tag = url.searchParams.get('tag') ?? '';
  Sentry.setTag('req', tag);

  // yield so the five in-flight requests interleave inside the handler
  await new Promise(resolve => setTimeout(resolve, 60));

  Sentry.captureException(new Error('a'));
  const seen = Sentry.getIsolationScope().getScopeData().tags;

  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ tag, seen }));
}).listen(port, '127.0.0.1', () => console.log(`http listening ${port}`));

import "./instrument-static";
import * as Sentry from '@sentry/bun';
import { createServer } from 'node:http';

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${process.env.PORT}`);

  if (url.pathname === '/error') {
    throw new Error('handler boom');
  }

  if (url.pathname === '/error-async') {
    Promise.reject(new Error('async handler boom'));
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('scheduled rejection\n');
    return;
  }

  if (url.pathname === '/slow') {
    const id = url.searchParams.get('id') ?? '?';
    const ms = Number(url.searchParams.get('ms') ?? 0);
    Sentry.setTag('reqid', id);
    setTimeout(() => {
      Sentry.captureMessage(`iso-${id}`);
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end(`slow ${id}\n`);
    }, ms);
    return;
  }

  if (url.pathname === '/sentinel') {
    Sentry.captureMessage(`sentinel-${url.searchParams.get('n') ?? '0'}`);
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('sentinel\n');
    return;
  }

  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('ok\n');
}).listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () => {
  console.log(`app listening ${process.env.PORT}`);
});

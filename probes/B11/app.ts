import './instrument';
import * as Sentry from '@sentry/bun';
import express from 'express';

const port = Number(process.env.PORT);
const expressPort = Number(process.env.EXPRESS_PORT);

function injectionState() {
  const orchestrion = (globalThis as any).__SENTRY_ORCHESTRION__ ?? {};
  return {
    bundler: orchestrion.bundler ? [...orchestrion.bundler] : null,
    runtime: orchestrion.runtime ?? null,
    standalone: Bun.main.startsWith('/$bunfs/'),
    execPath: process.execPath,
    cwd: process.cwd(),
  };
}

Bun.serve({
  port,
  routes: {
    '/injected': () => Response.json(injectionState()),
    '/hello/:name': req => new Response(`hello ${req.params.name}`),
    '/downstream': () => new Response('downstream'),
    '/error': () => {
      throw new Error('route boom');
    },
    '/sentinel': () => {
      Sentry.captureMessage('sentinel');
      return new Response('ok');
    },
  },
  error(err) {
    return new Response(`err ${err.message}`, { status: 500 });
  },
});

const app = express();

app.use(function query2(_req, _res, next) {
  next();
});

app.get('/users/:id', async (req, res) => {
  const downstream = await fetch(`http://127.0.0.1:${port}/downstream`).then(r => r.text());
  res.json({ id: req.params.id, downstream });
});

app.get('/boom', () => {
  throw new Error('express boom');
});

app.use(Sentry.expressErrorHandler());

app.listen(expressPort);

console.log(`app listening bun=${port} express=${expressPort}`, JSON.stringify(injectionState()));

import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import express from 'express';

const app = express();
app.get('/plain', (_req, res) => res.json({ ok: true }));
app.get('/users/:id', (req, res) => res.json({ id: req.params.id }));
app.listen(8080);

export default Sentry.withSentry(
  () => ({ dsn: 'https://public@example.invalid/1', tunnel: 'http://127.0.0.1:41338/', tracesSampleRate: 1.0, traceLifecycle: 'static' }),
  httpServerHandler({ port: 8080 }),
);

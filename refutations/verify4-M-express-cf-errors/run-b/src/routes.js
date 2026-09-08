import express from 'express';
import * as Sentry from '@sentry/cloudflare';

export function buildApp() {
  const app = express();

  app.get('/plain', (_req, res) => res.json({ ok: true }));
  app.get('/users/:id', (req, res) => res.json({ id: req.params.id }));
  app.get('/boom', () => {
    throw new Error('express-cf-boom');
  });
  app.get('/boom-async', async () => {
    await new Promise(r => setTimeout(r, 5));
    throw new Error('express-cf-boom-async');
  });
  app.get('/boom-next', (_req, _res, next) => {
    next(new Error('express-cf-boom-next'));
  });
  app.get('/sentinel', (_req, res) => {
    Sentry.captureMessage('sentinel');
    res.json({ sentinel: true });
  });

  return app;
}

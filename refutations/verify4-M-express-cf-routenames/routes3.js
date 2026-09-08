import express from 'express';
import * as Sentry from '@sentry/cloudflare';

export function buildApp() {
  const app = express();

  app.get('/plain', (req, res) => res.json({ ok: true }));
  app.get('/users/:id', (req, res) => res.json({ id: req.params.id }));

  const orders = express.Router();
  orders.get('/:orderId/items/:itemId', (req, res) => res.json({ ...req.params }));
  app.use('/api/orders', orders);

  app.get('/sentinel', (req, res) => {
    Sentry.captureMessage('sentinel');
    res.json({ ok: true });
  });

  app.use((err, req, res, _next) => {
    Sentry.captureException(err);
    res.status(500).json({ error: err.message });
  });

  return app;
}

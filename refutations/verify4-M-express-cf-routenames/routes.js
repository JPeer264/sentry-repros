import express from 'express';
import * as Sentry from '@sentry/cloudflare';

export function buildApp() {
  const app = express();

  app.get('/plain', (req, res) => res.json({ ok: true }));
  app.get('/users/:id', (req, res) => res.json({ id: req.params.id }));

  const orders = express.Router();
  orders.get('/:orderId/items/:itemId', (req, res) => res.json({ ...req.params }));
  app.use('/api/orders', orders);

  // Manual workaround candidate: rename the root http.server span from inside the handler.
  app.get('/manual/:id', (req, res) => {
    const active = Sentry.getActiveSpan();
    const root = active ? Sentry.getRootSpan(active) : undefined;
    let applied = 'no-active-span';
    if (root) {
      const route = (req.baseUrl || '') + (req.route?.path || req.path);
      Sentry.updateSpanName(root, `${req.method} ${route}`);
      root.setAttribute('http.route', route);
      root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route');
      applied = route;
    }
    res.json({ applied });
  });

  app.get('/boom', () => {
    throw new Error('verify4-boom');
  });

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

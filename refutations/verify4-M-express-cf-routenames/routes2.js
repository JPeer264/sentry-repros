import express from 'express';
import * as Sentry from '@sentry/cloudflare';

/**
 * Generic candidate workaround: rename the root http.server span from a global
 * middleware that patches res.end, so it runs after express routing resolved
 * req.route but before the root span is finished.
 */
function sentryExpressRouteNames() {
  return (req, res, next) => {
    const originalEnd = res.end;
    res.end = function patchedEnd(...args) {
      try {
        const active = Sentry.getActiveSpan();
        const root = active ? Sentry.getRootSpan(active) : undefined;
        const routePath = req.route?.path;
        if (root && routePath) {
          const route = `${req.baseUrl || ''}${routePath}`;
          Sentry.updateSpanName(root, `${req.method} ${route}`);
          root.setAttribute('http.route', route);
          root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route');
        }
      } catch {}
      return originalEnd.apply(this, args);
    };
    next();
  };
}

export function buildApp({ withWorkaround }) {
  const app = express();

  if (withWorkaround) {
    app.use(sentryExpressRouteNames());
  }

  app.get('/plain', (req, res) => res.json({ ok: true }));
  app.get('/users/:id', (req, res) => res.json({ id: req.params.id }));

  const orders = express.Router();
  orders.get('/:orderId/items/:itemId', (req, res) => res.json({ ...req.params }));
  app.use('/api/orders', orders);

  app.get('/probe', (req, res) => {
    const active = Sentry.getActiveSpan();
    const root = active ? Sentry.getRootSpan(active) : undefined;
    res.json({
      hasActiveSpan: !!active,
      rootName: root ? Sentry.spanToJSON(root).description : null,
      rootOp: root ? Sentry.spanToJSON(root).op : null,
    });
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

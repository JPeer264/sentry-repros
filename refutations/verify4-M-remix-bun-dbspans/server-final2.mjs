import './instrument.mjs';
import './db.mjs';
import * as Sentry from '@sentry/remix';
import { createRequestHandler } from '@remix-run/express';
import express from 'express';

const app = express();

// `sentryBunPlugin` inlines `@remix-run/server-runtime` into the bundle, so the monkeypatch
// `instrumentServer()` applies to the node_modules copy never runs. This middleware restores what
// that patch provides: a per-request isolation scope, continuation of the incoming trace, and the
// request data on events.
app.use((req, res, next) => {
  Sentry.withIsolationScope(isolationScope => {
    isolationScope.setSDKProcessingMetadata({
      normalizedRequest: {
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        method: req.method,
        headers: req.headers,
      },
    });
    return Sentry.continueTrace(
      { sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers.baggage || '' },
      () => next(),
    );
  });
});

app.all('*', createRequestHandler({ build: await import('./build/server/index.js') }));
const port = Number(process.env.PORT || 30000);
app.listen(port, '127.0.0.1', () => console.log(`[probe] listening ${port}`));

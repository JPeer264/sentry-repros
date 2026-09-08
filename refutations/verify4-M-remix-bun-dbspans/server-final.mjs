import './instrument.mjs';
import './db.mjs';
import * as Sentry from '@sentry/remix';
import { createRequestHandler } from '@remix-run/express';
import express from 'express';

const app = express();

// Replaces what `instrumentServer()`'s monkeypatch does on Node: the bundled
// `@remix-run/server-runtime` is a different instance than the node_modules copy the patch fills,
// so nothing opens a per-request isolation scope or continues the incoming trace.
app.use((req, res, next) => {
  Sentry.withIsolationScope(() =>
    Sentry.continueTrace(
      { sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers.baggage || '' },
      () => next(),
    ),
  );
});

app.all('*', createRequestHandler({ build: await import('./build/server/index.js') }));
const port = Number(process.env.PORT || 30000);
app.listen(port, '127.0.0.1', () => console.log(`[probe] listening ${port}`));

import './instrument.mjs';

import { createRequestHandler } from '@remix-run/express';
import { installGlobals } from '@remix-run/node';
import * as Sentry from '@sentry/remix';
import express from 'express';

installGlobals();

const app = express();
app.disable('x-powered-by');

// Bun's `node:http` never publishes `http.server.request.start`, so the SDK's
// httpServerIntegration cannot open an isolation scope per request.
app.use((req, _res, next) => {
  Sentry.withIsolationScope(() =>
    Sentry.continueTrace(
      { sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers['baggage'] || '' },
      () => next(),
    ),
  );
});

app.all(
  '*',
  createRequestHandler({ build: await import('./build/server/index.js') }),
);

const port = Number(process.env.PORT || 27433);
app.listen(port, () => console.log(`listening ${port}`));

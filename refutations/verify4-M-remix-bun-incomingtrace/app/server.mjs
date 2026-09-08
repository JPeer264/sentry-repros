import './instrument.mjs';

import * as Sentry from '@sentry/remix';
import { createRequestHandler } from '@remix-run/express';
import { installGlobals } from '@remix-run/node';
import express from 'express';
import './db.mjs';

installGlobals();

const app = express();
app.disable('x-powered-by');

const remixHandler = createRequestHandler({
  build: await import('./build/server/index.js'),
});

if (process.env.WRAP === '1') {
  // Manual per-request isolation + incoming trace continuation.
  app.all('*', (req, res, next) => {
    Sentry.withIsolationScope(() =>
      Sentry.continueTrace(
        {
          sentryTrace: req.headers['sentry-trace'] || '',
          baggage: req.headers['baggage'] || '',
        },
        () => remixHandler(req, res, next),
      ),
    );
  });
} else {
  app.all('*', remixHandler);
}

const port = process.env.PORT || 3030;
app.listen(port, () => console.log(`ready on http://127.0.0.1:${port}`));

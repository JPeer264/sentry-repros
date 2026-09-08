import './instrument.mjs';

import { createRequestHandler } from '@remix-run/express';
import { installGlobals } from '@remix-run/node';
import * as Sentry from '@sentry/remix';
import express from 'express';

installGlobals();

const app = express();
app.disable('x-powered-by');

const handler = createRequestHandler({ build: await import('./build/server/index.js') });

// On Bun the SDK cannot open a per-request isolation scope by itself, so do it here.
app.all('*', (req, res, next) =>
  Sentry.withIsolationScope(async isolationScope => {
    isolationScope.setSDKProcessingMetadata({
      normalizedRequest: {
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        method: req.method,
        headers: req.headers,
      },
    });
    return Sentry.continueTrace(
      { sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers['baggage'] || '' },
      async () => handler(req, res, next),
    );
  }),
);

const port = Number(process.env.PORT || 27433);
app.listen(port, () => console.log(`listening ${port}`));

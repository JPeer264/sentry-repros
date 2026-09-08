import './instrument.mjs';

import * as Sentry from '@sentry/remix';
import { createRequestHandler } from '@remix-run/express';
import { installGlobals } from '@remix-run/node';
import express from 'express';

installGlobals();

const app = express();
app.disable('x-powered-by');
app.use(express.static('build/client', { maxAge: '1h' }));

const remixHandler = createRequestHandler({ build: await import('./build/server/index.js') });

app.all('*', (req, res, next) =>
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
      () => remixHandler(req, res, next),
    );
  }),
);

const port = process.env.PORT || 34199;
app.listen(port, () => console.log(`listening ${port}`));

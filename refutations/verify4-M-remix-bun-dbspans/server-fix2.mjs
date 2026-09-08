import './instrument.mjs';
import './db.mjs';
import * as Sentry from '@sentry/remix';
import { createRequestHandler } from '@remix-run/express';
import express from 'express';

const app = express();

app.use((req, res, next) => {
  Sentry.withIsolationScope(() => {
    Sentry.setTag('mw_url', req.url);
    console.log('[mw]', req.url, 'trace=', Sentry.getTraceData()['sentry-trace']);
    return Sentry.continueTrace(
      { sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers.baggage || '' },
      () => next(),
    );
  });
});

app.all('*', createRequestHandler({ build: await import('./build/server/index.js') }));
const port = Number(process.env.PORT || 30000);
app.listen(port, '127.0.0.1', () => console.log(`[probe] listening ${port}`));

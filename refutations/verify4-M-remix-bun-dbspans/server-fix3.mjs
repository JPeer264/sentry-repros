import './instrument.mjs';
import './db.mjs';
import * as Sentry from '@sentry/remix';
import { createRequestHandler } from '@remix-run/express';
import express from 'express';

const app = express();

app.use((req, res, next) => {
  Sentry.withIsolationScope(() => {
    Sentry.setTag('mw_url', req.url);
    console.log('[mw ]', req.url, Sentry.getTraceData()['sentry-trace']);
    return Sentry.continueTrace(
      { sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers.baggage || '' },
      () => next(),
    );
  });
});

app.get('/exp', async (req, res) => {
  await new Promise(r => setTimeout(r, 50));
  console.log('[exp]', req.url, Sentry.getTraceData()['sentry-trace'], JSON.stringify(Sentry.getIsolationScope().getScopeData().tags));
  res.json({ trace: Sentry.getTraceData(), tags: Sentry.getIsolationScope().getScopeData().tags });
});

const remixHandler = createRequestHandler({ build: await import('./build/server/index.js') });
app.all('*', (req, res, next) => {
  console.log('[pre]', req.url, Sentry.getTraceData()['sentry-trace'], JSON.stringify(Sentry.getIsolationScope().getScopeData().tags));
  return remixHandler(req, res, next);
});

const port = Number(process.env.PORT || 30000);
app.listen(port, '127.0.0.1', () => console.log(`[probe] listening ${port}`));

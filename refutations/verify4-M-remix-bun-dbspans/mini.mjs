import './instrument.mjs';
import * as Sentry from '@sentry/remix';
import express from 'express';

const app = express();
app.use((req, res, next) => {
  Sentry.withIsolationScope(() => {
    Sentry.setTag('mw_url', req.url);
    console.log('[mw ]', req.url, Sentry.getTraceData()['sentry-trace']);
    return next();
  });
});
app.get('/p/:id', async (req, res) => {
  await new Promise(r => setTimeout(r, 30));
  res.json({ trace: Sentry.getTraceData()['sentry-trace'], tags: Sentry.getIsolationScope().getScopeData().tags });
});
app.listen(Number(process.env.PORT), '127.0.0.1', () => console.log('[probe] mini listening', process.env.PORT));

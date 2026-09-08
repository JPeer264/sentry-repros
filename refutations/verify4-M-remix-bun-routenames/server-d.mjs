import './instrument-c.mjs';
import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import * as Sentry from '@sentry/remix';

const build = await import('./build/server/index.js');
const finalBuild = process.env.INSTRUMENT_BUILD === '1' ? Sentry.instrumentBuild(build, { instrumentTracing: true }) : build;

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  const sync = Sentry.getActiveSpan();
  console.log('[mw sync]', req.url, !!sync, sync ? Sentry.spanToJSON(sync).name : null);
  Promise.resolve().then(async () => {
    await new Promise(r => setTimeout(r, 5));
    const later = Sentry.getActiveSpan();
    console.log('[mw async]', req.url, !!later, later ? Sentry.spanToJSON(later).name : null);
    next();
  });
});
const remixHandler = createRequestHandler({ build: finalBuild });
app.all('*', (req, res, next) => {
  const before = Sentry.getActiveSpan();
  console.log('[before remix]', req.url, !!before, before ? Sentry.spanToJSON(before).name : null);
  return remixHandler(req, res, next);
});

const port = Number(process.env.PORT || 41318);
app.listen(port, () => console.log(`[probe] listening ${port}`));

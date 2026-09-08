import './instrument.mjs';

import { createRequestHandler } from '@remix-run/express';
import { installGlobals } from '@remix-run/node';
import * as Sentry from '@sentry/remix';
import express from 'express';

installGlobals();

const app = express();
app.disable('x-powered-by');

const handler = createRequestHandler({ build: await import('./build/server/index.js') });

app.all('*', (req, res, next) =>
  Sentry.withIsolationScope(async () => {
    Sentry.setTag('req_id', req.url);
    console.log('[wrap] enter', req.url, 'iso=', Sentry.getIsolationScope().getScopeData().tags);
    const out = await handler(req, res, next);
    console.log('[wrap] leave', req.url, 'iso=', Sentry.getIsolationScope().getScopeData().tags);
    return out;
  }),
);

const port = Number(process.env.PORT || 27433);
app.listen(port, () => console.log(`listening ${port}`));

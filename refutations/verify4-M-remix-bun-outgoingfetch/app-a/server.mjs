import './instrument.mjs';

import * as Sentry from '@sentry/remix';
import { createRequestHandler } from '@remix-run/express';
import { installGlobals } from '@remix-run/node';
import express from 'express';
import mysql from 'mysql2/promise';

installGlobals();

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 4 });

const variant = process.env.VARIANT_ISOLATION || '0';
const app = express();
app.disable('x-powered-by');

// Variant 1: isolation middleware that calls next() inside the isolation scope.
if (variant === '1') {
  app.use((req, res, next) => {
    console.log('[probe] iso-mw v1');
    Sentry.withIsolationScope(() =>
      Sentry.continueTrace(
        { sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers['baggage'] || '' },
        () => next(),
      ),
    );
  });
}

app.use(express.static('build/client', { maxAge: '1h' }));

const remixHandler = createRequestHandler({
  build: await import('./build/server/index.js'),
  getLoadContext: () => ({ pool }),
});

if (variant === '2') {
  // Variant 2: wrap the remix express handler so the returned promise is inside the scope,
  // mirroring what instrumentServer()'s monkeypatch does on Node.
  app.all('*', (req, res, next) =>
    Sentry.withIsolationScope(() =>
      Sentry.continueTrace(
        { sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers['baggage'] || '' },
        () => remixHandler(req, res, next),
      ),
    ),
  );
} else {
  app.all('*', remixHandler);
}

const port = Number(process.env.PORT || 41338);
app.listen(port, () => console.log(`[probe] listening ${port} variant=${variant}`));

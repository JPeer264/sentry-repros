// Sentry.init() must run before the app module (and its imports) evaluate.
import './instrument.js';

import * as Sentry from '@sentry/node';
import express from 'express';

const app = express();
const port = process.env.PORT || 3456;

app.get('/', (req, res) => {
  res.json({ ok: true });
});

app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});

app.get('/error', () => {
  throw new Error('sea-repro-error');
});

// Burns ~150ms of CPU so the profiler has something to sample.
app.get('/work', (req, res) => {
  const until = Date.now() + 150;
  let x = 0;
  while (Date.now() < until) {
    x += Math.sqrt(x + 1);
  }
  res.json({ x });
});

Sentry.setupExpressErrorHandler(app);

const server = app.listen(port, () => {
  console.log(`listening on :${port}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

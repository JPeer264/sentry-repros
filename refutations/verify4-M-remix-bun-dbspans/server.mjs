import './instrument.mjs';
import './db.mjs';
import { createRequestHandler } from '@remix-run/express';
import express from 'express';

const app = express();
app.all(
  '*',
  createRequestHandler({
    build: await import('./build/server/index.js'),
  }),
);
const port = Number(process.env.PORT || 30000);
app.listen(port, '127.0.0.1', () => console.log(`[probe] listening ${port}`));

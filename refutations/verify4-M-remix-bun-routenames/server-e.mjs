import './instrument-e.mjs';
import { createRequestHandler } from '@remix-run/express';
import express from 'express';

const build = await import('./build/server/index.js');

const app = express();
app.disable('x-powered-by');
app.all('*', createRequestHandler({ build }));

const port = Number(process.env.PORT || 41318);
app.listen(port, () => console.log(`[probe] listening ${port} (mode E)`));

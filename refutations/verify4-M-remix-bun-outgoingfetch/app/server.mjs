import './instrument.mjs';
import { createRequestHandler } from '@remix-run/express';
import express from 'express';

const build = await import('./build/server/index.js');

const app = express();
app.use(express.static('build/client', { maxAge: '1h' }));
app.all('*', createRequestHandler({ build }));

const port = Number(process.env.PORT);
app.listen(port, () => console.log(`[probe] listening on ${port}`));

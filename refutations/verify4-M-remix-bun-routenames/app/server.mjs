import './instrument.mjs';

import { createRequestHandler } from '@remix-run/express';
import { installGlobals } from '@remix-run/node';
import express from 'express';

installGlobals();

const app = express();
app.disable('x-powered-by');
app.use(express.static('build/client', { maxAge: '1h' }));

app.all('*', createRequestHandler({ build: await import('./build/server/index.js') }));

const port = process.env.PORT || 34199;
app.listen(port, () => console.log(`listening ${port}`));

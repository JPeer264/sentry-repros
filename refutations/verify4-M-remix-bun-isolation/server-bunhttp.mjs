import './instrument-bunhttp.mjs';

import { createRequestHandler } from '@remix-run/express';
import { installGlobals } from '@remix-run/node';
import express from 'express';

installGlobals();

const app = express();
app.disable('x-powered-by');

app.all('*', createRequestHandler({ build: await import('./build/server/index.js') }));

const port = Number(process.env.PORT || 41319);
app.listen(port, () => console.log(`listening ${port}`));

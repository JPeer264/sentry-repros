import './instrument-c.mjs';
import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import * as Sentry from '@sentry/remix';

const build = await import('./build/server/index.js');
const finalBuild = process.env.INSTRUMENT_BUILD === '1' ? Sentry.instrumentBuild(build, { instrumentTracing: true }) : build;

const app = express();
app.disable('x-powered-by');
app.all('*', createRequestHandler({ build: finalBuild }));

const port = Number(process.env.PORT || 41318);
app.listen(port, () => console.log(`[probe] listening ${port} instrumentBuild=${process.env.INSTRUMENT_BUILD === '1'}`));

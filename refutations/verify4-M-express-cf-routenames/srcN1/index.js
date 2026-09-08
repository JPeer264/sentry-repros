import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';

import expressMod from 'express';
import { buildApp } from '../routes3.js';



const app = buildApp();
app.listen(8080);

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:48733/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'stream',
    debug: true,
  }),
  httpServerHandler({ port: 8080 }),
);

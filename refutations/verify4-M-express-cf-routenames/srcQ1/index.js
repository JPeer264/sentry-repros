import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import { buildApp } from '../routes4.js';

const app = buildApp();
app.listen(8080);

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:48733/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
  }),
  httpServerHandler({ port: 8080 }),
);

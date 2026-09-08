import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import { buildApp } from '../routes.js';

const app = buildApp();
app.listen(8080);

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:53177/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
    debug: true,
  }),
  httpServerHandler({ port: 8080 }),
);

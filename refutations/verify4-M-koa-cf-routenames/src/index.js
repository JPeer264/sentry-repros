import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import { buildApp } from '../app.js';

buildApp().listen(8080);

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:51733/',
    tracesSampleRate: 1.0,
    traceLifecycle: env.LIFECYCLE === 'static' ? 'static' : 'stream',
    debug: true,
  }),
  httpServerHandler({ port: 8080 }),
);

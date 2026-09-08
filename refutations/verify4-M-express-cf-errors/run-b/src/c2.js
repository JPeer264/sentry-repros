import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import { setupExpressErrorHandler } from '@sentry/server-utils';
import { buildApp } from './routes.js';

const app = buildApp();
setupExpressErrorHandler(app);
app.listen(8080);

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:44821/',
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
  }),
  httpServerHandler({ port: 8080 }),
);

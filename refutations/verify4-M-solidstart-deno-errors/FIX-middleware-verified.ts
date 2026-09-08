// src/middleware.ts
// Register with: solidStart({ appRoot: './src', middleware: './src/middleware.ts' })
// Captures throws from SolidStart 2 API route handlers (src/routes/api/*.ts), which neither
// @sentry/nitro's `error` hook nor the h3/srvx tracing channels ever see.
import * as Sentry from '@sentry/solidstart';
import { createMiddleware } from '@solidjs/start/middleware';

export default createMiddleware([
  async (event, next) => {
    try {
      return await next();
    } catch (error) {
      Sentry.captureException(error, { mechanism: { handled: false, type: 'solidstart.middleware' } });
      throw error;
    }
  },
  ...createMiddleware({ onBeforeResponse: [Sentry.sentryBeforeResponseMiddleware()] }),
]);

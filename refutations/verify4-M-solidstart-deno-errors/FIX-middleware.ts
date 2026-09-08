// src/middleware.ts - captures errors thrown from SolidStart 2 API route handlers.
// Register it via solidStart({ appRoot: './src', middleware: './src/middleware.ts' }).
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

import * as Sentry from '@sentry/solidstart';
import { sentryBeforeResponseMiddleware } from '@sentry/solidstart';
import { createMiddleware } from '@solidjs/start/middleware';

const captureThrows = async (event: unknown, next: () => Promise<unknown>) => {
  try {
    return await next();
  } catch (err) {
    if (process.env.PROBE_MW) {
      Sentry.captureException(err, {
        mechanism: { handled: false, type: 'probe.solidstart.middleware' },
      });
    }
    throw err;
  }
};

export default createMiddleware([captureThrows, ...createMiddleware({ onBeforeResponse: [sentryBeforeResponseMiddleware()] })]);

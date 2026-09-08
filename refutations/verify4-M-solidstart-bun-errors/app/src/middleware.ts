import * as Sentry from '@sentry/solidstart';
import { sentryBeforeResponseMiddleware } from '@sentry/solidstart';
import { createMiddleware } from '@solidjs/start/middleware';

const captureRouteErrors = async (event: any, next: any) => {
  if (!process.env.PROBE_MW) {
    return next();
  }
  try {
    return await next();
  } catch (e) {
    console.log('[probe] middleware caught', (e as Error)?.message);
    Sentry.captureException(e, { mechanism: { handled: false, type: 'solidstart.middleware' } });
    throw e;
  }
};

export default createMiddleware([
  captureRouteErrors,
  ...createMiddleware({ onBeforeResponse: [sentryBeforeResponseMiddleware()] }),
]);

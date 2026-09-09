// features/middleware.mdx:10-20 verbatim: the import path differs from index.mdx:192.
// Only resolved by check-config.mjs; not part of the build.
import { sentryBeforeResponseMiddleware } from '@sentry/solidstart/middleware';
import { createMiddleware } from '@solidjs/start/middleware';

export default createMiddleware({
  onBeforeResponse: [
    sentryBeforeResponseMiddleware(),
    // Add your other middleware handlers after `sentryBeforeResponseMiddleware`
  ],
});

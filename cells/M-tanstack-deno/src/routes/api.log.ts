import { createFileRoute } from '@tanstack/react-router';
import * as Sentry from '@sentry/tanstackstart-react';

export const Route = createFileRoute('/api/log')({
  server: {
    handlers: {
      GET: async () => {
        Sentry.logger.info('probe-log-from-handler');
        return new Response('logged');
      },
    },
  },
});

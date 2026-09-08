import { createFileRoute } from '@tanstack/react-router';
import * as Sentry from '@sentry/tanstackstart-react';

export const Route = createFileRoute('/api/sentinel')({
  server: {
    handlers: {
      GET: async () => {
        Sentry.captureMessage('sentinel');
        await Sentry.flush(2000);
        return new Response('sentinel');
      },
    },
  },
});

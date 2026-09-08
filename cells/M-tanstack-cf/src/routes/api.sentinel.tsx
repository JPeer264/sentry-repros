import * as Sentry from '@sentry/cloudflare';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/sentinel')({
  server: {
    handlers: {
      GET: () => {
        Sentry.captureMessage('sentinel');
        return Response.json({ ok: true });
      },
    },
  },
});

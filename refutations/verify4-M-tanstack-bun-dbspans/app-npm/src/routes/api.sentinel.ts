import { createFileRoute } from '@tanstack/react-router';
import * as Sentry from '@sentry/tanstackstart-react';

export const Route = createFileRoute('/api/sentinel')({
  server: {
    handlers: {
      GET: async () => {
        Sentry.captureMessage('sentinel');
        await Sentry.flush(5000);
        return Response.json({ ok: true, runtime: typeof (globalThis as any).Bun !== 'undefined' ? 'bun' : 'node' });
      },
    },
  },
});

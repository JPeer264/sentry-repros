import { createFileRoute } from '@tanstack/react-router';
import * as Sentry from '@sentry/tanstackstart-react';

export const Route = createFileRoute('/api/tag/$tag')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        Sentry.setTag('probe-tag', params.tag);
        await new Promise(r => setTimeout(r, 60));
        Sentry.captureException(new Error(`iso-${params.tag}`));
        return Response.json({ tag: params.tag });
      },
    },
  },
});

import * as Sentry from '@sentry/cloudflare';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/probe-log')({
  server: {
    handlers: {
      GET: () => {
        Sentry.logger.info('tanstack cf probe log', { where: 'route-handler' });
        return Response.json({ ok: true });
      },
    },
  },
});

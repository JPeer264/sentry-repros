import { createFileRoute } from '@tanstack/react-router';
import { logger } from '../probe/sentry';

export const Route = createFileRoute('/api/log')({
  server: {
    handlers: {
      GET: async () => {
        logger.info('tanstack-bun-log-probe');
        return Response.json({ logged: true });
      },
    },
  },
});

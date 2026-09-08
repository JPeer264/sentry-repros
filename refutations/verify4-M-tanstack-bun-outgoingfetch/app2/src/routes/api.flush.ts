import { createFileRoute } from '@tanstack/react-router';
import { flush } from '../probe/sentry';

export const Route = createFileRoute('/api/flush')({
  server: {
    handlers: {
      GET: async () => {
        await flush(4000);
        return new Response('ok');
      },
    },
  },
});

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/db-ioredis')({
  server: {
    handlers: {
      GET: async () => Response.json({ stub: true }),
    },
  },
});

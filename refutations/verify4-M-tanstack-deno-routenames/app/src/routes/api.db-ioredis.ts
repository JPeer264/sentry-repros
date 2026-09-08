import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/db-ioredis')({
  server: {
    handlers: {
      GET: async () => new Response(JSON.stringify({ stubbed: true }), { headers: { 'Content-Type': 'application/json' } }),
    },
  },
});

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/user/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => Response.json({ id: params.id }),
    },
  },
});

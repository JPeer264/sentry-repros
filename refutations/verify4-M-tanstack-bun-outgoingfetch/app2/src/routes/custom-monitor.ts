import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/custom-monitor')({
  server: {
    handlers: {
      GET: async () => new Response('ok'),
    },
  },
});

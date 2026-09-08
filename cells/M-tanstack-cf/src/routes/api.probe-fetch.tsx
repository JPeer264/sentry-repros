import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/probe-fetch')({
  server: {
    handlers: {
      GET: async () => {
        const res = await fetch('http://127.0.0.1:33518/rec');
        return Response.json({ ok: true, echo: await res.json() });
      },
    },
  },
});

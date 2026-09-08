import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/fetch')({
  server: {
    handlers: {
      GET: async () => {
        const port = process.env.RECORDER_PORT;
        const res = await fetch(`http://127.0.0.1:${port}/__recorder?from=tanstack-bun`);
        const body = await res.json();
        return Response.json({ ok: true, recorder: body });
      },
    },
  },
});

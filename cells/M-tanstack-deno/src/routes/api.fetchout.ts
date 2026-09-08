import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/fetchout')({
  server: {
    handlers: {
      GET: async () => {
        const target = process.env.PROBE_RECORDER || 'http://127.0.0.1:47315/rec';
        const res = await fetch(target);
        const body = await res.text();
        return Response.json({ ok: true, body });
      },
    },
  },
});

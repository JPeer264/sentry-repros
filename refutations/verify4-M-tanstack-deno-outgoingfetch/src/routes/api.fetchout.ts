import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/fetchout')({
  server: {
    handlers: {
      GET: async () => {
        const target = process.env.RECORDER_URL || 'http://127.0.0.1:41999/rec';
        const res = await fetch(target);
        const body = await res.text();
        return new Response(JSON.stringify({ ok: true, body }), {
          headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  },
});

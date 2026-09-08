import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/ping')({
  server: {
    handlers: {
      GET: async () => new Response(JSON.stringify({ ok: true, runtime: typeof (globalThis as any).Bun !== 'undefined' ? 'bun' : 'node' }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    },
  },
});

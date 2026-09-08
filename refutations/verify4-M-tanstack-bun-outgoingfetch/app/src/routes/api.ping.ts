import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/ping')({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, runtime: typeof (globalThis as any).Bun !== 'undefined' ? 'bun' : 'node' }),
    },
  },
});

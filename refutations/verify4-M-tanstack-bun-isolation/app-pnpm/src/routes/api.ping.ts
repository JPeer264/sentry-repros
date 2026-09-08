import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/ping')({
  server: { handlers: { GET: async () => new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } }) } },
});

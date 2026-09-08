import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/fetch')({
  server: {
    handlers: {
      GET: async () => {
        const recorder = (globalThis as { __PROBE_RECORDER__?: string }).__PROBE_RECORDER__;
        const res = await fetch(`${recorder}?from=tanstack-bun`);
        return Response.json({ downstream: await res.json() });
      },
    },
  },
});

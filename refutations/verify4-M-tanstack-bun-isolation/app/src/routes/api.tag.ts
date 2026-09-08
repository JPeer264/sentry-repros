import { createFileRoute } from '@tanstack/react-router';
import * as Sentry from '../probe/sentry';

export const Route = createFileRoute('/api/tag')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const tag = new URL(request.url).searchParams.get('tag') || 'none';
        Sentry.setTag('probe_tag', tag);
        await new Promise(r => setTimeout(r, 250));
        Sentry.captureException(new Error(`boom-${tag}`));
        return new Response(JSON.stringify({ tag, trace: Sentry.getTraceData() }), { headers: { 'content-type': 'application/json' } });
      },
    },
  },
});

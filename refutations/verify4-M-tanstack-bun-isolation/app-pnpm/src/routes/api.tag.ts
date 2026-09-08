import { createFileRoute } from '@tanstack/react-router';
import * as Sentry from '@sentry/tanstackstart-react';

export const Route = createFileRoute('/api/tag')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tag = url.searchParams.get('tag') || 'none';
        const delay = Number(url.searchParams.get('delay') || 100);
        Sentry.setTag('probe_tag', tag);
        await new Promise(r => setTimeout(r, delay));
        Sentry.captureException(new Error(`tag error ${tag}`));
        return new Response(JSON.stringify({ tag }), { headers: { 'Content-Type': 'application/json' } });
      },
    },
  },
});

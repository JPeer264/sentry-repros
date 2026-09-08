import { createFileRoute } from '@tanstack/react-router';
import { captureException, setTag } from '../probe/sentry';

export const Route = createFileRoute('/api/tag')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const tag = new URL(request.url).searchParams.get('tag') ?? 'none';
        setTag('probe_tag', tag);
        // Give the other concurrent requests time to set their own tag before this
        // one captures, so a shared isolation scope shows up as a mismatched tag.
        await new Promise(r => setTimeout(r, 300));
        captureException(new Error(`isolation-${tag}`));
        return Response.json({ tag });
      },
    },
  },
});

import * as Sentry from '@sentry/cloudflare';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/iso/$tag')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        Sentry.setTag('probe_tag', params.tag);
        await new Promise(resolve => setTimeout(resolve, 120));
        Sentry.captureException(new Error(`iso error ${params.tag}`));
        return Response.json({ ok: true, tag: params.tag });
      },
    },
  },
  component: () => <p>iso page</p>,
});

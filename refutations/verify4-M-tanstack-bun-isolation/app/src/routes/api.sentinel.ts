import { createFileRoute } from '@tanstack/react-router';
import * as Sentry from '../probe/sentry';

export const Route = createFileRoute('/api/sentinel')({
  server: { handlers: { GET: async () => { Sentry.captureMessage('sentinel'); await Sentry.flush(4000); return new Response('ok'); } } },
});

import { createFileRoute } from '@tanstack/react-router';
import { captureMessage, flush } from '../probe/sentry';

export const Route = createFileRoute('/api/sentinel')({
  server: {
    handlers: {
      GET: async () => {
        captureMessage('sentinel');
        await flush(4000);
        return Response.json({ sentinel: true });
      },
    },
  },
});

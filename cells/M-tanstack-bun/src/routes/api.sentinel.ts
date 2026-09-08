import { createFileRoute } from '@tanstack/react-router';
import { captureMessage } from '../probe/sentry';

export const Route = createFileRoute('/api/sentinel')({
  server: {
    handlers: {
      GET: async () => {
        captureMessage('sentinel');
        return Response.json({ sentinel: true });
      },
    },
  },
});

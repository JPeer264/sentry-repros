import { wrapFetchWithSentry } from './probe/sentry';
import handler, { createServerEntry } from '@tanstack/react-start/server-entry';

const requestHandler = wrapFetchWithSentry({
  fetch(request: Request) {
    return handler.fetch(request);
  },
});

export default createServerEntry(requestHandler);

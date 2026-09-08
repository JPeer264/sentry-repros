import handler, { createServerEntry } from '@tanstack/react-start/server-entry';
import type { ServerEntry } from '@tanstack/react-start/server-entry';
import { wrapFetchWithSentry } from './probe/sentry';

const requestHandler: ServerEntry = wrapFetchWithSentry({
  fetch(request: Request) {
    return handler.fetch(request);
  },
});

export default createServerEntry(requestHandler);

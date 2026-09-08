import { withIsolationScope, wrapFetchWithSentry } from '@sentry/tanstackstart-react';

import handler, { createServerEntry } from '@tanstack/react-start/server-entry';
import type { ServerEntry } from '@tanstack/react-start/server-entry';

// Bun does not publish node:diagnostics_channel `http.server.request.start`, so the SDK cannot
// fork a per-request isolation scope there. Fork it manually on Bun only; on Node the SDK
// already does it and an extra fork would hide request-scoped tags from the server transaction.
const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined';

const requestHandler: ServerEntry = wrapFetchWithSentry({
  fetch(request: Request) {
    return isBun ? withIsolationScope(() => handler.fetch(request)) : handler.fetch(request);
  },
});

export default createServerEntry(requestHandler);

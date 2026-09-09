// manual-setup.mdx:252-276 verbatim: the revealed entry.server.tsx with its handleRequest and
// handleError replaced by Sentry's, plus the `instrumentations` export. `streamTimeout` is the only
// line kept from the revealed file ("// ... rest of your server entry"). run.sh copies this file to
// app/entry.server.tsx for the `import-flag` variant.
import * as Sentry from '@sentry/react-router';
import { createReadableStreamFromReadable } from '@react-router/node';
import { renderToPipeableStream } from 'react-dom/server';
import { ServerRouter } from 'react-router';
import { type HandleErrorFunction } from 'react-router';

const handleRequest = Sentry.createSentryHandleRequest({
  ServerRouter,
  renderToPipeableStream,
  createReadableStreamFromReadable,
});

export default handleRequest;

export const handleError = Sentry.createSentryHandleError({
  logErrors: false
});

// Automatically instruments all server loaders, actions, middleware,
// and request handlers. Requires React Router 7.15+.
export const instrumentations = [Sentry.createSentryServerInstrumentation()];

// ... rest of your server entry
export const streamTimeout = 5_000;

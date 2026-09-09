// manual-setup.mdx:422-428 with the import path corrected to where the page told the user to create
// the file (the project root, manual-setup.mdx:203): `../instrument.server` instead of
// `./instrument.server`. run.sh copies this file to app/entry.server.tsx for the `top-import` variant.
import '../instrument.server';
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

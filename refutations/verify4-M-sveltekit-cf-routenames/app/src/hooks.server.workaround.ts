// Segment-name workaround for SvelteKit on Cloudflare Workers.
// Copy over src/hooks.server.ts to reproduce the "works with workaround" runs.
import {
  getActiveSpan,
  getRootSpan,
  handleErrorWithSentry,
  initCloudflareSentryHandle,
  sentryHandle,
} from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

const nameSegmentByRoute: Handle = ({ event, resolve }) => {
  const routeId = event.route?.id;
  const activeSpan = getActiveSpan();
  if (routeId && activeSpan && !event.isSubRequest) {
    const segment = getRootSpan(activeSpan);
    segment.updateName(`${event.request.method} ${routeId}`);
    segment.setAttributes({
      'sentry.segment.name.source': 'route',
      'http.route': routeId,
    });
  }
  return resolve(event);
};

export const handleError = handleErrorWithSentry();

export const handle = sequence(
  initCloudflareSentryHandle({
    dsn: 'https://public@o0.ingest.sentry.io/1234',
    tunnel: 'http://127.0.0.1:37421/',
    tracesSampleRate: 1.0,
    // traceLifecycle: 'static', // add for transaction envelopes
  }),
  nameSegmentByRoute,
  sentryHandle(),
);

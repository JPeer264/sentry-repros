import * as Sentry from '@sentry/nextjs';
import {
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
  shouldPropagateTraceForUrl,
  type Span,
} from '@sentry/core';

const spans: Record<string, Span> = {};

const webFetchIntegration = defineIntegration(() => ({
  name: 'WebFetch',
  setupOnce() {
    addFetchInstrumentationHandler(handlerData => {
      const client = getClient();
      if (!client) return;
      if (isSentryRequestUrl(handlerData.fetchData.url, client)) return;
      instrumentFetchRequest(
        handlerData,
        () => true,
        url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets),
        spans,
        { spanOrigin: 'auto.http.fetch' },
      );
    });
  },
}));

const patch = process.env.CF_FETCH_PATCH;
// eslint-disable-next-line no-console
console.log('[probe] CF_FETCH_PATCH =', JSON.stringify(patch));

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: 'http://127.0.0.1:47311/',
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  integrations: patch === '1' ? [webFetchIntegration()] : [],
});

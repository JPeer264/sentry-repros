import {
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
  LRUMap,
  shouldPropagateTraceForUrl,
} from '@sentry/core';

/**
 * Spans and trace headers for the runtime's global fetch, for runtimes where
 * fetch is not backed by node:http/undici (Deno).
 */
export const globalFetchIntegration = defineIntegration(() => {
  const spans = {};
  const headersUrlMap = new LRUMap(100);

  return {
    name: 'GlobalFetch',
    setupOnce() {
      addFetchInstrumentationHandler(handlerData => {
        const client = getClient();
        if (!client || isSentryRequestUrl(handlerData.fetchData.url, client)) {
          return;
        }
        instrumentFetchRequest(
          handlerData,
          () => true,
          url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, headersUrlMap),
          spans,
          { spanOrigin: 'auto.http.fetch', propagateTraceparent: client.getOptions().propagateTraceparent },
        );
      });
    },
  };
});

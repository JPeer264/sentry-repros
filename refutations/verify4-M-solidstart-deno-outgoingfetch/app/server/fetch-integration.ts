import {
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
  LRUMap,
  shouldPropagateTraceForUrl,
} from '@sentry/core';

export const globalFetchIntegration = defineIntegration(() => {
  const spans: Record<string, unknown> = {};
  const headersUrlMap = new LRUMap<string, boolean>(100);

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
          spans as Record<string, any>,
          { spanOrigin: 'auto.http.fetch' },
        );
      });
    },
  };
});

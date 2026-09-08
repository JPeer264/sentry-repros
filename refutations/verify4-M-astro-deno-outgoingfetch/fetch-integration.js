import {
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
  LRUMap,
  shouldPropagateTraceForUrl,
} from '@sentry/core';

export const denoFetchIntegration = defineIntegration(() => {
  const headersUrlMap = new LRUMap(100);
  const spans = {};
  return {
    name: 'DenoFetch',
    setupOnce() {
      addFetchInstrumentationHandler(handlerData => {
        const client = getClient();
        if (!client) return;
        if (isSentryRequestUrl(handlerData.fetchData.url, client)) return;
        instrumentFetchRequest(
          handlerData,
          () => true,
          url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, headersUrlMap),
          spans,
          { spanOrigin: 'auto.http.fetch' },
        );
      });
    },
  };
});

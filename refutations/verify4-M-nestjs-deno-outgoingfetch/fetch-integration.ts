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
  const headersUrlMap = new LRUMap<string, boolean>(100);
  const spans: Record<string, any> = {};

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

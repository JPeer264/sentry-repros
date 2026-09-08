import {
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
  LRUMap,
  shouldPropagateTraceForUrl,
} from '@sentry/core';

const headersUrlMap = new LRUMap<string, boolean>(100);
const spanMap: Record<string, any> = {};

export const denoFetchIntegration = defineIntegration(() => ({
  name: 'DenoUserlandFetch',
  setupOnce() {
    addFetchInstrumentationHandler(handlerData => {
      const client = getClient();
      if (!client) return;
      if (isSentryRequestUrl(handlerData.fetchData.url, client)) return;
      instrumentFetchRequest(
        handlerData,
        () => true,
        url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, headersUrlMap),
        spanMap,
        { spanOrigin: 'auto.http.fetch' },
      );
    });
  },
}));

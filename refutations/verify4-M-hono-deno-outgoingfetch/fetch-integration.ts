import {
  addBreadcrumb,
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
  LRUMap,
  shouldPropagateTraceForUrl,
} from '@sentry/core';

const _headersUrlMap = new LRUMap<string, boolean>(100);
const spans: Record<string, any> = {};

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
        url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, _headersUrlMap),
        spans,
        { spanOrigin: 'auto.http.fetch', propagateTraceparent: client.getOptions().propagateTraceparent },
      );
      if (handlerData.endTimestamp) {
        addBreadcrumb({ category: 'fetch', type: 'http', data: { method: handlerData.fetchData.method, url: handlerData.fetchData.url } });
      }
    });
  },
}));

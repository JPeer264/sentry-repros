import type { Client, HandlerDataFetch, Span } from '@sentry/core';
import {
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
  LRUMap,
  shouldPropagateTraceForUrl,
} from '@sentry/core';

const _headersUrlMap = new LRUMap<string, boolean>(100);

export const denoFetchIntegration = defineIntegration(() => {
  const spans: Record<string, Span> = {};
  return {
    name: 'DenoUserlandFetch',
    setup(client: Client) {
      addFetchInstrumentationHandler((handlerData: HandlerDataFetch) => {
        if (getClient() !== client) return;
        if (isSentryRequestUrl(handlerData.fetchData.url, client)) return;
        instrumentFetchRequest(
          handlerData,
          () => true,
          url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, _headersUrlMap),
          spans,
          { spanOrigin: 'auto.http.deno.fetch' },
        );
      });
    },
  };
});

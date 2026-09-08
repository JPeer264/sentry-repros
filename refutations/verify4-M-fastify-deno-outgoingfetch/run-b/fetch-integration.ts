// User-land port of @sentry/cloudflare's fetchIntegration, written only with
// primitives that @sentry/core already exports publicly.
import type { HandlerDataFetch, Span } from "@sentry/core";
import {
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
  LRUMap,
  shouldPropagateTraceForUrl,
} from "@sentry/core";

const spans: Record<string, Span> = {};
const headersUrlMap = new LRUMap<string, boolean>(100);

export const denoFetchIntegration = defineIntegration(() => ({
  name: "DenoUserlandFetch",
  setupOnce() {
    addFetchInstrumentationHandler((handlerData: HandlerDataFetch) => {
      const client = getClient();
      if (!client) return;
      if (isSentryRequestUrl(handlerData.fetchData.url, client)) return;
      instrumentFetchRequest(
        handlerData,
        () => true,
        (url: string) =>
          shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, headersUrlMap),
        spans,
        { spanOrigin: "auto.http.fetch" },
      );
    });
  },
}));

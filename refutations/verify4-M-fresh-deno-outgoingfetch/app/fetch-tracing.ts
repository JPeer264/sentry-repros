import type { Span } from "@sentry/core";
import {
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
} from "@sentry/core";

const spans: Record<string, Span> = {};

/**
 * Creates `http.client` spans and injects `sentry-trace`/`baggage` into
 * outgoing global `fetch()` calls. Hand-written stand-in for the missing
 * Deno-SDK fetch tracing.
 */
export const fetchTracingIntegration = defineIntegration(() => ({
  name: "FetchTracing",
  setup() {
    addFetchInstrumentationHandler((handlerData) => {
      const client = getClient();
      if (!client || isSentryRequestUrl(handlerData.fetchData.url, client)) {
        return;
      }
      instrumentFetchRequest(
        handlerData,
        () => true,
        () => true,
        spans,
        { spanOrigin: "auto.http.deno.fetch" },
      );
    });
  },
}));

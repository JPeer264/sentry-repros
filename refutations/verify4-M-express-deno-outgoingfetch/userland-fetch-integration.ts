// User-land port of @sentry/cloudflare's + @sentry/bun's fetchIntegration,
// built only from primitives that @sentry/core already exports.
import {
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
} from "@sentry/core";

const spans: Record<string, any> = {};

export const denoFetchIntegration = defineIntegration(() => ({
  name: "DenoUserlandFetch",
  setupOnce() {
    addFetchInstrumentationHandler((handlerData: any) => {
      const client = getClient();
      if (!client) return;
      if (isSentryRequestUrl(handlerData.fetchData.url, client)) return;
      instrumentFetchRequest(
        handlerData,
        () => true,
        () => true,
        spans,
        { spanOrigin: "auto.http.fetch" },
      );
    });
  },
}));

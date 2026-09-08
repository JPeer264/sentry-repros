import {
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
} from "@sentry/core";

const spans: Record<string, any> = {};

export const manualFetchIntegration = defineIntegration(() => ({
  name: "ManualFetch",
  setupOnce() {
    addFetchInstrumentationHandler((handlerData: any) => {
      const client = getClient();
      if (!client) return;
      if (isSentryRequestUrl(handlerData.fetchData.url, client)) return;
      instrumentFetchRequest(handlerData, () => true, () => true, spans, {
        spanOrigin: "auto.http.fetch",
      });
    });
  },
}));

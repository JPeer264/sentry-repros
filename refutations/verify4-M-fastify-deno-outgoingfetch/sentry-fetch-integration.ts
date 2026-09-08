// User-land port of the `fetchIntegration` that @sentry/bun and @sentry/cloudflare ship
// by default. @sentry/deno has no equivalent, so global fetch is uninstrumented there.
import {
  addBreadcrumb,
  addFetchInstrumentationHandler,
  defineIntegration,
  getBreadcrumbLogLevelFromHttpStatusCode,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
  LRUMap,
  shouldPropagateTraceForUrl,
} from "@sentry/core";

export const denoFetchIntegration = defineIntegration((options: { breadcrumbs?: boolean } = {}) => {
  const breadcrumbs = options.breadcrumbs !== false;
  const _headersUrlMap = new LRUMap<string, boolean>(100);
  const spans: Record<string, any> = {};

  return {
    name: "Fetch",
    setupOnce() {
      addFetchInstrumentationHandler((handlerData: any) => {
        const client = getClient();
        if (!client) return;
        if (isSentryRequestUrl(handlerData.fetchData.url, client)) return;

        instrumentFetchRequest(
          handlerData,
          () => true,
          (url: string) => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, _headersUrlMap),
          spans,
          { spanOrigin: "auto.http.fetch", propagateTraceparent: client.getOptions().propagateTraceparent },
        );

        if (breadcrumbs && handlerData.endTimestamp) {
          const response = handlerData.response as Response | undefined;
          addBreadcrumb({
            category: "fetch",
            type: "http",
            level: getBreadcrumbLogLevelFromHttpStatusCode(response?.status),
            data: { method: handlerData.fetchData.method, url: handlerData.fetchData.url, status_code: response?.status },
          });
        }
      });
    },
  };
});

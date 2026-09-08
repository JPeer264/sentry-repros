import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
import {
  addFetchInstrumentationHandler,
  defineIntegration,
  getClient,
  instrumentFetchRequest,
  isSentryRequestUrl,
  type Span,
} from "@sentry/core";

const denoFetchIntegration = defineIntegration(() => {
  const spans: Record<string, Span> = {};
  return {
    name: "DenoFetch",
    setupOnce() {
      addFetchInstrumentationHandler(handlerData => {
        const client = getClient();
        if (!client || isSentryRequestUrl(handlerData.fetchData?.url ?? "", client)) return;
        instrumentFetchRequest(handlerData, () => true, () => true, spans, {
          spanOrigin: "auto.http.fetch",
        });
      });
    },
  };
});

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:51701/",
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as "static" | "stream") || "stream",
  tracePropagationTargets: [/.*/],
  release: "v4-e@1",
  integrations: [denoFetchIntegration()],
});

import { withElysia } from "./node_modules/@sentry/elysia/build/esm/withElysia.js";
import { Elysia } from "elysia";

const app = withElysia(new Elysia())
  .get("/fetchout", async () => {
    const res = await fetch("http://127.0.0.1:51703/rec-e");
    return { rec: await res.text() };
  })
  .get("/sentinel", () => { Sentry.captureMessage("sentinel"); return "ok"; });

Deno.serve({ port: Number(Deno.env.get("PORT")), hostname: "127.0.0.1" }, app.fetch);

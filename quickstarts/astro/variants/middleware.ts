// docs/platforms/javascript/common/configuration/apis.mdx:1493-1503 verbatim. run.sh copies this file to
// src/middleware.ts for the `middleware` build only (astro.config.mjs then sets
// `autoInstrumentation: { requestHandler: false }`, automatic-instrumentation.mdx:47-60).
import * as Sentry from "@sentry/astro";
import { sequence } from "astro:middleware";

export const onRequest = sequence(
  Sentry.handleRequest({
    trackClientIp: true, // defaults to false
  })
  // other middleware handlers
);

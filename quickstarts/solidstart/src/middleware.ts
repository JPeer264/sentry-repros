// index.mdx:191-201 verbatim.
import { sentryBeforeResponseMiddleware } from "@sentry/solidstart";
import { createMiddleware } from "@solidjs/start/middleware";

export default createMiddleware({
  onBeforeResponse: [
    sentryBeforeResponseMiddleware(),
    // Add your other middleware handlers after `sentryBeforeResponseMiddleware`
  ],
});

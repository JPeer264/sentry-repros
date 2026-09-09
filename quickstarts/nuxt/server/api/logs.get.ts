// includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13-23 on the server.
import * as Sentry from "@sentry/nuxt";

export default defineEventHandler(() => {
  Sentry.logger.info("User example action completed");

  Sentry.logger.warn("Slow operation detected", {
    operation: "data_fetch",
    duration: 3500,
  });

  Sentry.logger.error("Validation failed", {
    field: "email",
    reason: "Invalid email",
  });
  return { ok: true };
});

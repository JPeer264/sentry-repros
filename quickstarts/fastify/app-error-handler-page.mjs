// docs/platforms/javascript/guides/fastify/features/error-handler.mdx:13-24, verbatim.
import * as Sentry from "@sentry/node";
import { setupFastifyErrorHandler } from "@sentry/fastify";

const app = fastify();

// Initialize Sentry
Sentry.init({
  dsn: "your-dsn",
});

// Setup the error handler
setupFastifyErrorHandler(app);

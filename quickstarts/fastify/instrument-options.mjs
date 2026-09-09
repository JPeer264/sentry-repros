import * as Sentry from "@sentry/node";

// The v11 place for shouldHandleError (docs/platforms/javascript/common/migration/v10-to-v11/index.mdx:722,
// which only shows the Express shape). The callback signature is the one from
// node_modules/@sentry/server-utils/build/types/integrations/fastify/index.d.ts. It also captures 4xx so the
// effect is observable on /error-404.
Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  integrations: [
    Sentry.fastifyIntegration({
      shouldHandleError(error, request, reply) {
        console.log(`shouldHandleError called: ${request.method} ${request.routeOptions?.url} -> ${reply.statusCode}`);
        return reply.statusCode >= 400;
      },
    }),
  ],
  tracesSampleRate: 1.0,
});

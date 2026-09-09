// docs/platforms/javascript/guides/fastify/features/error-handler.mdx:44-48: options passed to
// setupFastifyErrorHandler. The callback body is changed so its effect is observable: it logs every call and
// returns true, so /error-404 would be captured if the options were honoured.
import Fastify from "fastify";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = Fastify();

Sentry.setupFastifyErrorHandler(app, {
  shouldHandleError(error, request, reply) {
    console.log(`shouldHandleError called: ${request.method} ${request.routeOptions?.url} -> ${reply.statusCode}`);
    return true;
  },
});

registerRoutes(app);

app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" }).then(() => console.log(`app listening ${process.env.APP_PORT}`));

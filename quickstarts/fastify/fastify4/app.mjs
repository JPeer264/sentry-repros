// Same as ../app.mjs, but `fastify` resolves to fastify@4 from this directory; @sentry/node resolves upward.
import Fastify from "fastify";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "../routes.mjs";

const app = Fastify();

Sentry.setupFastifyErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" }).then(() => console.log(`app listening ${process.env.APP_PORT}`));

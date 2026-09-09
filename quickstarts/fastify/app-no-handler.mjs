// The ESM app without Sentry.setupFastifyErrorHandler(app), to see what the integration captures on its own.
import Fastify from "fastify";
import { registerRoutes } from "./routes.mjs";

const app = Fastify();

registerRoutes(app);

app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" }).then(() => console.log(`app listening ${process.env.APP_PORT}`));

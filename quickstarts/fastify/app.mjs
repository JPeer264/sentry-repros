// Started with `node --import ./instrument.mjs app.mjs` (platform-includes/getting-started-node/javascript.mdx:95),
// so the instrument file is not imported here. Body: getting-started-use/javascript.fastify.mdx:22-32.
import Fastify from "fastify";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = Fastify();

Sentry.setupFastifyErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" }).then(() => console.log(`app listening ${process.env.APP_PORT}`));

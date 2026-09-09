// The ESM tab with the import corrected to a resolvable specifier
// (getting-started-add-top-level-import/javascript.fastify.mdx:18 shows `import './instrument.js'`, which no page renders).
// Import this first!
import "./instrument.mjs";

// Now import other modules
import Fastify from "fastify";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = Fastify();

Sentry.setupFastifyErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" }).then(() => console.log(`app listening ${process.env.APP_PORT}`));

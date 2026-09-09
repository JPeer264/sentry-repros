// platform-includes/getting-started-use/javascript.fastify.mdx:18-33 (ESM tab), verbatim:
// the extensionless `import "./instrument"` is what the docs show.
// Import this first!
import "./instrument";

// Now import other modules
import Fastify from "fastify";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = Fastify();

Sentry.setupFastifyErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" }).then(() => console.log(`app listening ${process.env.APP_PORT}`));

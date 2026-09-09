// The ESM tab (getting-started-use/javascript.koa.mdx:18-33) with the import extension fixed:
// a first-line `import "./instrument.mjs"` and no --import flag (install/esm-without-import.mdx:53-63).
// Import this first!
import "./instrument.mjs";

// Now import other modules
import Koa from "koa";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = new Koa();

Sentry.setupKoaErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));

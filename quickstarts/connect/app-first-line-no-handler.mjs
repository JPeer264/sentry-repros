// A first-line `import "./instrument.mjs"` (install/esm-without-import.mdx:53-63) without the
// `Sentry.setupConnectErrorHandler(app)` line, which does not exist in this build.
// Import this first!
import "./instrument.mjs";

// Now import other modules
import connect from "connect";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = connect();

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));

// app-first-line.mjs (first-line `import "./instrument.mjs"`, no --import flag) without the deprecated
// `Sentry.setupKoaErrorHandler(app)` call, the combination of install/esm-without-import.mdx:53-63 and
// migration/v10-to-v11/index.mdx:715-719.
// Import this first!
import "./instrument.mjs";

// Now import other modules
import Koa from "koa";
import { registerRoutes } from "./routes.mjs";

const app = new Koa();

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));

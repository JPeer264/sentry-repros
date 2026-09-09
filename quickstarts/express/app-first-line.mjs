// The ESM tab with the import corrected to a resolvable specifier
// (getting-started-add-top-level-import/javascript.express.mdx:20 shows `import './instrument.js'`).
// Import this first!
import "./instrument.mjs";

// Now import other modules
import express from "express";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = express();

// Add your routes, etc.
registerRoutes(app);

// Add this after all routes,
// but before any and other error-handling middlewares are defined
Sentry.setupExpressErrorHandler(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));

// docs/platforms/javascript/guides/hono/features/error-handler.mdx:52-77 (Node.js tab) verbatim, plus the routes.
// Started with `node --import ./instrument.mjs`.
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { sentry } from "@sentry/hono/node";
import { registerRoutes } from "./routes.mjs";

const app = new Hono();

app.use(
  sentry(app, {
    shouldHandleError(error) {
      const status = (error)?.status;
      // Capture 401/403 in addition to the default 5xx errors
      return (
        status === 401 ||
        status === 403 ||
        typeof status !== "number" ||
        status >= 500
      );
    },
  })
);

// Your routes here
registerRoutes(app);

serve({ fetch: app.fetch, port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, (info) => console.log(`app listening ${info.port}`));

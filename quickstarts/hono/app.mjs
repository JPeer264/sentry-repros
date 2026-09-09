// Started with `node --import ./instrument.mjs app.mjs` (docs/platforms/javascript/guides/hono/index.mdx:214),
// so the instrument file is not imported here. Body: index.mdx:264-276 (Node.js tab, app.ts).
// Deviation: `serve(app)` would listen on port 3000; this repro passes the port and host explicitly.
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { sentry } from "@sentry/hono/node";
import { registerRoutes } from "./routes.mjs";

const app = new Hono();

app.use(sentry(app));

// Your routes here
registerRoutes(app);

serve({ fetch: app.fetch, port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, (info) => console.log(`app listening ${info.port}`));

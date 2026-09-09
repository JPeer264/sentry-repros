// docs/platforms/javascript/common/install/esm-without-import.mdx:51-58 (direct import, first line), with the
// extension the page omits, then the guide app (index.mdx:264-276). No --import flag.
import "./instrument.mjs";

// Now import other modules
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { sentry } from "@sentry/hono/node";
import { registerRoutes } from "./routes.mjs";

const app = new Hono();

app.use(sentry(app));

registerRoutes(app);

serve({ fetch: app.fetch, port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, (info) => console.log(`app listening ${info.port}`));

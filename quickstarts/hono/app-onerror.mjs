// The guide app (index.mdx:264-276) plus a user-defined `app.onError` that turns every error into a JSON 500,
// to see whether "Sentry captures exceptions from Hono's onError handler" (index.mdx:362) still holds when the
// user owns onError. Started with `node --import ./instrument.mjs`.
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { sentry } from "@sentry/hono/node";
import { registerRoutes } from "./routes.mjs";

const app = new Hono();

app.use(sentry(app));

app.onError((err, c) => {
  console.log(`app.onError: ${err.message}`);
  return c.json({ error: err.message }, 500);
});

registerRoutes(app);

serve({ fetch: app.fetch, port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, (info) => console.log(`app listening ${info.port}`));

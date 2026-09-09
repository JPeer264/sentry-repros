// The guide app (index.mdx:264-276) with `Sentry` imported from the package root, the import a user is most likely
// to write for the verify snippet's `Sentry.startSpan` (getting-started-verify/javascript.hono.mdx:37), which
// names no import. Started with `node --import ./instrument.mjs`.
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { sentry } from "@sentry/hono/node";
import * as Sentry from "@sentry/hono";
import * as SentryForSentinel from "@sentry/hono/node";

console.log("root export keys:", JSON.stringify(Object.keys(Sentry)));

const app = new Hono();

app.use(sentry(app));

app.get("/debug-sentry", async () => {
  await Sentry.startSpan(
    {
      op: "test",
      name: "My First Test Transaction",
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for 100ms
      throw new Error("My first Sentry error!");
    }
  );
});

app.get("/debug-log", (c) => {
  SentryForSentinel.logger.info("User example action completed");
  return c.text("logged\n");
});
app.get("/sentinel", (c) => {
  SentryForSentinel.captureMessage("sentinel");
  return c.text("sentinel\n");
});

serve({ fetch: app.fetch, port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, (info) => console.log(`app listening ${info.port}`));

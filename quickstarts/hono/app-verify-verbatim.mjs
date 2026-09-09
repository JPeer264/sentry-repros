// The guide app (index.mdx:264-276) with the verify snippets pasted where "Your routes here" sits:
// getting-started-verify/javascript.hono.mdx:13-15, then :36-47 which "updates the previous code snippet".
// Nothing in the guide imports `Sentry` into app.ts, so this file does not either. The sentinel and log routes
// use a differently named import so the repro can still wait for its sentinel.
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { sentry } from "@sentry/hono/node";
import * as SentryForSentinel from "@sentry/hono/node";

const app = new Hono();

app.use(sentry(app));

// Your routes here
// (getting-started-verify/javascript.hono.mdx:13-15 stood here first; :30 says to "update the previous code
// snippet", so it is replaced by :36-47. results-verify-verbatim-both.json is the run with both kept.)
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

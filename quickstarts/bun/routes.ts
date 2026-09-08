import * as Sentry from "@sentry/bun";

const RECORDER = process.env.RECORDER_URL;

export const routes = {
  "/users/:id": (req: any) => Response.json({ id: req.params.id }),

  "/debug-sentry": () => {
    throw new Error("My first Sentry error!");
  },

  "/debug-span": async () => {
    const body = await Sentry.startSpan({ op: "test", name: "My First Test Span" }, async () => {
      const r = await fetch(`${RECORDER}/recorder?from=debug-span`);
      return await r.text();
    });
    return new Response(`span done ${body}\n`);
  },

  "/debug-log": () => {
    Sentry.logger.info("hello from /debug-log", { route: "/debug-log" });
    return new Response("logged\n");
  },

  "/sentinel": () => {
    Sentry.captureMessage("sentinel");
    return new Response("sentinel\n");
  },
};

// Prints context.set.status as the SDK's onError hook sees it, for each error shape used in routes.ts.
import * as Sentry from "@sentry/elysia";
import { Elysia, status } from "elysia";
import { node } from "@elysiajs/node";

Sentry.init({ dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337", tunnel: process.env.SENTRY_TUNNEL });

const seen = [];
const app = Sentry.withElysia(new Elysia({ adapter: node() }), {
  shouldHandleError: (context) => {
    seen.push({ path: new URL(context.request.url).pathname, code: context.code, set_status: context.set.status, error: context.error?.constructor?.name, isError: context.error instanceof Error, status_prop: context.error?.status });
    return false;
  },
})
  .get("/debug-sentry", () => { throw new Error("My first Sentry error!"); })
  .get("/error-404", ({ set }) => { set.status = 404; throw new Error("custom 404"); })
  .get("/error-503", ({ set }) => { set.status = 503; throw new Error("custom 503"); })
  .get("/error-status-503", () => { throw status(503, "custom status 503"); })
  .get("/error-status-404", () => { throw status(404, "custom status 404"); })
  .get("/report", () => JSON.stringify(seen, null, 1))
  .listen({ port: Number(process.env.APP_PORT), hostname: "127.0.0.1" });

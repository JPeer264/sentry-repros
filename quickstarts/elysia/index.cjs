// Not in the Elysia guide: index.mdx:105-127 as CommonJS (require), to see whether the CJS builds of
// @sentry/elysia, elysia and @elysiajs/node work together under Node.
const Sentry = require("@sentry/elysia");
const { Elysia, status } = require("elysia");
const { node } = require("@elysiajs/node");

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  tracesSampleRate: 1.0,
});

const app = Sentry.withElysia(new Elysia({ adapter: node() }))
  .get("/", () => "Hello World")
  .onBeforeHandle(function auditHook() {})
  .get("/debug-sentry", () => {
    throw new Error("My first Sentry error!");
  })
  .get("/users/:id", function getUser({ params }) {
    return { id: params.id };
  })
  .get("/error-503", ({ set }) => {
    set.status = 503;
    throw new Error("custom 503");
  })
  .get("/debug-log", () => {
    Sentry.logger.info("User example action completed");
    return "logged\n";
  })
  .get("/sentinel", () => {
    Sentry.captureMessage("sentinel");
    return "sentinel\n";
  })
  .listen({ port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, () => console.log(`app listening ${process.env.APP_PORT}`));

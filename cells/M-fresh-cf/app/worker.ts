// @ts-nocheck
import * as Sentry from "@sentry/cloudflare";
import server from "./_fresh/server.js";

export default Sentry.withSentry(
  () => ({
    dsn: "http://publickey@127.0.0.1:22984/1",
    tunnel: "http://127.0.0.1:22984/",
    tracesSampleRate: 1.0,
    traceLifecycle: "static",
    debug: true,
    sendDefaultPii: true,
  }),
  {
    fetch(request: Request) {
      return server.fetch(request, {
        remoteAddr: { transport: "tcp", hostname: "127.0.0.1", port: 0 },
      });
    },
  },
);

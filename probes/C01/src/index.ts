import * as Sentry from "@sentry/cloudflare";

interface Env {
  SINK_URL: string;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: "https://c01public@o0.ingest.sentry.io/1",
    tunnel: env.SINK_URL,
    release: "c01-release@1.0.0",
    environment: "c01-env",
    sendDefaultPii: true,
    tracesSampleRate: 1,
  }),
  {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === "/enriched-throw") {
        enrich(url.pathname);
        throw new Error("c01 handler boom");
      }

      if (url.pathname === "/waituntil-throw") {
        ctx.waitUntil(
          (async () => {
            throw new Error("c01 waitUntil boom");
          })(),
        );
        return new Response("waituntil-throw scheduled\n");
      }

      if (url.pathname === "/waituntil-reject") {
        ctx.waitUntil(Promise.reject(new Error("c01 waitUntil reject")));
        return new Response("waituntil-reject scheduled\n");
      }

      if (url.pathname === "/sentinel") {
        Sentry.captureMessage(`sentinel ${url.searchParams.get("n") ?? "0"}`);
        return new Response("sentinel\n");
      }

      return new Response("ok\n");
    },
  },
);

function enrich(route: string): void {
  Sentry.setUser({ id: "user-42", email: "c01@example.com", username: "c01user" });
  Sentry.setTag("c01_tag", "tag-value");
  Sentry.setContext("c01_context", { key: "ctx-value", n: 7 });
  Sentry.addBreadcrumb({ category: "c01", message: "manual breadcrumb", level: "info", data: { step: 1 } });
  console.log("console.log before throw", { route });
  console.warn("console.warn before throw");
}

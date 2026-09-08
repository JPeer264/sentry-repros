import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
});

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const before = Sentry.getIsolationScope();
    if (url.pathname === "/dyn") {
      await import(
        `data:text/javascript,export const x=${Math.random()};`
      );
    } else if (url.pathname === "/plain") {
      await new Promise((r) => setTimeout(r, 10));
    } else if (url.pathname === "/scopes") {
      // deno-lint-ignore no-explicit-any
      return Response.json({ isoTags: (before as any).getScopeData().tags });
    }
    const after = Sentry.getIsolationScope();
    Sentry.setTag("probe", url.searchParams.get("t") ?? "none");
    return Response.json({ same: before === after, hasSpan: !!Sentry.getActiveSpan() });
  },
};

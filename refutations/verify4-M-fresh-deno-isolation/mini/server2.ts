import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
});

// deno-lint-ignore no-explicit-any
const tags = (s: any) => s.getScopeData().tags;

let n = 0;

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/scopes") {
      return Response.json({ isoTags: tags(Sentry.getIsolationScope()) });
    }
    const id = `r${++n}`;
    const s0 = Sentry.getIsolationScope();
    Sentry.setTag("req", id);
    if (url.pathname === "/dyn") {
      await import(`data:text/javascript,export const x=${Math.random()};`);
    } else {
      await new Promise((r) => setTimeout(r, 10));
    }
    const s1 = Sentry.getIsolationScope();
    Sentry.setTag("probe", url.searchParams.get("t") ?? "none");
    return Response.json({
      id,
      sameScopeObject: s0 === s1,
      tagsAfter: tags(s1),
      hasSpan: !!Sentry.getActiveSpan(),
    });
  },
};

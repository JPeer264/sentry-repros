import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
});

// deno-lint-ignore no-explicit-any
const tags = (s: any) => ({ ...s.getScopeData().tags });

let n = 0;

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const id = `r${++n}`;
    const tagsAtTop = tags(Sentry.getIsolationScope());
    Sentry.setTag("req", id);
    if (url.pathname === "/dyn") {
      await import(`data:text/javascript,export const x=${Math.random()};`);
    } else if (url.pathname === "/plain") {
      await new Promise((r) => setTimeout(r, 10));
    }
    return Response.json({
      id,
      path: url.pathname,
      tagsAtTop,
      tagsAtEnd: tags(Sentry.getIsolationScope()),
    });
  },
};

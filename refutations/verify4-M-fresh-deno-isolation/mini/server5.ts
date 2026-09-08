import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
import { getDefaultIsolationScope } from "@sentry/core";

const MODE = Deno.env.get("MODE") ?? "A"; // A = SDK wrap, B = manual+fix, C = manual+fork

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
  integrations: (def) => MODE === "A" ? def : def.filter((i) => i.name !== "DenoServe"),
});

async function inner(url: URL): Promise<Response> {
  const t = url.searchParams.get("t");
  if (t) Sentry.setTag("probe", t);
  if (url.pathname === "/dyn") {
    await import(`data:text/javascript,export const x=${Math.random()};`);
  }
  if (url.pathname === "/msg") Sentry.captureMessage("probe-msg");
  if (url.pathname === "/sentinel") {
    Sentry.captureMessage("sentinel");
    await Sentry.flush(3000);
  }
  return new Response("ok");
}

export default {
  fetch(req: Request): Promise<Response> | Response {
    const url = new URL(req.url);
    if (MODE === "A") return inner(url);
    const run = () =>
      Sentry.startSpan(
        { name: `${req.method} ${url.pathname}`, op: "http.server", attributes: { "sentry.source": "route" } },
        () => inner(url),
      );
    if (MODE === "B") return Sentry.withIsolationScope(getDefaultIsolationScope().clone(), run);
    return Sentry.withIsolationScope(run);
  },
};

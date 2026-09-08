import * as Sentry from "@sentry/deno";
import { RECORDER } from "./config.ts";

const userPattern = new URLPattern({ pathname: "/users/:id" });

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  const user = userPattern.exec(url);
  if (user) {
    return Response.json({ id: user.pathname.groups.id });
  }

  if (url.pathname === "/debug-sentry") {
    throw new Error("My first Sentry error!");
  }

  if (url.pathname === "/debug-span") {
    const body = await Sentry.startSpan({ op: "test", name: "My First Test Span" }, async () => {
      const r = await fetch(`${RECORDER}/recorder?from=debug-span`);
      return await r.text();
    });
    return new Response(`span done ${body}\n`);
  }

  if (url.pathname === "/debug-log") {
    Sentry.logger.info("hello from /debug-log", { route: "/debug-log" });
    return new Response("logged\n");
  }

  if (url.pathname === "/sentinel") {
    Sentry.captureMessage("sentinel");
    return new Response("sentinel\n");
  }

  return new Response("not found\n", { status: 404 });
}

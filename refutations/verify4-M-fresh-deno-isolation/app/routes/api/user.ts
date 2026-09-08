import * as Sentry from "@sentry/deno";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    const u = new URL(ctx.req.url).searchParams.get("u") ?? "anon";
    Sentry.setUser({ id: u, email: `${u}@example.com` });
    Sentry.addBreadcrumb({ message: `crumb-for-${u}` });
    Sentry.setContext("probeCtx", { who: u });
    return new Response(`user:${u}`);
  },
});

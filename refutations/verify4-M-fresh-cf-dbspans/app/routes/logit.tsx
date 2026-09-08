import * as Sentry from "@sentry/cloudflare";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET() {
    Sentry.logger.info("fresh-cf-log-line", { where: "route" });
    return new Response("ok");
  },
});

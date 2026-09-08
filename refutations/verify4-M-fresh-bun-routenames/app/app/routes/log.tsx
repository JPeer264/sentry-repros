import * as Sentry from "@sentry/bun";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET() {
    Sentry.logger.info("fresh-bun-log-probe", { where: "route-handler" });
    return new Response("logged");
  },
});

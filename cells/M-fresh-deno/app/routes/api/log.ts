import * as Sentry from "@sentry/deno";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  GET() {
    Sentry.logger.info("fresh-deno-log-line", { where: "route" });
    return Response.json({ logged: true });
  },
});

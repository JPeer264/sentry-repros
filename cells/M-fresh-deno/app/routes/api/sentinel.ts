import * as Sentry from "@sentry/deno";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  GET() {
    Sentry.captureMessage("sentinel");
    return Response.json({ ok: true });
  },
});

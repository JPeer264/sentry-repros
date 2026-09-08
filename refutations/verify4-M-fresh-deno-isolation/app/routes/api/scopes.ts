import * as Sentry from "@sentry/deno";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  GET() {
    const iso = Sentry.getIsolationScope();
    const cur = Sentry.getCurrentScope();
    const def = Sentry.getGlobalScope();
    return new Response(JSON.stringify({
      // deno-lint-ignore no-explicit-any
      isoTags: (iso as any).getScopeData().tags,
      // deno-lint-ignore no-explicit-any
      curTags: (cur as any).getScopeData().tags,
      // deno-lint-ignore no-explicit-any
      globalTags: (def as any).getScopeData().tags,
      hasActiveSpan: !!Sentry.getActiveSpan(),
    }), { headers: { "content-type": "application/json" } });
  },
});

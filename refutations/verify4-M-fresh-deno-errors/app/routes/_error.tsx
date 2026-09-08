import * as Sentry from "@sentry/deno";
import { define } from "../utils.ts";

export default define.page(function ErrorPage(props) {
  const err = (props as unknown as { error: unknown }).error;
  console.log("[_error.tsx] rendered, props keys:", Object.keys(props), "error:", String(err));
  const id = Sentry.captureException(err, {
    mechanism: { type: "fresh._error", handled: false },
  });
  console.log("[_error.tsx] captureException id:", id);
  return <p>custom error page</p>;
});

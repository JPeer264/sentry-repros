import * as Sentry from "@sentry/cloudflare";

export async function onRequest() {
  await Sentry.startSpan({ op: "test", name: "sentinel span" }, () =>
    fetch("http://127.0.0.1:4747/recorder?from=sentinel")
  );
  Sentry.captureMessage("sentinel");
  return new Response("sentinel");
}

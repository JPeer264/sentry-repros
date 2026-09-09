// Repro-only server sentinel: one message plus one span through the server SDK; the driver polls
// the sink for both instead of sleeping.
import * as Sentry from "@sentry/astro";

export async function GET() {
  Sentry.captureMessage("sentinel-server");
  await Sentry.startSpan({ name: "sentinel-server-span", op: "test" }, async () => {});
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}

// Repro-only server sentinel: one message plus one span, flushed, so the driver can poll the
// sink for them instead of sleeping.
import * as Sentry from "@sentry/solidstart";

export async function GET() {
  Sentry.captureMessage("server-sentinel");
  Sentry.startSpan({ name: "server-sentinel-span", op: "test" }, () => {});
  await Sentry.flush(3000);
  const client = Sentry.getClient();
  const options = client?.getOptions();
  return new Response(
    JSON.stringify({
      initialized: !!client,
      sdk: options?._metadata?.sdk,
      integrations: options?.integrations?.map((i) => i.name),
      node: process.version,
    }),
    { headers: { "content-type": "application/json" } }
  );
}

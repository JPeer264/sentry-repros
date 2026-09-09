// Repro-only resource route. Echoes the trace headers the server received from the browser and makes
// one server-side fetch to the sink's recorder so the sink sees what the server propagates.
import type { Route } from "./+types/api.recorder";

export async function loader({ request }: Route.LoaderArgs) {
  const from = new URL(request.url).searchParams.get("from") || "unknown";
  const sink = process.env.SINK_URL || "http://localhost:4760";
  let recorder = "not reached";
  try {
    const res = await fetch(`${sink}/recorder?from=server-for-${from}`);
    recorder = String(res.status);
  } catch (e) {
    recorder = `failed: ${(e as Error).message}`;
  }
  return Response.json({
    from,
    "sentry-trace": request.headers.get("sentry-trace"),
    baggage: request.headers.get("baggage"),
    recorder,
  });
}

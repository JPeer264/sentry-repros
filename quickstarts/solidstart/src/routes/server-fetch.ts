// Repro-only API route: a server-side fetch to the sink's recorder, so the sink can record
// whether the server propagates `sentry-trace` / `baggage` on outgoing requests.
export async function GET() {
  const res = await fetch("http://localhost:4764/recorder?from=server");
  return new Response(JSON.stringify({ recorder: await res.json() }), {
    headers: { "content-type": "application/json" },
  });
}

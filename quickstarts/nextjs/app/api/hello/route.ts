export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json({
    ok: true,
    incomingSentryTrace: request.headers.get("sentry-trace"),
    incomingBaggage: request.headers.get("baggage"),
  });
}

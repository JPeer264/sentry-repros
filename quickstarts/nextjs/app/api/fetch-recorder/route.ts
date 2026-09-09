export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sinkUrl = process.env.SINK_URL ?? "http://localhost:4750";
  const res = await fetch(`${sinkUrl}/recorder?from=server`);
  return Response.json({
    ok: true,
    recorder: await res.json(),
    incomingSentryTrace: request.headers.get("sentry-trace"),
  });
}

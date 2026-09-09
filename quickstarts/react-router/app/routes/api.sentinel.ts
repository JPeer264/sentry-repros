// Repro-only sentinel: one message plus one span on the server side; the driver polls the sink for both.
import * as Sentry from "@sentry/react-router";
import type { Route } from "./+types/api.sentinel";

export async function loader({ request }: Route.LoaderArgs) {
  const name = new URL(request.url).searchParams.get("name") || "sentinel-server";
  Sentry.startSpan({ op: "test", name: `${name}-span` }, () => {
    Sentry.captureMessage(name);
  });
  return Response.json({ name });
}

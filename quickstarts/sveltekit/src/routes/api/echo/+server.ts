// repro-only: echoes the trace headers the server received from the browser
import { json } from "@sveltejs/kit";

export const GET = ({ request }) =>
  json({
    "sentry-trace": request.headers.get("sentry-trace"),
    baggage: request.headers.get("baggage"),
  });

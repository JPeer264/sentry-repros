// repro-only: the server-side sentinel, one message plus one span the driver polls the sink for
import { json } from "@sveltejs/kit";
import * as Sentry from "@sentry/sveltekit";

export const GET = async ({ url }) => {
  const name = url.searchParams.get("name") ?? "sentinel";
  Sentry.captureMessage(name);
  await Sentry.startSpan({ name: `${name}-span`, op: "test" }, async () => {});
  return json({ ok: true, name });
};

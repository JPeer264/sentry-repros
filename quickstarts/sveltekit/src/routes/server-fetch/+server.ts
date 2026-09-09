// repro-only: server-side fetches to the sink's recorder, once with the global fetch and once
// with SvelteKit's event.fetch, so the recorder shows whether sentry-trace/baggage reached it.
import { json } from "@sveltejs/kit";

export const GET = async (event) => {
  const recorder = "http://127.0.0.1:4754/recorder";
  const a = await fetch(`${recorder}?from=server-global-fetch`);
  const b = await event.fetch(`${recorder}?from=server-event-fetch`);
  return json({ global: a.status, event: b.status });
};

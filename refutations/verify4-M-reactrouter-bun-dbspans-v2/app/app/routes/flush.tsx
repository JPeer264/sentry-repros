import * as Sentry from "@sentry/react-router";
import type { Route } from "./+types/flush";

export async function loader(_: Route.LoaderArgs) {
  Sentry.captureMessage("sentinel");
  await Sentry.flush(3000);
  return { ok: true };
}

export default function Flush() {
  return <div>flushed</div>;
}

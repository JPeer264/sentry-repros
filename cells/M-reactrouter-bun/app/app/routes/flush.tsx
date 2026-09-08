import * as Sentry from "@sentry/react-router";

import type { Route } from "./+types/flush";

export async function loader({}: Route.LoaderArgs) {
  Sentry.captureMessage("sentinel");
  await Sentry.flush(2000);
  return { flushed: true };
}

export default function Flush({ loaderData }: Route.ComponentProps) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}

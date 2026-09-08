import * as Sentry from "@sentry/react-router";
import type { Route } from "./+types/users";

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");
  const active = Sentry.getActiveSpan();
  const j = active ? Sentry.spanToJSON(active) : undefined;
  const activeName = active
    ? `SPAN[desc=${j?.description ?? "none"} op=${j?.op ?? "none"} root=${Sentry.spanToJSON(Sentry.getRootSpan(active)).description ?? "none"}]`
    : "NO-ACTIVE-SPAN";
  if (mode === "error") {
    throw new Error("loader boom on bun");
  }
  return { id: params.id, activeName };
}

export default function Users({ loaderData }: Route.ComponentProps) {
  return <div id="probe">{loaderData.activeName}</div>;
}

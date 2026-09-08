import * as Sentry from "@sentry/react-router";
import type { Route } from "./+types/users";

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");
  const active = Sentry.getActiveSpan();
  const activeName = active ? (Sentry.spanToJSON(active).description ?? "?") : "NO-ACTIVE-SPAN";
  if (mode === "error") {
    throw new Error("loader boom on bun");
  }
  return { id: params.id, activeName };
}

export default function Users({ loaderData }: Route.ComponentProps) {
  return <div>user {loaderData.id} active={loaderData.activeName}</div>;
}

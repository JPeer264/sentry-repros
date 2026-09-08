import * as Sentry from "@sentry/react-router";
import type { Route } from "./+types/users";

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") ?? "plain";
  const tag = url.searchParams.get("tag") ?? "none";
  const delay = Number(url.searchParams.get("delay") ?? "0");

  if (mode === "isolation") {
    Sentry.setTag("probe_tag", tag);
    Sentry.setUser({ id: `user-${tag}` });
    await new Promise((r) => setTimeout(r, delay));
    const eventId = Sentry.captureException(
      new Error(`isolation probe ${tag}`),
    );
    return {
      id: params.id,
      tag,
      eventId,
      isolationTagAfterWait: (Sentry.getIsolationScope() as any).getScopeData()
        .tags.probe_tag,
      traceId: (Sentry.getCurrentScope() as any).getPropagationContext().traceId,
    };
  }

  if (mode === "error") {
    throw new Error(`loader boom ${tag}`);
  }

  return { id: params.id, tag, mode };
}

export default function Users({ loaderData }: Route.ComponentProps) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}

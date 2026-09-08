import * as Sentry from "@sentry/react-router";

import type { Route } from "./+types/users";
import { pool } from "../db.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");
  const id = params.id;

  if (mode === "error") {
    throw new Error("loader boom on bun");
  }

  if (mode === "isolation") {
    const tag = url.searchParams.get("tag") ?? "none";
    const delay = Number(url.searchParams.get("delay") ?? "0");
    Sentry.setTag("probe_tag", tag);
    await new Promise(resolve => setTimeout(resolve, delay));
    Sentry.captureException(new Error(`isolation error ${tag}`));
    return { ok: "isolation", tag };
  }

  if (mode === "fetch") {
    const target = url.searchParams.get("target")!;
    const res = await fetch(target);
    return { ok: "fetch", status: res.status, echo: await res.json() };
  }

  if (mode === "db") {
    const [rows] = await pool.query("SELECT id, name FROM users WHERE id <= ?", [2]);
    return { ok: "db", rows };
  }

  if (mode === "log") {
    Sentry.logger.info("probe log from loader", { id });
    return { ok: "log" };
  }

  const span = Sentry.getActiveSpan();
  const root = span ? Sentry.getRootSpan(span) : undefined;
  return {
    ok: true,
    id,
    hasActiveSpan: !!span,
    rootSpanName: root ? Sentry.spanToJSON(root).description ?? null : null,
    traceId: span ? Sentry.spanToJSON(span).trace_id ?? null : null,
  };
}

export default function Users({ loaderData }: Route.ComponentProps) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}

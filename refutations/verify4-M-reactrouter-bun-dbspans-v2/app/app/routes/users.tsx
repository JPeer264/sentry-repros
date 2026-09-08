import * as Sentry from "@sentry/react-router";
import { pool } from "../db.server";
import type { Route } from "./+types/users";

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");
  const active = Sentry.getActiveSpan();
  const activeName = active ? (Sentry.spanToJSON(active).description ?? "?") : "NO-ACTIVE-SPAN";
  if (mode === "error") {
    throw new Error("loader boom on bun");
  }
  let rows: unknown = null;
  let count = 0;
  if (mode === "db") {
    const [r] = await pool.query("SELECT * FROM users WHERE id = ?", [params.id]);
    rows = r;
    const [r2] = await pool.execute("SELECT name FROM users");
    count = (r2 as unknown[]).length;
  }
  return { id: params.id, activeName, rows, count };
}

export default function Users({ loaderData }: Route.ComponentProps) {
  return <pre id="out">{JSON.stringify(loaderData)}</pre>;
}

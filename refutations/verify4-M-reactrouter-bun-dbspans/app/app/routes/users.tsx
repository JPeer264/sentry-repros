import * as Sentry from "@sentry/react-router";
import { pool } from "~/db.server";
import type { Route } from "./+types/users";

export async function loader({ params }: Route.LoaderArgs) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [params.id]);
  const [rows2] = await pool.execute("SELECT name FROM users");
  return { rows, count: (rows2 as unknown[]).length, activeSpan: !!Sentry.getActiveSpan() };
}

export default function Users({ loaderData }: Route.ComponentProps) {
  return <pre id="out">{JSON.stringify(loaderData)}</pre>;
}

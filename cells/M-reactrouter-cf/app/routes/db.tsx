import { queryPool } from '../db.server';
import type { Route } from './+types/db';

export async function loader(_args: Route.LoaderArgs) {
  try {
    const rows = await queryPool('SELECT id, name FROM users');
    return { rows: JSON.parse(JSON.stringify(rows)) };
  } catch (e) {
    return { error: String(e) };
  }
}

export default function Db({ loaderData }: Route.ComponentProps) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}

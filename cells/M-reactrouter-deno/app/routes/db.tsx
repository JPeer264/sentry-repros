import { queryFresh, queryPool } from '../db.server';
import type { Route } from './+types/db';

export async function loader({ request }: Route.LoaderArgs) {
  const fresh = new URL(request.url).searchParams.get('fresh') === '1';
  const rows = fresh ? await queryFresh('SELECT id, name FROM users') : await queryPool('SELECT id, name FROM users');
  return { ok: 'db', fresh, rows: JSON.parse(JSON.stringify(rows)) };
}

export default function Db({ loaderData }: Route.ComponentProps) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}

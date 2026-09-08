import { poolQuery } from '../db.server';

export async function loader() {
  const a = await poolQuery('SELECT id FROM users');
  const b = await poolQuery('SELECT name FROM users');
  return { a, b };
}

export default function Db2() { return <p>db2</p>; }

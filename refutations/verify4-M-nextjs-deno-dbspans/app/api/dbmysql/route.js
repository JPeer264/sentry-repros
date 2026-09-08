import { legacy } from '../../../lib.js';
export const dynamic = 'force-dynamic';
export async function GET() {
  const rows = await new Promise((resolve, reject) =>
    legacy.query('SELECT id, name FROM users', (err, res) => (err ? reject(err) : resolve(res))),
  );
  return Response.json({ rows });
}

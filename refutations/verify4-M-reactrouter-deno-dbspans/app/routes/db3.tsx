export async function loader({ request }: { request: Request }) {
  const mode = new URL(request.url).searchParams.get('mode') ?? 'conn';
  try {
    const mod: any = await import('mysql2');
    const mysql2 = mod.default ?? mod;
    const conn = mysql2.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
    const rows = await new Promise((resolve, reject) => {
      conn.query('SELECT id, name FROM users', (err: unknown, r: unknown) => (err ? reject(err) : resolve(r)));
    });
    conn.end();
    return { mode, ok: true, rows: JSON.parse(JSON.stringify(rows)) };
  } catch (err: any) {
    return { mode, ok: false, error: `${err?.name}: ${err?.message}` };
  }
}

export default function Db3() {
  return <p>db3</p>;
}

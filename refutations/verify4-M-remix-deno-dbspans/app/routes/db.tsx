export async function loader() {
  const pool = (globalThis as any).__probePool;
  const [rows] = await pool.query('SELECT id, name FROM users');
  return { rows };
}
export default function Db() {
  return <div>db</div>;
}

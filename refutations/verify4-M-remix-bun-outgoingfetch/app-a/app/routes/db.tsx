export async function loader({ context }: { context: { pool: any } }) {
  const [rows] = await context.pool.query('SELECT id, name FROM users');
  return { rows };
}

export default function Db() {
  return <div>db</div>;
}

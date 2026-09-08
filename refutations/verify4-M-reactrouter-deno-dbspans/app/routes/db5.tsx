export async function loader() {
  try {
    const { pool2Query } = await import('../db2.server');
    const rows = await pool2Query('SELECT id, name FROM users');
    return { ok: true, rows: JSON.parse(JSON.stringify(rows)) };
  } catch (err: any) {
    return { ok: false, error: `${err?.name}: ${err?.message}` };
  }
}
export default function Db5() {
  return <p>db5</p>;
}

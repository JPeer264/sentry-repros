import { pool } from '../db';

export default defineEventHandler(async () => {
  const [rows] = await pool.query('SELECT id, name FROM users');
  return { rows };
});

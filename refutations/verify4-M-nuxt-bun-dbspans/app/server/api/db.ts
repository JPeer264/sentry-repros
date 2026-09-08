import { pool } from '../utils/dbpool'

export default defineEventHandler(async () => {
  const [rows] = await pool.query('SELECT id, name FROM users WHERE id > 0')
  return { rows }
})

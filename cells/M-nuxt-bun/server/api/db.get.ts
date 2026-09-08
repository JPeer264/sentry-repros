import mysql from 'mysql2/promise'

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' })

export default defineEventHandler(async () => {
  const [rows] = await pool.query('SELECT id, name FROM users')
  return { rows }
})

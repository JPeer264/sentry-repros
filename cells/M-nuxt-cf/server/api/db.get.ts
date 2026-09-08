import mysql from 'mysql'

const connection = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' })

export default defineEventHandler(
  () =>
    new Promise((resolve, reject) => {
      connection.query('SELECT id, name FROM users', (err: unknown, rows: unknown) => {
        if (err) reject(err)
        else resolve({ rows })
      })
    }),
)

import { pool } from '../utils/dbpool'
import { conn } from '../utils/dbconn'

export default defineNitroPlugin(async () => {
  try {
    await pool.query('SELECT 1')
    console.log('[warmdb] mysql2 ok')
  } catch (e: any) {
    console.log('[warmdb] mysql2 failed:', e?.message)
  }
  await new Promise<void>(resolve => {
    conn.query('SELECT 1', (err: any) => {
      console.log('[warmdb] mysql ' + (err ? 'failed: ' + err.message : 'ok'))
      resolve()
    })
  })
})

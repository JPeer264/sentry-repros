import * as Sentry from '@sentry/nuxt'
import { pool } from '../utils/dbpool'

export default defineEventHandler(async () => {
  return await Sentry.startSpan({ name: 'manual-parent', op: 'manual' }, async () => {
    const [rows] = await pool.query('SELECT id, name FROM users WHERE id > 0')
    return { rows }
  })
})

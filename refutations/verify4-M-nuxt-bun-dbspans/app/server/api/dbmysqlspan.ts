import * as Sentry from '@sentry/nuxt'
import { conn } from '../utils/dbconn'

export default defineEventHandler(() => {
  return Sentry.startSpan({ name: 'manual-parent', op: 'manual' }, () => {
    return new Promise((resolve, reject) => {
      conn.query('SELECT id, name FROM users WHERE id > 0', (error: unknown, rows: unknown) => {
        if (error) { reject(error); return }
        resolve({ rows })
      })
    })
  })
})

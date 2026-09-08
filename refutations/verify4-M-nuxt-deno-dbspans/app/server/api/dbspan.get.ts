import * as Sentry from '@sentry/nuxt';
import { pool } from '../db';

export default defineEventHandler(async () => {
  return await Sentry.startSpan({ name: 'manual-parent', op: 'manual' }, async () => {
    const [rows] = await pool.query('SELECT id, name FROM users');
    return { rows };
  });
});

import * as Sentry from '@sentry/nuxt';
import { conn } from '../db2';

export default defineEventHandler(async () => {
  return await Sentry.startSpan({ name: 'manual-parent', op: 'manual' }, async () => {
    const rows = await new Promise((resolve, reject) => {
      conn.query('SELECT id, name FROM users', (err: unknown, res: unknown) => (err ? reject(err) : resolve(res)));
    });
    return { rows };
  });
});

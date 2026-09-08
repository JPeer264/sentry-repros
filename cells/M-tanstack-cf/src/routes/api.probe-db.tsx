import { createFileRoute } from '@tanstack/react-router';
import { query } from '~/db';

export const Route = createFileRoute('/api/probe-db')({
  server: {
    handlers: {
      GET: async () => {
        const rows = await query('SELECT id, name FROM users');
        return Response.json(rows);
      },
    },
  },
});

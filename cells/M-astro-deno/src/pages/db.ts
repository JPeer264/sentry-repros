import type { APIRoute } from 'astro';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 2,
});

export const GET: APIRoute = async () => {
  const [rows] = await pool.query('SELECT id, name FROM users');
  return new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json' } });
};

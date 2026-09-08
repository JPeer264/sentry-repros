import { json } from '@sveltejs/kit';
import dc from 'node:diagnostics_channel';
import { pool } from '$lib/db';

export async function GET() {
	const [rows] = await pool.query('SELECT id, name FROM users');
	return json({ rows, subs: dc.tracingChannel('mysql2:query').start.hasSubscribers });
}

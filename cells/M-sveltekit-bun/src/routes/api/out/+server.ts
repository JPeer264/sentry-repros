import { json } from '@sveltejs/kit';

export async function GET() {
	const base = process.env.RECORDER || 'http://127.0.0.1:41339';
	const res = await fetch(`${base}/__rec/from-sveltekit`);
	return json({ ok: res.ok });
}

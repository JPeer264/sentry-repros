import { json } from '@sveltejs/kit';

export async function GET() {
	const rec = process.env.REC_URL as string;
	const res = await fetch(`${rec}/__rec/from-sveltekit`);
	return json({ ok: res.ok, status: res.status });
}

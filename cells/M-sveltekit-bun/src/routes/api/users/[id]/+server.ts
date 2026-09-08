import { json } from '@sveltejs/kit';

export function GET({ params }) {
	return json({ id: params.id });
}

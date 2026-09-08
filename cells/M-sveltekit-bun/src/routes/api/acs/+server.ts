import { json } from '@sveltejs/kit';
import { AsyncLocalStorage } from 'node:async_hooks';

const als = new AsyncLocalStorage<string>();

export async function GET() {
	const inside = await als.run('value-in-als', async () => {
		await new Promise(r => setTimeout(r, 5));
		return als.getStore();
	});
	return json({ inside, outside: als.getStore() ?? null });
}

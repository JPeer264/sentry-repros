import { json } from '@sveltejs/kit';
export const prerender = false;
export const GET = async () => json({ skipped: true });

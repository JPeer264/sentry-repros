//#region node_modules/.nitro/vite/services/ssr/_build/assets/fetchout-BGsOaesX.js
async function GET() {
	const res = await fetch("http://127.0.0.1:47312/recorder");
	return new Response(await res.text(), { headers: { "content-type": "application/json" } });
}
//#endregion
export { GET };

//#region node_modules/.nitro/vite/services/ssr/_build/assets/_id_-dFel8eP8.js
function GET(event) {
	return new Response(JSON.stringify({ id: event.params.id }), { headers: { "content-type": "application/json" } });
}
//#endregion
export { GET };

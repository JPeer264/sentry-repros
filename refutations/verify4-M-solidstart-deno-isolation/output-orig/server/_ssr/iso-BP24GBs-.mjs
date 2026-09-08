import { at as setTag, tt as captureException } from "../_libs/sentry__core.mjs";
//#region node_modules/.nitro/vite/services/ssr/_build/assets/iso-BP24GBs-.js
async function GET(event) {
	const tag = new URL(event.request.url).searchParams.get("tag") || "none";
	setTag("probe-tag", tag);
	await new Promise((r) => setTimeout(r, 150));
	captureException(/* @__PURE__ */ new Error(`iso-${tag}`));
	return new Response(JSON.stringify({ tag }), { headers: { "content-type": "application/json" } });
}
//#endregion
export { GET };

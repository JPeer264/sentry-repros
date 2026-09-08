import { nt as captureMessage } from "../_libs/sentry__core.mjs";
//#region node_modules/.nitro/vite/services/ssr/_build/assets/sentinel-DIyjTffR.js
function GET() {
	captureMessage("sentinel");
	return new Response("{\"sentinel\":true}", { headers: { "content-type": "application/json" } });
}
//#endregion
export { GET };

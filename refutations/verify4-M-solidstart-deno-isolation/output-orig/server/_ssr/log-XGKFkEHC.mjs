import { t as info } from "../_libs/@sentry/node+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/_build/assets/log-XGKFkEHC.js
function GET() {
	info("solidstart-deno log line");
	return new Response("{\"logged\":true}", { headers: { "content-type": "application/json" } });
}
//#endregion
export { GET };

import { F as applySdkMetadata, On as debug, nn as getGlobalScope } from "./sentry__core.mjs";
import { n as init$1 } from "./@sentry/node+[...].mjs";
//#region node_modules/@sentry/solidstart/build/esm/server/utils.js
function lowQualityTransactionsFilter(options) {
	return Object.assign((event) => {
		if (event.type !== "transaction") return event;
		if (event.transaction?.match(/^GET \/_build\//)) {
			options.debug && debug.log("SolidStartLowQualityTransactionsFilter filtered transaction", event.transaction);
			return null;
		}
		return event;
	}, { id: "SolidStartLowQualityTransactionsFilter" });
}
function filterLowQualityTransactions(options) {
	getGlobalScope().addEventProcessor(lowQualityTransactionsFilter(options));
}
//#endregion
//#region node_modules/@sentry/solidstart/build/esm/server/sdk.js
function init(options) {
	const opts = { ...options };
	applySdkMetadata(opts, "solidstart", ["solidstart", "node"]);
	filterLowQualityTransactions(opts);
	return init$1(opts);
}
//#endregion
export { init as t };

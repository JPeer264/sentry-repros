import { r as __toESM } from "../../_runtime.mjs";
import { A as Bi, At as Zu, Bn as us, Bt as da, C as $i, Cn as pp, Ct as Wr, D as Al, Dn as qr, Dt as Ye, E as Ae$1, En as qe, Et as Xu, F as Dr, Fn as sp, Ft as bt, G as Id, Gn as xe, Gt as ea, H as Gr, Hn as vr, Ht as dr, I as Ed, It as bu, J as Ju, Jt as fn, K as Il, Kt as es, L as En, Lt as cp, M as Co, Mn as rs, Mt as ai, N as Cr, Nn as sd, Nt as ba, O as Ar, Ot as Yl, P as De$1, Pn as sm, Pt as br, Q as Lr, Qt as gr, R as Fe, Rt as cr, S as $e, Sn as po, St as Wl, T as $r, Tn as ps, Tt as Xr, U as He, Un as wn, Ut as ds, V as Ge, Vn as vc, Vt as dd, W as Hr, Wn as wr, Wt as dt, X as Le, Xt as ft, Y as Ke, Yn as ze, Yt as fr, Z as Li, Zt as ga, _ as oe, _n as nm, _t as Ue, a as Re$1, an as je, at as Nr, b as tE, bn as oo, c as Ue$1, cn as kr, ct as Pe, d as _e, dn as ls, dt as Qu, en as ht, et as Me, f as ae, ft as Re, g as ne, gn as ni, gt as Tn, h as eE, hn as na, ht as Sr, i as Oe, in as jd, it as Nn, j as Br, jn as rp, jt as _t, k as Be, kn as ra, kt as Yr, l as Xe, ln as ld, lt as Pr, m as de, mn as mu, mt as Sn, n as Ce, nn as ir, nt as Ni, o as TE, on as js, ot as Oo, p as be, pn as mt, pt as Rr, q as Ji, qn as yt, qt as fc, r as De, rn as is, rt as Nl, s as Te, sn as kc, st as Or, t as Ae, tn as im, tt as Ml, u as Ze, un as lp, ut as Qe, v as rE, vn as np, vt as Ve, w as $n, wn as pr, wt as Xe$1, x as te, xn as op, xt as We, y as se, yn as on, yt as Vr, z as Fl, zn as ur, zt as cs } from "../sentry__conventions.mjs";
import { $ as _INTERNAL_flushLogsBuffer, $t as SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, A as getContentLengthFromHeaders, An as getMainCarrier, At as getActiveSpan$1, B as parseStringToURLObject, Bt as mergeBaggageHeaders, C as dirname$1, Cn as triggerHandlers, Ct as safeSetSpanJSONAttributes, D as functionToStringIntegration, Dn as consoleSandbox, Dt as getIntegrationsToSetup, E as eventFiltersIntegration, En as CONSOLE_LEVELS, Et as defineIntegration, F as applySdkMetadata, Ft as isContinuingTrace, G as filterCollectedUrl, Gt as makeWeakRef, H as stripDataUrlContent, Ht as markSpanAsTracerProviderSpan, It as propagationContextFromHeaders, J as _INTERNAL_clearAiProviderSkips, Jt as SEMANTIC_ATTRIBUTE_CACHE_HIT, K as filterCollectedUrlQuery, Kt as getSpanStatusFromHttpCode, L as getSanitizedUrlString, Lt as shouldContinueTrace, M as uniq, Mn as GLOBAL_OBJ, Mt as spanToJSON, N as shouldPropagateTraceForUrl, Nt as spanToTraceContext, O as addBreadcrumb, On as debug$2, Ot as hasSpansEnabled, P as getTraceData, Pt as _setSpanForScope, Q as _INTERNAL_captureLog, Qt as SEMANTIC_ATTRIBUTE_SENTRY_OP, R as getUrlFragment, Rt as baggageHeaderToDynamicSamplingContext, S as consoleIntegration$1, Sn as maybeInstrument, St as hasSpanStreamingEnabled, T as linkedErrorsIntegration, Tn as stackParserFromStackParserOptions, Tt as SentryNonRecordingSpan, U as stripUrlQueryAndFragment, Ut as setCapturedScopesOnSpan, V as parseUrl, Vt as getCapturedScopesOnSpan, W as envToBool, Wt as derefWeakRef, X as _INTERNAL_skipAiProviderWrapping, Xt as SEMANTIC_ATTRIBUTE_CACHE_KEY, Y as _INTERNAL_shouldSkipAiProviderWrapping, Yt as SEMANTIC_ATTRIBUTE_CACHE_ITEM_SIZE, Z as createTransport, Zt as SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME, _ as nodeStackLineParser, _n as safeMathRandom, _t as startSpan$1, a as getHttpClientSubscriptions, an as getAsyncContextStrategy, b as getBreadcrumbLogLevelFromHttpStatusCode, bn as markFunctionWrapped, bt as withActiveSpan$1, c as HTTP_ON_CLIENT_REQUEST, cn as getDefaultIsolationScope, ct as REQUEST_HANDLER_SPAN_NAME_FALLBACK, d as _getConnectionAttributes, dn as parseSemver, dt as _INTERNAL_setDeferSegmentSpanCapture, en as getClient, et as waitForTracingChannelBinding, f as _getOperationName, fn as isMatchingPattern, ft as continueTrace, gn as truncate, gt as startNewTrace, h as sanitizeSqlQuery, hn as stringify, ht as startInactiveSpan, i as patchHttpModuleClient, in as withScope, it as flush, j as httpHeadersToSpanAttributes, jn as SDK_VERSION, jt as getRootSpan, k as spanKindToName, kn as originalConsoleMethods, kt as addChildSpanToSpan, l as HTTP_ON_SERVER_REQUEST, ln as generateTraceId, lt as ROUTER_SPAN_NAME_FALLBACK, m as getSqlQuerySummary, mn as stringMatchesSomePattern, mt as spanIsIgnored, n as processHttpServerTransactionEvent, o as getRequestOptions, on as setAsyncContextStrategy, ot as startSession, p as _reconstructQuery, pn as snipLine, pt as isTracingSuppressed$1, q as filterKeyValueData, r as getHttpServerSubscriptions, rn as getIsolationScope, rt as endSession, s as getRequestUrlFromClientRequest, sn as getDefaultCurrentScope, st as HTTP_SPAN_NAME_FALLBACK, t as DEFAULT_IGNORE_STATUS_CODES, tn as getCurrentScope, tt as captureException, u as _buildConnectionContext, un as timestampInSeconds, ut as bindScopeToEmitter, v as ServerRuntimeClient, vn as addNonEnumerableProperty, vt as startSpanManual, w as requestDataIntegration, wn as createStackParser, wt as getDynamicSamplingContextFromSpan, x as conversationIdIntegration, xn as isObjectLike, xt as serializeEnvelope, y as LRUMap, yn as fill, yt as suppressTracing, z as getUrlQuery, zt as dynamicSamplingContextToSentryBaggageHeader } from "../sentry__core.mjs";
import { t as require_src } from "../opentelemetry__api.mjs";
import { c as safeChannelCallback, l as DEBUG_BUILD$1, s as bindTracingChannelToSpan, u as setHttpServerSpanRouteAttribute } from "./nitro.mjs";
import * as require$$1$2 from "node:module";
import require$$1__default from "node:module";
import * as http from "node:http";
import { Readable } from "node:stream";
import * as https from "node:https";
import require$$0, { createReadStream, readFile, readFileSync, readdir } from "node:fs";
import require$$3, { fileURLToPath } from "node:url";
import require$$0$1, { join, posix, resolve, sep } from "node:path";
import * as diagnosticsChannel from "node:diagnostics_channel";
import { subscribe } from "node:diagnostics_channel";
import { EventEmitter, errorMonitor } from "node:events";
import * as diagch from "diagnostics_channel";
import { URL as URL$1 } from "url";
import { AsyncLocalStorage } from "node:async_hooks";
import * as net from "node:net";
import { MessageChannel, Worker, isMainThread, parentPort } from "node:worker_threads";
import require$$1 from "node:tty";
import * as util from "node:util";
import require$$1$1, { format, promisify } from "node:util";
import * as os from "node:os";
import require$$0$2 from "node:os";
import { execFile } from "node:child_process";
import { createInterface } from "node:readline";
import { isMainThread as isMainThread$1, threadId } from "worker_threads";
import { createGzip } from "node:zlib";
import * as tls from "node:tls";
//#region node_modules/@sentry/node/build/esm/debug-build.js
var DEBUG_BUILD = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/http/httpServerIntegration.js
var import_src = /* @__PURE__ */ __toESM(require_src());
var HTTP_SERVER_INSTRUMENTED_KEY = (0, import_src.createContextKey)("sentry_http_server_instrumented");
var INTEGRATION_NAME$37 = "Http.Server";
function addStartSpanCallback(request, callback) {
	addNonEnumerableProperty(request, "_startSpanCallback", new WeakRef(callback));
}
var _httpServerIntegration = (options = {}) => {
	const _options = {
		sessions: options.sessions ?? true,
		sessionFlushingDelayMS: options.sessionFlushingDelayMS ?? 6e4,
		maxRequestBodySize: options.maxRequestBodySize,
		spans: false,
		ignoreRequestBody: options.ignoreRequestBody,
		/**
		* Hook called by core's `instrumentServer` to wrap the upstream
		* `emit('request')` call.
		*
		* We use it to extract OTel context from request headers and re-enter
		* the OTel context before the framework sees the request, so subsequent
		* spans (eg from `httpServerSpansIntegration`) attach to the right trace.
		*/
		wrapServerEmitRequest(request, response, normalizedRequest, next) {
			const client = getClient();
			if (!client) return next();
			if (import_src.context.active().getValue(HTTP_SERVER_INSTRUMENTED_KEY)) return next();
			const ctx = import_src.propagation.extract(import_src.context.active(), normalizedRequest.headers).setValue(HTTP_SERVER_INSTRUMENTED_KEY, true);
			import_src.context.with(ctx, () => {
				client.emit("httpServerRequest", request, response, normalizedRequest);
				const callback = request._startSpanCallback?.deref();
				if (callback) callback(() => {
					next();
					return true;
				});
				else next();
			});
		}
	};
	return {
		name: INTEGRATION_NAME$37,
		setupOnce() {
			const { [HTTP_ON_SERVER_REQUEST]: onHttpServerRequestStart } = getHttpServerSubscriptions(_options);
			subscribe(HTTP_ON_SERVER_REQUEST, onHttpServerRequestStart);
		},
		afterAllSetup(client) {
			if (DEBUG_BUILD && client.getIntegrationByName("Http")) debug$2.warn("It seems that you have manually added `httpServerIntegration` while `httpIntegration` is also present. Make sure to remove `httpServerIntegration` when adding `httpIntegration`.");
		}
	};
};
var httpServerIntegration = _httpServerIntegration;
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/http/httpServerSpansIntegration.js
var INTEGRATION_NAME$36 = "Http.ServerSpans";
var _httpServerSpansIntegration = (options = {}) => {
	const ignoreStaticAssets = options.ignoreStaticAssets ?? true;
	const ignoreIncomingRequests = options.ignoreIncomingRequests;
	const ignoreStatusCodes = options.ignoreStatusCodes ?? DEFAULT_IGNORE_STATUS_CODES;
	const { onSpanCreated } = options;
	return {
		name: INTEGRATION_NAME$36,
		setup(client) {
			if (typeof __SENTRY_TRACING__ !== "undefined" && !__SENTRY_TRACING__) return;
			client.on("httpServerRequest", (_request, _response, normalizedRequest) => {
				const request = _request;
				const response = _response;
				const startSpan = (next) => {
					if (shouldIgnoreSpansForIncomingRequest(request, {
						ignoreStaticAssets,
						ignoreIncomingRequests
					})) {
						DEBUG_BUILD && debug$2.log(INTEGRATION_NAME$36, "Skipping span creation for incoming request", request.url);
						return next();
					}
					const fullUrl = normalizedRequest.url || request.url || "/";
					const urlObj = parseStringToURLObject(fullUrl);
					const headers = request.headers;
					const userAgent = headers["user-agent"];
					const httpVersion = request.httpVersion;
					const hostname = headers.host?.replace(/^(.*)(:[0-9]{1,5})/, "$1") || "localhost";
					const scheme = fullUrl.startsWith("https") ? "https" : "http";
					const requestMethod = normalizedRequest.method || request.method?.toUpperCase();
					const method = requestMethod || "GET";
					const httpTargetWithoutQueryFragment = urlObj ? urlObj.pathname : stripUrlQueryAndFragment(fullUrl);
					const bestEffortTransactionName = `${method} ${httpTargetWithoutQueryFragment}`;
					const query = getUrlQuery(urlObj?.search);
					const fragment = getUrlFragment(urlObj?.hash);
					const span = startInactiveSpan({
						name: hasSpanStreamingEnabled(client) ? requestMethod || "HTTP" : bestEffortTransactionName,
						attributes: {
							[dd]: "server",
							[Ed]: eE,
							[jd]: "url",
							[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.http_server",
							[ld]: isKnownPrefetchRequest(request) || void 0,
							[Ju]: filterCollectedUrl(fullUrl, client),
							[Zu]: urlObj?.pathname ?? httpTargetWithoutQueryFragment,
							[im]: filterCollectedUrlQuery(query, client),
							[Xu]: fragment,
							[js]: normalizedRequest.method,
							[sm]: userAgent,
							[nm]: scheme,
							[mu]: hostname,
							[lp]: "http",
							[pp]: httpVersion,
							[cp]: httpVersion?.toUpperCase() === "QUIC" ? "udp" : "tcp",
							"http.request.body.size": getContentLengthFromHeaders(request.headers),
							...httpHeadersToSpanAttributes(normalizedRequest.headers || {}, client.getDataCollectionOptions())
						}
					});
					onSpanCreated?.(span, request, response);
					return withActiveSpan$1(span, () => {
						bindScopeToEmitter(request);
						bindScopeToEmitter(response);
						let isEnded = false;
						function endSpan(status) {
							if (isEnded) return;
							isEnded = true;
							const newAttributes = getIncomingRequestAttributesOnResponse(request, response, client.getDataCollectionOptions().userInfo);
							span.setAttributes(newAttributes);
							span.setStatus(status);
							span.end();
						}
						response.on("close", () => {
							endSpan(getSpanStatusFromHttpCode(response.statusCode));
						});
						response.on(errorMonitor, () => {
							const httpStatus = getSpanStatusFromHttpCode(response.statusCode);
							endSpan(httpStatus.code === 2 ? httpStatus : { code: 2 });
						});
						return next();
					});
				};
				addStartSpanCallback(request, startSpan);
			});
		},
		processEvent(event) {
			return processHttpServerTransactionEvent(event, ignoreStatusCodes);
		},
		afterAllSetup(client) {
			if (!DEBUG_BUILD) return;
			if (client.getIntegrationByName("Http")) debug$2.warn("It seems that you have manually added `httpServerSpansIntegration` while `httpIntegration` is also present. Make sure to remove `httpIntegration` when adding `httpServerSpansIntegration`.");
			if (!client.getIntegrationByName("Http.Server")) debug$2.error("It seems that you have manually added `httpServerSpansIntegration` without adding `httpServerIntegration`. This is a requiement for spans to be created - please add the `httpServerIntegration` integration.");
		}
	};
};
var httpServerSpansIntegration = _httpServerSpansIntegration;
function isKnownPrefetchRequest(req) {
	return req.headers["next-router-prefetch"] === "1";
}
function isStaticAssetRequest(urlPath) {
	const path = stripUrlQueryAndFragment(urlPath);
	if (path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|webp|avif)$/)) return true;
	if (path.match(/^\/(robots\.txt|sitemap\.xml|manifest\.json|browserconfig\.xml)$/)) return true;
	return false;
}
function shouldIgnoreSpansForIncomingRequest(request, { ignoreStaticAssets, ignoreIncomingRequests }) {
	if (isTracingSuppressed$1()) return true;
	const urlPath = request.url;
	const method = request.method?.toUpperCase();
	if (method === "OPTIONS" || method === "HEAD" || !urlPath) return true;
	if (ignoreStaticAssets && method === "GET" && isStaticAssetRequest(urlPath)) return true;
	if (ignoreIncomingRequests?.(urlPath, request)) return true;
	return false;
}
function getForwardedClientAddress(forwardedFor) {
	return typeof forwardedFor === "string" ? forwardedFor.split(",")[0]?.trim() || void 0 : void 0;
}
function getIncomingRequestAttributesOnResponse(request, response, collectClientAddress) {
	const { socket } = request;
	const { statusCode, statusMessage } = response;
	const newAttributes = {
		[oo]: statusCode,
		"http.response.status_text": statusMessage?.toUpperCase()
	};
	if (collectClientAddress) newAttributes[ai] = getForwardedClientAddress(request.headers["x-forwarded-for"]) ?? socket?.remoteAddress;
	if (socket) {
		const { localAddress, localPort, remoteAddress, remotePort } = socket;
		newAttributes[bu] = localPort;
		newAttributes[np] = localAddress;
		newAttributes[rp] = localPort;
		newAttributes[ni] = remotePort;
		newAttributes[sp] = collectClientAddress ? remoteAddress : void 0;
		newAttributes[op] = remotePort;
	}
	return newAttributes;
}
//#endregion
//#region node_modules/@sentry/node/build/esm/nodeVersion.js
var NODE_VERSION = parseSemver(process.versions.node);
NODE_VERSION.major;
NODE_VERSION.minor;
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/http/SentryHttpInstrumentation.js
var FULLY_SUPPORTS_HTTP_DIAGNOSTICS_CHANNEL = NODE_VERSION.major === 22 && NODE_VERSION.minor >= 12 || NODE_VERSION.major === 23 && NODE_VERSION.minor >= 2 || NODE_VERSION.major >= 24;
function instrumentHttpOutgoingRequests(instrumentationOptions = {}) {
	const { outgoingRequestApplyCustomAttributes: applyCustomAttributesOnSpan, ...options } = instrumentationOptions;
	const patchOptions = {
		applyCustomAttributesOnSpan,
		...options,
		tracePropagation: options.tracePropagation ?? true,
		spans: options.spans ?? true,
		ignoreOutgoingRequests(url, request) {
			return isTracingSuppressed$1() || !!options.ignoreOutgoingRequests?.(url, getRequestOptions(request));
		},
		outgoingRequestHook(span, request) {
			options.outgoingRequestHook?.(span, request);
			const originalOnce = request.once;
			request.once = new Proxy(originalOnce, { apply(target, thisArg, args) {
				const [event] = args;
				if (event !== "response") return target.apply(thisArg, args);
				const parentContext = import_src.context.active();
				const requestContext = import_src.trace.setSpan(parentContext, span);
				return import_src.context.with(requestContext, () => {
					return target.apply(thisArg, args);
				});
			} });
		},
		outgoingResponseHook(span, response) {
			options.outgoingResponseHook?.(span, response);
		},
		errorMonitor,
		http
	};
	if (FULLY_SUPPORTS_HTTP_DIAGNOSTICS_CHANNEL) instrumentHttpOutgoingRequestsViaChannel(patchOptions);
	else instrumentHttpOutgoingRequestsViaMonkeyPatching(patchOptions);
}
function instrumentHttpOutgoingRequestsViaChannel(options) {
	const { [HTTP_ON_CLIENT_REQUEST]: onHttpClientRequestCreated } = getHttpClientSubscriptions(options);
	subscribe(HTTP_ON_CLIENT_REQUEST, onHttpClientRequestCreated);
}
function instrumentHttpOutgoingRequestsViaMonkeyPatching(options) {
	patchHttpModuleClient(http, options);
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/http/index.js
var INTEGRATION_NAME$35 = "Http";
var httpIntegration = defineIntegration((options = {}) => {
	const spans = options.spans ?? true;
	const enableServerSpans = spans && !options.disableIncomingRequestSpans;
	const server = httpServerIntegration(options);
	const serverSpans = httpServerSpansIntegration(options);
	return {
		name: INTEGRATION_NAME$35,
		setup(client) {
			const clientOptions = client.getOptions();
			if (enableServerSpans && hasSpansEnabled(clientOptions)) serverSpans.setup(client);
		},
		setupOnce() {
			server.setupOnce();
			instrumentHttpOutgoingRequests({
				breadcrumbs: options.breadcrumbs,
				spans,
				tracePropagation: options.tracePropagation ?? true,
				ignoreOutgoingRequests: options.ignoreOutgoingRequests,
				outgoingRequestHook: (span, request) => {
					const url = getRequestUrlFromClientRequest(request);
					if (url.startsWith("data:")) {
						const sanitizedUrl = stripDataUrlContent(url);
						const client = getClient();
						if (!client || !hasSpanStreamingEnabled(client)) span.updateName(`${request.method || "GET"} ${sanitizedUrl}`);
						span.setAttributes({ [Ju]: sanitizedUrl });
					}
					options.outgoingRequestHook?.(span, request);
				},
				outgoingResponseHook: options.outgoingResponseHook,
				outgoingRequestApplyCustomAttributes: options.outgoingRequestApplyCustomAttributes
			});
		},
		processEvent(event) {
			return serverSpans.processEvent(event);
		}
	};
});
//#endregion
//#region node_modules/@sentry/node/build/esm/utils/outgoingFetchRequest.js
var SENTRY_TRACE_HEADER$2 = "sentry-trace";
var SENTRY_BAGGAGE_HEADER$1 = "baggage";
var W3C_TRACEPARENT_HEADER$1 = "traceparent";
function addTracePropagationHeadersToFetchRequest(request, propagationDecisionMap, span) {
	const url = getAbsoluteUrl$1(request.origin, request.path);
	const { tracePropagationTargets, propagateTraceparent } = getClient()?.getOptions() || {};
	if (!shouldPropagateTraceForUrl(url, tracePropagationTargets, propagationDecisionMap)) return;
	const spanForTraceHeaders = span && spanIsIgnored(span) && getActiveSpan$1() ? void 0 : span;
	const addedHeaders = spanForTraceHeaders ? withActiveSpan$1(spanForTraceHeaders, () => getTraceData({ propagateTraceparent })) : getTraceData({ propagateTraceparent });
	if (!addedHeaders) return;
	const { "sentry-trace": sentryTrace, baggage, traceparent } = addedHeaders;
	const requestHeaders = Array.isArray(request.headers) ? normalizeUndiciHeaderPairs(request.headers) : stringToArrayHeaders(request.headers);
	_deduplicateArrayHeader(requestHeaders, SENTRY_TRACE_HEADER$2);
	_deduplicateArrayHeader(requestHeaders, SENTRY_BAGGAGE_HEADER$1);
	if (propagateTraceparent) _deduplicateArrayHeader(requestHeaders, W3C_TRACEPARENT_HEADER$1);
	if (!(_findExistingHeaderIndex(requestHeaders, SENTRY_TRACE_HEADER$2) !== -1)) {
		if (sentryTrace) requestHeaders.push(SENTRY_TRACE_HEADER$2, sentryTrace);
		if (traceparent && _findExistingHeaderIndex(requestHeaders, "traceparent") === -1) requestHeaders.push("traceparent", traceparent);
		const existingBaggageIndex = _findExistingHeaderIndex(requestHeaders, SENTRY_BAGGAGE_HEADER$1);
		if (baggage && existingBaggageIndex === -1) requestHeaders.push(SENTRY_BAGGAGE_HEADER$1, baggage);
		else if (baggage) {
			const existingBaggageValue = requestHeaders[existingBaggageIndex + 1];
			const merged = mergeBaggageHeaders(existingBaggageValue, baggage);
			if (merged) requestHeaders[existingBaggageIndex + 1] = merged;
		}
	}
	if (Array.isArray(request.headers)) request.headers.splice(0, request.headers.length, ...requestHeaders);
	else request.headers = arrayToStringHeaders(requestHeaders);
}
function normalizeUndiciHeaderPairs(headers) {
	const out = [];
	for (let i = 0; i < headers.length; i++) {
		const entry = headers[i];
		if (i % 2 === 0) out.push(typeof entry === "string" ? entry : String(entry));
		else out.push(Array.isArray(entry) ? entry.join(", ") : entry ?? "");
	}
	return out;
}
function stringToArrayHeaders(requestHeaders) {
	const headersArray = requestHeaders.split("\r\n");
	const headers = [];
	for (const header of headersArray) try {
		const colonIndex = header.indexOf(":");
		if (colonIndex === -1) continue;
		const key = header.slice(0, colonIndex).trim();
		const value = header.slice(colonIndex + 1).trim();
		if (key) headers.push(key, value);
	} catch {
		debug$2.warn(`Failed to convert string request header to array header: ${header}`);
	}
	return headers;
}
function arrayToStringHeaders(headers) {
	const headerPairs = [];
	for (let i = 0; i < headers.length; i += 2) {
		const key = headers[i];
		const value = headers[i + 1];
		if (!key || value == null) continue;
		headerPairs.push(`${key}: ${value}`);
	}
	if (!headerPairs.length) return "";
	return headerPairs.join("\r\n").concat("\r\n");
}
function _deduplicateArrayHeader(headers, headerName) {
	let firstIndex = -1;
	for (let i = 0; i < headers.length; i += 2) {
		if (headers[i] !== headerName) continue;
		if (firstIndex === -1) {
			firstIndex = i;
			continue;
		}
		const firstHeaderValue = headers[firstIndex + 1];
		if (headerName === SENTRY_BAGGAGE_HEADER$1 && firstHeaderValue) {
			const merged = mergeBaggageHeaders(headers[i + 1], firstHeaderValue);
			if (merged) headers[firstIndex + 1] = merged;
		}
		headers.splice(i, 2);
		i -= 2;
	}
}
function _findExistingHeaderIndex(headers, name) {
	return headers.findIndex((header, i) => i % 2 === 0 && header === name);
}
function addFetchRequestBreadcrumb(request, response) {
	const data = getBreadcrumbData(request);
	const statusCode = response.statusCode;
	const level = getBreadcrumbLogLevelFromHttpStatusCode(statusCode);
	addBreadcrumb({
		category: "http",
		data: {
			status_code: statusCode,
			...data
		},
		type: "http",
		level
	}, {
		event: "response",
		request,
		response
	});
}
function getBreadcrumbData(request) {
	try {
		const url = getAbsoluteUrl$1(request.origin, request.path);
		const parsedUrl = parseUrl(url);
		return {
			url: getSanitizedUrlString(parsedUrl),
			[js]: request.method || "GET",
			[im]: filterCollectedUrlQuery(getUrlQuery(parsedUrl.search)),
			[Xu]: getUrlFragment(parsedUrl.hash)
		};
	} catch {
		return {};
	}
}
function getAbsoluteUrl$1(origin, path = "/") {
	try {
		return new URL(path, origin).toString();
	} catch {
		const url = `${origin}`;
		if (url.endsWith("/") && path.startsWith("/")) return `${url}${path.slice(1)}`;
		if (!url.endsWith("/") && !path.startsWith("/")) return `${url}/${path}`;
		return `${url}${path}`;
	}
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/node-fetch/undici-instrumentation.js
var ATTR_HTTP_REQUEST_METHOD_ORIGINAL = "http.request.method_original";
var _channelSubs = [];
var spanFromReq = /* @__PURE__ */ new WeakMap();
var ignoreRequestMap = /* @__PURE__ */ new WeakMap();
var propagationDecisionMap = new LRUMap(100);
function instrumentUndici(config = {}) {
	if (_channelSubs.length) return;
	subscribeToChannel("undici:request:create", (message) => onRequestCreated(config, message));
	subscribeToChannel("undici:client:sendHeaders", (message) => onRequestHeaders(config, message));
	subscribeToChannel("undici:request:headers", (message) => onResponseHeaders(config, message));
	subscribeToChannel("undici:request:trailers", (message) => onDone(message));
	subscribeToChannel("undici:request:error", (message) => onError(message));
}
function safeExecute(fn, onError2) {
	try {
		return fn();
	} catch (error) {
		onError2(error);
		return;
	}
}
function subscribeToChannel(diagnosticChannel, onMessage) {
	_channelSubs.push(diagch.subscribe?.(diagnosticChannel, onMessage));
}
function parseRequestHeaders(request) {
	const result = /* @__PURE__ */ new Map();
	if (Array.isArray(request.headers)) for (let i = 0; i < request.headers.length; i += 2) {
		const key = request.headers[i];
		const value = request.headers[i + 1];
		if (typeof key === "string" && value !== void 0) result.set(key.toLowerCase(), value);
	}
	else if (typeof request.headers === "string") {
		const headers = request.headers.split("\r\n");
		for (const line of headers) {
			if (!line) continue;
			const colonIndex = line.indexOf(":");
			if (colonIndex === -1) continue;
			const key = line.substring(0, colonIndex).toLowerCase();
			const value = line.substring(colonIndex + 1).trim();
			const allValues = result.get(key);
			if (allValues && Array.isArray(allValues)) allValues.push(value);
			else if (allValues) result.set(key, [allValues, value]);
			else result.set(key, value);
		}
	}
	return result;
}
function onRequestCreated(config, { request }) {
	const url = getAbsoluteUrl(request.origin, request.path);
	const ignoredByCallback = safeExecute(() => !!config.ignoreOutgoingRequests?.(url), (e) => e && DEBUG_BUILD && debug$2.error("caught ignoreOutgoingRequests error: ", e));
	const ignoreForBreadcrumbs = isTracingSuppressed$1() || !!ignoredByCallback;
	ignoreRequestMap.set(request, ignoreForBreadcrumbs);
	if (!config.spans) {
		if (config.tracePropagation !== false && !ignoreForBreadcrumbs) addTracePropagationHeadersToFetchRequest(request, propagationDecisionMap);
		return;
	}
	if (request.method === "CONNECT" || ignoredByCallback) return;
	let requestUrl;
	try {
		requestUrl = new URL$1(request.path, request.origin);
	} catch (err) {
		DEBUG_BUILD && debug$2.warn("could not determine url.full:", err);
		return;
	}
	const urlScheme = requestUrl.protocol.replace(":", "");
	const requestMethod = getRequestMethod(request.method);
	const attributes = {
		[dd]: "client",
		[Ed]: Ze,
		[js]: requestMethod,
		[ATTR_HTTP_REQUEST_METHOD_ORIGINAL]: request.method,
		[Ju]: filterCollectedUrl(requestUrl.toString()),
		[Qu]: requestUrl.hostname || void 0,
		[Zu]: requestUrl.pathname,
		[im]: filterCollectedUrlQuery(getUrlQuery(requestUrl.search)),
		[Xu]: getUrlFragment(requestUrl.hash),
		[nm]: urlScheme,
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.node_fetch"
	};
	if (url.startsWith("data:")) {
		const sanitizedUrl = stripDataUrlContent(url);
		attributes[Ju] = sanitizedUrl;
		attributes[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME] = `${request.method || "GET"} ${sanitizedUrl}`;
	}
	const schemePorts = {
		https: "443",
		http: "80"
	};
	const serverAddress = requestUrl.hostname;
	const serverPort = requestUrl.port || schemePorts[urlScheme];
	attributes[mu] = serverAddress;
	if (serverPort && !isNaN(Number(serverPort))) attributes[bu] = Number(serverPort);
	const userAgentValues = parseRequestHeaders(request).get("user-agent");
	if (userAgentValues) {
		const userAgent = Array.isArray(userAgentValues) ? userAgentValues[userAgentValues.length - 1] : userAgentValues;
		attributes[sm] = userAgent;
	}
	const isDataUrl = url.startsWith("data:");
	const client = getClient();
	let spanName;
	if (requestMethod === "_OTHER") spanName = HTTP_SPAN_NAME_FALLBACK;
	else if (!!client && hasSpanStreamingEnabled(client)) spanName = requestUrl.hostname ? `${requestMethod} ${requestUrl.hostname}` : requestMethod;
	else if (isDataUrl) spanName = `${request.method || "GET"} ${stripDataUrlContent(url)}`;
	else spanName = `${requestMethod} ${getSanitizedUrlString(parseUrl(requestUrl.toString()))}`;
	const span = startInactiveSpan({
		name: spanName,
		attributes,
		onlyIfParent: !client || !hasSpanStreamingEnabled(client)
	});
	safeExecute(() => config.requestHook?.(span, request), (e) => e && DEBUG_BUILD && debug$2.error("caught requestHook error: ", e));
	addTracePropagationHeadersToFetchRequest(request, propagationDecisionMap, span);
	spanFromReq.set(request, span);
}
function onRequestHeaders(config, { request, socket }) {
	const span = spanFromReq.get(request);
	if (!span) return;
	const { remoteAddress, remotePort } = socket;
	const spanAttributes = {
		[sp]: remoteAddress,
		[op]: remotePort
	};
	if (config.headersToSpanAttributes?.requestHeaders) {
		const headersToAttribs = new Set(config.headersToSpanAttributes.requestHeaders.map((n) => n.toLowerCase()));
		const headersMap = parseRequestHeaders(request);
		for (const [name, value] of headersMap.entries()) if (headersToAttribs.has(name)) {
			const attrValue = Array.isArray(value) ? value : [value];
			spanAttributes[`http.request.header.${name}`] = attrValue;
		}
	}
	span.setAttributes(spanAttributes);
}
function onResponseHeaders(config, { request, response }) {
	if (config.breadcrumbs !== false && !ignoreRequestMap.get(request)) addFetchRequestBreadcrumb(request, response);
	const span = spanFromReq.get(request);
	if (!span) return;
	const spanAttributes = { [oo]: response.statusCode };
	safeExecute(() => config.responseHook?.(span, {
		request,
		response
	}), (e) => e && DEBUG_BUILD && debug$2.error("caught responseHook error: ", e));
	if (config.headersToSpanAttributes?.responseHeaders) {
		const headersToAttribs = /* @__PURE__ */ new Set();
		config.headersToSpanAttributes?.responseHeaders.forEach((name) => headersToAttribs.add(name.toLowerCase()));
		for (let idx = 0; idx < response.headers.length; idx = idx + 2) {
			const nameBuf = response.headers[idx];
			const valueBuf = response.headers[idx + 1];
			if (nameBuf === void 0 || valueBuf === void 0) continue;
			const name = nameBuf.toString().toLowerCase();
			const value = valueBuf;
			if (headersToAttribs.has(name)) {
				const attrName = `http.response.header.${name}`;
				if (!Object.prototype.hasOwnProperty.call(spanAttributes, attrName)) spanAttributes[attrName] = [value.toString()];
				else spanAttributes[attrName].push(value.toString());
			}
		}
	}
	span.setAttributes(spanAttributes);
	if (response.statusCode >= 400) span.setStatus(getSpanStatusFromHttpCode(response.statusCode));
}
function onDone({ request }) {
	const span = spanFromReq.get(request);
	if (!span) return;
	span.end();
	spanFromReq.delete(request);
}
function onError({ request, error }) {
	const span = spanFromReq.get(request);
	if (!span) return;
	span.setStatus({
		code: 2,
		message: error.message
	});
	span.end();
	spanFromReq.delete(request);
}
function getRequestMethod(original) {
	if (original.toUpperCase() in {
		CONNECT: true,
		OPTIONS: true,
		HEAD: true,
		GET: true,
		POST: true,
		PUT: true,
		PATCH: true,
		DELETE: true,
		TRACE: true,
		QUERY: true
	}) return original.toUpperCase();
	return "_OTHER";
}
function getAbsoluteUrl(origin, path = "/") {
	const url = `${origin}`;
	if (url.endsWith("/") && path.startsWith("/")) return `${url}${path.slice(1)}`;
	if (!url.endsWith("/") && !path.startsWith("/")) return `${url}/${path}`;
	return `${url}${path}`;
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/node-fetch/index.js
var _nativeNodeFetchIntegration = (options = {}) => {
	return {
		name: "NodeFetch",
		setupOnce() {
			const clientOptions = getClient()?.getOptions();
			instrumentUndici({
				...options,
				spans: _shouldInstrumentSpans(options, clientOptions)
			});
		}
	};
};
var nativeNodeFetchIntegration = defineIntegration(_nativeNodeFetchIntegration);
function _shouldInstrumentSpans(options, clientOptions = {}) {
	return options.spans ?? hasSpansEnabled(clientOptions);
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/async-context.js
function setAsyncLocalStorageAsyncContextStrategy() {
	const asyncStorage = getAsyncContextStrategy(getMainCarrier()).getTracingChannelBinding?.()?.asyncLocalStorage ?? new AsyncLocalStorage();
	function getScopes() {
		const scopes = asyncStorage.getStore();
		if (scopes) return scopes;
		return {
			scope: getDefaultCurrentScope(),
			isolationScope: getDefaultIsolationScope()
		};
	}
	function withScope(callback) {
		const scope = getScopes().scope.clone();
		const isolationScope = getScopes().isolationScope;
		return asyncStorage.run({
			scope,
			isolationScope
		}, () => {
			return callback(scope);
		});
	}
	function withSetScope(scope, callback) {
		const isolationScope = getScopes().isolationScope;
		return asyncStorage.run({
			scope,
			isolationScope
		}, () => {
			return callback(scope);
		});
	}
	function withIsolationScope(callback) {
		const scope = getScopes().scope.clone();
		const isolationScope = getScopes().isolationScope.clone();
		if (!isContinuingTrace(scope.getPropagationContext())) scope.setPropagationContext({
			traceId: generateTraceId(),
			sampleRand: safeMathRandom()
		});
		return asyncStorage.run({
			scope,
			isolationScope
		}, () => {
			return callback(isolationScope);
		});
	}
	function withSetIsolationScope(isolationScope, callback) {
		const scope = getScopes().scope.clone();
		return asyncStorage.run({
			scope,
			isolationScope
		}, () => {
			return callback(isolationScope);
		});
	}
	setAsyncContextStrategy({
		withScope,
		withSetScope,
		withIsolationScope,
		withSetIsolationScope,
		getCurrentScope: () => getScopes().scope,
		getIsolationScope: () => getScopes().isolationScope,
		getTracingChannelBinding: () => {
			return { asyncLocalStorage: asyncStorage };
		}
	});
	return asyncStorage;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/core/utils.js
var NON_INFERENCE_OPERATIONS = /* @__PURE__ */ new Set(["unknown"]);
function getGenAiSpanOp(operationName) {
	return NON_INFERENCE_OPERATIONS.has(operationName) ? se : `gen_ai.${operationName}`;
}
function resolveAIRecordingOptions(options) {
	const genAI = getClient()?.getDataCollectionOptions().genAI;
	return {
		...options,
		recordInputs: options?.recordInputs ?? genAI?.inputs ?? true,
		recordOutputs: options?.recordOutputs ?? genAI?.outputs ?? true
	};
}
function setTokenUsageAttributes(span, promptTokens, completionTokens, cachedInputTokens, cachedOutputTokens) {
	if (promptTokens !== void 0) span.setAttributes({ [is]: promptTokens });
	if (completionTokens !== void 0) span.setAttributes({ [rs]: completionTokens });
	if (promptTokens !== void 0 || completionTokens !== void 0 || cachedInputTokens !== void 0 || cachedOutputTokens !== void 0) {
		const totalTokens = (promptTokens ?? 0) + (completionTokens ?? 0) + (cachedInputTokens ?? 0) + (cachedOutputTokens ?? 0);
		span.setAttributes({ [ps]: totalTokens });
	}
}
function endStreamSpan(span, state, recordOutputs) {
	if (!span.isRecording()) return;
	const attrs = { [Dr]: true };
	if (state.responseId) attrs[qr] = state.responseId;
	if (state.responseModel) attrs[Pr] = state.responseModel;
	if (state.promptTokens !== void 0) attrs[is] = state.promptTokens;
	if (state.completionTokens !== void 0) attrs[rs] = state.completionTokens;
	if (state.totalTokens !== void 0) attrs[ps] = state.totalTokens;
	else if (state.promptTokens !== void 0 || state.completionTokens !== void 0 || state.cacheCreationInputTokens !== void 0 || state.cacheReadInputTokens !== void 0) attrs[ps] = (state.promptTokens ?? 0) + (state.completionTokens ?? 0) + (state.cacheCreationInputTokens ?? 0) + (state.cacheReadInputTokens ?? 0);
	if (state.finishReasons.length) attrs[Rr] = JSON.stringify(state.finishReasons);
	if (recordOutputs && state.responseTexts.length) attrs[Lr] = state.responseTexts.join("");
	if (recordOutputs && state.toolCalls.length) attrs[Gr] = JSON.stringify(state.toolCalls);
	span.setAttributes(attrs);
	span.end();
}
function extractSystemInstructions(messages) {
	if (!Array.isArray(messages)) return {
		systemInstructions: void 0,
		filteredMessages: messages
	};
	const systemMessageIndex = messages.findIndex((msg) => msg && typeof msg === "object" && "role" in msg && msg.role === "system");
	if (systemMessageIndex === -1) return {
		systemInstructions: void 0,
		filteredMessages: messages
	};
	const systemMessage = messages[systemMessageIndex];
	const systemContent = typeof systemMessage.content === "string" ? systemMessage.content : systemMessage.content !== void 0 ? JSON.stringify(systemMessage.content) : void 0;
	if (!systemContent) return {
		systemInstructions: void 0,
		filteredMessages: messages
	};
	return {
		systemInstructions: JSON.stringify([{
			type: "text",
			content: systemContent
		}]),
		filteredMessages: [...messages.slice(0, systemMessageIndex), ...messages.slice(systemMessageIndex + 1)]
	};
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/openai/constants.js
var OPENAI_INTEGRATION_NAME = "OpenAI";
var RESPONSE_EVENT_TYPES = [
	"response.created",
	"response.in_progress",
	"response.failed",
	"response.completed",
	"response.incomplete",
	"response.queued",
	"response.output_text.delta",
	...[
		"response.output_item.added",
		"response.function_call_arguments.delta",
		"response.function_call_arguments.done",
		"response.output_item.done"
	]
];
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/core/gen-ai-attributes.js
var GEN_AI_REQUEST_STREAM_ATTRIBUTE = "gen_ai.request.stream";
var GEN_AI_REQUEST_ENCODING_FORMAT_ATTRIBUTE = "gen_ai.request.encoding_format";
var GEN_AI_REQUEST_DIMENSIONS_ATTRIBUTE = "gen_ai.request.dimensions";
var GEN_AI_RESPONSE_STOP_REASON_ATTRIBUTE = "gen_ai.response.stop_reason";
var GEN_AI_TOOL_CALL_ID_ATTRIBUTE = "gen_ai.tool.call.id";
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/openai/utils.js
function isResponsesApiStreamEvent(event) {
	return event !== null && typeof event === "object" && "type" in event && typeof event.type === "string" && event.type.startsWith("response.");
}
function isChatCompletionChunk(event) {
	return event !== null && typeof event === "object" && "object" in event && event.object === "chat.completion.chunk";
}
function addResponseAttributes$2(span, result, recordOutputs) {
	if (!result || typeof result !== "object") return;
	const response = result;
	const attrs = {};
	if (typeof response.id === "string") attrs[qr] = response.id;
	if (typeof response.model === "string") attrs[Pr] = response.model;
	if (response.object === "conversation" && typeof response.id === "string") attrs[ir] = response.id;
	if (response.usage && typeof response.usage === "object") {
		const usage = response.usage;
		const inputTokens = usage.prompt_tokens ?? usage.input_tokens;
		if (typeof inputTokens === "number") attrs[is] = inputTokens;
		const outputTokens = usage.completion_tokens ?? usage.output_tokens;
		if (typeof outputTokens === "number") attrs[rs] = outputTokens;
		if (typeof usage.total_tokens === "number") attrs[ps] = usage.total_tokens;
	}
	if (Array.isArray(response.choices)) {
		const choices = response.choices;
		const finishReasons = choices.map((choice) => choice.finish_reason).filter((reason) => typeof reason === "string");
		if (finishReasons.length > 0) attrs[Rr] = JSON.stringify(finishReasons);
		if (recordOutputs) {
			const responseTexts = choices.map((choice) => {
				return choice.message?.content || "";
			});
			attrs[Lr] = JSON.stringify(responseTexts);
			const toolCalls = choices.map((choice) => {
				return choice.message?.tool_calls;
			}).filter((calls) => Array.isArray(calls) && calls.length > 0).flat();
			if (toolCalls.length > 0) attrs[Gr] = JSON.stringify(toolCalls);
		}
	}
	if (typeof response.status === "string") {
		if (!attrs["gen_ai.response.finish_reasons"]) attrs[Rr] = JSON.stringify([response.status]);
	}
	if (recordOutputs) {
		if (typeof response.output_text === "string" && !attrs["gen_ai.response.text"]) attrs[Lr] = response.output_text;
		if (Array.isArray(response.output) && response.output.length > 0 && !attrs["gen_ai.response.tool_calls"]) {
			const functionCalls = response.output.filter((item) => item?.type === "function_call");
			if (functionCalls.length > 0) attrs[Gr] = JSON.stringify(functionCalls);
		}
	}
	span.setAttributes(attrs);
}
function extractConversationId(params) {
	if ("conversation" in params && typeof params.conversation === "string") return params.conversation;
	if ("previous_response_id" in params && typeof params.previous_response_id === "string") return params.previous_response_id;
}
function extractRequestParameters(params) {
	const attributes = { [wr]: params.model ?? "unknown" };
	if ("temperature" in params) attributes[Or] = params.temperature;
	if ("top_p" in params) attributes[Ar] = params.top_p;
	if ("frequency_penalty" in params) attributes[vr] = params.frequency_penalty;
	if ("presence_penalty" in params) attributes[Sr] = params.presence_penalty;
	if ("stream" in params) attributes[GEN_AI_REQUEST_STREAM_ATTRIBUTE] = params.stream;
	if ("encoding_format" in params) attributes[GEN_AI_REQUEST_ENCODING_FORMAT_ATTRIBUTE] = params.encoding_format;
	if ("dimensions" in params) attributes[GEN_AI_REQUEST_DIMENSIONS_ATTRIBUTE] = params.dimensions;
	const conversationId = extractConversationId(params);
	if (conversationId) attributes[ir] = conversationId;
	return attributes;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/openai/streaming.js
function processChatCompletionToolCalls(toolCalls, state) {
	for (const toolCall of toolCalls) {
		const index = toolCall.index;
		if (index === void 0 || !toolCall.function) continue;
		if (!(index in state.chatCompletionToolCalls)) state.chatCompletionToolCalls[index] = {
			...toolCall,
			function: {
				name: toolCall.function.name,
				arguments: toolCall.function.arguments || ""
			}
		};
		else {
			const existingToolCall = state.chatCompletionToolCalls[index];
			if (toolCall.function.arguments && existingToolCall?.function) existingToolCall.function.arguments += toolCall.function.arguments;
		}
	}
}
function processChatCompletionChunk(chunk, state, recordOutputs) {
	state.responseId = chunk.id ?? state.responseId;
	state.responseModel = chunk.model ?? state.responseModel;
	if (chunk.usage) {
		state.promptTokens = chunk.usage.prompt_tokens;
		state.completionTokens = chunk.usage.completion_tokens;
		state.totalTokens = chunk.usage.total_tokens;
	}
	for (const choice of chunk.choices ?? []) {
		if (recordOutputs) {
			if (choice.delta?.content) state.responseTexts.push(choice.delta.content);
			if (choice.delta?.tool_calls) processChatCompletionToolCalls(choice.delta.tool_calls, state);
		}
		if (choice.finish_reason) state.finishReasons.push(choice.finish_reason);
	}
}
function processResponsesApiEvent(streamEvent, state, recordOutputs, span) {
	if (!(streamEvent && typeof streamEvent === "object")) {
		state.eventTypes.push("unknown:non-object");
		return;
	}
	if (streamEvent instanceof Error) {
		span.setStatus({
			code: 2,
			message: "internal_error"
		});
		captureException(streamEvent, { mechanism: {
			handled: false,
			type: "auto.ai.openai.stream-response"
		} });
		return;
	}
	if (!("type" in streamEvent)) return;
	const event = streamEvent;
	if (!RESPONSE_EVENT_TYPES.includes(event.type)) {
		state.eventTypes.push(event.type);
		return;
	}
	if (recordOutputs) {
		if (event.type === "response.output_item.done" && "item" in event) state.responsesApiToolCalls.push(event.item);
		if (event.type === "response.output_text.delta" && "delta" in event && event.delta) {
			state.responseTexts.push(event.delta);
			return;
		}
	}
	if ("response" in event) {
		const { response } = event;
		state.responseId = response.id ?? state.responseId;
		state.responseModel = response.model ?? state.responseModel;
		if (response.usage) {
			state.promptTokens = response.usage.input_tokens;
			state.completionTokens = response.usage.output_tokens;
			state.totalTokens = response.usage.total_tokens;
		}
		if (response.status) state.finishReasons.push(response.status);
		if (recordOutputs && response.output_text) state.responseTexts.push(response.output_text);
	}
}
async function* instrumentStream$1(stream, span, recordOutputs) {
	const state = {
		eventTypes: [],
		responseTexts: [],
		finishReasons: [],
		responseId: "",
		responseModel: "",
		promptTokens: void 0,
		completionTokens: void 0,
		totalTokens: void 0,
		chatCompletionToolCalls: {},
		responsesApiToolCalls: []
	};
	try {
		for await (const event of stream) {
			if (isChatCompletionChunk(event)) processChatCompletionChunk(event, state, recordOutputs);
			else if (isResponsesApiStreamEvent(event)) processResponsesApiEvent(event, state, recordOutputs, span);
			yield event;
		}
	} finally {
		const allToolCalls = [...Object.values(state.chatCompletionToolCalls), ...state.responsesApiToolCalls];
		endStreamSpan(span, {
			...state,
			toolCalls: allToolCalls
		}, recordOutputs);
	}
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/openai/index.js
function extractAvailableTools(params) {
	const tools = Array.isArray(params.tools) ? params.tools : [];
	const webSearchOptions = params.web_search_options && typeof params.web_search_options === "object" ? [{
		type: "web_search_options",
		...params.web_search_options
	}] : [];
	const availableTools = [...tools, ...webSearchOptions];
	if (availableTools.length === 0) return;
	try {
		return JSON.stringify(availableTools);
	} catch (error) {
		DEBUG_BUILD$1 && debug$2.error("Failed to serialize OpenAI tools:", error);
		return;
	}
}
function extractRequestAttributes$2(args, operationName) {
	const attributes = {
		[fr]: "openai",
		[ur]: operationName,
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ai.openai"
	};
	if (args.length > 0 && typeof args[0] === "object" && args[0] !== null) {
		const params = args[0];
		const availableTools = extractAvailableTools(params);
		if (availableTools) attributes[Hr] = availableTools;
		Object.assign(attributes, extractRequestParameters(params));
	} else attributes[wr] = "unknown";
	return attributes;
}
function addRequestAttributes(span, params, operationName) {
	if (operationName === "embeddings" && "input" in params) {
		const input = params.input;
		if (input == null) return;
		if (typeof input === "string" && input.length === 0) return;
		if (Array.isArray(input) && input.length === 0) return;
		span.setAttribute(pr, stringify(input, String));
		return;
	}
	const src = "input" in params ? params.input : "messages" in params ? params.messages : void 0;
	if (!src) return;
	if (Array.isArray(src) && src.length === 0) return;
	const { systemInstructions, filteredMessages } = extractSystemInstructions(src);
	if (systemInstructions) span.setAttribute(Wr, systemInstructions);
	span.setAttribute(dr, stringify(filteredMessages));
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/anthropic-ai/constants.js
var ANTHROPIC_AI_INTEGRATION_NAME = "Anthropic_AI";
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/anthropic-ai/utils.js
function setMessagesAttribute(span, messages) {
	if (Array.isArray(messages) && messages.length === 0) return;
	const { systemInstructions, filteredMessages } = extractSystemInstructions(messages);
	if (systemInstructions) span.setAttributes({ [Wr]: systemInstructions });
	span.setAttributes({ [dr]: stringify(filteredMessages) });
}
var ANTHROPIC_ERROR_TYPE_TO_SPAN_STATUS = {
	invalid_request_error: "invalid_argument",
	authentication_error: "unauthenticated",
	permission_error: "permission_denied",
	not_found_error: "not_found",
	request_too_large: "failed_precondition",
	rate_limit_error: "resource_exhausted",
	api_error: "internal_error",
	overloaded_error: "unavailable"
};
function mapAnthropicErrorToStatusMessage(errorType) {
	if (!errorType) return "internal_error";
	return ANTHROPIC_ERROR_TYPE_TO_SPAN_STATUS[errorType] || "internal_error";
}
function handleResponseError(span, response) {
	if (response.error) {
		span.setStatus({
			code: 2,
			message: mapAnthropicErrorToStatusMessage(response.error.type)
		});
		captureException(response.error, { mechanism: {
			handled: false,
			type: "auto.ai.anthropic.anthropic_error"
		} });
	}
}
function messagesFromParams(params) {
	const { system, messages, input, prompt } = params;
	const systemMessages = typeof system === "string" ? [{
		role: "system",
		content: params.system
	}] : [];
	const inputParamMessages = Array.isArray(input) ? input : input != null ? [input] : void 0;
	const messagesParamMessages = Array.isArray(messages) ? messages : messages != null ? [messages] : [];
	const promptMessages = prompt != null ? [{
		role: "user",
		content: stringify(prompt, String)
	}] : [];
	const userMessages = inputParamMessages ?? (messagesParamMessages.length ? messagesParamMessages : promptMessages);
	return [...systemMessages, ...userMessages];
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/anthropic-ai/streaming.js
function isErrorEvent$1(event, span) {
	if ("type" in event && typeof event.type === "string") {
		if (event.type === "error") {
			span.setStatus({
				code: 2,
				message: mapAnthropicErrorToStatusMessage(event.error?.type)
			});
			return true;
		}
	}
	return false;
}
function handleMessageMetadata(event, state) {
	if (event.type === "message_delta") {
		if (event.usage && typeof event.usage.output_tokens === "number") state.completionTokens = event.usage.output_tokens;
		if (event.delta?.stop_reason) state.finishReasons.push(event.delta.stop_reason);
	}
	if (event.message) {
		const message = event.message;
		if (message.id) state.responseId = message.id;
		if (message.model) state.responseModel = message.model;
		if (message.usage) {
			if (typeof message.usage.input_tokens === "number") state.promptTokens = message.usage.input_tokens;
			if (typeof message.usage.cache_creation_input_tokens === "number") state.cacheCreationInputTokens = message.usage.cache_creation_input_tokens;
			if (typeof message.usage.cache_read_input_tokens === "number") state.cacheReadInputTokens = message.usage.cache_read_input_tokens;
		}
	}
}
function handleContentBlockStart(event, state) {
	if (event.type !== "content_block_start" || typeof event.index !== "number" || !event.content_block) return;
	if (event.content_block.type === "tool_use" || event.content_block.type === "server_tool_use") state.activeToolBlocks[event.index] = {
		id: event.content_block.id,
		name: event.content_block.name,
		inputJsonParts: []
	};
}
function handleContentBlockDelta(event, state, recordOutputs) {
	if (event.type !== "content_block_delta" || !event.delta) return;
	if (typeof event.index === "number" && "partial_json" in event.delta && typeof event.delta.partial_json === "string") {
		const active = state.activeToolBlocks[event.index];
		if (active) active.inputJsonParts.push(event.delta.partial_json);
	}
	if (recordOutputs && typeof event.delta.text === "string") state.responseTexts.push(event.delta.text);
}
function handleContentBlockStop(event, state) {
	if (event.type !== "content_block_stop" || typeof event.index !== "number") return;
	const active = state.activeToolBlocks[event.index];
	if (!active) return;
	const raw = active.inputJsonParts.join("");
	let parsedInput;
	try {
		parsedInput = raw ? JSON.parse(raw) : {};
	} catch {
		parsedInput = { __unparsed: raw };
	}
	state.toolCalls.push({
		type: "tool_use",
		id: active.id,
		name: active.name,
		input: parsedInput
	});
	delete state.activeToolBlocks[event.index];
}
function processEvent(event, state, recordOutputs, span) {
	if (!(event && typeof event === "object")) return;
	if (isErrorEvent$1(event, span)) return;
	handleMessageMetadata(event, state);
	handleContentBlockStart(event, state);
	handleContentBlockDelta(event, state, recordOutputs);
	handleContentBlockStop(event, state);
}
async function* instrumentAsyncIterableStream(stream, span, recordOutputs) {
	const state = {
		responseTexts: [],
		finishReasons: [],
		responseId: "",
		responseModel: "",
		promptTokens: void 0,
		completionTokens: void 0,
		cacheCreationInputTokens: void 0,
		cacheReadInputTokens: void 0,
		toolCalls: [],
		activeToolBlocks: {}
	};
	try {
		for await (const event of stream) {
			processEvent(event, state, recordOutputs, span);
			yield event;
		}
	} finally {
		endStreamSpan(span, state, recordOutputs);
	}
}
function instrumentMessageStream(stream, span, recordOutputs) {
	const state = {
		responseTexts: [],
		finishReasons: [],
		responseId: "",
		responseModel: "",
		promptTokens: void 0,
		completionTokens: void 0,
		cacheCreationInputTokens: void 0,
		cacheReadInputTokens: void 0,
		toolCalls: [],
		activeToolBlocks: {}
	};
	stream.on("streamEvent", (event) => {
		processEvent(event, state, recordOutputs, span);
	});
	stream.on("message", () => {
		endStreamSpan(span, state, recordOutputs);
	});
	stream.on("error", (error) => {
		captureException(error, { mechanism: {
			handled: false,
			type: "auto.ai.anthropic.stream_error"
		} });
		if (span.isRecording()) {
			span.setStatus({
				code: 2,
				message: "internal_error"
			});
			span.end();
		}
	});
	return stream;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/anthropic-ai/index.js
function extractRequestAttributes$1(args, operationName) {
	const attributes = {
		[fr]: "anthropic",
		[ur]: operationName,
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ai.anthropic"
	};
	if (args.length > 0 && typeof args[0] === "object" && args[0] !== null) {
		const params = args[0];
		if (params.tools && Array.isArray(params.tools)) attributes[Hr] = JSON.stringify(params.tools);
		attributes[wr] = params.model ?? "unknown";
		if ("temperature" in params) attributes[Or] = params.temperature;
		if ("top_p" in params) attributes[Ar] = params.top_p;
		if ("stream" in params) attributes[GEN_AI_REQUEST_STREAM_ATTRIBUTE] = params.stream;
		if ("top_k" in params) attributes[Cr] = params.top_k;
		if ("frequency_penalty" in params) attributes[vr] = params.frequency_penalty;
		if ("max_tokens" in params) attributes[kr] = params.max_tokens;
	} else attributes[wr] = "unknown";
	return attributes;
}
function addPrivateRequestAttributes$1(span, params) {
	setMessagesAttribute(span, messagesFromParams(params));
}
function addContentAttributes(span, response) {
	if ("content" in response) {
		if (Array.isArray(response.content)) {
			span.setAttributes({ [Lr]: response.content.map((item) => item.text).filter((text) => !!text).join("") });
			const toolCalls = [];
			for (const item of response.content) if (item.type === "tool_use" || item.type === "server_tool_use") toolCalls.push(item);
			if (toolCalls.length > 0) span.setAttributes({ [Gr]: JSON.stringify(toolCalls) });
		}
	}
	if ("completion" in response) span.setAttributes({ [Lr]: response.completion });
}
function addMetadataAttributes(span, response) {
	if ("id" in response && "model" in response) {
		span.setAttributes({
			[qr]: response.id,
			[Pr]: response.model
		});
		if ("usage" in response && response.usage) setTokenUsageAttributes(span, response.usage.input_tokens, response.usage.output_tokens, response.usage.cache_creation_input_tokens, response.usage.cache_read_input_tokens);
	}
}
function addResponseAttributes$1(span, response, recordOutputs) {
	if (!response || typeof response !== "object") return;
	if ("type" in response && response.type === "error") {
		handleResponseError(span, response);
		return;
	}
	if (recordOutputs) addContentAttributes(span, response);
	addMetadataAttributes(span, response);
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/google-genai/constants.js
var GOOGLE_GENAI_INTEGRATION_NAME = "Google_GenAI";
var GOOGLE_GENAI_SYSTEM_NAME = "google_genai";
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/google-genai/streaming.js
function isErrorChunk(chunk, span) {
	const feedback = chunk?.promptFeedback;
	if (feedback?.blockReason) {
		const message = feedback.blockReasonMessage ?? feedback.blockReason;
		span.setStatus({
			code: 2,
			message: "internal_error"
		});
		captureException(`Content blocked: ${message}`, { mechanism: {
			handled: false,
			type: "auto.ai.google_genai"
		} });
		return true;
	}
	return false;
}
function handleResponseMetadata(chunk, state) {
	if (typeof chunk.responseId === "string") state.responseId = chunk.responseId;
	if (typeof chunk.modelVersion === "string") state.responseModel = chunk.modelVersion;
	const usage = chunk.usageMetadata;
	if (usage) {
		if (typeof usage.promptTokenCount === "number") state.promptTokens = usage.promptTokenCount;
		if (typeof usage.candidatesTokenCount === "number") state.completionTokens = usage.candidatesTokenCount;
		if (typeof usage.totalTokenCount === "number") state.totalTokens = usage.totalTokenCount;
	}
}
function handleCandidateContent(chunk, state, recordOutputs) {
	if (Array.isArray(chunk.functionCalls)) state.toolCalls.push(...chunk.functionCalls);
	for (const candidate of chunk.candidates ?? []) {
		if (candidate?.finishReason && !state.finishReasons.includes(candidate.finishReason)) state.finishReasons.push(candidate.finishReason);
		for (const part of candidate?.content?.parts ?? []) {
			if (recordOutputs && part.text) state.responseTexts.push(part.text);
			if (part.functionCall) state.toolCalls.push({
				type: "function",
				id: part.functionCall.id,
				name: part.functionCall.name,
				arguments: part.functionCall.args
			});
		}
	}
}
function processChunk(chunk, state, recordOutputs, span) {
	if (!chunk || isErrorChunk(chunk, span)) return;
	handleResponseMetadata(chunk, state);
	handleCandidateContent(chunk, state, recordOutputs);
}
async function* instrumentStream(stream, span, recordOutputs) {
	const state = {
		responseTexts: [],
		finishReasons: [],
		toolCalls: []
	};
	try {
		for await (const chunk of stream) {
			processChunk(chunk, state, recordOutputs, span);
			yield chunk;
		}
	} finally {
		endStreamSpan(span, state, recordOutputs);
	}
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/google-genai/utils.js
function contentUnionToMessages(content, role = "user") {
	if (typeof content === "string") return [{
		role,
		content
	}];
	if (Array.isArray(content)) return content.flatMap((content2) => contentUnionToMessages(content2, role));
	if (typeof content !== "object" || !content) return [];
	if ("role" in content && typeof content.role === "string") return [content];
	if ("parts" in content) return [{
		...content,
		role
	}];
	return [{
		role,
		content
	}];
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/google-genai/index.js
function extractModel(params, context) {
	if ("model" in params && typeof params.model === "string") return params.model;
	if (context && typeof context === "object") {
		const contextObj = context;
		if ("model" in contextObj && typeof contextObj.model === "string") return contextObj.model;
		if ("modelVersion" in contextObj && typeof contextObj.modelVersion === "string") return contextObj.modelVersion;
	}
	return "unknown";
}
function extractConfigAttributes(config) {
	const attributes = {};
	if ("temperature" in config && typeof config.temperature === "number") attributes[Or] = config.temperature;
	if ("topP" in config && typeof config.topP === "number") attributes[Ar] = config.topP;
	if ("topK" in config && typeof config.topK === "number") attributes[Cr] = config.topK;
	if ("maxOutputTokens" in config && typeof config.maxOutputTokens === "number") attributes[kr] = config.maxOutputTokens;
	if ("frequencyPenalty" in config && typeof config.frequencyPenalty === "number") attributes[vr] = config.frequencyPenalty;
	if ("presencePenalty" in config && typeof config.presencePenalty === "number") attributes[Sr] = config.presencePenalty;
	return attributes;
}
function extractRequestAttributes(operationName, params, context) {
	const attributes = {
		[fr]: GOOGLE_GENAI_SYSTEM_NAME,
		[ur]: operationName,
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ai.google_genai"
	};
	if (params) {
		attributes[wr] = extractModel(params, context);
		if ("config" in params && typeof params.config === "object" && params.config) {
			const config = params.config;
			Object.assign(attributes, extractConfigAttributes(config));
			if ("tools" in config && Array.isArray(config.tools)) {
				const functionDeclarations = config.tools.flatMap((tool) => tool.functionDeclarations);
				attributes[Hr] = JSON.stringify(functionDeclarations);
			}
		}
	} else attributes[wr] = extractModel({}, context);
	return attributes;
}
function addPrivateRequestAttributes(span, params, operationName) {
	if (operationName === "embeddings") {
		const contents = params.contents;
		if (contents != null) span.setAttribute(pr, stringify(contents, String));
		return;
	}
	const messages = [];
	if ("config" in params && params.config && typeof params.config === "object" && "systemInstruction" in params.config && params.config.systemInstruction) messages.push(...contentUnionToMessages(params.config.systemInstruction, "system"));
	if ("history" in params) messages.push(...contentUnionToMessages(params.history, "user"));
	if ("contents" in params) messages.push(...contentUnionToMessages(params.contents, "user"));
	if ("message" in params) messages.push(...contentUnionToMessages(params.message, "user"));
	if (Array.isArray(messages) && messages.length) {
		const { systemInstructions, filteredMessages } = extractSystemInstructions(messages);
		if (systemInstructions) span.setAttribute(Wr, systemInstructions);
		span.setAttributes({ [dr]: stringify(filteredMessages) });
	}
}
function addResponseAttributes(span, response, recordOutputs) {
	if (!response || typeof response !== "object") return;
	if (response.modelVersion) span.setAttribute(Pr, response.modelVersion);
	if (response.usageMetadata && typeof response.usageMetadata === "object") {
		const usage = response.usageMetadata;
		if (typeof usage.promptTokenCount === "number") span.setAttributes({ [is]: usage.promptTokenCount });
		if (typeof usage.candidatesTokenCount === "number") span.setAttributes({ [rs]: usage.candidatesTokenCount });
		if (typeof usage.totalTokenCount === "number") span.setAttributes({ [ps]: usage.totalTokenCount });
	}
	if (recordOutputs && Array.isArray(response.candidates) && response.candidates.length > 0) {
		const responseTexts = response.candidates.map((candidate) => {
			if (candidate.content?.parts && Array.isArray(candidate.content.parts)) return candidate.content.parts.map((part) => typeof part.text === "string" ? part.text : "").filter((text) => text.length > 0).join("");
			return "";
		}).filter((text) => text.length > 0);
		if (responseTexts.length > 0) span.setAttributes({ [Lr]: responseTexts.join("") });
	}
	if (recordOutputs && response.functionCalls) {
		const functionCalls = response.functionCalls;
		if (Array.isArray(functionCalls) && functionCalls.length > 0) span.setAttributes({ [Gr]: JSON.stringify(functionCalls) });
	}
}
function resolveChatParams(operationName, params, context) {
	if (operationName !== "chat" || params?.config != null || !context || typeof context !== "object") return params;
	const chatConfig = context.config;
	if (!chatConfig || typeof chatConfig !== "object") return params;
	return {
		...params,
		config: chatConfig
	};
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/workers-ai/constants.js
var WORKERS_AI_INTEGRATION_NAME = "WorkersAI";
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/langchain/constants.js
var LANGCHAIN_INTEGRATION_NAME = "LangChain";
var LANGCHAIN_ORIGIN = "auto.ai.langchain";
var ROLE_MAP = {
	human: "user",
	ai: "assistant",
	assistant: "assistant",
	system: "system",
	function: "function",
	tool: "tool"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/langchain/utils.js
var setIfDefined = (target, key, value) => {
	if (value != null) target[key] = value;
};
var setNumberIfDefined = (target, key, value) => {
	const n = Number(value);
	if (!Number.isNaN(n)) target[key] = n;
};
function normalizeMessageRole(role) {
	const normalized = role.toLowerCase();
	return ROLE_MAP[normalized] ?? normalized;
}
function normalizeRoleNameFromCtor(name) {
	if (name.includes("System")) return "system";
	if (name.includes("Human")) return "user";
	if (name.includes("AI") || name.includes("Assistant")) return "assistant";
	if (name.includes("Function")) return "function";
	if (name.includes("Tool")) return "tool";
	return "user";
}
function getInvocationParams(tags) {
	if (!tags || Array.isArray(tags)) return void 0;
	return tags.invocation_params;
}
function normalizeLangChainMessages(messages) {
	return messages.map((message) => {
		const maybeGetType = message._getType;
		if (typeof maybeGetType === "function") return {
			role: normalizeMessageRole(maybeGetType.call(message)),
			content: stringify(message.content, String)
		};
		if (message.lc === 1 && message.kwargs) {
			const id = message.id;
			const messageType = Array.isArray(id) && id.length > 0 ? id[id.length - 1] : "";
			return {
				role: normalizeMessageRole(typeof messageType === "string" ? normalizeRoleNameFromCtor(messageType) : "user"),
				content: stringify(message.kwargs?.content, String)
			};
		}
		if (message.type) return {
			role: normalizeMessageRole(String(message.type).toLowerCase()),
			content: stringify(message.content, String)
		};
		if (message.role) return {
			role: normalizeMessageRole(String(message.role)),
			content: stringify(message.content, String)
		};
		const ctor = message.constructor?.name;
		if (ctor && ctor !== "Object") return {
			role: normalizeMessageRole(normalizeRoleNameFromCtor(ctor)),
			content: stringify(message.content, String)
		};
		return {
			role: "user",
			content: stringify(message.content, String)
		};
	});
}
function extractCommonRequestAttributes(serialized, invocationParams, langSmithMetadata) {
	const attrs = {};
	const kwargs = "kwargs" in serialized ? serialized.kwargs : void 0;
	const temperature = invocationParams?.temperature ?? langSmithMetadata?.ls_temperature ?? kwargs?.temperature;
	setNumberIfDefined(attrs, Or, temperature);
	const maxTokens = invocationParams?.max_tokens ?? langSmithMetadata?.ls_max_tokens ?? kwargs?.max_tokens;
	setNumberIfDefined(attrs, kr, maxTokens);
	const topP = invocationParams?.top_p ?? kwargs?.top_p;
	setNumberIfDefined(attrs, Ar, topP);
	const frequencyPenalty = invocationParams?.frequency_penalty;
	setNumberIfDefined(attrs, vr, frequencyPenalty);
	const presencePenalty = invocationParams?.presence_penalty;
	setNumberIfDefined(attrs, Sr, presencePenalty);
	if (invocationParams && "stream" in invocationParams) setIfDefined(attrs, GEN_AI_REQUEST_STREAM_ATTRIBUTE, Boolean(invocationParams.stream));
	return attrs;
}
function baseRequestAttributes(system, modelName, serialized, invocationParams, langSmithMetadata) {
	return {
		[fr]: stringify(system ?? "langchain", String),
		[ur]: "chat",
		[wr]: stringify(modelName, String),
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: LANGCHAIN_ORIGIN,
		...extractCommonRequestAttributes(serialized, invocationParams, langSmithMetadata)
	};
}
function extractLLMRequestAttributes(llm, prompts, recordInputs, invocationParams, langSmithMetadata) {
	const system = langSmithMetadata?.ls_provider;
	const attrs = baseRequestAttributes(system, invocationParams?.model ?? langSmithMetadata?.ls_model_name ?? "unknown", llm, invocationParams, langSmithMetadata);
	if (recordInputs && Array.isArray(prompts) && prompts.length > 0) {
		const messages = prompts.map((p) => ({
			role: "user",
			content: p
		}));
		setIfDefined(attrs, dr, stringify(messages));
	}
	return attrs;
}
function extractChatModelRequestAttributes(llm, langChainMessages, recordInputs, invocationParams, langSmithMetadata) {
	const attrs = baseRequestAttributes(langSmithMetadata?.ls_provider ?? llm.id?.[2], invocationParams?.model ?? langSmithMetadata?.ls_model_name ?? "unknown", llm, invocationParams, langSmithMetadata);
	if (recordInputs && Array.isArray(langChainMessages) && langChainMessages.length > 0) {
		const { systemInstructions, filteredMessages } = extractSystemInstructions(normalizeLangChainMessages(langChainMessages.flat()));
		if (systemInstructions) setIfDefined(attrs, Wr, systemInstructions);
		setIfDefined(attrs, dr, stringify(filteredMessages));
	}
	return attrs;
}
function addToolCallsAttributes(generations, attrs) {
	const toolCalls = [];
	const flatGenerations = generations.flat();
	for (const gen of flatGenerations) {
		const msgToolCalls = gen.message?.tool_calls;
		if (Array.isArray(msgToolCalls) && msgToolCalls.length > 0) toolCalls.push(...msgToolCalls);
		else {
			const content = gen.message?.content;
			if (Array.isArray(content)) for (const item of content) {
				const t = item;
				if (t.type === "tool_use") toolCalls.push(t);
			}
		}
	}
	if (toolCalls.length > 0) setIfDefined(attrs, Gr, stringify(toolCalls, String));
}
function addTokenUsageAttributes(llmOutput, attrs) {
	if (!llmOutput) return;
	const tokenUsage = llmOutput.tokenUsage;
	const anthropicUsage = llmOutput.usage;
	if (tokenUsage) {
		setNumberIfDefined(attrs, is, tokenUsage.promptTokens);
		setNumberIfDefined(attrs, rs, tokenUsage.completionTokens);
		setNumberIfDefined(attrs, ps, tokenUsage.totalTokens);
	} else if (anthropicUsage) {
		setNumberIfDefined(attrs, is, anthropicUsage.input_tokens);
		setNumberIfDefined(attrs, rs, anthropicUsage.output_tokens);
		const input = Number(anthropicUsage.input_tokens);
		const output = Number(anthropicUsage.output_tokens);
		const total = (Number.isNaN(input) ? 0 : input) + (Number.isNaN(output) ? 0 : output);
		if (total > 0) setNumberIfDefined(attrs, ps, total);
		if (anthropicUsage.cache_creation_input_tokens !== void 0) setNumberIfDefined(attrs, $r, anthropicUsage.cache_creation_input_tokens);
		if (anthropicUsage.cache_read_input_tokens !== void 0) setNumberIfDefined(attrs, es, anthropicUsage.cache_read_input_tokens);
	}
}
function extractLlmResponseAttributes(llmResult, recordOutputs) {
	if (!llmResult) return;
	const attrs = {};
	if (Array.isArray(llmResult.generations)) {
		const finishReasons = llmResult.generations.flat().map((g) => {
			if (g.generationInfo?.finish_reason) return g.generationInfo.finish_reason;
			if (g.generation_info?.finish_reason) return g.generation_info.finish_reason;
			return null;
		}).filter((r) => typeof r === "string");
		if (finishReasons.length > 0) setIfDefined(attrs, Rr, stringify(finishReasons, String));
		addToolCallsAttributes(llmResult.generations, attrs);
		if (recordOutputs) {
			const texts = llmResult.generations.flat().map((gen) => gen.text ?? gen.message?.content).filter((t) => typeof t === "string");
			if (texts.length > 0) setIfDefined(attrs, Lr, stringify(texts, String));
		}
	}
	addTokenUsageAttributes(llmResult.llmOutput, attrs);
	const llmOutput = llmResult.llmOutput;
	const v1Message = (llmResult.generations?.[0]?.[0])?.message;
	const modelName = llmOutput?.model_name ?? llmOutput?.model ?? v1Message?.response_metadata?.model_name;
	if (modelName) setIfDefined(attrs, Pr, modelName);
	const responseId = llmOutput?.id ?? v1Message?.id;
	if (responseId) setIfDefined(attrs, qr, responseId);
	const stopReason = llmOutput?.stop_reason ?? v1Message?.response_metadata?.finish_reason;
	if (stopReason) setIfDefined(attrs, GEN_AI_RESPONSE_STOP_REASON_ATTRIBUTE, stringify(stopReason, String));
	return attrs;
}
function getAgentNameFromMetadata(metadata) {
	const attrs = {};
	const agentName = metadata?.lc_agent_name;
	if (typeof agentName === "string") attrs[$n] = agentName;
	return attrs;
}
function extractToolDefinitions(extraParams) {
	const tools = extraParams?.invocation_params?.tools ?? extraParams?.options?.tools;
	if (!Array.isArray(tools) || tools.length === 0) return void 0;
	const toolDefs = tools.map((tool) => {
		const fn = tool.function;
		return {
			type: "function",
			name: tool.name ?? fn?.name ?? "",
			description: tool.description ?? fn?.description
		};
	});
	return JSON.stringify(toolDefs);
}
function isCallbackManager(value) {
	if (!value || typeof value !== "object") return false;
	const candidate = value;
	return typeof candidate.addHandler === "function" && typeof candidate.copy === "function";
}
function isSentryHandler(handler) {
	return typeof handler === "object" && handler?.name === "SentryCallbackHandler";
}
function containsSentryHandler(handlers) {
	return handlers.some(isSentryHandler);
}
function _INTERNAL_mergeLangChainCallbackHandler(existing, sentryHandler) {
	if (!existing) return [sentryHandler];
	if (isCallbackManager(existing)) {
		if (containsSentryHandler(existing.handlers ?? [])) return existing;
		const copied = existing.copy();
		copied.addHandler(sentryHandler, true);
		return copied;
	}
	const handlers = Array.isArray(existing) ? existing : [existing];
	if (containsSentryHandler(handlers)) return existing;
	return [...handlers, sentryHandler];
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/langchain/index.js
function createLangChainCallbackHandler(options = {}) {
	const { recordInputs, recordOutputs } = resolveAIRecordingOptions(options);
	const spanMap = /* @__PURE__ */ new Map();
	const exitSpan = (runId) => {
		const span = spanMap.get(runId);
		if (span?.isRecording()) {
			span.end();
			spanMap.delete(runId);
		}
	};
	const handler = {
		lc_serializable: false,
		lc_namespace: [
			"langchain_core",
			"callbacks",
			"sentry"
		],
		lc_secrets: void 0,
		lc_attributes: void 0,
		lc_aliases: void 0,
		lc_serializable_keys: void 0,
		lc_id: [
			"langchain_core",
			"callbacks",
			"sentry"
		],
		lc_kwargs: {},
		name: "SentryCallbackHandler",
		ignoreLLM: false,
		ignoreChain: false,
		ignoreAgent: false,
		ignoreRetriever: false,
		ignoreCustomEvent: false,
		raiseError: false,
		awaitHandlers: true,
		handleLLMStart(llm, prompts, runId, _parentRunId, _extraParams, tags, metadata, _runName) {
			const invocationParams = getInvocationParams(tags);
			const attributes = extractLLMRequestAttributes(llm, prompts, recordInputs, invocationParams, metadata);
			const modelName = attributes["gen_ai.request.model"] || "unknown";
			const operationName = typeof attributes["gen_ai.operation.name"] === "string" ? attributes[ur] : "unknown";
			const client = getClient();
			startSpanManual({
				name: typeof modelName === "string" && modelName !== "unknown" || !(client && hasSpanStreamingEnabled(client)) ? `${operationName} ${modelName}` : operationName,
				attributes: {
					...getAgentNameFromMetadata(metadata),
					...attributes,
					[Ed]: oe
				}
			}, (span) => {
				spanMap.set(runId, span);
				return span;
			});
		},
		handleChatModelStart(llm, messages, runId, _parentRunId, extraParams, tags, metadata, _runName) {
			const invocationParams = getInvocationParams(tags);
			const attributes = extractChatModelRequestAttributes(llm, messages, recordInputs, invocationParams, metadata);
			const toolDefsJson = extractToolDefinitions(extraParams);
			if (toolDefsJson) attributes[Hr] = toolDefsJson;
			const modelName = attributes["gen_ai.request.model"] || "unknown";
			const operationName = typeof attributes["gen_ai.operation.name"] === "string" ? attributes[ur] : "unknown";
			const client = getClient();
			startSpanManual({
				name: typeof modelName === "string" && modelName !== "unknown" || !(client && hasSpanStreamingEnabled(client)) ? `${operationName} ${modelName}` : operationName,
				attributes: {
					...getAgentNameFromMetadata(metadata),
					...attributes,
					[Ed]: oe
				}
			}, (span) => {
				spanMap.set(runId, span);
				return span;
			});
		},
		handleLLMEnd(output, runId, _parentRunId, _tags, _extraParams) {
			const span = spanMap.get(runId);
			if (span?.isRecording()) {
				const attributes = extractLlmResponseAttributes(output, recordOutputs);
				if (attributes) span.setAttributes(attributes);
				exitSpan(runId);
			}
		},
		handleLLMError(_error, runId) {
			const span = spanMap.get(runId);
			if (span?.isRecording()) {
				span.setStatus({
					code: 2,
					message: "internal_error"
				});
				exitSpan(runId);
			}
		},
		handleChainStart(chain, inputs, runId, _parentRunId, _tags, metadata, _runType, runName) {
			if (metadata?.__sentry_langgraph__) return;
			const chainName = runName || chain.name;
			const attributes = {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ai.langchain",
				[ur]: "invoke_agent"
			};
			if (chainName) attributes[br] = chainName;
			if (recordInputs) attributes["langchain.chain.inputs"] = JSON.stringify(inputs);
			const client = getClient();
			startSpanManual({
				name: !(client && hasSpanStreamingEnabled(client)) ? `chain ${chainName || "unknown_chain"}` : chainName ? `invoke_agent ${chainName}` : "invoke_agent",
				attributes: {
					...attributes,
					[Ed]: Ce
				}
			}, (span) => {
				spanMap.set(runId, span);
				return span;
			});
		},
		handleChainEnd(outputs, runId) {
			const span = spanMap.get(runId);
			if (span?.isRecording()) {
				if (recordOutputs) span.setAttributes({ "langchain.chain.outputs": JSON.stringify(outputs) });
				exitSpan(runId);
			}
		},
		handleChainError(_error, runId) {
			const span = spanMap.get(runId);
			if (span?.isRecording()) {
				span.setStatus({
					code: 2,
					message: "internal_error"
				});
				exitSpan(runId);
			}
		},
		handleToolStart(tool, input, runId, _parentRunId, _tags, metadata, runName) {
			if (metadata?.__sentry_langgraph__) return;
			const toolName = runName || tool.name || "unknown_tool";
			const attributes = {
				...getAgentNameFromMetadata(metadata),
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: LANGCHAIN_ORIGIN,
				[ur]: "execute_tool",
				[Xr]: toolName
			};
			if (recordInputs) attributes[Yr] = input;
			startSpanManual({
				name: `execute_tool ${toolName}`,
				attributes: {
					...attributes,
					[Ed]: Oe
				}
			}, (span) => {
				spanMap.set(runId, span);
				return span;
			});
		},
		handleToolEnd(output, runId) {
			const span = spanMap.get(runId);
			if (span?.isRecording()) {
				if (recordOutputs) {
					const outputObj = output;
					const content = outputObj && typeof outputObj === "object" && "content" in outputObj ? outputObj.content : output;
					span.setAttributes({ [Vr]: stringify(content, String) });
				}
				exitSpan(runId);
			}
		},
		handleToolError(_error, runId) {
			const span = spanMap.get(runId);
			if (span?.isRecording()) {
				span.setStatus({
					code: 2,
					message: "internal_error"
				});
				exitSpan(runId);
			}
		},
		copy() {
			return handler;
		},
		toJSON() {
			return {
				lc: 1,
				type: "not_implemented",
				id: handler.lc_id
			};
		},
		toJSONNotImplemented() {
			return {
				lc: 1,
				type: "not_implemented",
				id: handler.lc_id
			};
		}
	};
	return handler;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/langgraph/constants.js
var LANGGRAPH_INTEGRATION_NAME = "LangGraph";
var LANGGRAPH_ORIGIN = "auto.ai.langgraph";
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/langgraph/utils.js
function extractLLMFromParams(args) {
	const arg = args[0];
	if (typeof arg !== "object" || !arg || !("llm" in arg) || !arg.llm || typeof arg.llm !== "object") return null;
	const llm = arg.llm;
	if (typeof llm.modelName !== "string" && typeof llm.model !== "string") return null;
	return llm;
}
function extractAgentNameFromParams(args) {
	const arg = args[0];
	if (typeof arg === "object" && !!arg && "name" in arg && typeof arg.name === "string") return arg.name;
	return null;
}
function wrapToolsWithSpans(tools, options, agentName) {
	const SENTRY_WRAPPED = "__sentry_tool_wrapped__";
	for (const tool of tools) {
		if (!tool || typeof tool !== "object") continue;
		const t = tool;
		const originalInvoke = t.invoke;
		if (typeof originalInvoke !== "function" || Object.prototype.hasOwnProperty.call(t, SENTRY_WRAPPED)) continue;
		const toolName = typeof t.name === "string" ? t.name : "unknown_tool";
		const toolDescription = typeof t.description === "string" ? t.description : void 0;
		t.invoke = new Proxy(originalInvoke, { apply(target, thisArg, args) {
			const spanAttributes = {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: LANGGRAPH_ORIGIN,
				[Ed]: Oe,
				[ur]: "execute_tool",
				[Xr]: toolName
			};
			const callAgentName = args[1]?.metadata?.lc_agent_name ?? agentName;
			if (typeof callAgentName === "string") spanAttributes[$n] = callAgentName;
			if (toolDescription) spanAttributes[Br] = toolDescription;
			const input = args[0];
			if (typeof input === "object" && !!input) {
				if ("id" in input && typeof input.id === "string") spanAttributes[GEN_AI_TOOL_CALL_ID_ATTRIBUTE] = input.id;
				if (options.recordInputs) {
					const toolArgs = "args" in input && typeof input.args === "object" ? input.args : input;
					try {
						spanAttributes[Yr] = JSON.stringify(toolArgs);
					} catch {}
				}
			}
			return startSpan$1({
				name: `execute_tool ${toolName}`,
				attributes: spanAttributes
			}, async (span) => {
				try {
					const result = await Reflect.apply(target, thisArg, args);
					if (options.recordOutputs) try {
						const resultObj = result;
						const content = resultObj && typeof resultObj === "object" && "content" in resultObj ? resultObj.content : result;
						span.setAttribute(Vr, typeof content === "string" ? content : JSON.stringify(content));
					} catch {}
					return result;
				} catch (error) {
					span.setStatus({
						code: 2,
						message: "internal_error"
					});
					throw error;
				}
			});
		} });
		Object.defineProperty(t, SENTRY_WRAPPED, {
			value: true,
			enumerable: false
		});
	}
	return tools;
}
function extractToolCalls(messages) {
	if (!messages || messages.length === 0) return null;
	const toolCalls = [];
	for (const message of messages) if (message && typeof message === "object") {
		const msgToolCalls = message.tool_calls;
		if (msgToolCalls && Array.isArray(msgToolCalls)) toolCalls.push(...msgToolCalls);
	}
	return toolCalls.length > 0 ? toolCalls : null;
}
function extractTokenUsageFromMessage(message) {
	const msg = message;
	let inputTokens = 0;
	let outputTokens = 0;
	let totalTokens = 0;
	if (msg.usage_metadata && typeof msg.usage_metadata === "object") {
		const usage = msg.usage_metadata;
		if (typeof usage.input_tokens === "number") inputTokens = usage.input_tokens;
		if (typeof usage.output_tokens === "number") outputTokens = usage.output_tokens;
		if (typeof usage.total_tokens === "number") totalTokens = usage.total_tokens;
		return {
			inputTokens,
			outputTokens,
			totalTokens
		};
	}
	if (msg.response_metadata && typeof msg.response_metadata === "object") {
		const metadata = msg.response_metadata;
		if (metadata.tokenUsage && typeof metadata.tokenUsage === "object") {
			const tokenUsage = metadata.tokenUsage;
			if (typeof tokenUsage.promptTokens === "number") inputTokens = tokenUsage.promptTokens;
			if (typeof tokenUsage.completionTokens === "number") outputTokens = tokenUsage.completionTokens;
			if (typeof tokenUsage.totalTokens === "number") totalTokens = tokenUsage.totalTokens;
		}
	}
	return {
		inputTokens,
		outputTokens,
		totalTokens
	};
}
function extractModelMetadata(span, message) {
	const msg = message;
	if (msg.response_metadata && typeof msg.response_metadata === "object") {
		const metadata = msg.response_metadata;
		if (metadata.model_name && typeof metadata.model_name === "string") span.setAttribute(Pr, metadata.model_name);
		if (metadata.finish_reason && typeof metadata.finish_reason === "string") span.setAttribute(Rr, [metadata.finish_reason]);
	}
}
function extractToolsFromCompiledGraph(compiledGraph) {
	if (!compiledGraph.builder?.nodes?.tools?.runnable?.tools) return null;
	const tools = compiledGraph.builder?.nodes?.tools?.runnable?.tools;
	if (!tools || !Array.isArray(tools) || tools.length === 0) return null;
	return tools.map((tool) => ({
		name: tool.lc_kwargs?.name,
		description: tool.lc_kwargs?.description,
		schema: tool.lc_kwargs?.schema
	}));
}
function setResponseAttributes(span, inputMessages, result) {
	const outputMessages = result?.messages;
	if (!outputMessages || !Array.isArray(outputMessages)) return;
	const inputCount = inputMessages?.length ?? 0;
	const newMessages = outputMessages.length > inputCount ? outputMessages.slice(inputCount) : [];
	if (newMessages.length === 0) return;
	const toolCalls = extractToolCalls(newMessages);
	if (toolCalls) span.setAttribute(Gr, JSON.stringify(toolCalls));
	const normalizedNewMessages = normalizeLangChainMessages(newMessages);
	span.setAttribute(Lr, JSON.stringify(normalizedNewMessages));
	let totalInputTokens = 0;
	let totalOutputTokens = 0;
	let totalTokens = 0;
	for (const message of newMessages) {
		const tokens = extractTokenUsageFromMessage(message);
		totalInputTokens += tokens.inputTokens;
		totalOutputTokens += tokens.outputTokens;
		totalTokens += tokens.totalTokens;
		extractModelMetadata(span, message);
	}
	if (totalInputTokens > 0) span.setAttribute(is, totalInputTokens);
	if (totalOutputTokens > 0) span.setAttribute(rs, totalOutputTokens);
	if (totalTokens > 0) span.setAttribute(ps, totalTokens);
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/langgraph/index.js
function instrumentCompiledGraphInvoke(originalInvoke, graphInstance, compileOptions, options, llm, sentryCallbackHandler) {
	return new Proxy(originalInvoke, { apply(target, thisArg, args) {
		const modelName = llm?.modelName ?? llm?.model;
		return startSpan$1({
			name: "invoke_agent",
			attributes: {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: LANGGRAPH_ORIGIN,
				[Ed]: Ce,
				[ur]: "invoke_agent"
			}
		}, async (span) => {
			try {
				const graphName = compileOptions?.name;
				if (graphName && typeof graphName === "string") {
					span.setAttribute(br, graphName);
					span.setAttribute($n, graphName);
					span.updateName(`invoke_agent ${graphName}`);
				}
				if (modelName) span.setAttribute(wr, modelName);
				const threadId = ((args.length > 1 ? args[1] : void 0)?.configurable)?.thread_id;
				if (threadId && typeof threadId === "string") span.setAttribute(ir, threadId);
				if (sentryCallbackHandler) {
					const invokeConfig = args[1] ?? {};
					args[1] = invokeConfig;
					invokeConfig.metadata = {
						...invokeConfig.metadata ?? {},
						__sentry_langgraph__: true,
						...typeof graphName === "string" ? { lc_agent_name: graphName } : {}
					};
					invokeConfig.callbacks = _INTERNAL_mergeLangChainCallbackHandler(invokeConfig.callbacks, sentryCallbackHandler);
				}
				const tools = extractToolsFromCompiledGraph(graphInstance);
				if (tools) span.setAttribute(Hr, JSON.stringify(tools));
				const recordInputs = options.recordInputs;
				const recordOutputs = options.recordOutputs;
				const inputMessages = args.length > 0 ? args[0]?.messages ?? [] : [];
				if (inputMessages && recordInputs) {
					const { systemInstructions, filteredMessages } = extractSystemInstructions(normalizeLangChainMessages(inputMessages));
					if (systemInstructions) span.setAttribute(Wr, systemInstructions);
					span.setAttributes({ [dr]: stringify(filteredMessages) });
				}
				const result = await Reflect.apply(target, thisArg, args);
				if (recordOutputs) setResponseAttributes(span, inputMessages ?? null, result);
				return result;
			} catch (error) {
				span.setStatus({
					code: 2,
					message: "internal_error"
				});
				throw error;
			}
		});
	} });
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/detect.js
function getOrchestrionInjectedModules() {
	const { runtime, bundler } = GLOBAL_OBJ.__SENTRY_ORCHESTRION__ ?? {};
	return [...runtime ?? [], ...bundler instanceof Set ? bundler : []];
}
function detectOrchestrionSetup() {
	const { runtime, bundler } = GLOBAL_OBJ.__SENTRY_ORCHESTRION__ ?? {};
	if (!runtime && !bundler) {
		debug$2.warn("[Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.");
		return;
	}
	debug$2.log(runtime ? `[Sentry] Runtime hook registered, injected libraries=${JSON.stringify(runtime)}` : "[Sentry] Runtime hook not registered");
	debug$2.log(bundler ? `[Sentry] Bundler plugin ran, injected libraries=${JSON.stringify(bundler instanceof Set ? [...bundler] : bundler)}` : "[Sentry] Bundler plugin did not run");
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/koa/koa-error-handler.js
var ERROR_HANDLER_ATTACHED = "__SENTRY_KOA_ERROR_HANDLER_ATTACHED__";
var KOA_CONTEXT_SPAN = "__SENTRY_KOA_SPAN__";
function attachKoaErrorHandler(app) {
	const markedApp = app;
	if (!markedApp || typeof markedApp.on !== "function" || markedApp[ERROR_HANDLER_ATTACHED]) return;
	addNonEnumerableProperty(markedApp, ERROR_HANDLER_ATTACHED, true);
	markedApp.on("error", (error, context) => {
		const span = context?.[KOA_CONTEXT_SPAN];
		const capture = () => {
			captureException(error, { mechanism: {
				type: "auto.middleware.koa",
				handled: false
			} });
		};
		if (span) withActiveSpan$1(span, capture);
		else capture();
	});
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/hapi/hapi-types.js
var LIFECYCLE_EXT_POINTS = [
	"onPreAuth",
	"onCredentials",
	"onPostAuth",
	"onPreHandler",
	"onPostHandler",
	"onPreResponse",
	"onRequest"
];
var handlerPatched = /* @__PURE__ */ Symbol("hapi-handler-patched");
var HapiLayerType = {
	ROUTER: "router",
	PLUGIN: "plugin",
	EXT: "server.ext"
};
var HapiLifecycleMethodNames = new Set(LIFECYCLE_EXT_POINTS);
var AttributeNames = /* @__PURE__ */ ((AttributeNames2) => {
	AttributeNames2["HAPI_TYPE"] = "hapi.type";
	AttributeNames2["PLUGIN_NAME"] = "hapi.plugin.name";
	AttributeNames2["EXT_TYPE"] = "server.ext.type";
	return AttributeNames2;
})(AttributeNames || {});
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/hapi/hapi-utils.js
function defaultShouldHandleError$2(error, request) {
	const statusCode = getResponseStatusCode(request, error);
	if (typeof statusCode !== "number") return true;
	return statusCode >= 500 || statusCode <= 299;
}
function getResponseStatusCode(request, error) {
	const response = request.response;
	if (isObjectLike(response)) {
		if (response.isBoom && isObjectLike(response.output) && typeof response.output.statusCode === "number") return response.output.statusCode;
		if (typeof response.statusCode === "number") return response.statusCode;
	}
	if (isObjectLike(error) && isObjectLike(error.output) && typeof error.output.statusCode === "number") return error.output.statusCode;
}
var isLifecycleExtType = (variableToCheck) => {
	return typeof variableToCheck === "string" && HapiLifecycleMethodNames.has(variableToCheck);
};
var isLifecycleExtEventObj = (variableToCheck) => {
	const event = variableToCheck?.type;
	return event !== void 0 && isLifecycleExtType(event);
};
var isDirectExtInput = (variableToCheck) => {
	return Array.isArray(variableToCheck) && variableToCheck.length <= 3 && isLifecycleExtType(variableToCheck[0]) && typeof variableToCheck[1] === "function";
};
var isPatchableExtMethod = (variableToCheck) => {
	return !Array.isArray(variableToCheck);
};
var getRouteMetadata = (route, pluginName) => {
	const attributes = {
		[po]: route.path,
		[js]: route.method
	};
	if (pluginName) {
		attributes[AttributeNames.HAPI_TYPE] = HapiLayerType.PLUGIN;
		attributes[AttributeNames.PLUGIN_NAME] = pluginName;
	} else attributes[AttributeNames.HAPI_TYPE] = HapiLayerType.ROUTER;
	const client = getClient();
	const isStreamedSpan = !!client && hasSpanStreamingEnabled(client);
	const fallbackName = pluginName ? REQUEST_HANDLER_SPAN_NAME_FALLBACK : ROUTER_SPAN_NAME_FALLBACK;
	return {
		attributes,
		name: isStreamedSpan ? route.path || fallbackName : `${route.method.toUpperCase()} ${route.path}`
	};
};
var getExtMetadata = (extPoint, pluginName, methodName) => {
	let baseName = `ext - ${extPoint}`;
	if (methodName && methodName !== "method") baseName = `ext - ${extPoint} - ${methodName}`;
	if (pluginName) return {
		attributes: {
			[AttributeNames.EXT_TYPE]: extPoint,
			[AttributeNames.HAPI_TYPE]: HapiLayerType.EXT,
			[AttributeNames.PLUGIN_NAME]: pluginName
		},
		name: `${pluginName}: ${baseName}`
	};
	return {
		attributes: {
			[AttributeNames.EXT_TYPE]: extPoint,
			[AttributeNames.HAPI_TYPE]: HapiLayerType.EXT
		},
		name: baseName
	};
};
var HAPI_TYPE_TO_SPAN_OP = {
	[HapiLayerType.PLUGIN]: TE,
	[HapiLayerType.ROUTER]: Xe,
	[HapiLayerType.EXT]: tE
};
function startMetadataSpan(metadata, original) {
	const hapiType = metadata.attributes[AttributeNames.HAPI_TYPE];
	const op = hapiType ? HAPI_TYPE_TO_SPAN_OP[hapiType] : void 0;
	return startSpan$1({
		name: metadata.name,
		attributes: {
			...metadata.attributes,
			[Ed]: op,
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.hapi"
		}
	}, original);
}
function wrapRouteHandler(route, pluginName) {
	if (route[handlerPatched] === true) return route;
	route[handlerPatched] = true;
	const wrapHandler = (oldHandler) => {
		return function(...params) {
			if (!getActiveSpan$1()) return oldHandler.call(this, ...params);
			setHttpServerSpanRouteAttribute(route.path);
			return startMetadataSpan(getRouteMetadata(route, pluginName), () => oldHandler.call(this, ...params));
		};
	};
	if (typeof route.handler === "function") route.handler = wrapHandler(route.handler);
	else if (typeof route.options === "function") {
		const oldOptions = route.options;
		route.options = function(server) {
			const options = oldOptions(server);
			if (typeof options.handler === "function") options.handler = wrapHandler(options.handler);
			return options;
		};
	} else if (typeof route.options?.handler === "function") route.options.handler = wrapHandler(route.options.handler);
	return route;
}
function wrapExtMethods(method, extPoint, pluginName) {
	if (Array.isArray(method)) {
		for (let i = 0; i < method.length; i++) method[i] = wrapExtMethods(method[i], extPoint);
		return method;
	} else if (isPatchableExtMethod(method)) {
		if (method[handlerPatched] === true) return method;
		method[handlerPatched] = true;
		const newHandler = function(...params) {
			if (!getActiveSpan$1()) return method.apply(this, params);
			return startMetadataSpan(getExtMetadata(extPoint, pluginName, method.name), () => method.apply(void 0, params));
		};
		newHandler[handlerPatched] = true;
		return newHandler;
	}
	return method;
}
function wrapRouteArguments(args, pluginName) {
	const route = args[0];
	if (Array.isArray(route)) for (let i = 0; i < route.length; i++) route[i] = wrapRouteHandler(route[i], pluginName);
	else args[0] = wrapRouteHandler(route, pluginName);
}
function wrapExtArguments(args, pluginName) {
	if (Array.isArray(args[0])) {
		const eventsList = args[0];
		for (let i = 0; i < eventsList.length; i++) {
			const eventObj = eventsList[i];
			if (isLifecycleExtType(eventObj.type)) {
				const lifecycleEventObj = eventObj;
				lifecycleEventObj.method = wrapExtMethods(lifecycleEventObj.method, eventObj.type, pluginName);
				eventsList[i] = lifecycleEventObj;
			}
		}
		return;
	} else if (isDirectExtInput(args)) {
		const extInput = args;
		const method = extInput[1];
		args[1] = wrapExtMethods(method, extInput[0], pluginName);
		return;
	} else if (isLifecycleExtEventObj(args[0])) {
		const lifecycleEventObj = args[0];
		lifecycleEventObj.method = wrapExtMethods(lifecycleEventObj.method, lifecycleEventObj.type, pluginName);
	}
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/hapi/hapi-error-handler.js
var ERROR_HANDLER_STATE = "__SENTRY_HAPI_ERROR_HANDLER_STATE__";
function isErrorEvent(event) {
	return !!(event && typeof event === "object" && "error" in event && event.error);
}
function attachHapiErrorHandler(server, shouldHandleError) {
	const events = server?.events;
	if (!events) return;
	const existingState = events[ERROR_HANDLER_STATE];
	if (existingState) {
		if (shouldHandleError) existingState.shouldHandleError = shouldHandleError;
		return;
	}
	const state = { shouldHandleError: shouldHandleError ?? defaultShouldHandleError$2 };
	addNonEnumerableProperty(events, ERROR_HANDLER_STATE, state);
	events.on({
		name: "request",
		channels: ["error"]
	}, (request, event) => {
		if (getIsolationScope() !== getDefaultIsolationScope()) {
			const route = request.route;
			if (route?.path) getIsolationScope().setTransactionName(`${route.method.toUpperCase()} ${route.path}`);
		} else DEBUG_BUILD$1 && debug$2.warn("Isolation scope is still the default isolation scope - skipping setting transactionName");
		if (isErrorEvent(event) && state.shouldHandleError(event.error, request)) captureException(event.error, { mechanism: {
			type: "auto.function.hapi",
			handled: false
		} });
	});
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/fastify/utils.js
var INTEGRATION_NAME$34 = "Fastify";
function defaultShouldHandleError$1(_error, _request, reply) {
	const statusCode = reply.statusCode;
	return statusCode >= 500 || statusCode <= 299;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/fastify/errors.js
var kErrorCaptured = /* @__PURE__ */ Symbol("sentry.fastifyErrorCaptured");
function getFastifyIntegration() {
	return getClient()?.getIntegrationByName(INTEGRATION_NAME$34);
}
function subscribeToFastifyErrorChannel() {
	diagnosticsChannel.subscribe("tracing:fastify.request.handler:error", (message) => {
		const { error, request, reply } = message;
		handleFastifyError(request, reply, error);
	});
}
function handleFastifyError(request, reply, error) {
	if (request[kErrorCaptured]) return;
	if ((getFastifyIntegration()?.getShouldHandleError() || defaultShouldHandleError$1)(error, request, reply)) {
		addNonEnumerableProperty(request, kErrorCaptured, true);
		captureException(error, { mechanism: {
			handled: false,
			type: "auto.function.fastify"
		} });
	}
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/fastify/instrumentation.js
var ORIGIN$18 = "auto.http.fastify";
var FASTIFY_HOOKS = [
	"onRequest",
	"preParsing",
	"preValidation",
	"preHandler",
	"preSerialization",
	"onSend",
	"onResponse",
	"onError"
];
var ATTRIBUTE_HOOK_NAME = "hook.name";
var ATTRIBUTE_FASTIFY_TYPE = "fastify.type";
var ATTRIBUTE_HOOK_CALLBACK_NAME = "hook.callback.name";
var HOOK_TYPE_ROUTE = "route-hook";
var HOOK_TYPE_INSTANCE = "hook";
var HOOK_TYPE_HANDLER = "request-handler";
var ANONYMOUS_FUNCTION_NAME = "anonymous";
var kRequestSpan = /* @__PURE__ */ Symbol("sentry fastify request span");
var kAddHookOriginal = /* @__PURE__ */ Symbol("sentry fastify addHook original");
var kSetNotFoundOriginal = /* @__PURE__ */ Symbol("sentry fastify setNotFoundHandler original");
function getRequestRouteUrl(request) {
	return request.routeOptions?.url ?? request.routerPath;
}
function isFastifyRequest(arg) {
	return isObjectLike(arg) && !!arg.method && !!arg.url && (!!arg.routeOptions || "routerPath" in arg);
}
function instrumentFastifyInstance(instance) {
	instance.decorate(kAddHookOriginal, instance.addHook);
	instance.decorate(kSetNotFoundOriginal, instance.setNotFoundHandler);
	instance.decorateRequest("opentelemetry", function opentelemetry() {
		return { span: this[kRequestSpan] };
	});
	instance.decorateRequest(kRequestSpan, null);
	instance.addHook("onRoute", onRoute);
	instance.addHook("onRequest", onRequest);
	instance.addHook("onResponse", onResponse);
	instance.addHook("onError", async (request, reply, error) => {
		handleFastifyError(request, reply, error);
	});
	instance.addHook = addHookPatched;
	instance.setNotFoundHandler = setNotFoundHandlerPatched;
}
function onRoute(routeOptions) {
	for (const hook of FASTIFY_HOOKS) {
		const handlerLike = routeOptions[hook];
		if (typeof handlerLike === "function") routeOptions[hook] = handlerWrapper(handlerLike, hook, routeHookAttributes(this.pluginName, hook, handlerLike, routeOptions.url));
		else if (Array.isArray(handlerLike)) routeOptions[hook] = handlerLike.map((handler) => handlerWrapper(handler, hook, routeHookAttributes(this.pluginName, hook, handler, routeOptions.url)));
	}
	routeOptions.onSend = appendRouteHook(routeOptions.onSend, finalizeResponseSpanHook);
	routeOptions.onError = appendRouteHook(routeOptions.onError, recordErrorInSpanHook);
	routeOptions.handler = handlerWrapper(routeOptions.handler, "handler", {
		[ATTRIBUTE_HOOK_NAME]: `${this.pluginName} - route-handler`,
		[ATTRIBUTE_FASTIFY_TYPE]: HOOK_TYPE_HANDLER,
		[po]: routeOptions.url,
		[ATTRIBUTE_HOOK_CALLBACK_NAME]: routeOptions.handler.name.length > 0 ? routeOptions.handler.name : ANONYMOUS_FUNCTION_NAME
	});
}
function routeHookAttributes(pluginName, hook, handler, url) {
	return {
		[ATTRIBUTE_HOOK_NAME]: `${pluginName} - route -> ${hook}`,
		[ATTRIBUTE_FASTIFY_TYPE]: HOOK_TYPE_ROUTE,
		[po]: url,
		[ATTRIBUTE_HOOK_CALLBACK_NAME]: handler.name?.length > 0 ? handler.name : ANONYMOUS_FUNCTION_NAME
	};
}
function appendRouteHook(existing, hook) {
	if (existing == null) return hook;
	return Array.isArray(existing) ? [...existing, hook] : [existing, hook];
}
function onRequest(request, _reply, hookDone) {
	const routeName = getRequestRouteUrl(request);
	const method = request.method || "GET";
	getIsolationScope().setTransactionName(`${method} ${routeName}`);
	const attributes = {
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$18,
		[Ed]: TE,
		[js]: request.method,
		[Zu]: request.url
	};
	const route = getRequestRouteUrl(request);
	if (route != null) {
		attributes[po] = route;
		setHttpServerSpanRouteAttribute(route);
	}
	const client = getClient();
	const isStreamedSpan = !!client && hasSpanStreamingEnabled(client);
	const requestSpan = startInactiveSpan({
		name: isStreamedSpan ? route || "Request handler" : route != null ? `${request.method} ${route}` : "request",
		attributes
	});
	request[kRequestSpan] = requestSpan;
	withActiveSpan$1(requestSpan, () => {
		hookDone();
	});
}
function onResponse(request, reply, hookDone) {
	const span = request[kRequestSpan];
	if (span != null) {
		span.setAttributes({ [oo]: reply.statusCode });
		span.end();
	}
	request[kRequestSpan] = null;
	hookDone();
}
function finalizeResponseSpanHook(request, reply, payload, hookDone) {
	const span = request[kRequestSpan];
	if (span != null) {
		if (reply.statusCode >= 500) span.setStatus({ code: 2 });
		span.setAttributes({ [oo]: reply.statusCode });
		span.end();
	}
	request[kRequestSpan] = null;
	hookDone(null, payload);
}
function recordErrorInSpanHook(request, _reply, error, hookDone) {
	const span = request[kRequestSpan];
	if (span != null) span.setStatus({
		code: 2,
		message: error.message
	});
	hookDone();
}
function addHookPatched(name, hook) {
	const addHookOriginal = this[kAddHookOriginal];
	if (FASTIFY_HOOKS.includes(name)) return addHookOriginal.call(this, name, handlerWrapper(hook, name, {
		[ATTRIBUTE_HOOK_NAME]: `${this.pluginName} - ${name}`,
		[ATTRIBUTE_FASTIFY_TYPE]: HOOK_TYPE_INSTANCE,
		[ATTRIBUTE_HOOK_CALLBACK_NAME]: hook.name?.length > 0 ? hook.name : ANONYMOUS_FUNCTION_NAME
	}));
	return addHookOriginal.call(this, name, hook);
}
function setNotFoundHandlerPatched(hooks, handler) {
	const setNotFoundHandlerOriginal = this[kSetNotFoundOriginal];
	if (typeof hooks === "function") {
		setNotFoundHandlerOriginal.call(this, handlerWrapper(hooks, "notFoundHandler", {
			[ATTRIBUTE_HOOK_NAME]: `${this.pluginName} - not-found-handler`,
			[ATTRIBUTE_FASTIFY_TYPE]: HOOK_TYPE_INSTANCE,
			[ATTRIBUTE_HOOK_CALLBACK_NAME]: hooks.name?.length > 0 ? hooks.name : ANONYMOUS_FUNCTION_NAME
		}));
		return;
	}
	if (hooks.preValidation != null) hooks.preValidation = handlerWrapper(hooks.preValidation, "notFoundHandler - preValidation", {
		[ATTRIBUTE_HOOK_NAME]: `${this.pluginName} - not-found-handler - preValidation`,
		[ATTRIBUTE_FASTIFY_TYPE]: HOOK_TYPE_INSTANCE,
		[ATTRIBUTE_HOOK_CALLBACK_NAME]: hooks.preValidation.name?.length > 0 ? hooks.preValidation.name : ANONYMOUS_FUNCTION_NAME
	});
	if (hooks.preHandler != null) hooks.preHandler = handlerWrapper(hooks.preHandler, "notFoundHandler - preHandler", {
		[ATTRIBUTE_HOOK_NAME]: `${this.pluginName} - not-found-handler - preHandler`,
		[ATTRIBUTE_FASTIFY_TYPE]: HOOK_TYPE_INSTANCE,
		[ATTRIBUTE_HOOK_CALLBACK_NAME]: hooks.preHandler.name?.length > 0 ? hooks.preHandler.name : ANONYMOUS_FUNCTION_NAME
	});
	if (handler == null) {
		setNotFoundHandlerOriginal.call(this, hooks);
		return;
	}
	setNotFoundHandlerOriginal.call(this, hooks, handlerWrapper(handler, "notFoundHandler", {
		[ATTRIBUTE_HOOK_NAME]: `${this.pluginName} - not-found-handler`,
		[ATTRIBUTE_FASTIFY_TYPE]: HOOK_TYPE_INSTANCE,
		[ATTRIBUTE_HOOK_CALLBACK_NAME]: handler.name?.length > 0 ? handler.name : ANONYMOUS_FUNCTION_NAME
	}));
}
function getRequestFromArgs(args) {
	for (const arg of args) if (isFastifyRequest(arg)) return arg;
	return null;
}
function handlerWrapper(handler, hookName, spanAttributes = {}) {
	return function handlerWrapped(...args) {
		const request = getRequestFromArgs(args);
		if (!request) return handler.call(this, ...args);
		const parentSpan = request[kRequestSpan] ?? void 0;
		const handlerName = handler.name?.length > 0 ? handler.name : this.pluginName ?? ANONYMOUS_FUNCTION_NAME;
		const hookType = spanAttributes[ATTRIBUTE_FASTIFY_TYPE];
		const op = hookType === HOOK_TYPE_INSTANCE ? tE : hookType === HOOK_TYPE_HANDLER ? TE : void 0;
		const client = getClient();
		const isStreamedRequestHandlerSpan = hookType === HOOK_TYPE_HANDLER && !!client && hasSpanStreamingEnabled(client);
		const attributeHookName = spanAttributes[ATTRIBUTE_HOOK_NAME];
		const name = isStreamedRequestHandlerSpan ? spanAttributes["http.route"] || "Request handler" : op && typeof attributeHookName === "string" ? attributeHookName : `${hookName} - ${handlerName}`;
		return startSpan$1({
			name,
			attributes: {
				...spanAttributes,
				[Ed]: op,
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$18
			},
			parentSpan
		}, () => handler.call(this, ...args));
	};
}
var _isInstrumented$1 = false;
function instrumentFastify() {
	if (_isInstrumented$1) return;
	_isInstrumented$1 = true;
	diagnosticsChannel.subscribe("fastify.initialization", (message) => {
		const fastifyInstance = message.fastify;
		if (fastifyInstance) instrumentFastifyInstance(fastifyInstance);
	});
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/fastify/index.js
var _fastifyIntegration = ({ shouldHandleError } = {}) => {
	let _shouldHandleError;
	return {
		name: INTEGRATION_NAME$34,
		setupOnce() {
			_shouldHandleError = shouldHandleError || defaultShouldHandleError$1;
			subscribeToFastifyErrorChannel();
			instrumentFastify();
		},
		getShouldHandleError() {
			return _shouldHandleError;
		}
	};
};
var fastifyIntegration = defineIntegration(_fastifyIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/prisma/global.js
var majorVersion = "7";
var GLOBAL_INSTRUMENTATION_KEY = "PRISMA_INSTRUMENTATION";
var GLOBAL_VERSIONED_INSTRUMENTATION_KEY = `V${majorVersion}_PRISMA_INSTRUMENTATION`;
var globalThisWithPrismaInstrumentation = globalThis;
function setGlobalTracingHelper(helper) {
	const globalValue = { helper };
	globalThisWithPrismaInstrumentation[GLOBAL_VERSIONED_INSTRUMENTATION_KEY] = globalValue;
	globalThisWithPrismaInstrumentation[GLOBAL_INSTRUMENTATION_KEY] = globalValue;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/prisma/tracing-helper.js
var showAllTraces = (() => {
	try {
		return process.env.PRISMA_SHOW_ALL_TRACES === "true";
	} catch {
		return false;
	}
})();
var nonSampledTraceParent = `00-10-10-00`;
var PRISMA_ORIGIN = "auto.db.prisma";
var MAX_TRACKED_PRISMA_SPANS = 1e3;
var prismaSpanRegistry = new LRUMap(MAX_TRACKED_PRISMA_SPANS);
var pendingEngineSpans = [];
function registerPrismaSpan(id, span) {
	prismaSpanRegistry.set(id, span);
}
function buildSpanAttributes(name, attributes) {
	const merged = {
		...attributes,
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: PRISMA_ORIGIN
	};
	if (name === "prisma:engine:db_query" && merged["db.system"] == null && merged["db.system.name"] == null) merged[ga] = "prisma";
	if (merged["db.system"] || merged["db.system.name"]) merged[Ed] = "db";
	return merged;
}
function buildSpanName$2(name, attributes) {
	const dbStatement = attributes[da];
	if (typeof dbStatement === "string" && dbStatement) return dbStatement;
	const queryText = attributes["db.query.text"];
	if ((name === "prisma:engine:db_query" || name === "prisma:client:db_query") && typeof queryText === "string") return queryText;
	return name;
}
function createResolvedEngineSpans() {
	let createdSpan = true;
	while (createdSpan) {
		createdSpan = false;
		for (let i = pendingEngineSpans.length - 1; i >= 0; i--) {
			const engineSpan = pendingEngineSpans[i];
			const parentSpan = prismaSpanRegistry.get(engineSpan.parent_span_id);
			if (!parentSpan) continue;
			const attributes = buildSpanAttributes(engineSpan.name, engineSpan.attributes);
			const span = startInactiveSpan({
				name: buildSpanName$2(engineSpan.name, attributes),
				attributes: {
					...attributes,
					[dd]: engineSpan.kind === "client" ? "client" : void 0
				},
				startTime: engineSpan.start_time,
				parentSpan
			});
			registerPrismaSpan(engineSpan.span_id, span);
			if (engineSpan.links) span.addLinks(engineSpan.links.flatMap((link) => {
				const linkedSpan = prismaSpanRegistry.get(link.span_id);
				return linkedSpan ? [{ context: linkedSpan.spanContext() }] : [];
			}));
			span.end(engineSpan.end_time);
			pendingEngineSpans.splice(i, 1);
			createdSpan = true;
		}
	}
}
var ActiveTracingHelper = class {
	constructor({ ignoreSpanTypes }) {
		this.ignoreSpanTypes = ignoreSpanTypes;
	}
	isEnabled() {
		return true;
	}
	getTraceParent(span) {
		const spanContext = (span ?? getActiveSpan$1())?.spanContext();
		if (spanContext) return `00-${spanContext.traceId}-${spanContext.spanId}-0${spanContext.traceFlags}`;
		return nonSampledTraceParent;
	}
	dispatchEngineSpans(spans) {
		const linkIds = /* @__PURE__ */ new Map();
		const roots = spans.filter((span) => span.parentId === null);
		for (const root of roots) dispatchEngineSpan(root, spans, linkIds, this.ignoreSpanTypes);
	}
	/**
	* Prisma v5 broke the tracing helper interface with the v6 major, replacing `createEngineSpan` with
	* `dispatchEngineSpans`. We implement the v6/v7 interface (`dispatchEngineSpans`) but also keep this
	* v5-only method so the same helper doesn't blow up in Prisma 5 users' faces, minting v5 engine spans
	* through Sentry's span APIs instead of crashing.
	*/
	createEngineSpan(engineSpanEvent) {
		pendingEngineSpans.push(...engineSpanEvent.spans);
		createResolvedEngineSpans();
		const overflow = pendingEngineSpans.length - MAX_TRACKED_PRISMA_SPANS;
		if (overflow > 0) {
			DEBUG_BUILD$1 && debug$2.log(`[Prisma] Dropping ${overflow} unresolved v5 engine span(s) whose parent was never registered.`);
			pendingEngineSpans.splice(0, overflow);
		}
	}
	getActiveContext() {
		return getActiveSpan$1();
	}
	runInChildSpan(nameOrOptions, callback) {
		const options = typeof nameOrOptions === "string" ? { name: nameOrOptions } : nameOrOptions;
		if (options.internal && !showAllTraces) return callback();
		const name = `prisma:client:${options.name}`;
		if (shouldIgnoreSpan(name, this.ignoreSpanTypes)) return callback();
		const parentSpan = getActiveSpan$1();
		const attributes = buildSpanAttributes(name, options.attributes);
		const spanOptions = {
			name: buildSpanName$2(name, attributes),
			attributes,
			kind: options.kind,
			links: options.links,
			startTime: options.startTime,
			parentSpan
		};
		if (options.active === false) {
			const span = startInactiveSpan(spanOptions);
			registerPrismaSpan(span.spanContext().spanId, span);
			return endSpan$1(span, () => callback(span, parentSpan));
		}
		return startSpanManual(spanOptions, (span) => {
			registerPrismaSpan(span.spanContext().spanId, span);
			return endSpan$1(span, () => callback(span, parentSpan));
		});
	}
};
function dispatchEngineSpan(engineSpan, allSpans, linkIds, ignoreSpanTypes) {
	if (shouldIgnoreSpan(engineSpan.name, ignoreSpanTypes)) return;
	const attributes = buildSpanAttributes(engineSpan.name, engineSpan.attributes);
	startSpanManual({
		name: buildSpanName$2(engineSpan.name, attributes),
		attributes: {
			...attributes,
			[dd]: engineSpan.kind === "client" ? "client" : void 0
		},
		startTime: engineSpan.startTime
	}, (span) => {
		linkIds.set(engineSpan.id, span.spanContext().spanId);
		if (engineSpan.links) span.addLinks(engineSpan.links.flatMap((link) => {
			const linkedId = linkIds.get(link);
			if (!linkedId) return [];
			return { context: {
				spanId: linkedId,
				traceId: span.spanContext().traceId,
				traceFlags: span.spanContext().traceFlags
			} };
		}));
		const children = allSpans.filter((s) => s.parentId === engineSpan.id);
		for (const child of children) dispatchEngineSpan(child, allSpans, linkIds, ignoreSpanTypes);
		span.end(engineSpan.endTime);
	});
}
function endSpan$1(span, run) {
	let result;
	try {
		result = run();
	} catch (reason) {
		span.end();
		throw reason;
	}
	if (isPromiseLike(result)) return result.then((value) => {
		span.end();
		return value;
	}, (reason) => {
		span.end();
		throw reason;
	});
	span.end();
	return result;
}
function isPromiseLike(value) {
	return value != null && typeof value["then"] === "function";
}
function shouldIgnoreSpan(spanName, ignoreSpanTypes) {
	return ignoreSpanTypes.some((pattern) => typeof pattern === "string" ? pattern === spanName : pattern.test(spanName));
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/prisma/index.js
var INTEGRATION_NAME$33 = "Prisma";
function instrumentPrisma(options) {
	setGlobalTracingHelper(new ActiveTracingHelper({ ignoreSpanTypes: options?.instrumentationConfig?.ignoreSpanTypes ?? [] }));
}
var _prismaIntegration = (options) => {
	return {
		name: INTEGRATION_NAME$33,
		setupOnce() {
			instrumentPrisma(options);
		}
	};
};
var prismaIntegration = defineIntegration(_prismaIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/module-names.js
function getModuleNames(configs) {
	return [...new Set(configs.map((config) => config.module.name))];
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/amqplib.js
var module$1$4 = {
	name: "amqplib",
	versionRange: ">=0.5.5 <2"
};
var amqplibConfig = [
	{
		channelName: "publish",
		module: {
			...module$1$4,
			filePath: "lib/channel_model.js"
		},
		functionQuery: {
			className: "Channel",
			methodName: "publish",
			kind: "Sync"
		}
	},
	{
		channelName: "confirmPublish",
		module: {
			...module$1$4,
			filePath: "lib/channel_model.js"
		},
		functionQuery: {
			className: "ConfirmChannel",
			methodName: "publish",
			kind: "Callback"
		}
	},
	{
		channelName: "consume",
		module: {
			...module$1$4,
			filePath: "lib/channel_model.js"
		},
		functionQuery: {
			className: "Channel",
			methodName: "consume",
			kind: "Async"
		}
	},
	{
		channelName: "dispatch",
		module: {
			...module$1$4,
			filePath: "lib/channel.js"
		},
		functionQuery: {
			className: "BaseChannel",
			methodName: "dispatchMessage",
			kind: "Sync"
		}
	},
	{
		channelName: "ack",
		module: {
			...module$1$4,
			filePath: "lib/channel_model.js"
		},
		functionQuery: {
			className: "Channel",
			methodName: "ack",
			kind: "Sync"
		}
	},
	{
		channelName: "nack",
		module: {
			...module$1$4,
			filePath: "lib/channel_model.js"
		},
		functionQuery: {
			className: "Channel",
			methodName: "nack",
			kind: "Sync"
		}
	},
	{
		channelName: "reject",
		module: {
			...module$1$4,
			filePath: "lib/channel_model.js"
		},
		functionQuery: {
			className: "Channel",
			methodName: "reject",
			kind: "Sync"
		}
	},
	{
		channelName: "ackAll",
		module: {
			...module$1$4,
			filePath: "lib/channel_model.js"
		},
		functionQuery: {
			className: "Channel",
			methodName: "ackAll",
			kind: "Sync"
		}
	},
	{
		channelName: "nackAll",
		module: {
			...module$1$4,
			filePath: "lib/channel_model.js"
		},
		functionQuery: {
			className: "Channel",
			methodName: "nackAll",
			kind: "Sync"
		}
	},
	{
		channelName: "connect",
		module: {
			...module$1$4,
			filePath: "lib/connect.js"
		},
		functionQuery: {
			functionName: "connect",
			kind: "Callback"
		}
	}
];
var amqplibModuleNames = getModuleNames(amqplibConfig);
var amqplibChannels = {
	AMQPLIB_PUBLISH: "orchestrion:amqplib:publish",
	AMQPLIB_CONFIRM_PUBLISH: "orchestrion:amqplib:confirmPublish",
	AMQPLIB_CONSUME: "orchestrion:amqplib:consume",
	AMQPLIB_DISPATCH: "orchestrion:amqplib:dispatch",
	AMQPLIB_ACK: "orchestrion:amqplib:ack",
	AMQPLIB_NACK: "orchestrion:amqplib:nack",
	AMQPLIB_REJECT: "orchestrion:amqplib:reject",
	AMQPLIB_ACK_ALL: "orchestrion:amqplib:ackAll",
	AMQPLIB_NACK_ALL: "orchestrion:amqplib:nackAll",
	AMQPLIB_CONNECT: "orchestrion:amqplib:connect"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/instrumentation.js
var INSTRUMENTED = /* @__PURE__ */ Symbol.for("SentryOrchestrionInstrumented");
var globalAny = globalThis;
var isBun = typeof globalAny.Bun !== "undefined";
var isDeno = typeof globalAny.Deno !== "undefined";
function invokeOrchestrionInstrumentation(client, moduleNames, callback, args, { requiresTracingChannelBinding = true } = {}) {
	const label = moduleNames.join(", ");
	if (!diagnosticsChannel.tracingChannel) {
		DEBUG_BUILD$1 && debug$2.log(`[instrumentation:${label}] no \`tracingChannel\` (Node < 18.19), not subscribing`);
		return;
	}
	if (hasBeenInstrumented(callback)) {
		DEBUG_BUILD$1 && debug$2.log(`[instrumentation:${label}] already subscribed, skipping`);
		return;
	}
	const run = (cleanup2) => {
		const subscribe = () => {
			if (hasBeenInstrumented(callback)) return;
			markInstrumented(callback);
			cleanup2?.();
			DEBUG_BUILD$1 && debug$2.log(`[instrumentation:${label}] subscribing to channels`);
			callback(...args);
		};
		if (!requiresTracingChannelBinding) {
			subscribe();
			return;
		}
		waitForTracingChannelBinding(subscribe);
		if (DEBUG_BUILD$1 && !hasBeenInstrumented(callback)) debug$2.log(`[instrumentation:${label}] async-context binding not ready, retrying before subscribing`);
	};
	if (isBun || isDeno) {
		DEBUG_BUILD$1 && debug$2.log(`[instrumentation:${label}] Bun/Deno, subscribing eagerly`);
		run();
		return;
	}
	const injected = getOrchestrionInjectedModules();
	const injectedName = moduleNames.find((name) => injected.includes(name));
	if (injectedName) {
		DEBUG_BUILD$1 && debug$2.log(`[instrumentation:${label}] "${injectedName}" already injected, subscribing now`);
		run();
		return;
	}
	DEBUG_BUILD$1 && debug$2.log(`[instrumentation:${label}] not injected yet, waiting for the module to load`);
	const cleanup = client.on("orchestrion.module-injected", (moduleName) => {
		if (hasBeenInstrumented(callback)) {
			cleanup();
			return;
		}
		if (moduleNames.includes(moduleName)) {
			DEBUG_BUILD$1 && debug$2.log(`[instrumentation:${label}] "${moduleName}" injected at runtime, subscribing now`);
			run(cleanup);
		}
	});
}
function hasBeenInstrumented(callback) {
	return callback[INSTRUMENTED] ?? false;
}
function markInstrumented(callback) {
	addNonEnumerableProperty(callback, INSTRUMENTED, true);
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/anthropic-ai.js
var anthropicAiConfig = [
	...["resources/messages/messages.js", "resources/messages/messages.mjs"].map((filePath) => ({
		channelName: "chat",
		module: {
			name: "@anthropic-ai/sdk",
			versionRange: ">=0.19.2 <1",
			filePath
		},
		functionQuery: {
			className: "Messages",
			methodName: "create",
			kind: "Auto"
		}
	})),
	...["resources/completions.js", "resources/completions.mjs"].map((filePath) => ({
		channelName: "chat",
		module: {
			name: "@anthropic-ai/sdk",
			versionRange: ">=0.19.2 <1",
			filePath
		},
		functionQuery: {
			className: "Completions",
			methodName: "create",
			kind: "Auto"
		}
	})),
	...["resources/beta/messages/messages.js", "resources/beta/messages/messages.mjs"].map((filePath) => ({
		channelName: "chat",
		module: {
			name: "@anthropic-ai/sdk",
			versionRange: ">=0.19.2 <1",
			filePath
		},
		functionQuery: {
			className: "Messages",
			methodName: "create",
			kind: "Auto"
		}
	})),
	...["resources/messages/messages.js", "resources/messages/messages.mjs"].map((filePath) => ({
		channelName: "messages-stream",
		module: {
			name: "@anthropic-ai/sdk",
			versionRange: ">=0.19.2 <1",
			filePath
		},
		functionQuery: {
			className: "Messages",
			methodName: "stream",
			kind: "Sync"
		}
	}))
];
var anthropicAiModuleNames = getModuleNames(anthropicAiConfig);
var anthropicAiChannels = {
	ANTHROPIC_CHAT: "orchestrion:@anthropic-ai/sdk:chat",
	ANTHROPIC_MESSAGES_STREAM: "orchestrion:@anthropic-ai/sdk:messages-stream"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/aws-sdk.js
var awsSdkConfig = [
	{
		channelName: "send",
		module: {
			name: "@smithy/core",
			versionRange: ">=3.24.0 <4",
			filePath: "dist-cjs/submodules/client/index.js"
		},
		functionQuery: {
			className: "Client",
			methodName: "send",
			kind: "Async"
		}
	},
	{
		channelName: "send",
		module: {
			name: "@smithy/smithy-client",
			versionRange: ">=1.0.3 <5",
			filePath: "dist-cjs/index.js"
		},
		functionQuery: {
			className: "Client",
			methodName: "send",
			kind: "Async"
		}
	},
	{
		channelName: "send",
		module: {
			name: "@aws-sdk/smithy-client",
			versionRange: "^3.1.0",
			filePath: "dist-cjs/index.js"
		},
		functionQuery: {
			className: "Client",
			methodName: "send",
			kind: "Async"
		}
	}
];
var awsSdkModuleNames = getModuleNames(awsSdkConfig);
var awsSdkChannels = {
	AWS_SMITHY_CORE_SEND: "orchestrion:@smithy/core:send",
	AWS_SMITHY_CLIENT_SEND: "orchestrion:@smithy/smithy-client:send",
	AWS_SDK_SMITHY_CLIENT_SEND: "orchestrion:@aws-sdk/smithy-client:send"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/dataloader.js
var module$1$3 = {
	name: "dataloader",
	versionRange: ">=2.0.0 <3",
	filePath: "index.js"
};
var dataloaderConfig = [
	{
		channelName: "construct",
		module: module$1$3,
		functionQuery: {
			functionName: "DataLoader",
			kind: "Sync"
		}
	},
	{
		channelName: "load",
		module: module$1$3,
		functionQuery: {
			expressionName: "load",
			kind: "Async"
		}
	},
	{
		channelName: "loadMany",
		module: module$1$3,
		functionQuery: {
			expressionName: "loadMany",
			kind: "Async"
		}
	},
	{
		channelName: "prime",
		module: module$1$3,
		functionQuery: {
			expressionName: "prime",
			kind: "Sync"
		}
	},
	{
		channelName: "clear",
		module: module$1$3,
		functionQuery: {
			expressionName: "clear",
			kind: "Sync"
		}
	},
	{
		channelName: "clearAll",
		module: module$1$3,
		functionQuery: {
			expressionName: "clearAll",
			kind: "Sync"
		}
	}
];
var dataloaderChannels = {
	DATALOADER_CONSTRUCT: "orchestrion:dataloader:construct",
	DATALOADER_LOAD: "orchestrion:dataloader:load",
	DATALOADER_LOAD_MANY: "orchestrion:dataloader:loadMany",
	DATALOADER_PRIME: "orchestrion:dataloader:prime",
	DATALOADER_CLEAR: "orchestrion:dataloader:clear",
	DATALOADER_CLEAR_ALL: "orchestrion:dataloader:clearAll"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/express.js
var expressConfig = [
	{
		channelName: "handle",
		module: {
			name: "express",
			versionRange: ">=4.0.0 <5",
			filePath: "lib/router/layer.js"
		},
		functionQuery: {
			expressionName: "handle_request",
			kind: "Callback"
		}
	},
	{
		channelName: "handle",
		module: {
			name: "router",
			versionRange: ">=2.0.0 <3",
			filePath: "lib/layer.js"
		},
		functionQuery: {
			expressionName: "handleRequest",
			kind: "Callback"
		}
	},
	{
		channelName: "register",
		module: {
			name: "express",
			versionRange: ">=4.0.0 <5",
			filePath: "lib/router/index.js"
		},
		functionQuery: {
			expressionName: "route",
			kind: "Sync"
		}
	},
	{
		channelName: "register",
		module: {
			name: "express",
			versionRange: ">=4.0.0 <5",
			filePath: "lib/router/index.js"
		},
		functionQuery: {
			expressionName: "use",
			kind: "Sync"
		}
	},
	{
		channelName: "register",
		module: {
			name: "router",
			versionRange: ">=2.0.0 <3",
			filePath: "index.js"
		},
		functionQuery: {
			expressionName: "route",
			kind: "Sync"
		}
	},
	{
		channelName: "register",
		module: {
			name: "router",
			versionRange: ">=2.0.0 <3",
			filePath: "index.js"
		},
		functionQuery: {
			expressionName: "use",
			kind: "Sync"
		}
	}
];
var expressModuleNames = getModuleNames(expressConfig);
var expressChannels = {
	EXPRESS_HANDLE: "orchestrion:express:handle",
	ROUTER_HANDLE: "orchestrion:router:handle",
	EXPRESS_REGISTER: "orchestrion:express:register",
	ROUTER_REGISTER: "orchestrion:router:register"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/firebase.js
var FIRESTORE_VERSION_RANGE = ">=3.0.0 <5";
var FIRESTORE_FILE = /dist\/lite\/(index|common-[^/]+)\.node\.(cjs\.js|mjs)$/;
var FIRESTORE_OPERATIONS$1 = [
	{
		functionName: "addDoc",
		channelName: "add-doc"
	},
	{
		functionName: "getDocs",
		channelName: "get-docs"
	},
	{
		functionName: "setDoc",
		channelName: "set-doc"
	},
	{
		functionName: "deleteDoc",
		channelName: "delete-doc"
	}
];
var FUNCTIONS_VERSION_RANGE = ">=6.0.0 <7";
var FUNCTIONS_TRIGGERS$1 = [
	{
		file: "lib/v2/providers/https.js",
		functionName: "onRequest",
		channelName: "http-request"
	},
	{
		file: "lib/v2/providers/https.js",
		functionName: "onCall",
		channelName: "http-call"
	},
	{
		file: "lib/v2/providers/firestore.js",
		functionName: "onDocumentCreated",
		channelName: "firestore-created"
	},
	{
		file: "lib/v2/providers/firestore.js",
		functionName: "onDocumentCreatedWithAuthContext",
		channelName: "firestore-created"
	},
	{
		file: "lib/v2/providers/firestore.js",
		functionName: "onDocumentUpdated",
		channelName: "firestore-updated"
	},
	{
		file: "lib/v2/providers/firestore.js",
		functionName: "onDocumentUpdatedWithAuthContext",
		channelName: "firestore-updated"
	},
	{
		file: "lib/v2/providers/firestore.js",
		functionName: "onDocumentDeleted",
		channelName: "firestore-deleted"
	},
	{
		file: "lib/v2/providers/firestore.js",
		functionName: "onDocumentDeletedWithAuthContext",
		channelName: "firestore-deleted"
	},
	{
		file: "lib/v2/providers/firestore.js",
		functionName: "onDocumentWritten",
		channelName: "firestore-written"
	},
	{
		file: "lib/v2/providers/firestore.js",
		functionName: "onDocumentWrittenWithAuthContext",
		channelName: "firestore-written"
	},
	{
		file: "lib/v2/providers/scheduler.js",
		functionName: "onSchedule",
		channelName: "scheduler"
	},
	{
		file: "lib/v2/providers/storage.js",
		functionName: "onObjectFinalized",
		channelName: "storage-finalized"
	},
	{
		file: "lib/v2/providers/storage.js",
		functionName: "onObjectArchived",
		channelName: "storage-archived"
	},
	{
		file: "lib/v2/providers/storage.js",
		functionName: "onObjectDeleted",
		channelName: "storage-deleted"
	},
	{
		file: "lib/v2/providers/storage.js",
		functionName: "onObjectMetadataUpdated",
		channelName: "storage-metadata-updated"
	}
];
var firebaseConfig = [...FIRESTORE_OPERATIONS$1.map(({ functionName, channelName }) => ({
	channelName,
	module: {
		name: "@firebase/firestore",
		versionRange: FIRESTORE_VERSION_RANGE,
		filePath: FIRESTORE_FILE
	},
	functionQuery: {
		functionName,
		kind: "Auto"
	}
})), ...FUNCTIONS_TRIGGERS$1.map(({ file, functionName, channelName }) => ({
	channelName,
	module: {
		name: "firebase-functions",
		versionRange: FUNCTIONS_VERSION_RANGE,
		filePath: file
	},
	functionQuery: {
		functionName,
		kind: "Sync"
	}
}))];
var firebaseModuleNames = getModuleNames(firebaseConfig);
var firebaseChannels = {
	FIREBASE_FIRESTORE_ADD_DOC: "orchestrion:@firebase/firestore:add-doc",
	FIREBASE_FIRESTORE_GET_DOCS: "orchestrion:@firebase/firestore:get-docs",
	FIREBASE_FIRESTORE_SET_DOC: "orchestrion:@firebase/firestore:set-doc",
	FIREBASE_FIRESTORE_DELETE_DOC: "orchestrion:@firebase/firestore:delete-doc",
	FIREBASE_FUNCTIONS_HTTP_REQUEST: "orchestrion:firebase-functions:http-request",
	FIREBASE_FUNCTIONS_HTTP_CALL: "orchestrion:firebase-functions:http-call",
	FIREBASE_FUNCTIONS_FIRESTORE_CREATED: "orchestrion:firebase-functions:firestore-created",
	FIREBASE_FUNCTIONS_FIRESTORE_UPDATED: "orchestrion:firebase-functions:firestore-updated",
	FIREBASE_FUNCTIONS_FIRESTORE_DELETED: "orchestrion:firebase-functions:firestore-deleted",
	FIREBASE_FUNCTIONS_FIRESTORE_WRITTEN: "orchestrion:firebase-functions:firestore-written",
	FIREBASE_FUNCTIONS_SCHEDULER: "orchestrion:firebase-functions:scheduler",
	FIREBASE_FUNCTIONS_STORAGE_FINALIZED: "orchestrion:firebase-functions:storage-finalized",
	FIREBASE_FUNCTIONS_STORAGE_ARCHIVED: "orchestrion:firebase-functions:storage-archived",
	FIREBASE_FUNCTIONS_STORAGE_DELETED: "orchestrion:firebase-functions:storage-deleted",
	FIREBASE_FUNCTIONS_STORAGE_METADATA_UPDATED: "orchestrion:firebase-functions:storage-metadata-updated"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/generic-pool.js
var genericPoolConfig = [{
	channelName: "acquire",
	module: {
		name: "generic-pool",
		versionRange: ">=3.0.0 <4",
		filePath: "lib/Pool.js"
	},
	functionQuery: {
		className: "Pool",
		methodName: "acquire",
		kind: "Auto"
	}
}, {
	channelName: "acquire",
	module: {
		name: "generic-pool",
		versionRange: ">=2.4.0 <3",
		filePath: "lib/generic-pool.js"
	},
	functionQuery: {
		expressionName: "acquire",
		kind: "Callback"
	}
}];
var genericPoolModuleNames = getModuleNames(genericPoolConfig);
var genericPoolChannels = { GENERIC_POOL_ACQUIRE: "orchestrion:generic-pool:acquire" };
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/google-genai.js
var NODE_DIST_FILES = [
	"dist/node/index.js",
	"dist/node/index.mjs",
	"dist/node/index.cjs"
];
var googleGenAiConfig = [
	...NODE_DIST_FILES.flatMap((filePath) => ["generateContent", "generateContentStream"].map((expressionName) => ({
		channelName: "generate-content",
		module: {
			name: "@google/genai",
			versionRange: ">=0.10.0 <3",
			filePath
		},
		functionQuery: {
			expressionName,
			kind: "Auto"
		}
	}))),
	...NODE_DIST_FILES.map((filePath) => ({
		channelName: "embed-content",
		module: {
			name: "@google/genai",
			versionRange: ">=0.10.0 <3",
			filePath
		},
		functionQuery: {
			className: "Models",
			methodName: "embedContent",
			kind: "Auto"
		}
	})),
	...NODE_DIST_FILES.flatMap((filePath) => ["sendMessage", "sendMessageStream"].map((methodName) => ({
		channelName: "chat",
		module: {
			name: "@google/genai",
			versionRange: ">=0.10.0 <3",
			filePath
		},
		functionQuery: {
			className: "Chat",
			methodName,
			kind: "Auto"
		}
	})))
];
var googleGenAiModuleNames = getModuleNames(googleGenAiConfig);
var googleGenAiChannels = {
	GOOGLE_GENAI_GENERATE_CONTENT: "orchestrion:@google/genai:generate-content",
	GOOGLE_GENAI_EMBED_CONTENT: "orchestrion:@google/genai:embed-content",
	GOOGLE_GENAI_CHAT: "orchestrion:@google/genai:chat"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/graphql.js
var graphqlConfig = [
	...["language/parser.js", "language/parser.mjs"].map((filePath) => ({
		channelName: "parse",
		module: {
			name: "graphql",
			versionRange: ">=14.0.0 <17",
			filePath
		},
		functionQuery: {
			functionName: "parse",
			kind: "Sync"
		}
	})),
	...["validation/validate.js", "validation/validate.mjs"].map((filePath) => ({
		channelName: "validate",
		module: {
			name: "graphql",
			versionRange: ">=14.0.0 <17",
			filePath
		},
		functionQuery: {
			functionName: "validate",
			kind: "Sync"
		}
	})),
	...["execution/execute.js", "execution/execute.mjs"].map((filePath) => ({
		channelName: "execute",
		module: {
			name: "graphql",
			versionRange: ">=14.0.0 <17",
			filePath
		},
		functionQuery: {
			functionName: "execute",
			kind: "Auto"
		}
	}))
];
var graphqlChannels = {
	GRAPHQL_PARSE: "orchestrion:graphql:parse",
	GRAPHQL_VALIDATE: "orchestrion:graphql:validate",
	GRAPHQL_EXECUTE: "orchestrion:graphql:execute"
};
var graphqlModuleNames = getModuleNames(graphqlConfig);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/hapi.js
var hapiConfig = [
	{
		channelName: "route",
		module: {
			name: "@hapi/hapi",
			versionRange: ">=17.0.0 <22.0.0",
			filePath: "lib/server.js"
		},
		functionQuery: {
			methodName: "route",
			kind: "Sync"
		}
	},
	{
		channelName: "ext",
		module: {
			name: "@hapi/hapi",
			versionRange: ">=17.0.0 <22.0.0",
			filePath: "lib/server.js"
		},
		functionQuery: {
			methodName: "ext",
			kind: "Sync"
		}
	},
	{
		channelName: "start",
		module: {
			name: "@hapi/hapi",
			versionRange: ">=17.0.0 <22.0.0",
			filePath: "lib/server.js"
		},
		functionQuery: {
			methodName: "start",
			kind: "Sync"
		}
	},
	{
		channelName: "initialize",
		module: {
			name: "@hapi/hapi",
			versionRange: ">=17.0.0 <22.0.0",
			filePath: "lib/server.js"
		},
		functionQuery: {
			methodName: "initialize",
			kind: "Sync"
		}
	}
];
var hapiModuleNames = getModuleNames(hapiConfig);
var hapiChannels = {
	HAPI_ROUTE: "orchestrion:@hapi/hapi:route",
	HAPI_EXT: "orchestrion:@hapi/hapi:ext",
	HAPI_START: "orchestrion:@hapi/hapi:start",
	HAPI_INITIALIZE: "orchestrion:@hapi/hapi:initialize"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/registration-only.js
var MODULE_REGISTRATION_TRANSFORM = "sentryModuleRegistration";
function registrationOnly(module) {
	return {
		channelName: "module-registration",
		module,
		astQuery: "Program",
		transform: MODULE_REGISTRATION_TRANSFORM
	};
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/ioredis.js
var ioredisConfig = [
	registrationOnly({
		name: "ioredis",
		versionRange: ">=5.11.0",
		filePath: "built/Redis.js"
	}),
	...[
		"lib/redis.js",
		"built/redis.js",
		"built/redis/index.js"
	].flatMap((filePath) => [{
		channelName: "command",
		module: {
			name: "ioredis",
			versionRange: ">=2.0.0 <5.0.0",
			filePath
		},
		functionQuery: {
			expressionName: "sendCommand",
			kind: "Async"
		}
	}, {
		channelName: "connect",
		module: {
			name: "ioredis",
			versionRange: ">=2.0.0 <5.0.0",
			filePath
		},
		functionQuery: {
			expressionName: "connect",
			kind: "Async"
		}
	}]),
	{
		channelName: "command",
		module: {
			name: "ioredis",
			versionRange: ">=5.0.0 <5.11.0",
			filePath: "built/Redis.js"
		},
		functionQuery: {
			className: "Redis",
			methodName: "sendCommand",
			kind: "Async"
		}
	},
	{
		channelName: "connect",
		module: {
			name: "ioredis",
			versionRange: ">=5.0.0 <5.11.0",
			filePath: "built/Redis.js"
		},
		functionQuery: {
			className: "Redis",
			methodName: "connect",
			kind: "Async"
		}
	}
];
var ioredisModuleNames = getModuleNames(ioredisConfig);
var ioredisChannels = {
	IOREDIS_COMMAND: "orchestrion:ioredis:command",
	IOREDIS_CONNECT: "orchestrion:ioredis:connect"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/kafkajs.js
var kafkajsConfig = [{
	channelName: "send_batch",
	module: {
		name: "kafkajs",
		versionRange: ">=2.0.0 <3",
		filePath: "src/producer/messageProducer.js"
	},
	functionQuery: {
		expressionName: "sendBatch",
		kind: "Async"
	}
}, {
	channelName: "consumer_run",
	module: {
		name: "kafkajs",
		versionRange: ">=2.0.0 <3",
		filePath: "src/consumer/index.js"
	},
	functionQuery: {
		expressionName: "run",
		kind: "Async"
	}
}];
var kafkajsModuleNames = getModuleNames(kafkajsConfig);
var kafkajsChannels = {
	KAFKAJS_SEND_BATCH: "orchestrion:kafkajs:send_batch",
	KAFKAJS_CONSUMER_RUN: "orchestrion:kafkajs:consumer_run"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/knex.js
var MODULE_NAME$1 = "knex";
var RUNNER_FILES = [
	{
		filePath: "lib/execution/runner.js",
		versionRange: ">=0.22.0 <4"
	},
	{
		filePath: "lib/runner.js",
		versionRange: ">=0.10.0 <0.22.0"
	},
	{
		filePath: "src/runner.js",
		versionRange: ">=0.18.0 <0.19.0"
	}
];
var CLIENT_FILES = [{
	filePath: "lib/client.js",
	versionRange: ">=0.10.0 <4"
}, {
	filePath: "src/client.js",
	versionRange: ">=0.18.0 <0.19.0"
}];
var CLIENT_METHODS = [
	"queryBuilder",
	"schemaBuilder",
	"raw"
];
function runnerQuery(filePath, versionRange) {
	return {
		channelName: "query",
		module: {
			name: MODULE_NAME$1,
			versionRange,
			filePath
		},
		functionQuery: {
			className: "Runner",
			methodName: "query",
			kind: "Async"
		}
	};
}
function clientMethod(methodName, filePath, versionRange) {
	return {
		channelName: methodName,
		module: {
			name: MODULE_NAME$1,
			versionRange,
			filePath
		},
		functionQuery: {
			className: "Client",
			methodName,
			kind: "Sync"
		}
	};
}
var knexConfig = [...RUNNER_FILES.map(({ filePath, versionRange }) => runnerQuery(filePath, versionRange)), ...CLIENT_FILES.flatMap(({ filePath, versionRange }) => CLIENT_METHODS.map((methodName) => clientMethod(methodName, filePath, versionRange)))];
var knexChannels = {
	KNEX_QUERY: "orchestrion:knex:query",
	KNEX_QUERY_BUILDER: "orchestrion:knex:queryBuilder",
	KNEX_SCHEMA_BUILDER: "orchestrion:knex:schemaBuilder",
	KNEX_RAW: "orchestrion:knex:raw"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/koa.js
var koaConfig = [{
	channelName: "use",
	module: {
		name: "koa",
		versionRange: ">=2.0.0 <4",
		filePath: "lib/application.js"
	},
	functionQuery: {
		className: "Application",
		methodName: "use",
		kind: "Sync"
	}
}, {
	channelName: "callback",
	module: {
		name: "koa",
		versionRange: ">=2.0.0 <4",
		filePath: "lib/application.js"
	},
	functionQuery: {
		className: "Application",
		methodName: "callback",
		kind: "Sync"
	}
}];
var koaModuleNames = getModuleNames(koaConfig);
var koaChannels = {
	KOA_USE: "orchestrion:koa:use",
	KOA_CALLBACK: "orchestrion:koa:callback"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/langchain.js
var chatModelConfig = ["dist/language_models/chat_models.cjs", "dist/language_models/chat_models.js"].flatMap((filePath) => {
	const module = {
		name: "@langchain/core",
		versionRange: ">=0.1.0 <2.0.0",
		filePath
	};
	return [{
		channelName: "chatModelInvoke",
		module,
		functionQuery: {
			className: "BaseChatModel",
			methodName: "invoke",
			kind: "Async"
		}
	}, {
		channelName: "chatModelStream",
		module,
		functionQuery: {
			className: "BaseChatModel",
			methodName: "_streamIterator",
			kind: "Async"
		}
	}];
});
var EMBED_QUERY = "embedQuery";
var EMBED_DOCUMENTS = "embedDocuments";
var EMBEDDINGS_PROVIDERS = [
	{
		name: "@langchain/openai",
		versionRange: ">=0.1.0 <2.0.0",
		methods: [EMBED_QUERY, EMBED_DOCUMENTS]
	},
	{
		name: "@langchain/google-genai",
		versionRange: ">=0.1.0 <3.0.0",
		methods: [EMBED_QUERY, EMBED_DOCUMENTS]
	},
	{
		name: "@langchain/mistralai",
		versionRange: ">=0.1.0 <2.0.0",
		methods: [EMBED_QUERY, EMBED_DOCUMENTS]
	},
	{
		name: "@langchain/google-common",
		versionRange: ">=0.1.0 <3.0.0",
		methods: [EMBED_DOCUMENTS]
	}
];
var embeddingsConfig = EMBEDDINGS_PROVIDERS.flatMap(({ name, versionRange, methods }) => ["dist/embeddings.cjs", "dist/embeddings.js"].flatMap((filePath) => methods.map((method) => ({
	channelName: method,
	module: {
		name,
		versionRange,
		filePath
	},
	functionQuery: {
		methodName: method,
		kind: "Async"
	}
}))));
var langchainConfig = [...chatModelConfig, ...embeddingsConfig];
var langchainEmbeddingsChannels = EMBEDDINGS_PROVIDERS.flatMap(({ name, methods }) => methods.map((method) => `orchestrion:${name}:${method}`));
var langchainModuleNames = getModuleNames(langchainConfig);
var langchainChannels = {
	LANGCHAIN_CHAT_MODEL_INVOKE: "orchestrion:@langchain/core:chatModelInvoke",
	LANGCHAIN_CHAT_MODEL_STREAM: "orchestrion:@langchain/core:chatModelStream"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/langgraph.js
var module$1$2 = (filePath) => ({
	name: "@langchain/langgraph",
	versionRange: ">=0.0.0 <2.0.0",
	filePath
});
var compileConfig = ["dist/graph/state.cjs", "dist/graph/state.js"].map((filePath) => ({
	channelName: "stateGraphCompile",
	module: module$1$2(filePath),
	functionQuery: {
		className: "StateGraph",
		methodName: "compile",
		kind: "Sync"
	}
}));
var createReactAgentConfig = ["dist/prebuilt/react_agent_executor.cjs", "dist/prebuilt/react_agent_executor.js"].map((filePath) => ({
	channelName: "createReactAgent",
	module: module$1$2(filePath),
	functionQuery: {
		functionName: "createReactAgent",
		kind: "Sync"
	}
}));
var langgraphConfig = [...compileConfig, ...createReactAgentConfig];
var langgraphModuleNames = getModuleNames(langgraphConfig);
var langgraphChannels = {
	LANGGRAPH_STATE_GRAPH_COMPILE: "orchestrion:@langchain/langgraph:stateGraphCompile",
	LANGGRAPH_CREATE_REACT_AGENT: "orchestrion:@langchain/langgraph:createReactAgent"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/lru-memoizer.js
var lruMemoizerConfig = [{
	channelName: "load",
	module: {
		name: "lru-memoizer",
		versionRange: ">=2.1.0 <4",
		filePath: "lib/async.js"
	},
	functionQuery: {
		functionName: "memoizedFunction",
		kind: "Callback"
	}
}];
var lruMemoizerModuleNames = getModuleNames(lruMemoizerConfig);
var lruMemoizerChannels = { LRU_MEMOIZER_LOAD: "orchestrion:lru-memoizer:load" };
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/mongodb.js
var module$1$1 = { name: "mongodb" };
var mongodbConfig = [
	{
		channelName: "command",
		module: {
			...module$1$1,
			versionRange: ">=6.4.0 <8",
			filePath: "lib/cmap/connection.js"
		},
		functionQuery: {
			methodName: "command",
			kind: "Async"
		}
	},
	{
		channelName: "command",
		module: {
			...module$1$1,
			versionRange: ">=4.0.0 <6.4",
			filePath: "lib/cmap/connection.js"
		},
		functionQuery: {
			methodName: "command",
			kind: "Callback"
		}
	},
	{
		channelName: "checkout",
		module: {
			...module$1$1,
			versionRange: ">=4.0.0 <6.4",
			filePath: "lib/cmap/connection_pool.js"
		},
		functionQuery: {
			methodName: "checkOut",
			kind: "Callback"
		}
	},
	...[
		"insert",
		"update",
		"remove"
	].map((op) => ({
		channelName: `v3_${op}`,
		module: {
			...module$1$1,
			versionRange: ">=3.3.0 <4",
			filePath: "lib/core/wireprotocol/index.js"
		},
		functionQuery: {
			expressionName: op,
			kind: "Callback"
		}
	})),
	{
		channelName: "v3_command",
		module: {
			...module$1$1,
			versionRange: ">=3.3.0 <4",
			filePath: "lib/core/wireprotocol/command.js"
		},
		functionQuery: {
			functionName: "command",
			kind: "Callback"
		}
	},
	{
		channelName: "v3_query",
		module: {
			...module$1$1,
			versionRange: ">=3.3.0 <4",
			filePath: "lib/core/wireprotocol/query.js"
		},
		functionQuery: {
			functionName: "query",
			kind: "Callback"
		}
	},
	{
		channelName: "v3_get_more",
		module: {
			...module$1$1,
			versionRange: ">=3.3.0 <4",
			filePath: "lib/core/wireprotocol/get_more.js"
		},
		functionQuery: {
			functionName: "getMore",
			kind: "Callback"
		}
	}
];
var mongodbModuleNames = getModuleNames(mongodbConfig);
var mongodbChannels = {
	MONGODB_COMMAND: "orchestrion:mongodb:command",
	MONGODB_CHECKOUT: "orchestrion:mongodb:checkout",
	MONGODB_V3_INSERT: "orchestrion:mongodb:v3_insert",
	MONGODB_V3_UPDATE: "orchestrion:mongodb:v3_update",
	MONGODB_V3_REMOVE: "orchestrion:mongodb:v3_remove",
	MONGODB_V3_COMMAND: "orchestrion:mongodb:v3_command",
	MONGODB_V3_QUERY: "orchestrion:mongodb:v3_query",
	MONGODB_V3_GET_MORE: "orchestrion:mongodb:v3_get_more"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/mongoose.js
var module$1 = {
	name: "mongoose",
	versionRange: ">=5.9.7 <9.7.0"
};
var CONTEXT_CAPTURE_QUERY_METHODS = [
	"find",
	"findOne",
	"deleteOne",
	"deleteMany",
	"estimatedDocumentCount",
	"countDocuments",
	"distinct",
	"where",
	"$where",
	"findOneAndUpdate",
	"findOneAndDelete",
	"findOneAndReplace",
	"remove",
	"count",
	"findOneAndRemove"
];
var mongooseConfig = [
	registrationOnly({
		name: "mongoose",
		versionRange: ">=9.7.0",
		filePath: "lib/query.js"
	}),
	{
		channelName: "query_exec",
		module: {
			...module$1,
			filePath: "lib/query.js"
		},
		functionQuery: {
			expressionName: "exec",
			kind: "Auto"
		}
	},
	{
		channelName: "aggregate_exec",
		module: {
			...module$1,
			filePath: "lib/aggregate.js"
		},
		functionQuery: {
			expressionName: "exec",
			kind: "Auto"
		}
	},
	{
		channelName: "model_save",
		module: {
			...module$1,
			filePath: "lib/model.js"
		},
		functionQuery: {
			expressionName: "save",
			kind: "Auto"
		}
	},
	{
		channelName: "model_insert_many",
		module: {
			...module$1,
			filePath: "lib/model.js"
		},
		functionQuery: {
			expressionName: "insertMany",
			kind: "Auto"
		}
	},
	{
		channelName: "model_bulk_write",
		module: {
			...module$1,
			filePath: "lib/model.js"
		},
		functionQuery: {
			expressionName: "bulkWrite",
			kind: "Auto"
		}
	},
	{
		channelName: "model_remove",
		module: {
			...module$1,
			filePath: "lib/model.js"
		},
		functionQuery: {
			expressionName: "remove",
			kind: "Auto"
		}
	},
	{
		channelName: "model_aggregate",
		module: {
			...module$1,
			filePath: "lib/model.js"
		},
		functionQuery: {
			expressionName: "aggregate",
			kind: "Sync"
		}
	},
	...CONTEXT_CAPTURE_QUERY_METHODS.map((methodName) => ({
		channelName: `ctx_${methodName}`,
		module: {
			...module$1,
			filePath: "lib/query.js"
		},
		functionQuery: {
			expressionName: methodName,
			kind: "Sync"
		}
	}))
];
var mongooseModuleNames = getModuleNames(mongooseConfig);
var mongooseChannels = {
	MONGOOSE_QUERY_EXEC: "orchestrion:mongoose:query_exec",
	MONGOOSE_AGGREGATE_EXEC: "orchestrion:mongoose:aggregate_exec",
	MONGOOSE_MODEL_SAVE: "orchestrion:mongoose:model_save",
	MONGOOSE_MODEL_INSERT_MANY: "orchestrion:mongoose:model_insert_many",
	MONGOOSE_MODEL_BULK_WRITE: "orchestrion:mongoose:model_bulk_write",
	MONGOOSE_MODEL_REMOVE: "orchestrion:mongoose:model_remove",
	MONGOOSE_MODEL_AGGREGATE: "orchestrion:mongoose:model_aggregate"
};
var MONGOOSE_CONTEXT_CAPTURE_CHANNELS = CONTEXT_CAPTURE_QUERY_METHODS.map((methodName) => `orchestrion:mongoose:ctx_${methodName}`);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/mysql2.js
var mysql2Config = [
	registrationOnly({
		name: "mysql2",
		versionRange: ">=3.20.0",
		filePath: "lib/base/connection.js"
	}),
	{
		channelName: "query",
		module: {
			name: "mysql2",
			versionRange: ">=1.4.2 <3.11.5",
			filePath: "lib/connection.js"
		},
		functionQuery: {
			className: "Connection",
			methodName: "query",
			kind: "Callback"
		}
	},
	{
		channelName: "execute",
		module: {
			name: "mysql2",
			versionRange: ">=1.4.2 <3.11.5",
			filePath: "lib/connection.js"
		},
		functionQuery: {
			className: "Connection",
			methodName: "execute",
			kind: "Callback"
		}
	},
	{
		channelName: "query",
		module: {
			name: "mysql2",
			versionRange: ">=3.11.5 <3.20.0",
			filePath: "lib/base/connection.js"
		},
		functionQuery: {
			className: "BaseConnection",
			methodName: "query",
			kind: "Callback"
		}
	},
	{
		channelName: "execute",
		module: {
			name: "mysql2",
			versionRange: ">=3.11.5 <3.20.0",
			filePath: "lib/base/connection.js"
		},
		functionQuery: {
			className: "BaseConnection",
			methodName: "execute",
			kind: "Callback"
		}
	}
];
var mysql2ModuleNames = getModuleNames(mysql2Config);
var mysql2Channels = {
	MYSQL2_QUERY: "orchestrion:mysql2:query",
	MYSQL2_EXECUTE: "orchestrion:mysql2:execute"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/mysql.js
var mysqlConfig = [{
	channelName: "query",
	module: {
		name: "mysql",
		versionRange: ">=2.0.0 <3",
		filePath: "lib/Connection.js"
	},
	functionQuery: {
		expressionName: "query",
		kind: "Auto"
	}
}];
var mysqlModuleNames = getModuleNames(mysqlConfig);
var mysqlChannels = { MYSQL_QUERY: "orchestrion:mysql:query" };
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/nestjs.js
function astQueryInstrumentation(config) {
	return config;
}
var nestjsConfig = [
	{
		channelName: "nestFactoryCreate",
		module: {
			name: "@nestjs/core",
			versionRange: ">=8.0.0 <13",
			filePath: "nest-factory.js"
		},
		functionQuery: {
			className: "NestFactoryStatic",
			methodName: "create",
			kind: "Async"
		}
	},
	{
		channelName: "routerExecutionContextCreate",
		module: {
			name: "@nestjs/core",
			versionRange: ">=8.0.0 <13",
			filePath: "router/router-execution-context.js"
		},
		functionQuery: {
			className: "RouterExecutionContext",
			methodName: "create",
			kind: "Sync"
		}
	},
	astQueryInstrumentation({
		channelName: "injectableDecorator",
		module: {
			name: "@nestjs/common",
			versionRange: ">=8.0.0 <13",
			filePath: "decorators/core/injectable.decorator.js"
		},
		astQuery: "FunctionDeclaration[id.name=\"Injectable\"] ReturnStatement > ArrowFunctionExpression",
		functionQuery: { kind: "Sync" }
	}),
	astQueryInstrumentation({
		channelName: "catchDecorator",
		module: {
			name: "@nestjs/common",
			versionRange: ">=8.0.0 <13",
			filePath: "decorators/core/catch.decorator.js"
		},
		astQuery: "FunctionDeclaration[id.name=\"Catch\"] ReturnStatement > ArrowFunctionExpression",
		functionQuery: { kind: "Sync" }
	}),
	{
		channelName: "cronDecorator",
		module: {
			name: "@nestjs/schedule",
			versionRange: ">=2.0.0",
			filePath: "dist/decorators/cron.decorator.js"
		},
		functionQuery: {
			functionName: "Cron",
			kind: "Sync"
		}
	},
	{
		channelName: "intervalDecorator",
		module: {
			name: "@nestjs/schedule",
			versionRange: ">=2.0.0",
			filePath: "dist/decorators/interval.decorator.js"
		},
		functionQuery: {
			functionName: "Interval",
			kind: "Sync"
		}
	},
	{
		channelName: "timeoutDecorator",
		module: {
			name: "@nestjs/schedule",
			versionRange: ">=2.0.0",
			filePath: "dist/decorators/timeout.decorator.js"
		},
		functionQuery: {
			functionName: "Timeout",
			kind: "Sync"
		}
	},
	{
		channelName: "onEventDecorator",
		module: {
			name: "@nestjs/event-emitter",
			versionRange: ">=2.0.0",
			filePath: "dist/decorators/on-event.decorator.js"
		},
		functionQuery: {
			expressionName: "OnEvent",
			kind: "Sync"
		}
	},
	{
		channelName: "processorDecorator",
		module: {
			name: "@nestjs/bullmq",
			versionRange: ">=10.0.0",
			filePath: "dist/decorators/processor.decorator.js"
		},
		functionQuery: {
			functionName: "Processor",
			kind: "Sync"
		}
	}
];
var nestjsChannels = {
	NESTJS_APP_CREATION: "orchestrion:@nestjs/core:nestFactoryCreate",
	NESTJS_ROUTER_CONTEXT: "orchestrion:@nestjs/core:routerExecutionContextCreate",
	NESTJS_INJECTABLE: "orchestrion:@nestjs/common:injectableDecorator",
	NESTJS_CATCH: "orchestrion:@nestjs/common:catchDecorator",
	NESTJS_SCHEDULE_CRON: "orchestrion:@nestjs/schedule:cronDecorator",
	NESTJS_SCHEDULE_INTERVAL: "orchestrion:@nestjs/schedule:intervalDecorator",
	NESTJS_SCHEDULE_TIMEOUT: "orchestrion:@nestjs/schedule:timeoutDecorator",
	NESTJS_ONEVENT: "orchestrion:@nestjs/event-emitter:onEventDecorator",
	NESTJS_PROCESSOR: "orchestrion:@nestjs/bullmq:processorDecorator"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/openai.js
var openaiConfig = [
	...["resources/chat/completions/completions.js", "resources/chat/completions/completions.mjs"].map((filePath) => ({
		channelName: "chat",
		module: {
			name: "openai",
			versionRange: ">=4.0.0 <8",
			filePath
		},
		functionQuery: {
			className: "Completions",
			methodName: "create",
			kind: "Auto"
		}
	})),
	...["resources/responses/responses.js", "resources/responses/responses.mjs"].map((filePath) => ({
		channelName: "chat",
		module: {
			name: "openai",
			versionRange: ">=4.0.0 <8",
			filePath
		},
		functionQuery: {
			className: "Responses",
			methodName: "create",
			kind: "Auto"
		}
	})),
	...["resources/embeddings.js", "resources/embeddings.mjs"].map((filePath) => ({
		channelName: "embeddings",
		module: {
			name: "openai",
			versionRange: ">=4.0.0 <8",
			filePath
		},
		functionQuery: {
			className: "Embeddings",
			methodName: "create",
			kind: "Auto"
		}
	})),
	...["resources/conversations/conversations.js", "resources/conversations/conversations.mjs"].map((filePath) => ({
		channelName: "chat",
		module: {
			name: "openai",
			versionRange: ">=4.0.0 <8",
			filePath
		},
		functionQuery: {
			className: "Conversations",
			methodName: "create",
			kind: "Auto"
		}
	}))
];
var openaiModuleNames = getModuleNames(openaiConfig);
var openaiChannels = {
	OPENAI_CHAT: "orchestrion:openai:chat",
	OPENAI_EMBEDDINGS: "orchestrion:openai:embeddings"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/pg.js
var pgConfig = [
	{
		channelName: "query",
		module: {
			name: "pg",
			versionRange: ">=8.0.3 <9",
			filePath: "lib/client.js"
		},
		functionQuery: {
			className: "Client",
			methodName: "query",
			kind: "Auto"
		}
	},
	{
		channelName: "connect",
		module: {
			name: "pg",
			versionRange: ">=8.0.3 <9",
			filePath: "lib/client.js"
		},
		functionQuery: {
			className: "Client",
			methodName: "connect",
			kind: "Auto"
		}
	},
	{
		channelName: "query",
		module: {
			name: "pg",
			versionRange: ">=8.0.3 <9",
			filePath: "lib/native/client.js"
		},
		functionQuery: {
			expressionName: "query",
			kind: "Auto"
		}
	},
	{
		channelName: "connect",
		module: {
			name: "pg",
			versionRange: ">=8.0.3 <9",
			filePath: "lib/native/client.js"
		},
		functionQuery: {
			expressionName: "connect",
			kind: "Auto"
		}
	},
	{
		channelName: "connect",
		module: {
			name: "pg-pool",
			versionRange: ">=2.0.0 <4",
			filePath: "index.js"
		},
		functionQuery: {
			className: "Pool",
			methodName: "connect",
			kind: "Auto"
		}
	}
];
var pgModuleNames = getModuleNames(pgConfig);
var pgChannels = {
	PG_QUERY: "orchestrion:pg:query",
	PG_CONNECT: "orchestrion:pg:connect",
	PGPOOL_CONNECT: "orchestrion:pg-pool:connect"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/postgres.js
var postgresJsInstrumentationConfig = (dir) => [
	{
		channelName: "handle",
		module: {
			name: "postgres",
			versionRange: ">=3.0.0 <4",
			filePath: `${dir}/query.js`
		},
		functionQuery: {
			className: "Query",
			methodName: "handle",
			kind: "Async"
		}
	},
	{
		channelName: "connection",
		module: {
			name: "postgres",
			versionRange: ">=3.0.0 <4",
			filePath: `${dir}/connection.js`
		},
		functionQuery: {
			functionName: "Connection",
			kind: "Sync"
		}
	},
	{
		channelName: "execute",
		module: {
			name: "postgres",
			versionRange: ">=3.0.0 <4",
			filePath: `${dir}/connection.js`
		},
		functionQuery: {
			functionName: "execute",
			kind: "Sync"
		}
	},
	{
		channelName: "connect",
		module: {
			name: "postgres",
			versionRange: ">=3.0.0 <4",
			filePath: `${dir}/connection.js`
		},
		functionQuery: {
			methodName: "connect",
			kind: "Sync"
		}
	}
];
var postgresJsConfig = ["src", "cjs/src"].flatMap(postgresJsInstrumentationConfig);
var postgresJsModuleNames = getModuleNames(postgresJsConfig);
var postgresJsChannels = {
	POSTGRESJS_HANDLE: "orchestrion:postgres:handle",
	POSTGRESJS_CONNECTION: "orchestrion:postgres:connection",
	POSTGRESJS_EXECUTE: "orchestrion:postgres:execute",
	POSTGRESJS_CONNECT: "orchestrion:postgres:connect"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/redis.js
var redisConfig = [
	registrationOnly({
		name: "@redis/client",
		versionRange: ">=5.12.0",
		filePath: "dist/lib/client/index.js"
	}),
	{
		channelName: "command",
		module: {
			name: "redis",
			versionRange: ">=2.6.0 <4",
			filePath: "index.js"
		},
		functionQuery: {
			expressionName: "internal_send_command",
			kind: "Sync"
		}
	},
	{
		channelName: "executor",
		module: {
			name: "@redis/client",
			versionRange: "^1.0.0",
			filePath: "dist/lib/client/index.js"
		},
		functionQuery: {
			className: "RedisClient",
			methodName: "commandsExecutor",
			kind: "Async"
		}
	},
	{
		channelName: "command",
		module: {
			name: "@redis/client",
			versionRange: "^1.0.0",
			filePath: "dist/lib/client/index.js"
		},
		functionQuery: {
			className: "RedisClient",
			methodName: "sendCommand",
			kind: "Async"
		}
	},
	{
		channelName: "connect",
		module: {
			name: "@redis/client",
			versionRange: "^1.0.0",
			filePath: "dist/lib/client/index.js"
		},
		functionQuery: {
			className: "RedisClient",
			methodName: "connect",
			kind: "Async"
		}
	},
	{
		channelName: "command",
		module: {
			name: "@redis/client",
			versionRange: ">=5.0.0 <5.12.0",
			filePath: "dist/lib/client/index.js"
		},
		functionQuery: {
			className: "RedisClient",
			methodName: "sendCommand",
			kind: "Async"
		}
	},
	{
		channelName: "connect",
		module: {
			name: "@redis/client",
			versionRange: ">=5.0.0 <5.12.0",
			filePath: "dist/lib/client/index.js"
		},
		functionQuery: {
			className: "RedisClient",
			methodName: "connect",
			kind: "Async"
		}
	},
	{
		channelName: "multi",
		module: {
			name: "@redis/client",
			versionRange: ">=5.0.0 <5.12.0",
			filePath: "dist/lib/client/index.js"
		},
		functionQuery: {
			className: "RedisClient",
			methodName: "_executeMulti",
			kind: "Async"
		}
	},
	{
		channelName: "pipeline",
		module: {
			name: "@redis/client",
			versionRange: ">=5.0.0 <5.12.0",
			filePath: "dist/lib/client/index.js"
		},
		functionQuery: {
			className: "RedisClient",
			methodName: "_executePipeline",
			kind: "Async"
		}
	},
	{
		channelName: "batch",
		module: {
			name: "@redis/client",
			versionRange: "^1.0.0",
			filePath: "dist/lib/client/index.js"
		},
		functionQuery: {
			className: "RedisClient",
			methodName: "multiExecutor",
			kind: "Async"
		}
	}
];
var redisModuleNames = getModuleNames(redisConfig);
var redisChannels = {
	REDIS_COMMAND: "orchestrion:redis:command",
	NODE_REDIS_COMMAND: "orchestrion:@redis/client:command",
	NODE_REDIS_EXECUTOR: "orchestrion:@redis/client:executor",
	NODE_REDIS_CONNECT: "orchestrion:@redis/client:connect",
	NODE_REDIS_MULTI: "orchestrion:@redis/client:multi",
	NODE_REDIS_PIPELINE: "orchestrion:@redis/client:pipeline",
	NODE_REDIS_BATCH: "orchestrion:@redis/client:batch"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/remix.js
var remixInstrumentationConfig = (dir) => [
	{
		channelName: "requestHandler",
		module: {
			name: "@remix-run/server-runtime",
			versionRange: ">=2.0.0 <3",
			filePath: `${dir}/server.js`
		},
		astQuery: "FunctionExpression[id.name=\"requestHandler\"]",
		functionQuery: { kind: "Async" }
	},
	{
		channelName: "matchServerRoutes",
		module: {
			name: "@remix-run/server-runtime",
			versionRange: ">=2.0.0 <3",
			filePath: `${dir}/routeMatching.js`
		},
		functionQuery: {
			functionName: "matchServerRoutes",
			kind: "Sync"
		}
	},
	{
		channelName: "callRouteLoader",
		module: {
			name: "@remix-run/server-runtime",
			versionRange: ">=2.9.0 <3",
			filePath: `${dir}/data.js`
		},
		functionQuery: {
			functionName: "callRouteLoader",
			kind: "Async"
		}
	},
	{
		channelName: "callRouteAction",
		module: {
			name: "@remix-run/server-runtime",
			versionRange: ">=2.9.0 <3",
			filePath: `${dir}/data.js`
		},
		functionQuery: {
			functionName: "callRouteAction",
			kind: "Async"
		}
	},
	{
		channelName: "callRouteLoader",
		module: {
			name: "@remix-run/server-runtime",
			versionRange: ">=2.0.0 <2.9.0",
			filePath: `${dir}/data.js`
		},
		functionQuery: {
			functionName: "callRouteLoaderRR",
			kind: "Async"
		}
	},
	{
		channelName: "callRouteAction",
		module: {
			name: "@remix-run/server-runtime",
			versionRange: ">=2.0.0 <2.9.0",
			filePath: `${dir}/data.js`
		},
		functionQuery: {
			functionName: "callRouteActionRR",
			kind: "Async"
		}
	}
];
var remixConfig = ["dist", "dist/esm"].flatMap(remixInstrumentationConfig);
var remixChannels = {
	REMIX_REQUEST_HANDLER: "orchestrion:@remix-run/server-runtime:requestHandler",
	REMIX_MATCH_SERVER_ROUTES: "orchestrion:@remix-run/server-runtime:matchServerRoutes",
	REMIX_CALL_ROUTE_LOADER: "orchestrion:@remix-run/server-runtime:callRouteLoader",
	REMIX_CALL_ROUTE_ACTION: "orchestrion:@remix-run/server-runtime:callRouteAction"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/tedious.js
var MODULE_NAME = "tedious";
var FILE_PATH = "lib/connection.js";
var VERSION_RANGE = ">=1.11.0 <20";
var tediousConfig = [
	"connect",
	"execSql",
	"execSqlBatch",
	"callProcedure",
	"execBulkLoad",
	"prepare",
	"execute"
].map((methodName) => ({
	channelName: methodName,
	module: {
		name: MODULE_NAME,
		versionRange: VERSION_RANGE,
		filePath: FILE_PATH
	},
	functionQuery: {
		className: "Connection",
		methodName,
		kind: "Sync"
	}
}));
var tediousModuleNames = getModuleNames(tediousConfig);
var tediousChannels = {
	TEDIOUS_CONNECT: "orchestrion:tedious:connect",
	TEDIOUS_EXEC_SQL: "orchestrion:tedious:execSql",
	TEDIOUS_EXEC_SQL_BATCH: "orchestrion:tedious:execSqlBatch",
	TEDIOUS_CALL_PROCEDURE: "orchestrion:tedious:callProcedure",
	TEDIOUS_EXEC_BULK_LOAD: "orchestrion:tedious:execBulkLoad",
	TEDIOUS_PREPARE: "orchestrion:tedious:prepare",
	TEDIOUS_EXECUTE: "orchestrion:tedious:execute"
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/vercel-ai.js
var vercelAiConfig = [
	...["dist/index.js", "dist/index.mjs"].map((filePath) => registrationOnly({
		name: "ai",
		versionRange: ">=7.0.0",
		filePath
	})),
	...vercelAiEntries(">=4.0.0 <7.0.0", "generateText", "generateText", "Async"),
	...vercelAiEntries(">=4.0.0 <7.0.0", "streamText", "streamText", "Sync"),
	...vercelAiEntries(">=4.0.0 <7.0.0", "generateObject", "generateObject", "Async"),
	...vercelAiEntries(">=4.0.0 <7.0.0", "embed", "embed", "Async"),
	...vercelAiEntries(">=4.0.0 <7.0.0", "embedMany", "embedMany", "Async"),
	...vercelAiEntries(">=5.0.0 <7.0.0", "resolveLanguageModel", "resolveLanguageModel", "Sync"),
	...vercelAiEntries(">=6.0.0 <7.0.0", "executeToolCall", "executeToolCall", "Async")
];
var vercelAiChannels = {
	VERCEL_AI_GENERATE_TEXT: "orchestrion:ai:generateText",
	VERCEL_AI_STREAM_TEXT: "orchestrion:ai:streamText",
	VERCEL_AI_GENERATE_OBJECT: "orchestrion:ai:generateObject",
	VERCEL_AI_EMBED: "orchestrion:ai:embed",
	VERCEL_AI_EMBED_MANY: "orchestrion:ai:embedMany",
	VERCEL_AI_EXECUTE_TOOL_CALL: "orchestrion:ai:executeToolCall",
	VERCEL_AI_RESOLVE_LANGUAGE_MODEL: "orchestrion:ai:resolveLanguageModel"
};
function vercelAiEntries(versionRange, channelName, functionName, kind) {
	return ["dist/index.js", "dist/index.mjs"].map((filePath) => ({
		channelName,
		module: {
			name: "ai",
			versionRange,
			filePath
		},
		functionQuery: {
			functionName,
			kind
		}
	}));
}
var vercelAiModuleNames = getModuleNames(vercelAiConfig);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/channels.js
var CHANNELS = {
	...amqplibChannels,
	...anthropicAiChannels,
	...awsSdkChannels,
	...dataloaderChannels,
	...expressChannels,
	...firebaseChannels,
	...genericPoolChannels,
	...googleGenAiChannels,
	...graphqlChannels,
	...hapiChannels,
	...ioredisChannels,
	...kafkajsChannels,
	...knexChannels,
	...koaChannels,
	...langchainChannels,
	...langgraphChannels,
	...lruMemoizerChannels,
	...mongodbChannels,
	...mongooseChannels,
	...mysql2Channels,
	...mysqlChannels,
	...nestjsChannels,
	...openaiChannels,
	...pgChannels,
	...postgresJsChannels,
	...redisChannels,
	...remixChannels,
	...tediousChannels,
	...vercelAiChannels
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/amqplib.js
var INTEGRATION_NAME$32 = "Amqplib";
var PUBLISHER_ORIGIN = "auto.amqplib.publisher";
var CONSUMER_ORIGIN$1 = "auto.amqplib.consumer";
var ATTR_MESSAGING_RABBITMQ_DESTINATION_ROUTING_KEY = "messaging.rabbitmq.destination.routing_key";
var ATTR_MESSAGING_CONVERSATION_ID = "messaging.message.conversation_id";
var MESSAGING_OPERATION_VALUE_PROCESS = "process";
var MESSAGING_OPERATION_VALUE_SEND = "send";
var CONSUME_TIMEOUT_MS = 6e4;
var END_OP = {
	Ack: "ack",
	AckAll: "ackAll",
	Reject: "reject",
	Nack: "nack",
	NackAll: "nackAll",
	ChannelClosed: "channel closed",
	ChannelError: "channel error",
	InstrumentationTimeout: "instrumentation timeout"
};
var MESSAGE_STORED_SPAN = /* @__PURE__ */ Symbol("sentry.amqplib.message.stored-span");
var CHANNEL_SPANS_NOT_ENDED = /* @__PURE__ */ Symbol("sentry.amqplib.channel.spans-not-ended");
var CHANNEL_CONSUME_TIMEOUT_TIMER = /* @__PURE__ */ Symbol("sentry.amqplib.channel.consume-timeout-timer");
var CHANNEL_CONSUMER_INFO = /* @__PURE__ */ Symbol("sentry.amqplib.channel.consumer-info");
var CHANNEL_IS_CONFIRM_PUBLISHING = /* @__PURE__ */ Symbol("sentry.amqplib.channel.is-confirm-publishing");
var CONNECTION_ATTRIBUTES = /* @__PURE__ */ Symbol("sentry.amqplib.connection.attributes");
var NOOP$3 = () => {};
var _amqplibIntegration = () => {
	return {
		name: INTEGRATION_NAME$32,
		setup(client) {
			invokeOrchestrionInstrumentation(client, amqplibModuleNames, instrumentAmqplib, []);
		}
	};
};
function instrumentAmqplib() {
	subscribeConnect$1();
	subscribePublish();
	subscribeConfirmPublish();
	subscribeConsume();
	subscribeDispatch();
	subscribeSettle();
}
function subscribePublish() {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(CHANNELS.AMQPLIB_PUBLISH), (data) => {
		if (data.self?.[CHANNEL_IS_CONFIRM_PUBLISHING]) return;
		return startPublishSpan(data);
	});
}
function subscribeConfirmPublish() {
	const channel = diagnosticsChannel.tracingChannel(CHANNELS.AMQPLIB_CONFIRM_PUBLISH);
	bindTracingChannelToSpan(channel, (data) => {
		if (data.self) data.self[CHANNEL_IS_CONFIRM_PUBLISHING] = true;
		return startPublishSpan(data);
	});
	channel.end.subscribe((message) => {
		const self = message.self;
		if (self) self[CHANNEL_IS_CONFIRM_PUBLISHING] = false;
	});
}
function subscribeConsume() {
	const channel = diagnosticsChannel.tracingChannel(CHANNELS.AMQPLIB_CONSUME);
	channel.start.subscribe(NOOP$3);
	channel.asyncEnd.subscribe((message) => {
		const data = message;
		const consumerChannel = data.self;
		const consumerTag = data.result?.consumerTag;
		if (!consumerChannel || !consumerTag) return;
		ensureChannelState(consumerChannel);
		const queueArg = data.arguments[0];
		const queue = typeof queueArg === "string" ? queueArg : "<unknown>";
		const options = data.arguments[2];
		consumerChannel[CHANNEL_CONSUMER_INFO]?.set(consumerTag, {
			noAck: !!options?.noAck,
			queue
		});
	});
}
function subscribeDispatch() {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(CHANNELS.AMQPLIB_DISPATCH), (data) => {
		const channel = data.self;
		const fields = data.arguments[0];
		const msg = data.arguments[1];
		if (!channel || !msg) return;
		ensureChannelState(channel);
		const info = fields?.consumerTag ? channel[CHANNEL_CONSUMER_INFO]?.get(fields.consumerTag) : void 0;
		const queue = info?.queue ?? msg.fields?.routingKey;
		const noAck = info?.noAck ?? false;
		const headers = msg.properties?.headers;
		const sentryTrace = getHeaderAsString$1(headers, "sentry-trace");
		const baggage = getHeaderAsString$1(headers, "baggage");
		const span = continueTrace({
			sentryTrace,
			baggage
		}, () => startConsumeSpan(queue, msg, channel));
		if (!noAck) {
			channel[CHANNEL_SPANS_NOT_ENDED]?.push({
				msg,
				timeOfConsume: timestampInSeconds()
			});
			msg[MESSAGE_STORED_SPAN] = span;
		}
		data._sentryNoAck = noAck;
		return span;
	}, { deferSpanEnd({ data }) {
		return !data._sentryNoAck;
	} });
}
function subscribeSettle() {
	diagnosticsChannel.tracingChannel(CHANNELS.AMQPLIB_ACK).start.subscribe((message) => handleAck(message, false, END_OP.Ack));
	diagnosticsChannel.tracingChannel(CHANNELS.AMQPLIB_NACK).start.subscribe((message) => handleAck(message, true, END_OP.Nack));
	diagnosticsChannel.tracingChannel(CHANNELS.AMQPLIB_REJECT).start.subscribe((message) => handleAck(message, true, END_OP.Reject));
	diagnosticsChannel.tracingChannel(CHANNELS.AMQPLIB_ACK_ALL).start.subscribe((message) => {
		const data = message;
		if (data.self) endAllSpansOnChannel(data.self, false, END_OP.AckAll, void 0);
	});
	diagnosticsChannel.tracingChannel(CHANNELS.AMQPLIB_NACK_ALL).start.subscribe((message) => {
		const data = message;
		if (data.self) endAllSpansOnChannel(data.self, true, END_OP.NackAll, data.arguments[0]);
	});
}
function subscribeConnect$1() {
	const channel = diagnosticsChannel.tracingChannel(CHANNELS.AMQPLIB_CONNECT);
	channel.start.subscribe(NOOP$3);
	channel.asyncEnd.subscribe((message) => {
		const data = message;
		const conn = data.result;
		if (!conn || typeof conn !== "object") return;
		conn[CONNECTION_ATTRIBUTES] = {
			...getConnectionAttributesFromUrl(data.arguments?.[0]),
			...getConnectionAttributesFromServer(conn)
		};
	});
}
function handleAck(data, isRejected, endOperation) {
	const channel = data.self;
	if (!channel) return;
	const message = data.arguments[0];
	if (!message) return;
	const allUpToOrRequeue = data.arguments[1];
	const requeue = data.arguments[2];
	const requeueResolved = endOperation === END_OP.Reject ? allUpToOrRequeue : requeue;
	const spansNotEnded = channel[CHANNEL_SPANS_NOT_ENDED] ?? [];
	const msgIndex = spansNotEnded.findIndex((msgDetails) => msgDetails.msg === message);
	if (msgIndex < 0) endConsumerSpan(message, isRejected, endOperation, requeueResolved);
	else if (endOperation !== END_OP.Reject && allUpToOrRequeue) {
		for (let i = 0; i <= msgIndex; i++) endConsumerSpan(spansNotEnded[i].msg, isRejected, endOperation, requeueResolved);
		spansNotEnded.splice(0, msgIndex + 1);
	} else {
		endConsumerSpan(message, isRejected, endOperation, requeueResolved);
		spansNotEnded.splice(msgIndex, 1);
	}
}
function ensureChannelState(channel) {
	if (Object.prototype.hasOwnProperty.call(channel, CHANNEL_SPANS_NOT_ENDED)) return;
	channel[CHANNEL_SPANS_NOT_ENDED] = [];
	channel[CHANNEL_CONSUMER_INFO] = /* @__PURE__ */ new Map();
	const timer = setInterval(() => checkConsumeTimeoutOnChannel(channel), CONSUME_TIMEOUT_MS);
	timer.unref?.();
	channel[CHANNEL_CONSUME_TIMEOUT_TIMER] = timer;
	if (typeof channel.on === "function") {
		channel.on("close", () => {
			endAllSpansOnChannel(channel, true, END_OP.ChannelClosed, void 0);
			clearConsumeTimeoutTimer(channel);
		});
		channel.on("error", () => {
			endAllSpansOnChannel(channel, true, END_OP.ChannelError, void 0);
			clearConsumeTimeoutTimer(channel);
		});
	}
}
function clearConsumeTimeoutTimer(channel) {
	const activeTimer = channel[CHANNEL_CONSUME_TIMEOUT_TIMER];
	if (activeTimer) {
		clearInterval(activeTimer);
		channel[CHANNEL_CONSUME_TIMEOUT_TIMER] = void 0;
	}
}
function checkConsumeTimeoutOnChannel(channel) {
	const currentTime = timestampInSeconds();
	const spansNotEnded = channel[CHANNEL_SPANS_NOT_ENDED] ?? [];
	let i = 0;
	for (; i < spansNotEnded.length; i++) {
		const currMessage = spansNotEnded[i];
		if ((currentTime - currMessage.timeOfConsume) * 1e3 < CONSUME_TIMEOUT_MS) break;
		endConsumerSpan(currMessage.msg, null, END_OP.InstrumentationTimeout, true);
	}
	spansNotEnded.splice(0, i);
}
function endAllSpansOnChannel(channel, isRejected, operation, requeue) {
	(channel[CHANNEL_SPANS_NOT_ENDED] ?? []).forEach((msgDetails) => {
		endConsumerSpan(msgDetails.msg, isRejected, operation, requeue);
	});
	channel[CHANNEL_SPANS_NOT_ENDED] = [];
}
function endConsumerSpan(message, isRejected, operation, requeue) {
	const storedSpan = message[MESSAGE_STORED_SPAN];
	if (!storedSpan) return;
	if (isRejected !== false) storedSpan.setStatus({
		code: 2,
		message: operation !== END_OP.ChannelClosed && operation !== END_OP.ChannelError ? `${operation} called on message${requeue === true ? " with requeue" : requeue === false ? " without requeue" : ""}` : operation
	});
	storedSpan.end();
	message[MESSAGE_STORED_SPAN] = void 0;
}
function startPublishSpan(data) {
	const exchangeArg = data.arguments[0];
	const routingKeyArg = data.arguments[1];
	const exchange = typeof exchangeArg === "string" ? exchangeArg : "";
	const routingKey = typeof routingKeyArg === "string" ? routingKeyArg : "";
	let options = data.arguments[3];
	const client = getClient();
	const destination = resolveDestination(exchange, routingKey);
	const streamedName = destination ? `${MESSAGING_OPERATION_VALUE_SEND} ${destination}` : MESSAGING_OPERATION_VALUE_SEND;
	const span = startInactiveSpan({
		name: client && hasSpanStreamingEnabled(client) ? streamedName : `publish ${normalizeExchange(exchange)}`,
		attributes: {
			[Ed]: be,
			[dd]: "producer",
			...getStoredConnectionAttributes(data.self),
			[Al]: destination,
			[ATTR_MESSAGING_RABBITMQ_DESTINATION_ROUTING_KEY]: routingKey,
			[Fl]: MESSAGING_OPERATION_VALUE_SEND,
			[Wl]: MESSAGING_OPERATION_VALUE_SEND,
			[Ml]: options?.messageId,
			[ATTR_MESSAGING_CONVERSATION_ID]: options?.correlationId,
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: PUBLISHER_ORIGIN
		}
	});
	if (!options || typeof options !== "object") {
		options = {};
		data.arguments[3] = options;
	}
	const headers = options.headers && typeof options.headers === "object" ? options.headers : options.headers = {};
	const traceData = getTraceData({ span });
	if (traceData["sentry-trace"]) headers["sentry-trace"] = traceData["sentry-trace"];
	if (traceData.baggage) headers["baggage"] = traceData.baggage;
	return span;
}
function startConsumeSpan(queue, msg, channel) {
	const client = getClient();
	const destination = resolveDestination(msg.fields?.exchange, msg.fields?.routingKey);
	const streamedName = destination ? `${MESSAGING_OPERATION_VALUE_PROCESS} ${destination}` : MESSAGING_OPERATION_VALUE_PROCESS;
	return startInactiveSpan({
		name: client && hasSpanStreamingEnabled(client) ? streamedName : queue ? `${queue} ${MESSAGING_OPERATION_VALUE_PROCESS}` : MESSAGING_OPERATION_VALUE_PROCESS,
		attributes: {
			[Ed]: De,
			[dd]: "consumer",
			[jd]: "component",
			...getStoredConnectionAttributes(channel),
			[Al]: destination,
			[ATTR_MESSAGING_RABBITMQ_DESTINATION_ROUTING_KEY]: msg.fields?.routingKey,
			[Fl]: MESSAGING_OPERATION_VALUE_PROCESS,
			[Wl]: MESSAGING_OPERATION_VALUE_PROCESS,
			[Ml]: msg.properties?.messageId,
			[ATTR_MESSAGING_CONVERSATION_ID]: msg.properties?.correlationId,
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: CONSUMER_ORIGIN$1
		}
	});
}
function getStoredConnectionAttributes(channel) {
	const connection = channel?.connection;
	const stored = connection?.[CONNECTION_ATTRIBUTES];
	if (stored) return stored;
	const product = connection?.serverProperties?.product ?? connection?.connection?.serverProperties?.product;
	if (typeof product === "string" && product) return { [Yl]: product.toLowerCase() };
	return {};
}
function getConnectionAttributesFromServer(conn) {
	const product = conn.serverProperties?.product ?? conn.connection?.serverProperties?.product;
	if (typeof product === "string" && product) return { [Yl]: product.toLowerCase() };
	return {};
}
function getConnectionAttributesFromUrl(url) {
	const attributes = { [pp]: "0.9.1" };
	const resolvedUrl = url || "amqp://localhost";
	if (typeof resolvedUrl === "object") {
		const connectOptions = resolvedUrl;
		const protocol = getProtocol(connectOptions.protocol);
		const hostname = getHostname(connectOptions.hostname);
		const port = getPort(connectOptions.port, protocol);
		attributes[lp] = protocol;
		attributes[mu] = hostname;
		attributes[bu] = port;
	} else if (typeof resolvedUrl === "string") {
		const censoredUrl = censorPassword(resolvedUrl);
		attributes[Ju] = censoredUrl;
		try {
			const urlParts = new URL(censoredUrl);
			const protocol = getProtocol(urlParts.protocol);
			const hostname = getHostname(urlParts.hostname);
			const port = getPort(urlParts.port ? parseInt(urlParts.port, 10) : void 0, protocol);
			attributes[lp] = protocol;
			attributes[mu] = hostname;
			attributes[bu] = port;
		} catch {}
	}
	return attributes;
}
function resolveDestination(exchange, routingKey) {
	return exchange || routingKey || void 0;
}
function normalizeExchange(exchangeName) {
	return exchangeName !== "" ? exchangeName : "<default>";
}
function censorPassword(url) {
	return url.replace(/:[^:@/]*@/, ":***@");
}
function getPort(portFromUrl, resolvedProtocol) {
	return portFromUrl || (resolvedProtocol === "AMQP" ? 5672 : 5671);
}
function getProtocol(protocolFromUrl) {
	const resolvedProtocol = protocolFromUrl || "amqp";
	return (resolvedProtocol.endsWith(":") ? resolvedProtocol.substring(0, resolvedProtocol.length - 1) : resolvedProtocol).toUpperCase();
}
function getHostname(hostnameFromUrl) {
	return hostnameFromUrl || "localhost";
}
function getHeaderAsString$1(headers, key) {
	const value = headers?.[key];
	if (value == null) return;
	return Array.isArray(value) ? String(value[0]) : String(value);
}
var amqplibIntegration = defineIntegration(_amqplibIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/anthropic.js
var INTEGRATION_NAME$31 = "Anthropic_AI";
var ORIGIN$17 = "auto.ai.anthropic";
var INSTRUMENTED_CHANNELS$2 = [{
	channel: CHANNELS.ANTHROPIC_CHAT,
	operation: "chat",
	stream: "async-iterable"
}, {
	channel: CHANNELS.ANTHROPIC_MESSAGES_STREAM,
	operation: "chat",
	stream: "message-stream"
}];
var _anthropicAIIntegration = (options = {}) => {
	return {
		name: INTEGRATION_NAME$31,
		setup(client) {
			invokeOrchestrionInstrumentation(client, anthropicAiModuleNames, instrumentAnthropic, [options]);
		}
	};
};
function instrumentAnthropic(options) {
	for (const { channel, operation, stream } of INSTRUMENTED_CHANNELS$2) bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(channel), (data) => createGenAiSpan$2(data, operation, options), {
		beforeSpanEnd: (span, data) => {
			addResponseAttributes$1(span, data.result, resolveAIRecordingOptions(options).recordOutputs);
		},
		deferSpanEnd: ({ span, data }) => wrapStreamResult$2(span, data, stream, options)
	});
}
function createGenAiSpan$2(data, operation, options) {
	const args = data.arguments ?? [];
	if (_INTERNAL_shouldSkipAiProviderWrapping(INTEGRATION_NAME$31)) return;
	if (args[1]?.headers?.["X-Stainless-Helper-Method"] === "stream") return;
	const params = typeof args[0] === "object" && args[0] !== null ? args[0] : void 0;
	const { recordInputs } = resolveAIRecordingOptions(options);
	const attributes = extractRequestAttributes$1(args, operation);
	const model = attributes["gen_ai.request.model"] || "unknown";
	attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN] = ORIGIN$17;
	const client = getClient();
	const span = startInactiveSpan({
		name: model !== "unknown" || !(client && hasSpanStreamingEnabled(client)) ? `${operation} ${model}` : operation,
		op: getGenAiSpanOp(operation),
		attributes
	});
	if (recordInputs && params) addPrivateRequestAttributes$1(span, params);
	return span;
}
function isAsyncIterable$2(value) {
	return !!value && typeof value[Symbol.asyncIterator] === "function";
}
function isMessageStream(value) {
	return !!value && typeof value.on === "function";
}
function wrapStreamResult$2(span, data, stream, options) {
	const { recordOutputs } = resolveAIRecordingOptions(options);
	const result = data.result;
	if (stream === "async-iterable" && isAsyncIterable$2(result)) {
		const iterate = result[Symbol.asyncIterator].bind(result);
		const instrumented = instrumentAsyncIterableStream({ [Symbol.asyncIterator]: iterate }, span, recordOutputs);
		result[Symbol.asyncIterator] = () => instrumented;
		return true;
	}
	if (stream === "message-stream" && isMessageStream(result)) {
		instrumentMessageStream(result, span, recordOutputs);
		return true;
	}
	return false;
}
var anthropicAIIntegration = defineIntegration(_anthropicAIIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/constants.js
var AWS_SDK_ORIGIN = "auto.aws.aws_sdk";
var DB_SYSTEM_VALUE_DYNAMODB = "dynamodb";
var ATTR_MESSAGING_DESTINATION_KIND = "messaging.destination_kind";
var MESSAGING_DESTINATION_KIND_VALUE_TOPIC = "topic";
var GEN_AI_OPERATION_NAME_VALUE_CHAT = "chat";
var GEN_AI_OPERATION_NAME_VALUE_GENERATE_CONTENT = "generate_content";
var GEN_AI_SYSTEM_VALUE_AWS_BEDROCK = "aws.bedrock";
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/services/bedrock-runtime.js
var textDecoder = new TextDecoder();
var BedrockRuntimeServiceExtension = class {
	requestPreSpanHook(request) {
		switch (request.commandName) {
			case "Converse": return this._requestPreSpanHookConverse(request, false);
			case "ConverseStream": return this._requestPreSpanHookConverse(request, true);
			case "InvokeModel": return this._requestPreSpanHookInvokeModel(request, false);
			case "InvokeModelWithResponseStream": return this._requestPreSpanHookInvokeModel(request, true);
		}
		return {};
	}
	responseHook(response, span) {
		const commandName = response.request.commandName;
		if (!span.isRecording()) {
			if (commandName === "ConverseStream" || commandName === "InvokeModelWithResponseStream") span.end();
			return;
		}
		switch (commandName) {
			case "Converse": return this._responseHookConverse(response, span);
			case "ConverseStream": return this._responseHookConverseStream(response, span);
			case "InvokeModel": return this._responseHookInvokeModel(response, span);
			case "InvokeModelWithResponseStream": return this._responseHookInvokeModelWithResponseStream(response, span);
		}
	}
	_requestPreSpanHookConverse(request, isStream) {
		let spanName = GEN_AI_OPERATION_NAME_VALUE_CHAT;
		const spanAttributes = {
			[fr]: GEN_AI_SYSTEM_VALUE_AWS_BEDROCK,
			[ur]: GEN_AI_OPERATION_NAME_VALUE_CHAT
		};
		const modelId = request.commandInput.modelId;
		if (modelId) {
			spanAttributes[wr] = modelId;
			if (spanName) spanName += ` ${modelId}`;
		}
		const inferenceConfig = request.commandInput.inferenceConfig;
		if (inferenceConfig) {
			const { maxTokens, temperature, topP, stopSequences } = inferenceConfig;
			if (maxTokens !== void 0) spanAttributes[kr] = maxTokens;
			if (temperature !== void 0) spanAttributes[Or] = temperature;
			if (topP !== void 0) spanAttributes[Ar] = topP;
			if (stopSequences !== void 0) spanAttributes[Nr] = stopSequences;
		}
		return {
			spanName,
			spanOp: oe,
			isStream,
			spanAttributes
		};
	}
	_requestPreSpanHookInvokeModel(request, isStream) {
		let spanName = GEN_AI_OPERATION_NAME_VALUE_GENERATE_CONTENT;
		const spanAttributes = {
			[fr]: GEN_AI_SYSTEM_VALUE_AWS_BEDROCK,
			[ur]: GEN_AI_OPERATION_NAME_VALUE_GENERATE_CONTENT
		};
		const modelId = request.commandInput?.modelId;
		if (modelId) {
			spanAttributes[wr] = modelId;
			spanName += ` ${modelId}`;
		}
		if (request.commandInput?.body) {
			const requestBody = JSON.parse(request.commandInput.body);
			if (modelId.includes("amazon.titan")) {
				if (requestBody.textGenerationConfig?.temperature !== void 0) spanAttributes[Or] = requestBody.textGenerationConfig.temperature;
				if (requestBody.textGenerationConfig?.topP !== void 0) spanAttributes[Ar] = requestBody.textGenerationConfig.topP;
				if (requestBody.textGenerationConfig?.maxTokenCount !== void 0) spanAttributes[kr] = requestBody.textGenerationConfig.maxTokenCount;
				if (requestBody.textGenerationConfig?.stopSequences !== void 0) spanAttributes[Nr] = requestBody.textGenerationConfig.stopSequences;
			} else if (modelId.includes("amazon.nova")) {
				if (requestBody.inferenceConfig?.temperature !== void 0) spanAttributes[Or] = requestBody.inferenceConfig.temperature;
				if (requestBody.inferenceConfig?.top_p !== void 0) spanAttributes[Ar] = requestBody.inferenceConfig.top_p;
				if (requestBody.inferenceConfig?.max_new_tokens !== void 0) spanAttributes[kr] = requestBody.inferenceConfig.max_new_tokens;
				if (requestBody.inferenceConfig?.stopSequences !== void 0) spanAttributes[Nr] = requestBody.inferenceConfig.stopSequences;
			} else if (modelId.includes("anthropic.claude")) {
				if (requestBody.max_tokens !== void 0) spanAttributes[kr] = requestBody.max_tokens;
				if (requestBody.temperature !== void 0) spanAttributes[Or] = requestBody.temperature;
				if (requestBody.top_p !== void 0) spanAttributes[Ar] = requestBody.top_p;
				if (requestBody.stop_sequences !== void 0) spanAttributes[Nr] = requestBody.stop_sequences;
			} else if (modelId.includes("meta.llama")) {
				if (requestBody.max_gen_len !== void 0) spanAttributes[kr] = requestBody.max_gen_len;
				if (requestBody.temperature !== void 0) spanAttributes[Or] = requestBody.temperature;
				if (requestBody.top_p !== void 0) spanAttributes[Ar] = requestBody.top_p;
			} else if (modelId.includes("cohere.command-r")) {
				if (requestBody.max_tokens !== void 0) spanAttributes[kr] = requestBody.max_tokens;
				if (requestBody.temperature !== void 0) spanAttributes[Or] = requestBody.temperature;
				if (requestBody.p !== void 0) spanAttributes[Ar] = requestBody.p;
				if (requestBody.message !== void 0) spanAttributes[is] = Math.ceil(requestBody.message.length / 6);
				if (requestBody.stop_sequences !== void 0) spanAttributes[Nr] = requestBody.stop_sequences;
			} else if (modelId.includes("cohere.command")) {
				if (requestBody.max_tokens !== void 0) spanAttributes[kr] = requestBody.max_tokens;
				if (requestBody.temperature !== void 0) spanAttributes[Or] = requestBody.temperature;
				if (requestBody.p !== void 0) spanAttributes[Ar] = requestBody.p;
				if (requestBody.prompt !== void 0) spanAttributes[is] = Math.ceil(requestBody.prompt.length / 6);
				if (requestBody.stop_sequences !== void 0) spanAttributes[Nr] = requestBody.stop_sequences;
			} else if (modelId.includes("mistral")) {
				if (requestBody.prompt !== void 0) spanAttributes[is] = Math.ceil(requestBody.prompt.length / 6);
				if (requestBody.max_tokens !== void 0) spanAttributes[kr] = requestBody.max_tokens;
				if (requestBody.temperature !== void 0) spanAttributes[Or] = requestBody.temperature;
				if (requestBody.top_p !== void 0) spanAttributes[Ar] = requestBody.top_p;
				if (requestBody.stop !== void 0) spanAttributes[Nr] = requestBody.stop;
			}
		}
		return {
			spanName,
			spanOp: Ae,
			isStream,
			spanAttributes
		};
	}
	_responseHookConverse(response, span) {
		const { stopReason, usage } = response.data;
		setStopReason(span, stopReason);
		setUsage(span, usage);
	}
	_responseHookConverseStream(response, span) {
		response.data.stream = wrapConverseStreamResponse(response.data.stream, span);
	}
	_responseHookInvokeModel(response, span) {
		const currentModelId = response.request.commandInput?.modelId;
		if (response.data?.body) {
			const decodedResponseBody = textDecoder.decode(response.data.body);
			const responseBody = JSON.parse(decodedResponseBody);
			if (currentModelId.includes("amazon.titan")) {
				if (responseBody.inputTextTokenCount !== void 0) span.setAttribute(is, responseBody.inputTextTokenCount);
				if (responseBody.results?.[0]?.tokenCount !== void 0) span.setAttribute(rs, responseBody.results[0].tokenCount);
				if (responseBody.results?.[0]?.completionReason !== void 0) span.setAttribute(Rr, [responseBody.results[0].completionReason]);
			} else if (currentModelId.includes("amazon.nova")) {
				if (responseBody.usage !== void 0) {
					if (responseBody.usage.inputTokens !== void 0) span.setAttribute(is, responseBody.usage.inputTokens);
					if (responseBody.usage.outputTokens !== void 0) span.setAttribute(rs, responseBody.usage.outputTokens);
				}
				if (responseBody.stopReason !== void 0) span.setAttribute(Rr, [responseBody.stopReason]);
			} else if (currentModelId.includes("anthropic.claude")) {
				if (responseBody.usage?.input_tokens !== void 0) span.setAttribute(is, responseBody.usage.input_tokens);
				if (responseBody.usage?.output_tokens !== void 0) span.setAttribute(rs, responseBody.usage.output_tokens);
				if (responseBody.stop_reason !== void 0) span.setAttribute(Rr, [responseBody.stop_reason]);
			} else if (currentModelId.includes("meta.llama")) {
				if (responseBody.prompt_token_count !== void 0) span.setAttribute(is, responseBody.prompt_token_count);
				if (responseBody.generation_token_count !== void 0) span.setAttribute(rs, responseBody.generation_token_count);
				if (responseBody.stop_reason !== void 0) span.setAttribute(Rr, [responseBody.stop_reason]);
			} else if (currentModelId.includes("cohere.command-r")) {
				if (responseBody.text !== void 0) span.setAttribute(rs, Math.ceil(responseBody.text.length / 6));
				if (responseBody.finish_reason !== void 0) span.setAttribute(Rr, [responseBody.finish_reason]);
			} else if (currentModelId.includes("cohere.command")) {
				if (responseBody.generations?.[0]?.text !== void 0) span.setAttribute(rs, Math.ceil(responseBody.generations[0].text.length / 6));
				if (responseBody.generations?.[0]?.finish_reason !== void 0) span.setAttribute(Rr, [responseBody.generations[0].finish_reason]);
			} else if (currentModelId.includes("mistral")) {
				if (responseBody.outputs?.[0]?.text !== void 0) span.setAttribute(rs, Math.ceil(responseBody.outputs[0].text.length / 6));
				if (responseBody.outputs?.[0]?.stop_reason !== void 0) span.setAttribute(Rr, [responseBody.outputs[0].stop_reason]);
			}
		}
	}
	_responseHookInvokeModelWithResponseStream(response, span) {
		const stream = response.data?.body;
		const modelId = response.request.commandInput?.modelId;
		if (!stream || !modelId) return;
		const recordAttributes = resolveStreamRecorder(modelId);
		response.data.body = async function* () {
			try {
				for await (const chunk of stream) {
					if (recordAttributes) {
						const parsedChunk = parseChunk(chunk?.chunk?.bytes);
						if (parsedChunk) recordAttributes(parsedChunk, span);
					}
					yield chunk;
				}
			} finally {
				span.end();
			}
		}();
	}
};
function resolveStreamRecorder(modelId) {
	if (modelId.includes("amazon.titan")) return recordTitanAttributes;
	if (modelId.includes("anthropic.claude")) return recordClaudeAttributes;
	if (modelId.includes("amazon.nova")) return recordNovaAttributes;
	if (modelId.includes("meta.llama")) return recordLlamaAttributes;
	if (modelId.includes("cohere.command-r")) return recordCohereRAttributes;
	if (modelId.includes("cohere.command")) return recordCohereAttributes;
	if (modelId.includes("mistral")) return recordMistralAttributes;
}
async function* wrapConverseStreamResponse(stream, span) {
	try {
		let usage;
		for await (const item of stream) {
			setStopReason(span, item.messageStop?.stopReason);
			usage = item.metadata?.usage;
			yield item;
		}
		setUsage(span, usage);
	} finally {
		span.end();
	}
}
function setStopReason(span, stopReason) {
	if (stopReason !== void 0) span.setAttribute(Rr, [stopReason]);
}
function setUsage(span, usage) {
	if (usage) {
		const { inputTokens, outputTokens } = usage;
		if (inputTokens !== void 0) span.setAttribute(is, inputTokens);
		if (outputTokens !== void 0) span.setAttribute(rs, outputTokens);
	}
}
function parseChunk(bytes) {
	if (!bytes || !(bytes instanceof Uint8Array)) return null;
	try {
		const str = Buffer.from(bytes).toString("utf-8");
		return JSON.parse(str);
	} catch (err) {
		DEBUG_BUILD$1 && debug$2.warn("[instrumentation:aws-sdk] failed to parse streamed bedrock chunk", err);
		return null;
	}
}
function recordNovaAttributes(parsedChunk, span) {
	if (parsedChunk.metadata?.usage !== void 0) {
		if (parsedChunk.metadata?.usage.inputTokens !== void 0) span.setAttribute(is, parsedChunk.metadata.usage.inputTokens);
		if (parsedChunk.metadata?.usage.outputTokens !== void 0) span.setAttribute(rs, parsedChunk.metadata.usage.outputTokens);
	}
	if (parsedChunk.messageStop?.stopReason !== void 0) span.setAttribute(Rr, [parsedChunk.messageStop.stopReason]);
}
function recordClaudeAttributes(parsedChunk, span) {
	if (parsedChunk.message?.usage?.input_tokens !== void 0) span.setAttribute(is, parsedChunk.message.usage.input_tokens);
	if (parsedChunk.message?.usage?.output_tokens !== void 0) span.setAttribute(rs, parsedChunk.message.usage.output_tokens);
	if (parsedChunk.delta?.stop_reason !== void 0) span.setAttribute(Rr, [parsedChunk.delta.stop_reason]);
}
function recordTitanAttributes(parsedChunk, span) {
	if (parsedChunk.inputTextTokenCount !== void 0) span.setAttribute(is, parsedChunk.inputTextTokenCount);
	if (parsedChunk.totalOutputTextTokenCount !== void 0) span.setAttribute(rs, parsedChunk.totalOutputTextTokenCount);
	if (parsedChunk.completionReason !== void 0) span.setAttribute(Rr, [parsedChunk.completionReason]);
}
function recordLlamaAttributes(parsedChunk, span) {
	if (parsedChunk.prompt_token_count !== void 0) span.setAttribute(is, parsedChunk.prompt_token_count);
	if (parsedChunk.generation_token_count !== void 0) span.setAttribute(rs, parsedChunk.generation_token_count);
	if (parsedChunk.stop_reason !== void 0) span.setAttribute(Rr, [parsedChunk.stop_reason]);
}
function recordMistralAttributes(parsedChunk, span) {
	if (parsedChunk.outputs?.[0]?.text !== void 0) span.setAttribute(rs, Math.ceil(parsedChunk.outputs[0].text.length / 6));
	if (parsedChunk.outputs?.[0]?.stop_reason !== void 0) span.setAttribute(Rr, [parsedChunk.outputs[0].stop_reason]);
}
function recordCohereAttributes(parsedChunk, span) {
	if (parsedChunk.generations?.[0]?.text !== void 0) span.setAttribute(rs, Math.ceil(parsedChunk.generations[0].text.length / 6));
	if (parsedChunk.generations?.[0]?.finish_reason !== void 0) span.setAttribute(Rr, [parsedChunk.generations[0].finish_reason]);
}
function recordCohereRAttributes(parsedChunk, span) {
	if (parsedChunk.text !== void 0) span.setAttribute(rs, Math.ceil(parsedChunk.text.length / 6));
	if (parsedChunk.finish_reason !== void 0) span.setAttribute(Rr, [parsedChunk.finish_reason]);
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/services/dynamodb.js
function toArray(values) {
	return Array.isArray(values) ? values : [values];
}
var DynamodbServiceExtension = class {
	requestPreSpanHook(normalizedRequest) {
		const operation = normalizedRequest.commandName;
		const tableName = normalizedRequest.commandInput?.TableName;
		const spanAttributes = {};
		spanAttributes[ga] = DB_SYSTEM_VALUE_DYNAMODB;
		spanAttributes[Ji] = tableName;
		spanAttributes[ea] = operation;
		if (normalizedRequest.commandInput?.TableName) spanAttributes[Qe] = [normalizedRequest.commandInput.TableName];
		else if (normalizedRequest.commandInput?.RequestItems) spanAttributes[Qe] = Object.keys(normalizedRequest.commandInput.RequestItems);
		if (operation === "CreateTable" || operation === "UpdateTable") {
			if (normalizedRequest.commandInput?.ProvisionedThroughput) {
				spanAttributes[We] = normalizedRequest.commandInput.ProvisionedThroughput.ReadCapacityUnits;
				spanAttributes[je] = normalizedRequest.commandInput.ProvisionedThroughput.WriteCapacityUnits;
			}
		}
		if (operation === "GetItem" || operation === "Scan" || operation === "Query") {
			if (normalizedRequest.commandInput?.ConsistentRead) spanAttributes[xe] = normalizedRequest.commandInput.ConsistentRead;
		}
		if (operation === "Query" || operation === "Scan") {
			if (normalizedRequest.commandInput?.ProjectionExpression) spanAttributes[Fe] = normalizedRequest.commandInput.ProjectionExpression;
		}
		if (operation === "CreateTable") {
			if (normalizedRequest.commandInput?.GlobalSecondaryIndexes) spanAttributes[De$1] = toArray(normalizedRequest.commandInput.GlobalSecondaryIndexes).map((x) => JSON.stringify(x));
			if (normalizedRequest.commandInput?.LocalSecondaryIndexes) spanAttributes[Ge] = toArray(normalizedRequest.commandInput.LocalSecondaryIndexes).map((x) => JSON.stringify(x));
		}
		if (operation === "ListTables" || operation === "Query" || operation === "Scan") {
			if (normalizedRequest.commandInput?.Limit) spanAttributes[ze] = normalizedRequest.commandInput.Limit;
		}
		if (operation === "ListTables") {
			if (normalizedRequest.commandInput?.ExclusiveStartTableName) spanAttributes[Pe] = normalizedRequest.commandInput.ExclusiveStartTableName;
		}
		if (operation === "Query") {
			if (normalizedRequest.commandInput?.ScanIndexForward) spanAttributes[Ve] = normalizedRequest.commandInput.ScanIndexForward;
			if (normalizedRequest.commandInput?.IndexName) spanAttributes[Ue] = normalizedRequest.commandInput.IndexName;
			if (normalizedRequest.commandInput?.Select) spanAttributes[Be] = normalizedRequest.commandInput.Select;
		}
		if (operation === "Scan") {
			if (normalizedRequest.commandInput?.Segment) spanAttributes[He] = normalizedRequest.commandInput?.Segment;
			if (normalizedRequest.commandInput?.TotalSegments) spanAttributes[Xe$1] = normalizedRequest.commandInput?.TotalSegments;
			if (normalizedRequest.commandInput?.IndexName) spanAttributes[Ue] = normalizedRequest.commandInput.IndexName;
			if (normalizedRequest.commandInput?.Select) spanAttributes[Be] = normalizedRequest.commandInput.Select;
		}
		if (operation === "UpdateTable") {
			if (normalizedRequest.commandInput?.AttributeDefinitions) spanAttributes[Ae$1] = toArray(normalizedRequest.commandInput.AttributeDefinitions).map((x) => JSON.stringify(x));
			if (normalizedRequest.commandInput?.GlobalSecondaryIndexUpdates) spanAttributes[Le] = toArray(normalizedRequest.commandInput.GlobalSecondaryIndexUpdates).map((x) => JSON.stringify(x));
		}
		return {
			spanAttributes,
			spanOp: "db"
		};
	}
	responseHook(response, span) {
		if (response.data?.ConsumedCapacity) span.setAttribute(Re, toArray(response.data.ConsumedCapacity).map((x) => JSON.stringify(x)));
		if (response.data?.ItemCollectionMetrics) span.setAttribute(Me, toArray(response.data.ItemCollectionMetrics).map((x) => JSON.stringify(x)));
		if (response.data?.TableNames) span.setAttribute(Ke, response.data?.TableNames.length);
		if (response.data?.Count) span.setAttribute(qe, response.data?.Count);
		if (response.data?.ScannedCount) span.setAttribute(Ye, response.data?.ScannedCount);
	}
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/services/kinesis.js
var KinesisServiceExtension = class {
	requestPreSpanHook(request) {
		const streamName = request.commandInput?.StreamName;
		const spanAttributes = {};
		if (streamName) spanAttributes[$e] = streamName;
		return { spanAttributes };
	}
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/services/lambda.js
var INVOKE_COMMAND = "Invoke";
var LambdaServiceExtension = class {
	requestPreSpanHook(request) {
		const functionName = request.commandInput?.FunctionName;
		const spanAttributes = {};
		let spanName;
		if (request.commandName === INVOKE_COMMAND) {
			spanAttributes[Tn] = functionName;
			spanAttributes[wn] = "aws";
			spanName = `${functionName} ${INVOKE_COMMAND}`;
		}
		return {
			spanAttributes,
			spanName
		};
	}
	requestPostSpanHook(request, span) {
		if (request.commandName === INVOKE_COMMAND && request.commandInput) request.commandInput.ClientContext = injectLambdaPropagationContext(request.commandInput.ClientContext, span);
	}
	responseHook(response, span) {
		if (response.request.commandName === INVOKE_COMMAND) {
			span.setAttribute(fn, response.requestId);
			if (response.request.region) span.setAttribute(Sn, response.request.region);
		}
	}
};
function injectLambdaPropagationContext(clientContext, span) {
	try {
		const propagatedContext = getTraceData({ span });
		const parsedClientContext = clientContext ? JSON.parse(Buffer.from(clientContext, "base64").toString("utf8")) : {};
		const updatedClientContext = {
			...parsedClientContext,
			custom: {
				...parsedClientContext.custom,
				...propagatedContext
			}
		};
		const encodedClientContext = Buffer.from(JSON.stringify(updatedClientContext)).toString("base64");
		if (encodedClientContext.length > 3583) {
			DEBUG_BUILD$1 && debug$2.warn("[instrumentation:aws-sdk] cannot set trace propagation on lambda invoke parameters due to ClientContext length limitations.");
			return clientContext;
		}
		return encodedClientContext;
	} catch (e) {
		DEBUG_BUILD$1 && debug$2.log("[instrumentation:aws-sdk] failed to set trace propagation on lambda ClientContext", e);
		return clientContext;
	}
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/services/s3.js
var S3ServiceExtension = class {
	requestPreSpanHook(request) {
		const bucketName = request.commandInput?.Bucket;
		const spanAttributes = {};
		if (bucketName) spanAttributes[bt] = bucketName;
		return { spanAttributes };
	}
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/services/secretsmanager.js
var SecretsManagerServiceExtension = class {
	requestPreSpanHook(request) {
		const secretId = request.commandInput?.SecretId;
		const spanAttributes = {};
		if (typeof secretId === "string" && secretId.startsWith("arn:aws:secretsmanager:")) spanAttributes[yt] = secretId;
		return { spanAttributes };
	}
	responseHook(response, span) {
		const secretArn = response.data?.ARN;
		if (secretArn) span.setAttribute(yt, secretArn);
	}
};
var SENTRY_TRACE_HEADER$1 = "sentry-trace";
var BAGGAGE_HEADER = "baggage";
var PROPAGATION_FIELDS = [SENTRY_TRACE_HEADER$1, BAGGAGE_HEADER];
function injectPropagationContext(attributesMap, traceData) {
	const attributes = attributesMap ?? {};
	const headerKeys = Object.keys(traceData);
	if (Object.keys(attributes).length + headerKeys.length <= 10) for (const key of headerKeys) {
		const value = traceData[key];
		if (value) attributes[key] = {
			DataType: "String",
			StringValue: value
		};
	}
	else DEBUG_BUILD$1 && debug$2.warn("[instrumentation:aws-sdk] cannot set trace propagation on SQS/SNS message due to maximum amount of MessageAttributes");
	return attributes;
}
function extractPropagationHeaders(message) {
	const carrier = message.MessageAttributes ?? {};
	const sentryTrace = carrier[SENTRY_TRACE_HEADER$1]?.StringValue ?? carrier[SENTRY_TRACE_HEADER$1]?.Value;
	if (!sentryTrace) return;
	return {
		sentryTrace,
		baggage: carrier[BAGGAGE_HEADER]?.StringValue ?? carrier[BAGGAGE_HEADER]?.Value
	};
}
function addPropagationFieldsToAttributeNames(messageAttributeNames = []) {
	return uniq([...messageAttributeNames, ...PROPAGATION_FIELDS]);
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/services/sns.js
var UNKNOWN_DESTINATION = "unknown";
var SEND_OPERATION = "send";
function buildSpanName$1(operation, destination, isStreamed) {
	if (!destination) return operation;
	return isStreamed ? `${operation} ${destination}` : `${destination} ${operation}`;
}
var SnsServiceExtension = class {
	requestPreSpanHook(request) {
		let spanName = `SNS ${request.commandName}`;
		let spanOp;
		const spanAttributes = {
			[Yl]: "aws.sns",
			[dd]: "client"
		};
		if (request.commandName === "Publish") {
			spanOp = be;
			spanAttributes[dd] = "producer";
			spanAttributes[ATTR_MESSAGING_DESTINATION_KIND] = MESSAGING_DESTINATION_KIND_VALUE_TOPIC;
			const { TopicArn, TargetArn, PhoneNumber } = request.commandInput;
			const destinationName = extractDestinationName(TopicArn, TargetArn, PhoneNumber);
			spanAttributes[Nl] = destinationName;
			spanAttributes[Al] = TopicArn || TargetArn || PhoneNumber || UNKNOWN_DESTINATION;
			spanAttributes[Wl] = SEND_OPERATION;
			const client = getClient();
			const isStreamed = !!client && hasSpanStreamingEnabled(client);
			const named = PhoneNumber ? "phone_number" : destinationName;
			spanName = buildSpanName$1(SEND_OPERATION, named === UNKNOWN_DESTINATION || isStreamed && !PhoneNumber && named.includes("/") ? void 0 : named, isStreamed);
		}
		const topicArn = request.commandInput?.TopicArn;
		if (topicArn) spanAttributes[ht] = topicArn;
		return {
			spanAttributes,
			spanName,
			spanOp
		};
	}
	requestPostSpanHook(request, span) {
		if (request.commandName === "Publish") {
			const origMessageAttributes = request.commandInput.MessageAttributes ?? {};
			request.commandInput.MessageAttributes = injectPropagationContext(origMessageAttributes, getTraceData({ span }));
		}
	}
	responseHook(response, span) {
		const topicArn = response.data?.TopicArn;
		if (topicArn) span.setAttribute(ht, topicArn);
	}
};
function extractDestinationName(topicArn, targetArn, phoneNumber) {
	if (topicArn || targetArn) {
		const arn = topicArn ?? targetArn;
		try {
			return arn.substring(arn.lastIndexOf(":") + 1);
		} catch {
			return arn;
		}
	} else if (phoneNumber) return phoneNumber;
	else return UNKNOWN_DESTINATION;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/services/sqs.js
var SqsServiceExtension = class {
	requestPreSpanHook(request) {
		const queueUrl = extractQueueUrl(request.commandInput);
		const queueName = extractQueueNameFromUrl(queueUrl);
		let operation;
		let spanOp;
		const spanAttributes = {
			[Yl]: "aws_sqs",
			[Al]: queueName,
			[Ju]: queueUrl,
			[dd]: "client"
		};
		switch (request.commandName) {
			case "ReceiveMessage":
				operation = "receive";
				spanOp = de;
				spanAttributes[dd] = "consumer";
				request.commandInput.MessageAttributeNames = addPropagationFieldsToAttributeNames(request.commandInput.MessageAttributeNames);
				break;
			case "SendMessage":
			case "SendMessageBatch":
				operation = "send";
				spanOp = be;
				spanAttributes[dd] = "producer";
		}
		if (operation) spanAttributes[Wl] = operation;
		const client = getClient();
		const isStreamed = !!client && hasSpanStreamingEnabled(client);
		return {
			spanAttributes,
			spanName: buildSpanName(operation, queueName, isStreamed),
			spanOp
		};
	}
	requestPostSpanHook(request, span) {
		switch (request.commandName) {
			case "SendMessage":
				{
					const origMessageAttributes = request.commandInput.MessageAttributes ?? {};
					request.commandInput.MessageAttributes = injectPropagationContext(origMessageAttributes, getTraceData({ span }));
				}
				break;
			case "SendMessageBatch": {
				const entries = request.commandInput?.Entries;
				if (Array.isArray(entries)) {
					const traceData = getTraceData({ span });
					entries.forEach((messageParams) => {
						messageParams.MessageAttributes = injectPropagationContext(messageParams.MessageAttributes ?? {}, traceData);
					});
				}
			}
		}
	}
	responseHook(response, span) {
		switch (response.request.commandName) {
			case "SendMessage":
				span.setAttribute(Ml, response?.data?.MessageId);
				break;
			case "SendMessageBatch": break;
			case "ReceiveMessage": {
				const messages = response?.data?.Messages || [];
				span.setAttribute(Il, messages.length);
				for (const message of messages) linkReceivedMessageToProducer(span, message);
				break;
			}
		}
	}
};
function linkReceivedMessageToProducer(span, message) {
	const headers = extractPropagationHeaders(message);
	if (!headers) return;
	const { parentSpanId, traceId, sampled } = propagationContextFromHeaders(headers.sentryTrace, headers.baggage);
	if (traceId && parentSpanId) span.addLink({
		context: {
			traceId,
			spanId: parentSpanId,
			traceFlags: sampled ? 1 : 0
		},
		attributes: { [Ml]: message.MessageId }
	});
}
function buildSpanName(operation, queueName, isStreamed) {
	if (!operation) return;
	if (!queueName) return operation;
	return isStreamed ? `${operation} ${queueName}` : `${queueName} ${operation}`;
}
function extractQueueUrl(commandInput) {
	return commandInput?.QueueUrl;
}
function extractQueueNameFromUrl(queueUrl) {
	if (!queueUrl) return void 0;
	const segments = queueUrl.split("/");
	if (segments.length === 0) return void 0;
	return segments[segments.length - 1] || void 0;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/services/stepfunctions.js
var StepFunctionsServiceExtension = class {
	requestPreSpanHook(request) {
		const stateMachineArn = request.commandInput?.stateMachineArn;
		const activityArn = request.commandInput?.activityArn;
		const spanAttributes = {};
		if (stateMachineArn) spanAttributes[_t] = stateMachineArn;
		if (activityArn) spanAttributes[ft] = activityArn;
		return { spanAttributes };
	}
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/services/ServicesExtensions.js
var ServicesExtensions = class {
	constructor() {
		this._services = /* @__PURE__ */ new Map([
			["SecretsManager", new SecretsManagerServiceExtension()],
			["SFN", new StepFunctionsServiceExtension()],
			["SQS", new SqsServiceExtension()],
			["SNS", new SnsServiceExtension()],
			["DynamoDB", new DynamodbServiceExtension()],
			["Lambda", new LambdaServiceExtension()],
			["S3", new S3ServiceExtension()],
			["Kinesis", new KinesisServiceExtension()],
			["BedrockRuntime", new BedrockRuntimeServiceExtension()]
		]);
	}
	requestPreSpanHook(request) {
		const serviceExtension = this._services.get(request.serviceName);
		if (!serviceExtension) return {};
		return serviceExtension.requestPreSpanHook(request);
	}
	requestPostSpanHook(request, span) {
		this._services.get(request.serviceName)?.requestPostSpanHook?.(request, span);
	}
	responseHook(response, span) {
		this._services.get(response.request.serviceName)?.responseHook?.(response, span);
	}
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/utils.js
function removeSuffixFromStringIfExists(str, suffixToRemove) {
	const suffixLength = suffixToRemove.length;
	return str?.slice(-suffixLength) === suffixToRemove ? str.slice(0, -suffixLength) : str;
}
function normalizeV3Request(serviceName, commandNameWithSuffix, commandInput, region) {
	return {
		serviceName: serviceName?.replace(/\s+/g, ""),
		commandName: removeSuffixFromStringIfExists(commandNameWithSuffix, "Command"),
		commandInput,
		region
	};
}
function extractAttributesFromNormalizedRequest(normalizedRequest) {
	return {
		[kc]: "aws-api",
		[fc]: normalizedRequest.commandName,
		[vc]: normalizedRequest.serviceName,
		[Ni]: normalizedRequest.region
	};
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/aws-sdk/index.js
var INTEGRATION_NAME$30 = "Aws";
function setMetadataAttributes(span, metadata) {
	if (!metadata) return;
	if (metadata.requestId) span.setAttribute(mt, metadata.requestId);
	if (metadata.httpStatusCode) span.setAttribute(oo, metadata.httpStatusCode);
	if (metadata.extendedRequestId) span.setAttribute(dt, metadata.extendedRequestId);
}
var _awsIntegration = () => {
	const servicesExtensions = new ServicesExtensions();
	return {
		name: INTEGRATION_NAME$30,
		setup(client) {
			invokeOrchestrionInstrumentation(client, awsSdkModuleNames, instrumentAwsSdk, [servicesExtensions]);
		}
	};
};
function instrumentAwsSdk(servicesExtensions) {
	const getSpan = (data) => safeChannelCallback(() => {
		const command = data.arguments[0];
		const commandName = command?.constructor?.name;
		if (!command || !commandName) return;
		const clientConfig = data.self?.config;
		const serviceName = clientConfig?.serviceId ?? removeSuffixFromStringIfExists(data.self?.constructor?.name || "AWS", "Client");
		if (!command.input) command.input = {};
		const normalizedRequest = normalizeV3Request(serviceName, commandName, command.input, void 0);
		const requestMetadata = servicesExtensions.requestPreSpanHook(normalizedRequest);
		const span = startInactiveSpan({
			name: requestMetadata.spanName ?? `${normalizedRequest.serviceName}.${normalizedRequest.commandName}`,
			op: requestMetadata.spanOp || "rpc",
			attributes: {
				[dd]: "client",
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: AWS_SDK_ORIGIN,
				...extractAttributesFromNormalizedRequest(normalizedRequest),
				...requestMetadata.spanAttributes
			}
		});
		data._sentryNormalizedRequest = normalizedRequest;
		data._sentryRequestMetadata = requestMetadata;
		let regionResult;
		try {
			regionResult = clientConfig?.region?.();
		} catch {}
		const regionHolder = {
			settled: false,
			promise: Promise.resolve(regionResult).then((region) => {
				if (region) {
					normalizedRequest.region = region;
					span.setAttribute(Ni, region);
				}
			}).catch(() => {}).finally(() => {
				regionHolder.settled = true;
			})
		};
		data._sentryRegion = regionHolder;
		safeChannelCallback(() => servicesExtensions.requestPostSpanHook(normalizedRequest, span));
		return span;
	});
	const opts = { deferSpanEnd({ span, data, end }) {
		const normalizedRequest = data._sentryNormalizedRequest;
		const requestMetadata = data._sentryRequestMetadata;
		if (!normalizedRequest) return false;
		const failed = "error" in data;
		safeChannelCallback(() => {
			if (failed) {
				const err = data.error;
				const errMetadata = err?.$metadata;
				setMetadataAttributes(span, {
					requestId: err?.RequestId ?? errMetadata?.requestId,
					httpStatusCode: errMetadata?.httpStatusCode,
					extendedRequestId: err?.extendedRequestId ?? errMetadata?.extendedRequestId
				});
				return;
			}
			const output = data.result;
			setMetadataAttributes(span, output?.$metadata);
			const normalizedResponse = {
				data: output,
				request: normalizedRequest,
				requestId: output?.$metadata?.requestId
			};
			servicesExtensions.responseHook(normalizedResponse, span);
		});
		if (requestMetadata?.isStream && !failed) return true;
		const region = data._sentryRegion;
		if (region && !region.settled) {
			region.promise.then(() => end());
			return true;
		}
		return false;
	} };
	const awsSendChannels = [
		CHANNELS.AWS_SMITHY_CORE_SEND,
		CHANNELS.AWS_SMITHY_CLIENT_SEND,
		CHANNELS.AWS_SDK_SMITHY_CLIENT_SEND
	];
	for (const channelName of awsSendChannels) bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(channelName), getSpan, opts);
}
var awsIntegration = defineIntegration(_awsIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/generic-pool.js
var INTEGRATION_NAME$29 = "GenericPool";
var _genericPoolIntegration = () => {
	return {
		name: INTEGRATION_NAME$29,
		setup(client) {
			invokeOrchestrionInstrumentation(client, genericPoolModuleNames, instrumentGenericPool, []);
		}
	};
};
var genericPoolIntegration = defineIntegration(_genericPoolIntegration);
function instrumentGenericPool() {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(CHANNELS.GENERIC_POOL_ACQUIRE), () => startInactiveSpan({
		name: "generic-pool.acquire",
		attributes: {
			[Ed]: "db",
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.db.generic_pool"
		}
	}));
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/google-genai.js
var INTEGRATION_NAME$28 = "Google_GenAI";
var ORIGIN$16 = "auto.ai.google_genai";
var INSTRUMENTED_CHANNELS$1 = [
	{
		channel: CHANNELS.GOOGLE_GENAI_GENERATE_CONTENT,
		operation: "generate_content"
	},
	{
		channel: CHANNELS.GOOGLE_GENAI_EMBED_CONTENT,
		operation: "embeddings"
	},
	{
		channel: CHANNELS.GOOGLE_GENAI_CHAT,
		operation: "chat"
	}
];
var _googleGenAIIntegration = (options = {}) => {
	return {
		name: INTEGRATION_NAME$28,
		setup(client) {
			invokeOrchestrionInstrumentation(client, googleGenAiModuleNames, instrumentGoogleGenai, [options]);
		}
	};
};
function instrumentGoogleGenai(options) {
	for (const { channel, operation } of INSTRUMENTED_CHANNELS$1) bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(channel), (data) => createGenAiSpan$1(data, operation, options), {
		beforeSpanEnd: (span, data) => {
			if (operation !== "embeddings") addResponseAttributes(span, data.result, resolveAIRecordingOptions(options).recordOutputs);
		},
		deferSpanEnd: ({ span, data }) => wrapStreamResult$1(span, data, options)
	});
}
function createGenAiSpan$1(data, operation, options) {
	if (_INTERNAL_shouldSkipAiProviderWrapping(INTEGRATION_NAME$28)) return;
	if (operation !== "chat") {
		const activeSpan = getActiveSpan$1();
		if (activeSpan) {
			const { attributes: { [Ed]: op, [Id]: origin } } = spanToJSON(activeSpan);
			if (origin === ORIGIN$16 && op === "gen_ai.chat") return;
		}
	}
	const params = resolveChatParams(operation, (data.arguments ?? [])[0], data.self);
	const { recordInputs } = resolveAIRecordingOptions(options);
	const attributes = extractRequestAttributes(operation, params, data.self);
	const model = attributes["gen_ai.request.model"] || "unknown";
	attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN] = ORIGIN$16;
	const client = getClient();
	const span = startInactiveSpan({
		name: model !== "unknown" || !(client && hasSpanStreamingEnabled(client)) ? `${operation} ${model}` : operation,
		op: getGenAiSpanOp(operation),
		attributes
	});
	if (recordInputs && params) addPrivateRequestAttributes(span, params, operation);
	return span;
}
function isAsyncIterable$1(value) {
	return !!value && typeof value[Symbol.asyncIterator] === "function";
}
function wrapStreamResult$1(span, data, options) {
	const result = data.result;
	if (!isAsyncIterable$1(result)) return false;
	const { recordOutputs } = resolveAIRecordingOptions(options);
	const iterate = result[Symbol.asyncIterator].bind(result);
	const instrumented = instrumentStream({ [Symbol.asyncIterator]: iterate }, span, recordOutputs ?? false);
	result[Symbol.asyncIterator] = () => instrumented;
	return true;
}
var googleGenAIIntegration = defineIntegration(_googleGenAIIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/graphql/constants.js
var ORIGIN$15 = "auto.graphql.diagnostic_channel";
var SPAN_NAME_PARSE = "graphql.parse";
var SPAN_NAME_VALIDATE = "graphql.validate";
var SPAN_NAME_EXECUTE = "graphql.execute";
var SPAN_NAME_SUBSCRIBE = "graphql.subscribe";
var SPAN_NAME_RESOLVE = "graphql.resolve";
var GRAPHQL_PROCESSING_TYPE = "graphql.processing.type";
var PROCESSING_TYPE_PARSE = "parse";
var PROCESSING_TYPE_VALIDATE = "validate";
var PROCESSING_TYPE_EXECUTE = "execute";
var PROCESSING_TYPE_RESOLVE = "resolve";
var GRAPHQL_FIELD_NAME = "graphql.field.name";
var GRAPHQL_FIELD_PATH = "graphql.field.path";
var GRAPHQL_FIELD_TYPE = "graphql.field.type";
var GRAPHQL_PARENT_NAME = "graphql.parent.name";
var GRAPHQL_DATA_SYMBOL = /* @__PURE__ */ Symbol.for("opentelemetry.graphql_data");
var GRAPHQL_PATCHED_SYMBOL = /* @__PURE__ */ Symbol.for("opentelemetry.patched");
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/graphql/utils.js
var ORIGINAL_DESCRIPTION_ATTRIBUTE = "original-description";
var REDACTED_LITERAL_KINDS = /* @__PURE__ */ new Set([
	"Int",
	"Float",
	"String",
	"BlockString"
]);
function renameRootSpanWithOperation(span, operationType, operationName) {
	const rootSpan = getRootSpan(span);
	if (rootSpan === span) return;
	const rootSpanJson = spanToJSON(rootSpan);
	const newOperation = operationName ? `${operationType} ${operationName}` : operationType;
	const existingOperations = rootSpanJson.attributes[sd];
	let operations;
	if (Array.isArray(existingOperations)) operations = [...existingOperations, newOperation];
	else if (typeof existingOperations === "string") operations = [existingOperations, newOperation];
	else operations = newOperation;
	rootSpan.setAttribute(sd, operations);
	const client = getClient();
	if (client && hasSpanStreamingEnabled(client)) return;
	const originalDescription = rootSpanJson.attributes[ORIGINAL_DESCRIPTION_ATTRIBUTE] ?? rootSpanJson.name;
	if (!rootSpanJson.attributes[ORIGINAL_DESCRIPTION_ATTRIBUTE]) rootSpan.setAttribute(ORIGINAL_DESCRIPTION_ATTRIBUTE, originalDescription);
	const source = rootSpanJson.attributes[jd];
	rootSpan.updateName(`${originalDescription} (${getGraphqlOperationNamesFromAttribute(operations)})`);
	rootSpan.setAttribute(jd, source);
}
function getGraphqlOperationNamesFromAttribute(attr) {
	if (Array.isArray(attr)) {
		const sorted = attr.slice().sort();
		if (sorted.length <= 5) return sorted.join(", ");
		return `${sorted.slice(0, 5).join(", ")}, +${sorted.length - 5}`;
	}
	return attr;
}
function getOperationSpanName(operationType, operationName, fallbackName) {
	if (operationType && operationName) return `${operationType} ${operationName}`;
	if (operationType) return operationType;
	return fallbackName;
}
function hasResultErrors(result) {
	if (isObjectLike(result) && "errors" in result) {
		const errors = result.errors;
		return Array.isArray(errors) && errors.length > 0;
	}
	return false;
}
function redactGraphqlDocument(document) {
	const loc = document?.loc;
	const body = loc?.source?.body;
	if (typeof body !== "string" || !loc?.startToken) return;
	try {
		const ranges = [];
		for (let token = loc.startToken; token; token = token.next) if (REDACTED_LITERAL_KINDS.has(token.kind)) ranges.push({
			start: token.start,
			end: token.end,
			kind: token.kind
		});
		let out = body;
		for (let i = ranges.length - 1; i >= 0; i--) {
			const { start, end, kind } = ranges[i];
			const replacement = kind === "String" || kind === "BlockString" ? "\"*\"" : "*";
			out = out.slice(0, start) + replacement + out.slice(end);
		}
		return out;
	} catch {
		return;
	}
}
function collectGraphqlDocument(document) {
	if (getClient()?.getDataCollectionOptions().graphQL.document !== true) return;
	return redactGraphqlDocument(document);
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/graphql/graphql-dc-subscriber.js
var GRAPHQL_DC_CHANNEL_PARSE = "graphql:parse";
var GRAPHQL_DC_CHANNEL_VALIDATE = "graphql:validate";
var GRAPHQL_DC_CHANNEL_EXECUTE = "graphql:execute";
var GRAPHQL_DC_CHANNEL_SUBSCRIBE = "graphql:subscribe";
var GRAPHQL_DC_CHANNEL_RESOLVE = "graphql:resolve";
function subscribeGraphqlDiagnosticChannels(tracingChannel, options = {}) {
	const ignoreResolveSpans = options.ignoreResolveSpans !== false;
	const ignoreTrivialResolveSpans = options.ignoreTrivialResolveSpans !== false;
	const useOperationNameForRootSpan = options.useOperationNameForRootSpan !== false;
	setupParseChannel(tracingChannel);
	setupValidateChannel(tracingChannel);
	setupOperationChannel(tracingChannel, GRAPHQL_DC_CHANNEL_EXECUTE, SPAN_NAME_EXECUTE, useOperationNameForRootSpan);
	setupOperationChannel(tracingChannel, GRAPHQL_DC_CHANNEL_SUBSCRIBE, SPAN_NAME_SUBSCRIBE, useOperationNameForRootSpan);
	if (!ignoreResolveSpans) setupResolveChannel(tracingChannel, ignoreTrivialResolveSpans);
}
function setupParseChannel(tracingChannel) {
	bindTracingChannelToSpan(tracingChannel(GRAPHQL_DC_CHANNEL_PARSE), () => {
		const client = getClient();
		return startInactiveSpan({
			name: client && hasSpanStreamingEnabled(client) ? `GraphQL ${PROCESSING_TYPE_PARSE}` : SPAN_NAME_PARSE,
			attributes: {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$15,
				[SEMANTIC_ATTRIBUTE_SENTRY_OP]: rE,
				[GRAPHQL_PROCESSING_TYPE]: PROCESSING_TYPE_PARSE
			}
		});
	});
}
function setupValidateChannel(tracingChannel) {
	bindTracingChannelToSpan(tracingChannel(GRAPHQL_DC_CHANNEL_VALIDATE), (data) => {
		const client = getClient();
		return startInactiveSpan({
			name: client && hasSpanStreamingEnabled(client) ? `GraphQL ${PROCESSING_TYPE_VALIDATE}` : SPAN_NAME_VALIDATE,
			attributes: {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$15,
				[SEMANTIC_ATTRIBUTE_SENTRY_OP]: rE,
				[GRAPHQL_PROCESSING_TYPE]: PROCESSING_TYPE_VALIDATE,
				[cs]: collectGraphqlDocument(data.document)
			}
		});
	}, { beforeSpanEnd: (span, data) => {
		if (Array.isArray(data.result) && data.result.length > 0) span.setStatus({
			code: 2,
			message: "invalid_argument"
		});
	} });
}
function setupOperationChannel(tracingChannel, channelName, fallbackName, useOperationNameForRootSpan) {
	bindTracingChannelToSpan(tracingChannel(channelName), (data) => {
		const client = getClient();
		const streamedName = `GraphQL ${data.operationType || "execute"}`;
		const span = startInactiveSpan({
			name: client && hasSpanStreamingEnabled(client) ? streamedName : getOperationSpanName(data.operationType, data.operationName, fallbackName),
			attributes: {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$15,
				[SEMANTIC_ATTRIBUTE_SENTRY_OP]: rE,
				[GRAPHQL_PROCESSING_TYPE]: PROCESSING_TYPE_EXECUTE,
				[us]: data.operationType,
				[ds]: data.operationName || void 0,
				[cs]: collectGraphqlDocument(data.document)
			}
		});
		if (useOperationNameForRootSpan && data.operationType) renameRootSpanWithOperation(span, data.operationType, data.operationName);
		return span;
	}, { beforeSpanEnd: (span, data) => {
		if (hasResultErrors(data.result)) span.setStatus({
			code: 2,
			message: "internal_error"
		});
	} });
}
function setupResolveChannel(tracingChannel, ignoreTrivialResolveSpans) {
	bindTracingChannelToSpan(tracingChannel(GRAPHQL_DC_CHANNEL_RESOLVE), (data) => {
		if (ignoreTrivialResolveSpans && data.isDefaultResolver) return;
		const client = getClient();
		return startInactiveSpan({
			name: client && hasSpanStreamingEnabled(client) ? `GraphQL ${PROCESSING_TYPE_RESOLVE}` : `${SPAN_NAME_RESOLVE} ${data.fieldPath}`,
			attributes: {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$15,
				[SEMANTIC_ATTRIBUTE_SENTRY_OP]: rE,
				[GRAPHQL_PROCESSING_TYPE]: PROCESSING_TYPE_RESOLVE,
				[GRAPHQL_FIELD_NAME]: data.fieldName,
				[GRAPHQL_FIELD_PATH]: data.fieldPath,
				[GRAPHQL_FIELD_TYPE]: data.fieldType,
				[GRAPHQL_PARENT_NAME]: data.parentType
			}
		});
	});
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/graphql/resolvers.js
function isPromise(value) {
	return typeof value?.then === "function";
}
function wrapFields(type, getConfig) {
	if (!type || type[GRAPHQL_PATCHED_SYMBOL]) return;
	type[GRAPHQL_PATCHED_SYMBOL] = true;
	const fields = type.getFields();
	Object.keys(fields).forEach((key) => {
		const field = fields[key];
		if (!field) return;
		if (field.resolve) field.resolve = wrapFieldResolver(getConfig, field.resolve);
		if (field.type) for (const unwrappedType of unwrapType(field.type)) wrapFields(unwrappedType, getConfig);
	});
}
function wrapFieldResolver(getConfig, fieldResolver, isDefaultResolver = false) {
	if (typeof fieldResolver !== "function" || fieldResolver[GRAPHQL_PATCHED_SYMBOL]) return fieldResolver;
	function wrappedFieldResolver(source, args, rawContextValue, info) {
		if (!fieldResolver) return;
		const contextValue = rawContextValue ?? {};
		if (getConfig().ignoreTrivialResolveSpans && isDefaultResolver && (isObjectLike(source) || typeof source === "function")) {
			if (typeof source[info.fieldName] !== "function") return fieldResolver.call(this, source, args, contextValue, info);
		}
		if (!contextValue[GRAPHQL_DATA_SYMBOL]) return fieldResolver.call(this, source, args, contextValue, info);
		const { field, spanAdded } = createFieldIfNotExists(contextValue, info, pathToArray(info.path));
		const span = field.span;
		return withActiveSpan$1(span, () => {
			try {
				const res = fieldResolver.call(this, source, args, contextValue, info);
				if (isPromise(res)) return res.then((r) => {
					endResolveSpan(span, spanAdded);
					return r;
				}, (err) => {
					endResolveSpan(span, spanAdded, err);
					throw err;
				});
				endResolveSpan(span, spanAdded);
				return res;
			} catch (err) {
				endResolveSpan(span, spanAdded, err);
				throw err;
			}
		});
	}
	wrappedFieldResolver[GRAPHQL_PATCHED_SYMBOL] = true;
	return wrappedFieldResolver;
}
function endResolveSpan(span, shouldEndSpan, error) {
	if (!shouldEndSpan) return;
	if (error) span.setStatus({
		code: 2,
		message: error.message
	});
	span.end();
}
function createFieldIfNotExists(contextValue, info, path) {
	const existing = getField(contextValue, path);
	if (existing) return {
		field: existing,
		spanAdded: false
	};
	const field = { span: createResolverSpan(info, path, getParentFieldSpan(contextValue, path)) };
	addField(contextValue, path, field);
	return {
		field,
		spanAdded: true
	};
}
function createResolverSpan(info, path, parentSpan) {
	const attributes = {
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$15,
		[SEMANTIC_ATTRIBUTE_SENTRY_OP]: rE,
		[GRAPHQL_PROCESSING_TYPE]: PROCESSING_TYPE_RESOLVE,
		[GRAPHQL_FIELD_NAME]: info.fieldName,
		[GRAPHQL_FIELD_PATH]: path.join("."),
		[GRAPHQL_FIELD_TYPE]: info.returnType.toString(),
		[GRAPHQL_PARENT_NAME]: info.parentType.name
	};
	const client = getClient();
	return startInactiveSpan({
		name: client && hasSpanStreamingEnabled(client) ? `GraphQL ${PROCESSING_TYPE_RESOLVE}` : `${SPAN_NAME_RESOLVE} ${path.join(".")}`,
		attributes,
		parentSpan
	});
}
function addField(contextValue, path, field) {
	const data = contextValue[GRAPHQL_DATA_SYMBOL];
	if (data) data.fields[path.join(".")] = field;
}
function getField(contextValue, path) {
	return contextValue[GRAPHQL_DATA_SYMBOL]?.fields[path.join(".")];
}
function getParentFieldSpan(contextValue, path) {
	for (let i = path.length - 1; i > 0; i--) {
		const field = getField(contextValue, path.slice(0, i));
		if (field) return field.span;
	}
	return contextValue[GRAPHQL_DATA_SYMBOL]?.span;
}
function pathToArray(path) {
	const flattened = [];
	let curr = path;
	while (curr) {
		flattened.push(String(curr.key));
		curr = curr.prev;
	}
	return flattened.reverse();
}
function unwrapType(type) {
	if ("ofType" in type && type.ofType) return unwrapType(type.ofType);
	if (isGraphQLUnionType(type)) return type.getTypes();
	if (isGraphQLObjectType(type)) return [type];
	return [];
}
function isGraphQLUnionType(type) {
	return "getTypes" in type && typeof type.getTypes === "function";
}
function isGraphQLObjectType(type) {
	return "getFields" in type && typeof type.getFields === "function";
}
function getOperation(document, operationName) {
	const definitions = document?.definitions;
	if (!definitions || !Array.isArray(definitions)) return;
	const isOperation = (def) => !!def?.operation && [
		"query",
		"mutation",
		"subscription"
	].indexOf(def.operation) !== -1;
	if (operationName) return definitions.filter(isOperation).find((def) => operationName === def?.name?.value);
	return definitions.find(isOperation);
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/graphql/spans.js
var BASE_ATTRIBUTES = {
	[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$15,
	[SEMANTIC_ATTRIBUTE_SENTRY_OP]: rE
};
function startParseSpan() {
	const client = getClient();
	return startInactiveSpan({
		name: client && hasSpanStreamingEnabled(client) ? `GraphQL ${PROCESSING_TYPE_PARSE}` : SPAN_NAME_PARSE,
		attributes: {
			...BASE_ATTRIBUTES,
			[GRAPHQL_PROCESSING_TYPE]: PROCESSING_TYPE_PARSE
		}
	});
}
function startValidateSpan(documentAST) {
	const client = getClient();
	return startInactiveSpan({
		name: client && hasSpanStreamingEnabled(client) ? `GraphQL ${PROCESSING_TYPE_VALIDATE}` : SPAN_NAME_VALIDATE,
		attributes: {
			...BASE_ATTRIBUTES,
			[GRAPHQL_PROCESSING_TYPE]: PROCESSING_TYPE_VALIDATE,
			[cs]: collectGraphqlDocument(documentAST)
		}
	});
}
function finalizeValidateSpan(span, result) {
	if (Array.isArray(result) && result.length > 0) span.setStatus({
		code: 2,
		message: "invalid_argument"
	});
}
function normalizeExecuteArgs(argsArray) {
	if (argsArray.length >= 2) return {
		schema: argsArray[0],
		document: argsArray[1],
		contextValue: argsArray[3] ?? {},
		operationName: argsArray[5],
		fieldResolver: argsArray[6],
		writeBack: (contextValue, fieldResolver) => {
			argsArray[3] = contextValue;
			argsArray[6] = fieldResolver;
		}
	};
	const obj = argsArray[0] ?? {};
	return {
		schema: obj.schema,
		document: obj.document,
		contextValue: obj.contextValue ?? {},
		operationName: obj.operationName,
		fieldResolver: obj.fieldResolver,
		writeBack: (contextValue, fieldResolver) => {
			obj.contextValue = contextValue;
			obj.fieldResolver = fieldResolver;
		}
	};
}
function startExecuteSpan(argsArray, self, config, getConfig) {
	const args = normalizeExecuteArgs(argsArray);
	const { schema, document } = args;
	let { contextValue, fieldResolver } = args;
	const alreadyInstrumented = !!contextValue[GRAPHQL_DATA_SYMBOL];
	if (!config.ignoreResolveSpans && !alreadyInstrumented) {
		const isUsingDefaultResolver = fieldResolver == null;
		const defaultFieldResolver = self?.defaultFieldResolver;
		const fieldResolverForExecute = fieldResolver ?? defaultFieldResolver;
		if (fieldResolverForExecute) fieldResolver = wrapFieldResolver(getConfig, fieldResolverForExecute, isUsingDefaultResolver);
		if (schema) {
			wrapFields(schema.getQueryType(), getConfig);
			wrapFields(schema.getMutationType(), getConfig);
		}
	}
	const operation = getOperation(document, args.operationName);
	const operationType = operation?.operation;
	const operationName = operation?.name?.value ?? args.operationName ?? void 0;
	const client = getClient();
	const streamedName = `GraphQL ${operationType || "execute"}`;
	const span = startInactiveSpan({
		name: client && hasSpanStreamingEnabled(client) ? streamedName : getOperationSpanName(operationType, operationName || void 0, SPAN_NAME_EXECUTE),
		attributes: {
			...BASE_ATTRIBUTES,
			[GRAPHQL_PROCESSING_TYPE]: PROCESSING_TYPE_EXECUTE,
			[us]: operationType,
			[ds]: operationName || void 0,
			[cs]: collectGraphqlDocument(document)
		}
	});
	if (config.useOperationNameForRootSpan && operationType) renameRootSpanWithOperation(span, operationType, operationName || void 0);
	contextValue[GRAPHQL_DATA_SYMBOL] = {
		source: document,
		span,
		fields: {}
	};
	args.writeBack(contextValue, fieldResolver);
	return span;
}
function finalizeExecuteSpan(span, result) {
	if (hasResultErrors(result)) span.setStatus({
		code: 2,
		message: "internal_error"
	});
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/graphql/index.js
var INTEGRATION_NAME$27 = "Graphql";
function getOptionsWithDefaults(options) {
	return {
		ignoreResolveSpans: options.ignoreResolveSpans !== false,
		ignoreTrivialResolveSpans: options.ignoreTrivialResolveSpans !== false,
		useOperationNameForRootSpan: options.useOperationNameForRootSpan !== false
	};
}
var _graphqlIntegration = (options = {}) => {
	const config = getOptionsWithDefaults(options);
	const getConfig = () => config;
	return {
		name: INTEGRATION_NAME$27,
		setup(client) {
			invokeOrchestrionInstrumentation(client, graphqlModuleNames, instrumentGraphql, [config, getConfig]);
		},
		setupOnce() {
			setupNativeGraphQLInstrumentation(options);
		}
	};
};
function instrumentGraphql(config, getConfig) {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(CHANNELS.GRAPHQL_PARSE), () => safeChannelCallback(() => startParseSpan()));
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(CHANNELS.GRAPHQL_VALIDATE), (data) => safeChannelCallback(() => startValidateSpan(data.arguments[1])), { beforeSpanEnd: (span, data) => safeChannelCallback(() => finalizeValidateSpan(span, data.result)) });
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(CHANNELS.GRAPHQL_EXECUTE), (data) => safeChannelCallback(() => startExecuteSpan(data.arguments, data.self, config, getConfig)), { beforeSpanEnd: (span, data) => safeChannelCallback(() => finalizeExecuteSpan(span, data.result)) });
}
function setupNativeGraphQLInstrumentation(options) {
	if (!diagnosticsChannel.tracingChannel) return;
	waitForTracingChannelBinding(() => {
		subscribeGraphqlDiagnosticChannels(diagnosticsChannel.tracingChannel, options);
	});
}
var graphqlIntegration = defineIntegration(_graphqlIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/hapi/index.js
var INTEGRATION_NAME$26 = "Hapi";
var _hapiIntegration = ({ shouldHandleError } = {}) => {
	return {
		name: INTEGRATION_NAME$26,
		setup(client) {
			invokeOrchestrionInstrumentation(client, hapiModuleNames, instrumentHapi, [shouldHandleError], { requiresTracingChannelBinding: false });
		}
	};
};
function instrumentHapi(shouldHandleError) {
	diagnosticsChannel.tracingChannel(CHANNELS.HAPI_ROUTE).subscribe({
		start(rawCtx) {
			const ctx = rawCtx;
			wrapRouteArguments(ctx.arguments, ctx.self?.realm?.plugin);
		},
		end() {},
		asyncStart() {},
		asyncEnd() {},
		error() {}
	});
	diagnosticsChannel.tracingChannel(CHANNELS.HAPI_EXT).subscribe({
		start(rawCtx) {
			const ctx = rawCtx;
			wrapExtArguments(ctx.arguments, ctx.self?.realm?.plugin);
		},
		end() {},
		asyncStart() {},
		asyncEnd() {},
		error() {}
	});
	const attachOnStart = {
		start(rawCtx) {
			const server = rawCtx.self;
			if (server) attachHapiErrorHandler(server, shouldHandleError);
		},
		end() {},
		asyncStart() {},
		asyncEnd() {},
		error() {}
	};
	diagnosticsChannel.tracingChannel(CHANNELS.HAPI_START).subscribe(attachOnStart);
	diagnosticsChannel.tracingChannel(CHANNELS.HAPI_INITIALIZE).subscribe(attachOnStart);
}
var hapiIntegration = defineIntegration(_hapiIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/koa/index.js
var INTEGRATION_NAME$25 = "Koa";
var ORIGIN$14 = "auto.http.koa";
var LAYER_TYPE = {
	ROUTER: "router",
	MIDDLEWARE: "middleware"
};
var kLayerPatched = /* @__PURE__ */ Symbol("sentry.koa.layer-patched");
var _koaIntegration = (options = {}) => {
	const ignoreLayersType = options.ignoreLayersType ?? [];
	return {
		name: INTEGRATION_NAME$25,
		setup(client) {
			invokeOrchestrionInstrumentation(client, koaModuleNames, instrumentKoa, [ignoreLayersType], { requiresTracingChannelBinding: false });
		}
	};
};
function instrumentKoa(ignoreLayersType) {
	diagnosticsChannel.tracingChannel(CHANNELS.KOA_USE).subscribe({
		start(rawCtx) {
			handleUse(rawCtx, ignoreLayersType);
		},
		end() {},
		asyncStart() {},
		asyncEnd() {},
		error() {}
	});
	diagnosticsChannel.tracingChannel(CHANNELS.KOA_CALLBACK).subscribe({
		start() {},
		end(rawCtx) {
			const app = rawCtx.self;
			if (app) attachKoaErrorHandler(app);
		},
		asyncStart() {},
		asyncEnd() {},
		error() {}
	});
}
function handleUse(ctx, ignoreLayersType) {
	const middleware = ctx.arguments[0];
	if (typeof middleware === "function") ctx.arguments[0] = patchUse(middleware, ignoreLayersType);
}
function patchUse(middleware, ignoreLayersType) {
	return middleware.router ? patchRouterDispatch(middleware, ignoreLayersType) : patchLayer(middleware, false, ignoreLayersType);
}
function patchRouterDispatch(dispatchLayer, ignoreLayersType) {
	const routesStack = dispatchLayer.router?.stack ?? [];
	for (const pathLayer of routesStack) {
		const path = pathLayer.path;
		const pathStack = pathLayer.stack;
		pathStack.forEach((routedMiddleware, j) => {
			pathStack[j] = patchLayer(routedMiddleware, true, ignoreLayersType, path);
		});
	}
	return dispatchLayer;
}
function patchLayer(middlewareLayer, isRouter, ignoreLayersType, layerPath) {
	const layerType = isRouter ? LAYER_TYPE.ROUTER : LAYER_TYPE.MIDDLEWARE;
	if (middlewareLayer[kLayerPatched] === true || ignoreLayersType.includes(layerType)) return middlewareLayer;
	if (middlewareLayer.constructor.name === "GeneratorFunction" || middlewareLayer.constructor.name === "AsyncGeneratorFunction") return middlewareLayer;
	middlewareLayer[kLayerPatched] = true;
	return (context, next) => {
		if (!getActiveSpan$1()) return middlewareLayer(context, next);
		const metadata = getMiddlewareMetadata(context, middlewareLayer, isRouter, layerPath);
		if (context._matchedRoute) setHttpServerSpanRouteAttribute(context._matchedRoute.toString());
		const koaName = metadata.attributes[Oo];
		const staticName = typeof koaName === "string" ? koaName || "< unknown >" : metadata.name;
		const client = getClient();
		const name = layerType === LAYER_TYPE.ROUTER && !!client && hasSpanStreamingEnabled(client) ? metadata.attributes["http.route"] || "Router" : staticName;
		return startSpan$1({
			name,
			attributes: {
				...metadata.attributes,
				[Ed]: layerType === LAYER_TYPE.MIDDLEWARE ? tE : Xe,
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$14
			}
		}, () => {
			if (!context["__SENTRY_KOA_SPAN__"]) {
				const activeSpan = getActiveSpan$1();
				if (activeSpan) addNonEnumerableProperty(context, KOA_CONTEXT_SPAN, activeSpan);
			}
			const route = metadata.attributes[po];
			if (getIsolationScope() === getDefaultIsolationScope()) DEBUG_BUILD$1 && debug$2.warn("Isolation scope is default isolation scope - skipping setting transactionName");
			else if (route) {
				const method = context.request?.method?.toUpperCase() || "GET";
				getIsolationScope().setTransactionName(`${method} ${route}`);
			}
			return middlewareLayer(context, next);
		});
	};
}
function getMiddlewareMetadata(context, layer, isRouter, layerPath) {
	if (isRouter) return {
		attributes: {
			[Oo]: layerPath?.toString(),
			[Co]: LAYER_TYPE.ROUTER,
			[po]: layerPath?.toString()
		},
		name: context._matchedRouteName || `router - ${layerPath}`
	};
	return {
		attributes: {
			[Oo]: layer.name || "middleware",
			[Co]: LAYER_TYPE.MIDDLEWARE,
			[Li]: layer.name || "middleware"
		},
		name: `middleware - ${layer.name}`
	};
}
var koaIntegration = defineIntegration(_koaIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/redis/redis-statement-serializer.js
var serializationSubsets = [
	{
		regex: /^ECHO/i,
		args: 0
	},
	{
		regex: /^(LPUSH|MSET|PFA|PUBLISH|RPUSH|SADD|SET|SPUBLISH|XADD|ZADD)/i,
		args: 1
	},
	{
		regex: /^(HSET|HMSET|LSET|LINSERT)/i,
		args: 2
	},
	{
		regex: /^(ACL|BIT|B[LRZ]|CLIENT|CLUSTER|CONFIG|COMMAND|DECR|DEL|EVAL|EX|FUNCTION|GEO|GET|HINCR|HMGET|HSCAN|INCR|L[TRLM]|MEMORY|P[EFISTU]|RPOP|S[CDIMORSU]|XACK|X[CDGILPRT]|Z[CDILMPRS])/i,
		args: -1
	}
];
var defaultDbStatementSerializer = (cmdName, cmdArgs) => {
	if (Array.isArray(cmdArgs) && cmdArgs.length) {
		const nArgsToSerialize = serializationSubsets.find(({ regex }) => regex.test(cmdName))?.args ?? 0;
		const argsToSerialize = nArgsToSerialize >= 0 ? cmdArgs.slice(0, nArgsToSerialize) : cmdArgs.slice();
		if (cmdArgs.length > argsToSerialize.length) argsToSerialize.push(`[${cmdArgs.length - nArgsToSerialize} other arguments]`);
		return `${cmdName} ${argsToSerialize.join(" ")}`;
	}
	return cmdName;
};
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/redis/redis-cache.js
var SINGLE_ARG_COMMANDS = [
	"get",
	"set",
	"setex"
];
var GET_COMMANDS = ["get", "mget"];
var SET_COMMANDS = ["set", "setex"];
var REMOVE_COMMANDS = ["del", "unlink"];
function isInCommands(redisCommands, command) {
	return redisCommands.includes(command.toLowerCase());
}
function getCacheOperation(command) {
	if (isInCommands(GET_COMMANDS, command)) return Re$1;
	else if (isInCommands(SET_COMMANDS, command)) return te;
	else if (isInCommands(REMOVE_COMMANDS, command)) return Te;
	else return;
}
function keyHasPrefix(key, prefixes) {
	return prefixes.some((prefix) => key.startsWith(prefix));
}
function getCacheKeySafely(redisCommand, cmdArgs) {
	try {
		if (cmdArgs.length === 0) return;
		const processArg = (arg) => {
			if (typeof arg === "string" || typeof arg === "number" || Buffer.isBuffer(arg)) return [arg.toString()];
			else if (Array.isArray(arg)) return flatten(arg.map((arg2) => processArg(arg2)));
			else return ["<unknown>"];
		};
		const firstArg = cmdArgs[0];
		if (isInCommands(SINGLE_ARG_COMMANDS, redisCommand) && firstArg != null) return processArg(firstArg);
		return flatten(cmdArgs.map((arg) => processArg(arg)));
	} catch {
		return;
	}
}
function shouldConsiderForCache(redisCommand, keys, prefixes) {
	if (!getCacheOperation(redisCommand)) return false;
	for (const key of keys) if (keyHasPrefix(key, prefixes)) return true;
	return false;
}
function calculateCacheItemSize(response) {
	const getSize = (value) => {
		try {
			if (Buffer.isBuffer(value)) return value.byteLength;
			else if (typeof value === "string") return value.length;
			else if (typeof value === "number") return value.toString().length;
			else if (value === null || value === void 0) return 0;
			return JSON.stringify(value).length;
		} catch {
			return;
		}
	};
	return Array.isArray(response) ? response.reduce((acc, curr) => {
		const size = getSize(curr);
		return typeof size === "number" ? acc !== void 0 ? acc + size : size : acc;
	}, 0) : getSize(response);
}
function applyRedisCacheAttributes(span, redisCommand, cmdArgs, response, options) {
	const safeKey = getCacheKeySafely(redisCommand, cmdArgs);
	const cacheOperation = getCacheOperation(redisCommand);
	if (!safeKey || !cacheOperation || !options.cachePrefixes || !shouldConsiderForCache(redisCommand, safeKey, options.cachePrefixes)) return;
	const attributes = spanToJSON(span).attributes;
	const networkPeerAddress = attributes["net.peer.name"] ?? attributes["server.address"];
	const networkPeerPort = attributes["net.peer.port"] ?? attributes["server.port"];
	if (networkPeerPort && networkPeerAddress) span.setAttributes({
		[sp]: networkPeerAddress,
		[op]: networkPeerPort
	});
	const cacheItemSize = isInCommands(REMOVE_COMMANDS, redisCommand) ? void 0 : calculateCacheItemSize(response);
	if (cacheItemSize) span.setAttribute(SEMANTIC_ATTRIBUTE_CACHE_ITEM_SIZE, cacheItemSize);
	if (isInCommands(GET_COMMANDS, redisCommand) && cacheItemSize !== void 0) span.setAttribute(SEMANTIC_ATTRIBUTE_CACHE_HIT, cacheItemSize > 0);
	span.setAttributes({
		[SEMANTIC_ATTRIBUTE_SENTRY_OP]: cacheOperation,
		[SEMANTIC_ATTRIBUTE_CACHE_KEY]: safeKey
	});
	const spanDescription = safeKey.join(", ");
	span.updateName(options.maxCacheKeyLength ? truncate(spanDescription, options.maxCacheKeyLength) : spanDescription);
}
function flatten(input) {
	const result = [];
	const flattenHelper = (input2) => {
		input2.forEach((el) => {
			if (Array.isArray(el)) flattenHelper(el);
			else result.push(el);
		});
	};
	flattenHelper(input);
	return result;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/redis/redis-dc-subscriber.js
var REDIS_DC_CHANNEL_COMMAND = "node-redis:command";
var REDIS_DC_CHANNEL_BATCH = "node-redis:batch";
var REDIS_DC_CHANNEL_CONNECT = "node-redis:connect";
var IOREDIS_DC_CHANNEL_COMMAND = "ioredis:command";
var IOREDIS_DC_CHANNEL_CONNECT = "ioredis:connect";
var ORIGIN$13 = "auto.db.redis.diagnostic_channel";
var DB_SYSTEM_NAME_VALUE_REDIS = "redis";
function subscribeRedisDiagnosticChannels(tracingChannel, cacheOptions = {}) {
	setupCommandChannel(tracingChannel, REDIS_DC_CHANNEL_COMMAND, (data) => data.args.slice(1), cacheOptions);
	setupBatchChannel(tracingChannel, REDIS_DC_CHANNEL_BATCH, (data) => data.batchMode === "PIPELINE" ? "PIPELINE" : "MULTI");
	setupConnectChannel$1(tracingChannel, REDIS_DC_CHANNEL_CONNECT);
	setupCommandChannel(tracingChannel, IOREDIS_DC_CHANNEL_COMMAND, (data) => data.args, cacheOptions);
	setupConnectChannel$1(tracingChannel, IOREDIS_DC_CHANNEL_CONNECT);
}
function setupCommandChannel(tracingChannel, channelName, getCommandArgs, cacheOptions) {
	bindTracingChannelToSpan(tracingChannel(channelName), (data) => {
		const args = getCommandArgs(data);
		const statement = args.length ? `${data.command} ${args.join(" ")}` : data.command;
		return startInactiveSpan({
			name: `redis-${data.command}`,
			attributes: {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$13,
				[Ed]: _e,
				[ga]: DB_SYSTEM_NAME_VALUE_REDIS,
				[ea]: data.command,
				[ra]: statement,
				...data.serverAddress != null ? { [mu]: data.serverAddress } : {},
				...data.serverPort != null ? { [bu]: data.serverPort } : {}
			}
		});
	}, { beforeSpanEnd(span, data) {
		if ("error" in data) return;
		applyRedisCacheAttributes(span, data.command, getCommandArgs(data), data.result, cacheOptions);
	} });
}
function setupBatchChannel(tracingChannel, channelName, getOperationName) {
	bindTracingChannelToSpan(tracingChannel(channelName), (data) => {
		return startInactiveSpan({
			name: getOperationName(data),
			attributes: {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$13,
				[Ed]: _e,
				[ga]: DB_SYSTEM_NAME_VALUE_REDIS,
				...Number(data.batchSize) > 1 ? { [$i]: data.batchSize } : {},
				...data.serverAddress != null ? { [mu]: data.serverAddress } : {},
				...data.serverPort != null ? { [bu]: data.serverPort } : {}
			}
		});
	});
}
function setupConnectChannel$1(tracingChannel, channelName) {
	bindTracingChannelToSpan(tracingChannel(channelName), (data) => {
		return startInactiveSpan({
			name: "redis-connect",
			attributes: {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$13,
				[Ed]: "db",
				[ga]: DB_SYSTEM_NAME_VALUE_REDIS,
				...data.serverAddress != null ? { [mu]: data.serverAddress } : {},
				...data.serverPort != null ? { [bu]: data.serverPort } : {}
			}
		});
	});
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/redis/ioredis-channel-subscriber.js
var ORIGIN$12 = "auto.db.redis";
var DB_SYSTEM_VALUE_REDIS$1 = "redis";
function getConnectionOptions(self) {
	return {
		host: self?.options?.host,
		port: self?.options?.port
	};
}
function connectionAttributes(host, port) {
	return {
		[ga]: DB_SYSTEM_VALUE_REDIS$1,
		...host != null ? { [mu]: host } : {},
		...port != null ? { [bu]: port } : {},
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$12
	};
}
var tracedCommands = /* @__PURE__ */ new WeakSet();
function startIORedisCommandSpan(data) {
	const command = data.arguments?.[0];
	if (!command || typeof command !== "object") return;
	if (tracedCommands.has(command)) return;
	tracedCommands.add(command);
	const { host, port } = getConnectionOptions(data.self);
	const statement = defaultDbStatementSerializer(command.name, command.args ?? []);
	return startInactiveSpan({
		name: statement,
		attributes: {
			[dd]: "client",
			...connectionAttributes(host, port),
			[Ed]: _e,
			[ea]: command.name,
			[ra]: statement
		}
	});
}
function instrumentIoredis(options) {
	const commandChannel = diagnosticsChannel.tracingChannel(CHANNELS.IOREDIS_COMMAND);
	const connectChannel = diagnosticsChannel.tracingChannel(CHANNELS.IOREDIS_CONNECT);
	bindTracingChannelToSpan(commandChannel, startIORedisCommandSpan, {
		requiresParentSpan: true,
		beforeSpanEnd(span, data) {
			if ("error" in data) return;
			const command = data.arguments?.[0];
			if (command) applyRedisCacheAttributes(span, command.name, command.args, data.result, options);
		}
	});
	bindTracingChannelToSpan(connectChannel, (data) => {
		const { host, port } = getConnectionOptions(data.self);
		return startInactiveSpan({
			name: "connect",
			attributes: {
				[dd]: "client",
				...connectionAttributes(host, port),
				[Ed]: "db"
			}
		});
	}, { requiresParentSpan: true });
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/redis/index.js
var INTEGRATION_NAME$24 = "Redis";
var ORIGIN$11 = "auto.db.redis";
var DB_SYSTEM_VALUE_REDIS = "redis";
function endSpan(span, err) {
	if (err) span.setStatus({
		code: 2,
		message: err instanceof Error ? err.message : String(err)
	});
	span.end();
}
function stripCommandOptions(args) {
	const first = args[0];
	if (isObjectLike(first) && Object.getOwnPropertySymbols(first).length > 0) return args.slice(1);
	return args;
}
function nodeRedisAttributes(options) {
	return {
		[ga]: DB_SYSTEM_VALUE_REDIS,
		...options?.socket?.host != null ? { [mu]: options.socket.host } : {},
		...options?.socket?.port != null ? { [bu]: options.socket.port } : {},
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$11
	};
}
function startCommandSpan(commandName, commandArgs, attributes) {
	const dbStatement = defaultDbStatementSerializer(commandName, commandArgs);
	return startInactiveSpan({
		name: dbStatement || `redis-${commandName}`,
		attributes: {
			[dd]: "client",
			...attributes,
			[Ed]: _e,
			[ea]: commandName,
			[ra]: dbStatement
		}
	});
}
function subscribeLegacyRedisCommand(cacheOptions) {
	const channel = diagnosticsChannel.tracingChannel(CHANNELS.REDIS_COMMAND);
	const noop = () => {};
	channel.subscribe({
		end: noop,
		asyncStart: noop,
		asyncEnd: noop,
		start(data) {
			const command = data.arguments?.[0];
			if (!command || typeof command !== "object") return;
			const originalCallback = command.callback;
			if (typeof originalCallback !== "function") return;
			const client = data.self;
			const attributes = {
				[ga]: DB_SYSTEM_VALUE_REDIS,
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$11
			};
			if (client?.connection_options?.host != null) attributes[mu] = client.connection_options.host;
			if (client?.connection_options?.port != null) attributes[bu] = client.connection_options.port;
			const span = startCommandSpan(command.command, command.args ?? [], attributes);
			data._sentrySpan = span;
			const parentSpan = getActiveSpan$1();
			command.callback = function(err, reply) {
				if (!err) applyRedisCacheAttributes(span, command.command, command.args ?? [], reply, cacheOptions);
				endSpan(span, err);
				const args = arguments;
				return withActiveSpan$1(parentSpan ?? null, () => originalCallback.apply(this, args));
			};
		},
		error(data) {
			const span = data._sentrySpan;
			if (span) endSpan(span, data.error);
		}
	});
}
function bindNodeRedisCommandChannel(channelName, getWireArgs, cacheOptions) {
	const channel = diagnosticsChannel.tracingChannel(channelName);
	bindTracingChannelToSpan(channel, (data) => {
		const wireArgs = getWireArgs(data);
		if (!wireArgs?.length) return;
		const commandName = String(wireArgs[0]);
		const options = data.self?.options;
		return startCommandSpan(commandName, wireArgs.slice(1), nodeRedisAttributes(options));
	}, { beforeSpanEnd(span, data) {
		if ("error" in data) return;
		const wireArgs = getWireArgs(data);
		if (wireArgs?.length) applyRedisCacheAttributes(span, String(wireArgs[0]), wireArgs.slice(1), data.result, cacheOptions);
	} });
}
function getSendCommandArgs(data) {
	const args = data.arguments?.[0];
	return Array.isArray(args) ? args : void 0;
}
function getExecutorArgs(data) {
	const command = data.arguments?.[0];
	const jsArgs = data.arguments?.[1];
	if (typeof command?.transformArguments !== "function" || !Array.isArray(jsArgs)) return;
	try {
		return command.transformArguments(...stripCommandOptions(jsArgs));
	} catch {
		return;
	}
}
function bindNodeRedisConnectChannel() {
	const channel = diagnosticsChannel.tracingChannel(CHANNELS.NODE_REDIS_CONNECT);
	bindTracingChannelToSpan(channel, (data) => {
		const options = data.self?.options;
		return startInactiveSpan({
			name: "redis-connect",
			attributes: {
				[dd]: "client",
				...nodeRedisAttributes(options),
				[Ed]: "db"
			}
		});
	});
}
function bindNodeRedisBatchChannel(channelName, getOperation) {
	const channel = diagnosticsChannel.tracingChannel(channelName);
	bindTracingChannelToSpan(channel, (data) => {
		const commands = data.arguments?.[0];
		const size = Array.isArray(commands) ? commands.length : void 0;
		const socket = data.self?.options?.socket;
		return startInactiveSpan({
			name: getOperation(data),
			attributes: {
				[dd]: "client",
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$11,
				[Ed]: _e,
				[ga]: DB_SYSTEM_VALUE_REDIS,
				...size && size > 1 ? { [$i]: size } : {},
				...socket?.host != null ? { [mu]: socket.host } : {},
				...socket?.port != null ? { [bu]: socket.port } : {}
			}
		});
	});
}
var _redisIntegration = (options = {}) => {
	return {
		name: INTEGRATION_NAME$24,
		setup(client) {
			invokeOrchestrionInstrumentation(client, redisModuleNames, instrumentLegacyRedis, [options], { requiresTracingChannelBinding: false });
			invokeOrchestrionInstrumentation(client, redisModuleNames, instrumentNodeRedis, [options]);
			invokeOrchestrionInstrumentation(client, ioredisModuleNames, instrumentIoredis, [options]);
		},
		setupOnce() {
			if (!diagnosticsChannel.tracingChannel) return;
			waitForTracingChannelBinding(() => {
				subscribeRedisDiagnosticChannels(diagnosticsChannel.tracingChannel, options);
			});
		}
	};
};
function instrumentLegacyRedis(options) {
	subscribeLegacyRedisCommand(options);
}
function instrumentNodeRedis(options) {
	bindNodeRedisCommandChannel(CHANNELS.NODE_REDIS_COMMAND, getSendCommandArgs, options);
	bindNodeRedisCommandChannel(CHANNELS.NODE_REDIS_EXECUTOR, getExecutorArgs, options);
	bindNodeRedisConnectChannel();
	bindNodeRedisBatchChannel(CHANNELS.NODE_REDIS_MULTI, () => "MULTI");
	bindNodeRedisBatchChannel(CHANNELS.NODE_REDIS_PIPELINE, () => "PIPELINE");
	bindNodeRedisBatchChannel(CHANNELS.NODE_REDIS_BATCH, (data) => data.arguments?.[2] !== void 0 ? "MULTI" : "PIPELINE");
}
var redisIntegration = defineIntegration(_redisIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/kafkajs/semconv.js
var ATTR_MESSAGING_DESTINATION_PARTITION_ID = "messaging.destination.partition.id";
var ATTR_MESSAGING_KAFKA_MESSAGE_KEY = "messaging.kafka.message.key";
var ATTR_MESSAGING_KAFKA_MESSAGE_TOMBSTONE = "messaging.kafka.message.tombstone";
var ATTR_MESSAGING_KAFKA_OFFSET = "messaging.kafka.offset";
var MESSAGING_OPERATION_TYPE_VALUE_PROCESS = "process";
var MESSAGING_OPERATION_TYPE_VALUE_RECEIVE = "receive";
var MESSAGING_OPERATION_TYPE_VALUE_SEND = "send";
var MESSAGING_SYSTEM_VALUE_KAFKA = "kafka";
var ERROR_TYPE_VALUE_OTHER = "_OTHER";
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/kafkajs/spans.js
var PRODUCER_ORIGIN = "auto.kafkajs.producer";
var CONSUMER_ORIGIN = "auto.kafkajs.consumer";
var TRACE_FLAG_SAMPLED = 1;
var TRACE_FLAG_NONE = 0;
function getHeaderAsString(headers, key) {
	const value = headers?.[key];
	if (value == null) return;
	return Array.isArray(value) ? value[0]?.toString() : value.toString();
}
function getLinksFromHeaders(headers) {
	const sentryTrace = getHeaderAsString(headers, "sentry-trace");
	if (!sentryTrace) return;
	const { traceId, parentSpanId, sampled } = propagationContextFromHeaders(sentryTrace, getHeaderAsString(headers, "baggage"));
	if (!parentSpanId) return;
	return [{ context: {
		traceId,
		spanId: parentSpanId,
		isRemote: true,
		traceFlags: sampled ? TRACE_FLAG_SAMPLED : TRACE_FLAG_NONE
	} }];
}
function startConsumerSpan({ topic, message, operationType, links, attributes }) {
	const operationName = operationType === "receive" ? "poll" : operationType;
	const isBatchReceive = operationType === MESSAGING_OPERATION_TYPE_VALUE_RECEIVE;
	const client = getClient();
	return startInactiveSpan({
		name: client && hasSpanStreamingEnabled(client) ? `${operationType} ${topic}` : `${operationName} ${topic}`,
		links,
		attributes: {
			[Ed]: isBatchReceive ? de : De,
			[dd]: isBatchReceive ? "client" : "consumer",
			...attributes,
			[Yl]: MESSAGING_SYSTEM_VALUE_KAFKA,
			[Al]: topic,
			[Wl]: operationType,
			[Fl]: operationName,
			[ATTR_MESSAGING_KAFKA_MESSAGE_KEY]: message?.key ? String(message.key) : void 0,
			[ATTR_MESSAGING_KAFKA_MESSAGE_TOMBSTONE]: message?.key && message.value === null ? true : void 0,
			[ATTR_MESSAGING_KAFKA_OFFSET]: message?.offset,
			...message ? { [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: CONSUMER_ORIGIN } : {}
		}
	});
}
function startProducerSpan(topic, message) {
	const span = startInactiveSpan({
		name: `send ${topic}`,
		attributes: {
			[Ed]: be,
			[dd]: "producer",
			[Yl]: MESSAGING_SYSTEM_VALUE_KAFKA,
			[Al]: topic,
			[ATTR_MESSAGING_KAFKA_MESSAGE_KEY]: message.key ? String(message.key) : void 0,
			[ATTR_MESSAGING_KAFKA_MESSAGE_TOMBSTONE]: message.key && message.value === null ? true : void 0,
			[ATTR_MESSAGING_DESTINATION_PARTITION_ID]: message.partition !== void 0 ? String(message.partition) : void 0,
			[Fl]: "send",
			[Wl]: MESSAGING_OPERATION_TYPE_VALUE_SEND,
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: PRODUCER_ORIGIN
		}
	});
	message.headers = message.headers ?? {};
	const traceData = getTraceData({ span });
	if (traceData["sentry-trace"]) message.headers["sentry-trace"] = traceData["sentry-trace"];
	if (traceData.baggage) message.headers["baggage"] = traceData.baggage;
	return span;
}
function applyErrorToSpans(spans, reason) {
	let errorMessage;
	let errorType = ERROR_TYPE_VALUE_OTHER;
	if (typeof reason === "string" || reason === void 0) errorMessage = reason;
	else if (typeof reason === "object" && reason !== null && Object.prototype.hasOwnProperty.call(reason, "message")) {
		errorMessage = reason.message;
		errorType = reason.constructor.name;
	}
	spans.forEach((span) => {
		span.setAttribute(on, errorType);
		span.setStatus({
			code: 2,
			message: errorMessage
		});
	});
}
function endSpansOnPromise(spans, promise) {
	return Promise.resolve(promise).catch((reason) => {
		applyErrorToSpans(spans, reason);
		throw reason;
	}).finally(() => {
		spans.forEach((span) => span.end());
	});
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/kafkajs/consumer.js
var consumerCallbackWrapped = /* @__PURE__ */ Symbol("sentry-kafkajs-consumer-callback-wrapped");
function isWrappedConsumerCallback(fn) {
	return typeof fn === "function" && fn[consumerCallbackWrapped] === true;
}
function wrapEachMessage(original) {
	const wrapped = function eachMessage(payload) {
		const sentryTrace = getHeaderAsString(payload.message.headers, "sentry-trace");
		const baggage = getHeaderAsString(payload.message.headers, "baggage");
		return continueTrace({
			sentryTrace,
			baggage
		}, () => {
			const span = startConsumerSpan({
				topic: payload.topic,
				message: payload.message,
				operationType: MESSAGING_OPERATION_TYPE_VALUE_PROCESS,
				attributes: { [ATTR_MESSAGING_DESTINATION_PARTITION_ID]: String(payload.partition) }
			});
			const promise = withActiveSpan$1(span, () => original.call(this, payload));
			return endSpansOnPromise([span], promise);
		});
	};
	wrapped[consumerCallbackWrapped] = true;
	return wrapped;
}
function wrapEachBatch(original) {
	const wrapped = function eachBatch(payload) {
		const receivingSpan = startNewTrace(() => startConsumerSpan({
			topic: payload.batch.topic,
			message: void 0,
			operationType: MESSAGING_OPERATION_TYPE_VALUE_RECEIVE,
			attributes: {
				[Il]: payload.batch.messages.length,
				[ATTR_MESSAGING_DESTINATION_PARTITION_ID]: String(payload.batch.partition)
			}
		}));
		return withActiveSpan$1(receivingSpan, () => {
			const spans = [receivingSpan];
			payload.batch.messages.forEach((message) => {
				spans.push(startConsumerSpan({
					topic: payload.batch.topic,
					message,
					operationType: MESSAGING_OPERATION_TYPE_VALUE_PROCESS,
					links: getLinksFromHeaders(message.headers),
					attributes: { [ATTR_MESSAGING_DESTINATION_PARTITION_ID]: String(payload.batch.partition) }
				}));
			});
			return endSpansOnPromise(spans, original.call(this, payload));
		});
	};
	wrapped[consumerCallbackWrapped] = true;
	return wrapped;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/kafkajs/index.js
var INTEGRATION_NAME$23 = "Kafka";
function subscribeToProducer() {
	diagnosticsChannel.tracingChannel(CHANNELS.KAFKAJS_SEND_BATCH).subscribe({
		start(ctx) {
			const spans = [];
			(ctx.arguments[0]?.topicMessages ?? []).forEach((topicMessage) => {
				topicMessage.messages.forEach((message) => {
					spans.push(startProducerSpan(topicMessage.topic, message));
				});
			});
			ctx._sentrySpans = spans;
		},
		error(ctx) {
			if (ctx._sentrySpans) applyErrorToSpans(ctx._sentrySpans, ctx.error);
		},
		asyncEnd(ctx) {
			ctx._sentrySpans?.forEach((span) => span.end());
		}
	});
}
function subscribeToConsumer() {
	diagnosticsChannel.tracingChannel(CHANNELS.KAFKAJS_CONSUMER_RUN).subscribe({ start(ctx) {
		const config = ctx.arguments[0];
		if (!config || typeof config !== "object") return;
		if (typeof config.eachMessage === "function" && !isWrappedConsumerCallback(config.eachMessage)) config.eachMessage = wrapEachMessage(config.eachMessage);
		if (typeof config.eachBatch === "function" && !isWrappedConsumerCallback(config.eachBatch)) config.eachBatch = wrapEachBatch(config.eachBatch);
	} });
}
var _kafkaIntegration = () => {
	return {
		name: INTEGRATION_NAME$23,
		setup(client) {
			invokeOrchestrionInstrumentation(client, kafkajsModuleNames, instrumentKafkajs, [], { requiresTracingChannelBinding: false });
		}
	};
};
function instrumentKafkajs() {
	subscribeToProducer();
	subscribeToConsumer();
}
var kafkaIntegration = defineIntegration(_kafkaIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/langchain/embeddings.js
function inferSystemFromInstance(instance) {
	const name = instance.constructor?.name ?? "";
	if (name.includes("OpenAI")) return "openai";
	if (name.includes("Google")) return "google_genai";
	if (name.includes("Mistral")) return "mistralai";
	if (name.includes("Vertex")) return "google_vertexai";
	if (name.includes("Bedrock")) return "aws_bedrock";
	if (name.includes("Ollama")) return "ollama";
	if (name.includes("Cloudflare")) return "cloudflare";
	if (name.includes("Cohere")) return "cohere";
	return "langchain";
}
function extractEmbeddingAttributes(instance) {
	const embeddingsInstance = instance ?? {};
	const attributes = {
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: LANGCHAIN_ORIGIN,
		[Ed]: ae,
		[ur]: "embeddings",
		[wr]: embeddingsInstance.model ?? "unknown"
	};
	attributes[fr] = inferSystemFromInstance(embeddingsInstance);
	if ("dimensions" in embeddingsInstance) attributes[GEN_AI_REQUEST_DIMENSIONS_ATTRIBUTE] = embeddingsInstance.dimensions;
	if ("encodingFormat" in embeddingsInstance) attributes[GEN_AI_REQUEST_ENCODING_FORMAT_ATTRIBUTE] = embeddingsInstance.encodingFormat;
	return attributes;
}
function _INTERNAL_getLangChainEmbeddingsSpanOptions(instance, input, options = {}) {
	const { recordInputs } = resolveAIRecordingOptions(options);
	const attributes = extractEmbeddingAttributes(instance);
	const modelName = attributes["gen_ai.request.model"] || "unknown";
	const client = getClient();
	if (recordInputs && input != null) attributes[pr] = stringify(input, String);
	return {
		name: typeof modelName === "string" && modelName !== "unknown" || !(client && hasSpanStreamingEnabled(client)) ? `embeddings ${modelName}` : "embeddings",
		attributes
	};
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/langchain.js
var INTEGRATION_NAME$22 = LANGCHAIN_INTEGRATION_NAME;
var SKIPPED_PROVIDERS = [
	OPENAI_INTEGRATION_NAME,
	ANTHROPIC_AI_INTEGRATION_NAME,
	GOOGLE_GENAI_INTEGRATION_NAME
];
function markProvidersSkipped() {
	_INTERNAL_skipAiProviderWrapping(SKIPPED_PROVIDERS);
}
var _langChainIntegration = (options = {}) => {
	return {
		name: INTEGRATION_NAME$22,
		setup(client) {
			invokeOrchestrionInstrumentation(client, langchainModuleNames, instrumentChatModels, [options], { requiresTracingChannelBinding: false });
			invokeOrchestrionInstrumentation(client, langchainModuleNames, instrumentEmbeddings, [options]);
		}
	};
};
function instrumentChatModels(options) {
	const sentryHandler = createLangChainCallbackHandler(options);
	const injectHandler = (message) => {
		markProvidersSkipped();
		const args = message.arguments;
		if (!Array.isArray(args)) return;
		let callOptions = args[1];
		if (!callOptions || typeof callOptions !== "object" || Array.isArray(callOptions)) {
			callOptions = {};
			args[1] = callOptions;
		}
		callOptions.callbacks = _INTERNAL_mergeLangChainCallbackHandler(callOptions.callbacks, sentryHandler);
	};
	for (const channelName of [CHANNELS.LANGCHAIN_CHAT_MODEL_INVOKE, CHANNELS.LANGCHAIN_CHAT_MODEL_STREAM]) diagnosticsChannel.tracingChannel(channelName).start.subscribe(injectHandler);
}
function instrumentEmbeddings(options) {
	for (const channelName of langchainEmbeddingsChannels) bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(channelName), (data) => createEmbeddingsSpan(data, options));
}
function createEmbeddingsSpan(data, options) {
	markProvidersSkipped();
	const input = (data.arguments ?? [])[0];
	return startInactiveSpan(_INTERNAL_getLangChainEmbeddingsSpanOptions(data.self, input, options));
}
var langChainIntegration = defineIntegration(_langChainIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/langgraph.js
var INTEGRATION_NAME$21 = LANGGRAPH_INTEGRATION_NAME;
var insideCreateReactAgent = false;
var _langGraphIntegration = (options = {}) => {
	return {
		name: INTEGRATION_NAME$21,
		setup(client) {
			invokeOrchestrionInstrumentation(client, langgraphModuleNames, instrumentLanggraph, [options], { requiresTracingChannelBinding: false });
		}
	};
};
function instrumentLanggraph(options) {
	const resolvedOptions = resolveAIRecordingOptions(options);
	const sentryHandler = createLangChainCallbackHandler(resolvedOptions);
	diagnosticsChannel.tracingChannel(CHANNELS.LANGGRAPH_STATE_GRAPH_COMPILE).end.subscribe((message) => {
		if (insideCreateReactAgent) return;
		const { arguments: args, result } = message;
		wrapCompiledGraphInvoke(result, getFirstArgObject(args) ?? {}, resolvedOptions, null, sentryHandler);
	});
	const reactAgentChannel = diagnosticsChannel.tracingChannel(CHANNELS.LANGGRAPH_CREATE_REACT_AGENT);
	reactAgentChannel.start.subscribe((message) => {
		insideCreateReactAgent = true;
		try {
			const { arguments: args } = message;
			const params = getFirstArgObject(args);
			if (params && Array.isArray(params.tools) && params.tools.length > 0) wrapToolsWithSpans(params.tools, resolvedOptions, extractAgentNameFromParams(args) ?? void 0);
		} catch (error) {
			DEBUG_BUILD$1 && debug$2.error("[instrumentation:langgraph] failed to wrap createReactAgent tools", error);
		}
	});
	reactAgentChannel.end.subscribe((message) => {
		insideCreateReactAgent = false;
		const { arguments: args, result } = message;
		const agentName = extractAgentNameFromParams(args) ?? void 0;
		wrapCompiledGraphInvoke(result, agentName ? { name: agentName } : {}, resolvedOptions, extractLLMFromParams(args), sentryHandler);
	});
	reactAgentChannel.error.subscribe(() => {
		insideCreateReactAgent = false;
	});
}
function getFirstArgObject(args) {
	const first = (args ?? [])[0];
	return typeof first === "object" && first !== null ? first : void 0;
}
function wrapCompiledGraphInvoke(graph, compileOptions, options, llm, sentryHandler) {
	if (!graph || typeof graph !== "object") return;
	const compiledGraph = graph;
	const originalInvoke = compiledGraph.invoke;
	if (typeof originalInvoke === "function") compiledGraph.invoke = instrumentCompiledGraphInvoke(originalInvoke.bind(compiledGraph), compiledGraph, compileOptions, options, llm, sentryHandler);
}
var langGraphIntegration = defineIntegration(_langGraphIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/lru-memoizer.js
var INTEGRATION_NAME$20 = "LruMemoizer";
var _lruMemoizerIntegration = () => {
	return {
		name: INTEGRATION_NAME$20,
		setup(client) {
			invokeOrchestrionInstrumentation(client, lruMemoizerModuleNames, instrumentLruMemoizer, []);
		}
	};
};
function instrumentLruMemoizer() {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(CHANNELS.LRU_MEMOIZER_LOAD), () => void 0);
}
var lruMemoizerIntegration = defineIntegration(_lruMemoizerIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/mongodb/mongodb-span.js
var ATTR_DB_CONNECTION_STRING$2 = "db.connection_string";
var DB_SYSTEM_VALUE_MONGODB = "mongodb";
function serializeDbStatement(commandObj) {
	return JSON.stringify(scrubStatement(commandObj));
}
function scrubStatement(value) {
	if (Array.isArray(value)) return value.map((element) => scrubStatement(element));
	if (isCommandObj(value)) return Object.entries(value).map(([key, element]) => [key, scrubStatement(element)]).reduce((prev, current) => {
		if (isCommandEntry(current)) prev[current[0]] = current[1];
		return prev;
	}, {});
	return "?";
}
function isCommandObj(value) {
	return isObjectLike(value) && !isBuffer(value);
}
function isBuffer(value) {
	return typeof Buffer !== "undefined" && Buffer.isBuffer(value);
}
function isCommandEntry(value) {
	return Array.isArray(value);
}
function getV4SpanAttributes(connectionCtx, ns, command, operation, origin) {
	let host;
	let port;
	if (connectionCtx) {
		const hostParts = typeof connectionCtx.address === "string" ? connectionCtx.address.split(":") : "";
		if (hostParts.length === 2) {
			host = hostParts[0];
			port = hostParts[1];
		}
	}
	let commandObj;
	if (command?.documents?.[0]) commandObj = command.documents[0];
	else if (command?.cursors) commandObj = command.cursors;
	else commandObj = command;
	return getSpanAttributes(ns.db, ns.collection, host, port, commandObj, operation, origin);
}
function getSpanAttributes(dbName, dbCollection, host, port, commandObj, operation, origin) {
	const attributes = {
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: origin,
		[ga]: DB_SYSTEM_VALUE_MONGODB,
		[Ji]: dbName,
		[Bi]: dbCollection,
		[ea]: operation,
		[ATTR_DB_CONNECTION_STRING$2]: `mongodb://${host}:${port}/${dbName}`
	};
	if (host && port) {
		attributes[mu] = host;
		const portNumber = parseInt(port, 10);
		if (!isNaN(portNumber)) attributes[bu] = portNumber;
	}
	if (commandObj) try {
		attributes[ra] = serializeDbStatement(commandObj);
	} catch {}
	return attributes;
}
function getV3CommandOperation(command) {
	if (command.createIndexes !== void 0) return "createIndexes";
	else if (command.findandmodify !== void 0) return "findAndModify";
	else if (command.ismaster !== void 0) return "isMaster";
	else if (command.count !== void 0) return "count";
	else if (command.aggregate !== void 0) return "aggregate";
}
function getV3SpanAttributes(ns, topology, command, operation, origin) {
	let host;
	let port;
	if (topology?.s) {
		host = topology.s.options?.host ?? topology.s.host;
		port = (topology.s.options?.port ?? topology.s.port)?.toString();
		if (host == null || port == null) {
			const address = topology.description?.address;
			if (address) {
				const segments = address.split(":");
				host = segments[0];
				port = segments[1];
			}
		}
	}
	const [dbName, dbCollection] = ns.toString().split(".");
	const commandObj = command?.query ?? command?.q ?? command;
	return getSpanAttributes(dbName, dbCollection, host, port, commandObj, operation, origin);
}
function startMongoSpan(attributes) {
	const operation = attributes[ea];
	const target = attributes["db.collection.name"] || attributes["db.namespace"];
	const client = getClient();
	const name = client && hasSpanStreamingEnabled(client) ? operation && target ? `${operation} ${target}` : target || DB_SYSTEM_VALUE_MONGODB : attributes["db.query.text"] || `mongodb.${attributes["db.operation.name"] || "command"}`;
	return startInactiveSpan({
		name,
		attributes: {
			[Ed]: "db",
			[dd]: "client",
			...attributes
		}
	});
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/mongodb/index.js
var INTEGRATION_NAME$19 = "Mongo";
var ORIGIN$10 = "auto.db.mongo";
var V3_DEDICATED_COMMANDS = /* @__PURE__ */ new Set([
	"insert",
	"update",
	"delete",
	"find",
	"getMore",
	"killCursors"
]);
var _mongoIntegration = () => {
	return {
		name: INTEGRATION_NAME$19,
		setup(client) {
			invokeOrchestrionInstrumentation(client, mongodbModuleNames, instrumentMongodb, []);
		}
	};
};
function instrumentMongodb() {
	subscribeV4Command();
	subscribeV4Checkout();
	subscribeV3Wireprotocol();
}
function subscribeV4Command() {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(CHANNELS.MONGODB_COMMAND), (data) => {
		const args = data.arguments ?? [];
		const ns = args[0];
		const cmd = args[1];
		if (!ns || !cmd || typeof cmd !== "object" || cmd.ismaster || cmd.hello) return;
		const operation = Object.keys(cmd)[0];
		return startMongoSpan(getV4SpanAttributes(data.self, ns, cmd, operation, ORIGIN$10));
	}, { requiresParentSpan: true });
}
function subscribeV4Checkout() {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(CHANNELS.MONGODB_CHECKOUT), () => void 0);
}
function subscribeV3Wireprotocol() {
	for (const operation of [
		"insert",
		"update",
		"remove"
	]) bindV3(operation === "insert" ? CHANNELS.MONGODB_V3_INSERT : operation === "update" ? CHANNELS.MONGODB_V3_UPDATE : CHANNELS.MONGODB_V3_REMOVE, (args) => ({
		topology: args[0],
		ns: args[1],
		command: args[2]?.[0],
		operation
	}));
	bindV3(CHANNELS.MONGODB_V3_COMMAND, (args) => {
		const command = args[2];
		const type = command ? Object.keys(command)[0] : void 0;
		if (type && V3_DEDICATED_COMMANDS.has(type)) return;
		return {
			topology: args[0],
			ns: args[1],
			command,
			operation: command ? getV3CommandOperation(command) : void 0
		};
	});
	bindV3(CHANNELS.MONGODB_V3_QUERY, (args) => ({
		topology: args[0],
		ns: args[1],
		command: args[2],
		operation: "find"
	}));
	bindV3(CHANNELS.MONGODB_V3_GET_MORE, (args) => ({
		topology: args[0],
		ns: args[1],
		command: args[2]?.cmd,
		operation: "getMore"
	}));
}
function bindV3(channelName, extract) {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(channelName), (data) => {
		const args = data.arguments;
		if (!args) return;
		const info = extract(args);
		if (!info || typeof info.ns !== "string") return;
		return startMongoSpan(getV3SpanAttributes(info.ns, info.topology, info.command, info.operation, ORIGIN$10));
	}, { requiresParentSpan: true });
}
var mongoIntegration = defineIntegration(_mongoIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/mongoose/mongoose-dc-subscriber.js
var MONGOOSE_DC_CHANNEL_QUERY = "mongoose:query";
var MONGOOSE_DC_CHANNEL_AGGREGATE = "mongoose:aggregate";
var MONGOOSE_DC_CHANNEL_MODEL_SAVE = "mongoose:model:save";
var MONGOOSE_DC_CHANNEL_MODEL_INSERT_MANY = "mongoose:model:insertMany";
var MONGOOSE_DC_CHANNEL_MODEL_BULK_WRITE = "mongoose:model:bulkWrite";
var MONGOOSE_DC_CHANNEL_CURSOR_NEXT = "mongoose:cursor:next";
var ORIGIN$9 = "auto.db.mongoose.diagnostic_channel";
var DB_SYSTEM_NAME_VALUE_MONGODB$1 = "mongodb";
var MAX_REDACTION_DEPTH = 10;
var subscribed$1 = false;
function subscribeMongooseDiagnosticChannels(tracingChannel) {
	if (subscribed$1) return;
	subscribed$1 = true;
	try {
		setupChannel(tracingChannel, MONGOOSE_DC_CHANNEL_QUERY);
		setupChannel(tracingChannel, MONGOOSE_DC_CHANNEL_AGGREGATE);
		setupChannel(tracingChannel, MONGOOSE_DC_CHANNEL_MODEL_SAVE);
		setupChannel(tracingChannel, MONGOOSE_DC_CHANNEL_MODEL_INSERT_MANY);
		setupChannel(tracingChannel, MONGOOSE_DC_CHANNEL_MODEL_BULK_WRITE);
		setupChannel(tracingChannel, MONGOOSE_DC_CHANNEL_CURSOR_NEXT);
	} catch {
		DEBUG_BUILD$1 && debug$2.log("Mongoose node:diagnostics_channel subscription failed.");
	}
}
function setupChannel(tracingChannel, channelName) {
	bindTracingChannelToSpan(tracingChannel(channelName), (data) => {
		const collection = data.collection;
		const queryText = redactMongoQuery(data.args?.pipeline ?? data.args?.filter);
		const batchSize = getBatchSize(data);
		const client = getClient();
		const target = collection || data.database;
		const name = client && hasSpanStreamingEnabled(client) ? target ? `${data.operation} ${target}` : DB_SYSTEM_NAME_VALUE_MONGODB$1 : collection ? `mongoose.${collection}.${data.operation}` : `mongoose.${data.operation}`;
		return startInactiveSpan({
			name,
			attributes: {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$9,
				[Ed]: "db",
				[ga]: DB_SYSTEM_NAME_VALUE_MONGODB$1,
				[ea]: data.operation,
				[Bi]: collection ?? void 0,
				[Ji]: data.database ?? void 0,
				[ra]: queryText ?? void 0,
				[$i]: batchSize ?? void 0,
				[mu]: data.serverAddress ?? void 0,
				[bu]: data.serverPort ?? void 0
			}
		});
	});
}
function getBatchSize(data) {
	const args = data.args;
	const batch = data.operation === "insertMany" ? args?.docs : data.operation === "bulkWrite" ? args?.ops : void 0;
	return Array.isArray(batch) && batch.length > 1 ? batch.length : void 0;
}
function redactMongoQuery(value) {
	if (value == null) return;
	try {
		const redacted = redactValue(value, 0);
		const text = JSON.stringify(redacted);
		return text == null || text === "{}" || text === "[]" ? void 0 : text;
	} catch {
		return;
	}
}
function redactValue(value, depth) {
	if (depth > MAX_REDACTION_DEPTH) return "?";
	if (Array.isArray(value)) return value.map((item) => redactValue(item, depth + 1));
	if (isObjectLike(value)) {
		const out = {};
		for (const key of Object.keys(value)) out[key] = redactValue(value[key], depth + 1);
		return out;
	}
	return "?";
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/mongoose/mongoose-legacy-span.js
var DB_SYSTEM_NAME_VALUE_MONGODB = "mongodb";
function startMongooseLegacySpan({ collection, modelName, operation, origin, parentSpan }) {
	const collectionName = collection?.name;
	const namespace = collection?.conn?.name;
	const attributes = {
		[Ed]: "db",
		[dd]: "client",
		[Bi]: collectionName,
		[Ji]: namespace,
		[ba]: collection?.conn?.user,
		[mu]: collection?.conn?.host,
		[bu]: collection?.conn?.port,
		[ea]: operation,
		[ga]: DB_SYSTEM_NAME_VALUE_MONGODB,
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: origin
	};
	const client = getClient();
	const target = collectionName || namespace;
	const name = client && hasSpanStreamingEnabled(client) ? target ? `${operation} ${target}` : DB_SYSTEM_NAME_VALUE_MONGODB : `mongoose.${modelName}.${operation}`;
	return startInactiveSpan({
		name,
		attributes,
		parentSpan
	});
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/mongoose/index.js
var INTEGRATION_NAME$18 = "Mongoose";
var ORIGIN$8 = "auto.db.mongoose";
var STORED_PARENT_SPAN = /* @__PURE__ */ new WeakMap();
var orchestrionSubscribed = false;
var _mongooseIntegration = () => {
	return {
		name: INTEGRATION_NAME$18,
		setupOnce() {
			if (!diagnosticsChannel.tracingChannel) return;
			waitForTracingChannelBinding(() => {
				subscribeMongooseDiagnosticChannels(diagnosticsChannel.tracingChannel);
			});
		},
		setup(client) {
			invokeOrchestrionInstrumentation(client, mongooseModuleNames, subscribeOrchestrionMongooseChannels, []);
		}
	};
};
function subscribeOrchestrionMongooseChannels() {
	if (orchestrionSubscribed) return;
	orchestrionSubscribed = true;
	for (const channelName of MONGOOSE_CONTEXT_CAPTURE_CHANNELS) channel(channelName).subscribe({ start(message) {
		stashParentSpan(message.self);
	} });
	channel(CHANNELS.MONGOOSE_MODEL_AGGREGATE).subscribe({ end(message) {
		const result = message.result;
		if (result && typeof result === "object") stashParentSpan(result);
	} });
	bindExecSpan(CHANNELS.MONGOOSE_QUERY_EXEC, (self) => {
		const query = self;
		return startSpan(query.mongooseCollection, query.model?.modelName, query.op ?? "exec", STORED_PARENT_SPAN.get(self));
	});
	bindExecSpan(CHANNELS.MONGOOSE_AGGREGATE_EXEC, (self) => {
		const model = self._model;
		return startSpan(model?.collection, model?.modelName, "aggregate", STORED_PARENT_SPAN.get(self));
	});
	bindExecSpan(CHANNELS.MONGOOSE_MODEL_SAVE, (self) => {
		const ctor = self.constructor;
		return startSpan(ctor.collection, ctor.modelName, "save");
	});
	bindExecSpan(CHANNELS.MONGOOSE_MODEL_REMOVE, (self) => {
		const ctor = self.constructor;
		return startSpan(ctor.collection, ctor.modelName, "remove");
	});
	bindExecSpan(CHANNELS.MONGOOSE_MODEL_INSERT_MANY, (self) => {
		const model = self;
		return startSpan(model.collection, model.modelName, "insertMany");
	});
	bindExecSpan(CHANNELS.MONGOOSE_MODEL_BULK_WRITE, (self) => {
		const model = self;
		return startSpan(model.collection, model.modelName, "bulkWrite");
	});
}
function startSpan(collection, modelName, operation, parentSpan) {
	return startMongooseLegacySpan({
		collection,
		modelName,
		operation,
		origin: ORIGIN$8,
		parentSpan
	});
}
function channel(channelName) {
	return diagnosticsChannel.tracingChannel(channelName);
}
function bindExecSpan(channelName, getSpan) {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(channelName), (data) => {
		const self = data.self;
		if (!self) return;
		return getSpan(self);
	});
}
function stashParentSpan(self) {
	const active = getActiveSpan$1();
	if (self && active) STORED_PARENT_SPAN.set(self, active);
}
var mongooseIntegration = defineIntegration(_mongooseIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/mysql.js
var INTEGRATION_NAME$17 = "Mysql";
var ATTR_DB_CONNECTION_STRING$1 = "db.connection_string";
var DB_SYSTEM_NAME_VALUE_MYSQL$1 = "mysql";
var _mysqlIntegration = () => {
	return {
		name: INTEGRATION_NAME$17,
		setup(client) {
			invokeOrchestrionInstrumentation(client, mysqlModuleNames, instrumentMysql, []);
		}
	};
};
function instrumentMysql() {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(CHANNELS.MYSQL_QUERY), (data) => {
		const sql = extractSql$2(data.arguments[0]);
		const { host, port, database, user } = getConnectionConfig(data.self);
		const portNumber = typeof port === "string" ? parseInt(port, 10) : port;
		const portIsNumber = typeof portNumber === "number" && !isNaN(portNumber);
		data._sentryCallerScope = getCurrentScope();
		const querySummary = sql ? getSqlQuerySummary(sanitizeSqlQuery(sql, "mysql")) : void 0;
		const client = getClient();
		const name = client && hasSpanStreamingEnabled(client) ? querySummary || database || DB_SYSTEM_NAME_VALUE_MYSQL$1 : sql ?? "mysql.query";
		return startInactiveSpan({
			name,
			attributes: {
				[Ed]: "db",
				[dd]: "client",
				[ga]: DB_SYSTEM_NAME_VALUE_MYSQL$1,
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.db.mysql",
				[ATTR_DB_CONNECTION_STRING$1]: getJDBCString(host, portIsNumber ? portNumber : void 0, database),
				...database ? { [Ji]: database } : {},
				...user ? { [ba]: user } : {},
				...sql ? { [ra]: sql } : {},
				[na]: querySummary,
				[mu]: host,
				[bu]: portIsNumber ? portNumber : void 0
			}
		});
	}, { deferSpanEnd({ data, end }) {
		const result = data.result;
		if (!result || typeof result !== "object" || !hasOnMethod$1(result)) return false;
		const callerScope = data._sentryCallerScope;
		if (callerScope) bindScopeToEmitter(result, callerScope);
		result.on("error", (err) => end(err));
		result.on("end", () => end());
		return true;
	} });
}
function hasOnMethod$1(obj) {
	return "on" in obj && typeof obj.on === "function";
}
function extractSql$2(firstArg) {
	if (typeof firstArg === "string") return firstArg;
	if (isObjectLike(firstArg) && "sql" in firstArg) {
		const sql = firstArg.sql;
		return typeof sql === "string" ? sql : void 0;
	}
}
function getConnectionConfig(connection) {
	const config = connection?.config?.connectionConfig ?? connection?.config ?? {};
	return {
		host: config.host,
		port: config.port,
		database: config.database,
		user: config.user
	};
}
function getJDBCString(host, port, database) {
	let s = `jdbc:mysql://${host || "localhost"}`;
	if (typeof port === "number") s += `:${port}`;
	if (database) s += `/${database}`;
	return s;
}
var mysqlIntegration = defineIntegration(_mysqlIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/mysql2/mysql2-dc-subscriber.js
var MYSQL2_DC_CHANNEL_QUERY = "mysql2:query";
var MYSQL2_DC_CHANNEL_EXECUTE = "mysql2:execute";
var MYSQL2_DC_CHANNEL_CONNECT = "mysql2:connect";
var MYSQL2_DC_CHANNEL_POOL_CONNECT = "mysql2:pool:connect";
var ORIGIN$7 = "auto.db.mysql2.diagnostic_channel";
var DB_SYSTEM_NAME_VALUE_MYSQL = "mysql";
var SQL_OPERATION_RE = /^\s*(\w+)/;
function subscribeMysql2DiagnosticChannels(tracingChannel) {
	setupQueryChannel(tracingChannel, MYSQL2_DC_CHANNEL_QUERY);
	setupQueryChannel(tracingChannel, MYSQL2_DC_CHANNEL_EXECUTE);
	setupConnectChannel(tracingChannel, MYSQL2_DC_CHANNEL_CONNECT, "mysql2.connect");
	setupConnectChannel(tracingChannel, MYSQL2_DC_CHANNEL_POOL_CONNECT, "mysql2.pool.connect");
}
function setupQueryChannel(tracingChannel, channelName) {
	bindTracingChannelToSpan(tracingChannel(channelName), (data) => {
		const queryText = data.query ? sanitizeSqlQuery(data.query, "mysql") : void 0;
		const operation = queryText?.match(SQL_OPERATION_RE)?.[1]?.toUpperCase();
		const querySummary = getSqlQuerySummary(queryText);
		const client = getClient();
		const name = client && hasSpanStreamingEnabled(client) ? querySummary || data.database || DB_SYSTEM_NAME_VALUE_MYSQL : queryText || "mysql2.query";
		return startInactiveSpan({
			name,
			attributes: {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$7,
				[Ed]: "db",
				[ga]: DB_SYSTEM_NAME_VALUE_MYSQL,
				[ra]: queryText,
				[na]: querySummary,
				[ea]: operation,
				[Ji]: data.database || void 0,
				[mu]: data.serverAddress,
				[bu]: data.serverPort
			}
		});
	}, { requiresParentSpan: true });
}
function setupConnectChannel(tracingChannel, channelName, spanName) {
	bindTracingChannelToSpan(tracingChannel(channelName), (data) => {
		return startInactiveSpan({
			name: spanName,
			attributes: {
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$7,
				[Ed]: "db",
				[ga]: DB_SYSTEM_NAME_VALUE_MYSQL,
				[Ji]: data.database || void 0,
				[mu]: data.serverAddress,
				[bu]: data.serverPort
			}
		});
	}, { requiresParentSpan: true });
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/mysql2/index.js
var INTEGRATION_NAME$16 = "Mysql2";
var ORIGIN$6 = "auto.db.mysql2";
var DB_SYSTEM_VALUE_MYSQL = "mysql";
function instrumentMysql2Orchestrion() {
	subscribeQueryChannel(CHANNELS.MYSQL2_QUERY);
	subscribeQueryChannel(CHANNELS.MYSQL2_EXECUTE);
}
function subscribeQueryChannel(channelName) {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(channelName), (data) => {
		const statement = getQueryText(data.arguments);
		const connectionAttributes = getConnectionAttributes$1(data.self?.config);
		const querySummary = statement ? getSqlQuerySummary(sanitizeSqlQuery(statement, "mysql")) : void 0;
		const client = getClient();
		const name = client && hasSpanStreamingEnabled(client) ? querySummary || connectionAttributes["db.namespace"] || DB_SYSTEM_VALUE_MYSQL : statement ?? "mysql2.query";
		return startInactiveSpan({
			name,
			attributes: {
				[dd]: "client",
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$6,
				[Ed]: "db",
				[ga]: DB_SYSTEM_VALUE_MYSQL,
				[ra]: statement || void 0,
				[na]: querySummary,
				...connectionAttributes
			}
		});
	}, { requiresParentSpan: true });
}
function getQueryText(args) {
	return extractSql$1(args[0]);
}
function extractSql$1(firstArg) {
	if (typeof firstArg === "string") return firstArg;
	if (isObjectLike(firstArg) && "sql" in firstArg) {
		const sql = firstArg.sql;
		return typeof sql === "string" ? sql : void 0;
	}
}
function getConnectionAttributes$1(config) {
	const { host, port, database, user } = config?.connectionConfig ?? config ?? {};
	const portNumber = typeof port === "string" ? parseInt(port, 10) : port;
	const portIsNumber = typeof portNumber === "number" && !isNaN(portNumber);
	return {
		[Ji]: database || void 0,
		[ba]: user || void 0,
		[mu]: host || void 0,
		[bu]: portIsNumber ? portNumber : void 0
	};
}
var _mysql2Integration = () => {
	return {
		name: INTEGRATION_NAME$16,
		setupOnce() {
			if (!diagnosticsChannel.tracingChannel) return;
			waitForTracingChannelBinding(() => {
				subscribeMysql2DiagnosticChannels(diagnosticsChannel.tracingChannel);
			});
		},
		setup(client) {
			invokeOrchestrionInstrumentation(client, mysql2ModuleNames, instrumentMysql2Orchestrion, []);
		}
	};
};
var mysql2Integration = defineIntegration(_mysql2Integration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/openai.js
var INTEGRATION_NAME$15 = "OpenAI";
var ORIGIN$5 = "auto.ai.openai";
var INSTRUMENTED_CHANNELS = [{
	channel: CHANNELS.OPENAI_CHAT,
	operation: "chat"
}, {
	channel: CHANNELS.OPENAI_EMBEDDINGS,
	operation: "embeddings"
}];
var _openAIIntegration = (options = {}) => {
	return {
		name: INTEGRATION_NAME$15,
		setup(client) {
			invokeOrchestrionInstrumentation(client, openaiModuleNames, instrumentOpenai, [options]);
		}
	};
};
function instrumentOpenai(options) {
	for (const { channel, operation } of INSTRUMENTED_CHANNELS) bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(channel), (data) => createGenAiSpan(data, operation, options), {
		beforeSpanEnd: (span, data) => {
			addResponseAttributes$2(span, data.result, resolveAIRecordingOptions(options).recordOutputs);
		},
		deferSpanEnd: ({ span, data }) => wrapStreamResult(span, data, options)
	});
}
function createGenAiSpan(data, operation, options) {
	if (_INTERNAL_shouldSkipAiProviderWrapping(INTEGRATION_NAME$15)) return;
	const args = data.arguments ?? [];
	const params = args[0];
	const { recordInputs } = resolveAIRecordingOptions(options);
	const attributes = extractRequestAttributes$2(args, operation);
	attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN] = ORIGIN$5;
	const model = params?.model || "unknown";
	const client = getClient();
	const span = startInactiveSpan({
		name: model !== "unknown" || !(client && hasSpanStreamingEnabled(client)) ? `${operation} ${model}` : operation,
		op: getGenAiSpanOp(operation),
		attributes
	});
	if (recordInputs && params) addRequestAttributes(span, params, operation);
	return span;
}
function isAsyncIterable(value) {
	return !!value && typeof value[Symbol.asyncIterator] === "function";
}
function wrapStreamResult(span, data, options) {
	const result = data.result;
	if (!isAsyncIterable(result)) return false;
	const { recordOutputs } = resolveAIRecordingOptions(options);
	const iterate = result[Symbol.asyncIterator].bind(result);
	const instrumented = instrumentStream$1({ [Symbol.asyncIterator]: iterate }, span, recordOutputs ?? false);
	result[Symbol.asyncIterator] = () => instrumented;
	return true;
}
var openAIIntegration = defineIntegration(_openAIIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/postgres.js
var INTEGRATION_NAME$14 = "Postgres";
var ORIGIN$4 = "auto.db.postgres";
var ATTR_DB_CONNECTION_STRING = "db.connection_string";
var ATTR_PG_PLAN = "db.postgresql.plan";
var ATTR_PG_IDLE_TIMEOUT = "db.postgresql.idle.timeout.millis";
var ATTR_PG_MAX_CLIENT = "db.postgresql.max.client";
var DB_SYSTEM_POSTGRESQL = "postgresql";
var SPAN_QUERY_FALLBACK = "pg.query";
var SPAN_CONNECT = "pg.connect";
var SPAN_POOL_CONNECT = "pg-pool.connect";
var _postgresIntegration = (options = {}) => {
	return {
		name: INTEGRATION_NAME$14,
		setup(client) {
			invokeOrchestrionInstrumentation(client, pgModuleNames, instrumentPostgres, [options]);
		}
	};
};
function instrumentPostgres(options) {
	subscribeQueryLikeChannel(CHANNELS.PG_QUERY, querySpanOptions, { deferStreamedResult: true });
	if (!options.ignoreConnectSpans) {
		subscribeQueryLikeChannel(CHANNELS.PG_CONNECT, connectSpanOptions);
		subscribeQueryLikeChannel(CHANNELS.PGPOOL_CONNECT, poolConnectSpanOptions);
	}
}
function subscribeQueryLikeChannel(channelName, getSpanOptions, { deferStreamedResult = false } = {}) {
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(channelName), (data) => {
		data._sentryCallerScope = getCurrentScope();
		const spanOptions = getSpanOptions(data);
		return startInactiveSpan({
			...spanOptions,
			attributes: {
				...spanOptions.attributes,
				[dd]: "client"
			}
		});
	}, deferStreamedResult ? {
		requiresParentSpan: true,
		deferSpanEnd({ data, end }) {
			const result = data.result;
			if (!result || typeof result !== "object" || !hasOnMethod(result)) return false;
			const callerScope = data._sentryCallerScope;
			if (callerScope) bindScopeToEmitter(result, callerScope);
			result.on("error", (err) => end(err));
			result.on("end", () => end());
			return true;
		}
	} : { requiresParentSpan: true });
}
function querySpanOptions(ctx) {
	const params = ctx.self?.connectionParameters ?? {};
	const queryConfig = extractQueryConfig(ctx.arguments);
	const client = getClient();
	const querySummary = queryConfig?.text ? getSqlQuerySummary(sanitizeSqlQuery(queryConfig.text)) : void 0;
	return {
		name: client && hasSpanStreamingEnabled(client) ? querySummary || params.database || DB_SYSTEM_POSTGRESQL : queryConfig?.text ?? SPAN_QUERY_FALLBACK,
		attributes: {
			[Ed]: "db",
			...getConnectionAttributes(params),
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$4,
			[ra]: queryConfig?.text || void 0,
			[na]: querySummary,
			[ATTR_PG_PLAN]: typeof queryConfig?.name === "string" ? queryConfig.name : void 0
		}
	};
}
function connectSpanOptions(ctx) {
	const params = ctx.self?.connectionParameters ?? {};
	return {
		name: SPAN_CONNECT,
		attributes: {
			[Ed]: "db",
			...getConnectionAttributes(params)
		}
	};
}
function poolConnectSpanOptions(ctx) {
	const opts = ctx.self?.options ?? {};
	return {
		name: SPAN_POOL_CONNECT,
		attributes: {
			[Ed]: "db",
			...getPoolConnectionAttributes(opts)
		}
	};
}
function hasOnMethod(obj) {
	return "on" in obj && typeof obj.on === "function";
}
function extractQueryConfig(args) {
	const arg0 = args[0];
	if (typeof arg0 === "string") return { text: arg0 };
	if (isObjectLike(arg0) && typeof arg0.text === "string") {
		const obj = arg0;
		return {
			text: obj.text,
			name: obj.name
		};
	}
}
function getConnectionAttributes(params) {
	return {
		[ga]: DB_SYSTEM_POSTGRESQL,
		[ATTR_DB_CONNECTION_STRING]: getConnectionString(params),
		[Ji]: params.database,
		[ba]: params.user,
		[mu]: params.host,
		[bu]: Number.isInteger(params.port) ? params.port : void 0
	};
}
function getPoolConnectionAttributes(opts) {
	let url;
	try {
		url = opts.connectionString ? new URL(opts.connectionString) : void 0;
	} catch {
		url = void 0;
	}
	const database = url?.pathname.slice(1) || opts.database;
	const host = url?.hostname || opts.host;
	const port = Number(url?.port) || (Number.isInteger(opts.port) ? opts.port : void 0);
	const user = url?.username || opts.user;
	return {
		[ga]: DB_SYSTEM_POSTGRESQL,
		[ATTR_DB_CONNECTION_STRING]: getConnectionString(opts),
		[ATTR_PG_IDLE_TIMEOUT]: opts.idleTimeoutMillis,
		[ATTR_PG_MAX_CLIENT]: opts.max,
		[Ji]: database,
		[bu]: port,
		[mu]: host || void 0,
		[ba]: user || void 0
	};
}
function getConnectionString(params) {
	if (params.connectionString) try {
		const url = new URL(params.connectionString);
		url.username = "";
		url.password = "";
		return url.toString();
	} catch {
		return "postgresql://localhost:5432/";
	}
	return `postgresql://${params.host || "localhost"}:${params.port || 5432}/${params.database || ""}`;
}
var postgresIntegration = defineIntegration(_postgresIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/postgres-js.js
var INTEGRATION_NAME$13 = "PostgresJs";
var ORIGIN$3 = "auto.db.postgresjs";
var DB_SYSTEM_NAME_POSTGRES = "postgres";
var DB_RESPONSE_STATUS_CODE = "db.response.status_code";
var NOOP$2 = () => {};
var QUERY_FROM_INSTRUMENTED_SQL = /* @__PURE__ */ Symbol.for("sentry.query.from.instrumented.sql");
var QUERY_SPAN = /* @__PURE__ */ Symbol("sentryPostgresJsSpan");
var CONNECTION_ATTRS_SET = /* @__PURE__ */ Symbol("sentryPostgresJsConnectionAttrsSet");
var SPAN_ENDED = /* @__PURE__ */ Symbol("sentryPostgresJsSpanEnded");
var connectionContexts = /* @__PURE__ */ new WeakMap();
var endpointRegistry = [];
function registerEndpoint(context) {
	if (!endpointRegistry.some((e) => e.ATTR_SERVER_ADDRESS === context.ATTR_SERVER_ADDRESS && e.ATTR_SERVER_PORT === context.ATTR_SERVER_PORT && e.ATTR_DB_NAMESPACE === context.ATTR_DB_NAMESPACE)) endpointRegistry.push(context);
}
function resolveSingleEndpoint() {
	return endpointRegistry.length === 1 ? endpointRegistry[0] : void 0;
}
function recordConnectionFromChannel(message) {
	const connection = message.result;
	const options = message.arguments?.[0];
	if (!connection || typeof connection !== "object" || !options) return;
	const context = _buildConnectionContext(options);
	connectionContexts.set(connection, context);
	registerEndpoint(context);
}
function setConnectionAttributes(span, query, context) {
	const queryRecord = query;
	if (queryRecord[CONNECTION_ATTRS_SET]) return;
	queryRecord[CONNECTION_ATTRS_SET] = true;
	if (context) span.setAttributes(_getConnectionAttributes(context));
}
function attachConnectionAttributesFromChannel(message) {
	const connection = message.self;
	const query = message.arguments?.[0];
	if (!connection || !query) return;
	const span = query[QUERY_SPAN];
	const context = connectionContexts.get(connection);
	if (span && context) setConnectionAttributes(span, query, context);
}
function wrapQuerySettlement(data, span, sanitizedSqlQuery) {
	const query = data.self;
	if (!query) return;
	const markEnded = () => {
		data[SPAN_ENDED] = true;
	};
	const originalResolve = query.resolve;
	if (typeof originalResolve === "function") query.resolve = function(...resolveArgs) {
		markEnded();
		try {
			const command = resolveArgs[0]?.command;
			span.setAttribute(ea, _getOperationName(sanitizedSqlQuery, command));
			span.end();
		} catch (e) {
			DEBUG_BUILD$1 && debug$2.error("[instrumentation:postgresjs] error ending span in resolve:", e);
		}
		return originalResolve.apply(this, resolveArgs);
	};
	const originalReject = query.reject;
	if (typeof originalReject === "function") query.reject = function(...rejectArgs) {
		markEnded();
		try {
			const err = rejectArgs[0];
			span.setStatus({
				code: 2,
				message: err?.message || "unknown_error"
			});
			span.setAttribute(DB_RESPONSE_STATUS_CODE, err?.code || "unknown");
			span.setAttribute(on, err?.name || "unknown");
			span.end();
		} catch (e) {
			DEBUG_BUILD$1 && debug$2.error("[instrumentation:postgresjs] error ending span in reject:", e);
		}
		return originalReject.apply(this, rejectArgs);
	};
}
var _postgresJsIntegration = (options = {}) => {
	return {
		name: INTEGRATION_NAME$13,
		setup(client) {
			invokeOrchestrionInstrumentation(client, postgresJsModuleNames, instrumentPostgresJs, [options]);
		}
	};
};
function instrumentPostgresJs(options) {
	const { requireParentSpan, requestHook } = options;
	diagnosticsChannel.tracingChannel(CHANNELS.POSTGRESJS_CONNECTION).subscribe({
		start: NOOP$2,
		asyncStart: NOOP$2,
		asyncEnd: NOOP$2,
		error: NOOP$2,
		end: recordConnectionFromChannel
	});
	diagnosticsChannel.tracingChannel(CHANNELS.POSTGRESJS_EXECUTE).subscribe({
		end: NOOP$2,
		asyncStart: NOOP$2,
		asyncEnd: NOOP$2,
		error: NOOP$2,
		start: attachConnectionAttributesFromChannel
	});
	diagnosticsChannel.tracingChannel(CHANNELS.POSTGRESJS_CONNECT).subscribe({
		end: NOOP$2,
		asyncStart: NOOP$2,
		asyncEnd: NOOP$2,
		error: NOOP$2,
		start: attachConnectionAttributesFromChannel
	});
	bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(CHANNELS.POSTGRESJS_HANDLE), (data) => {
		const query = data.self;
		if (!query) return;
		if (query.executed === true || query[QUERY_FROM_INSTRUMENTED_SQL]) return;
		const fullQuery = _reconstructQuery(query.strings);
		const sanitizedSqlQuery = sanitizeSqlQuery(fullQuery);
		const querySummary = getSqlQuerySummary(sanitizedSqlQuery);
		const client = getClient();
		const context = resolveSingleEndpoint();
		const name = client && hasSpanStreamingEnabled(client) ? querySummary || context?.ATTR_DB_NAMESPACE || DB_SYSTEM_NAME_POSTGRES : sanitizedSqlQuery || "postgresjs.query";
		const span = startInactiveSpan({
			name,
			attributes: {
				[Ed]: "db",
				[dd]: "client",
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$3,
				[ga]: DB_SYSTEM_NAME_POSTGRES,
				[ra]: sanitizedSqlQuery,
				[na]: querySummary,
				[ea]: _getOperationName(sanitizedSqlQuery)
			}
		});
		query[QUERY_SPAN] = span;
		if (context) setConnectionAttributes(span, query, context);
		if (requestHook) try {
			requestHook(span, sanitizedSqlQuery, context);
		} catch (e) {
			span.setAttribute("sentry.hook.error", "requestHook failed");
			DEBUG_BUILD$1 && debug$2.error("[instrumentation:postgresjs] error in requestHook:", e);
		}
		wrapQuerySettlement(data, span, sanitizedSqlQuery);
		return span;
	}, {
		requiresParentSpan: requireParentSpan !== false,
		deferSpanEnd({ data }) {
			if (data[SPAN_ENDED]) return true;
			if ("error" in data) return false;
			return true;
		}
	});
}
var postgresJsIntegration = defineIntegration(_postgresJsIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/tedious.js
var INTEGRATION_NAME$12 = "Tedious";
var ORIGIN$2 = "auto.db.tedious";
var DB_SYSTEM_VALUE_MSSQL = "mssql";
var ATTR_DB_SQL_TABLE = "db.sql.table";
var currentDatabaseSymbol = /* @__PURE__ */ Symbol("sentry.orchestrion.tedious.current-database");
function setDatabase(databaseName) {
	Object.defineProperty(this, currentDatabaseSymbol, {
		value: databaseName,
		writable: true,
		configurable: true
	});
}
function removeDatabaseListener() {
	this.removeListener("databaseChange", setDatabase);
}
function subscribeConnect() {
	diagnosticsChannel.tracingChannel(CHANNELS.TEDIOUS_CONNECT).start.subscribe((message) => {
		const connection = message.self;
		if (!connection) return;
		setDatabase.call(connection, connection.config?.options?.database);
		connection.removeListener("databaseChange", setDatabase);
		connection.on("databaseChange", setDatabase);
		connection.removeListener("end", removeDatabaseListener);
		connection.once("end", removeDatabaseListener);
	});
}
function subscribeQuery(channelName, operation) {
	diagnosticsChannel.tracingChannel(channelName).start.subscribe((message) => {
		const data = message;
		const connection = data.self;
		const request = data.arguments[0];
		if (!connection || !(request instanceof EventEmitter)) return;
		let procCount = 0;
		let statementCount = 0;
		const incrementStatementCount = () => {
			statementCount++;
		};
		const incrementProcCount = () => {
			procCount++;
		};
		const databaseName = connection[currentDatabaseSymbol];
		const sql = extractSql(request);
		const attributes = {
			[Ed]: "db",
			[dd]: "client",
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$2,
			[ga]: DB_SYSTEM_VALUE_MSSQL,
			[Ji]: databaseName,
			[ba]: connection.config?.userName ?? connection.config?.authentication?.options?.userName,
			[ra]: sql,
			[ATTR_DB_SQL_TABLE]: request.table,
			[mu]: connection.config?.server,
			[bu]: connection.config?.options?.port
		};
		const span = startInactiveSpan({
			name: sql || getSpanName(operation, databaseName, sql, request.table),
			attributes
		});
		const endSpan = once((err) => {
			request.removeListener("done", incrementStatementCount);
			request.removeListener("doneInProc", incrementStatementCount);
			request.removeListener("doneProc", incrementProcCount);
			request.removeListener("error", endSpan);
			connection.removeListener("end", endSpan);
			span.setAttribute("tedious.procedure_count", procCount);
			span.setAttribute("tedious.statement_count", statementCount);
			if (err) span.setStatus({
				code: 2,
				message: err.message
			});
			span.end();
		});
		request.on("done", incrementStatementCount);
		request.on("doneInProc", incrementStatementCount);
		request.on("doneProc", incrementProcCount);
		request.once("error", endSpan);
		connection.on("end", endSpan);
		if (typeof request.callback === "function") {
			const originalCallback = request.callback;
			request.callback = function(...args) {
				endSpan(args[0]);
				return originalCallback.apply(this, args);
			};
		}
	});
}
function extractSql(request) {
	if (request.sqlTextOrProcedure === "sp_prepare" && request.parametersByName?.stmt?.value != null) {
		const value = request.parametersByName.stmt.value;
		return typeof value === "string" ? value : void 0;
	}
	return request.sqlTextOrProcedure;
}
function getSpanName(operation, db, sql, bulkLoadTable) {
	if (operation === "execBulkLoad" && bulkLoadTable && db) return `${operation} ${bulkLoadTable} ${db}`;
	if (operation === "callProcedure") return db ? `${operation} ${sql} ${db}` : `${operation} ${sql}`;
	return db ? `${operation} ${db}` : operation;
}
function once(fn) {
	let called = false;
	return (...args) => {
		if (called) return;
		called = true;
		fn(...args);
	};
}
var _tediousIntegration = () => {
	return {
		name: INTEGRATION_NAME$12,
		setup(client) {
			invokeOrchestrionInstrumentation(client, tediousModuleNames, instrumentTedious, [], { requiresTracingChannelBinding: false });
		}
	};
};
function instrumentTedious() {
	subscribeConnect();
	subscribeQuery(CHANNELS.TEDIOUS_EXEC_SQL, "execSql");
	subscribeQuery(CHANNELS.TEDIOUS_EXEC_SQL_BATCH, "execSqlBatch");
	subscribeQuery(CHANNELS.TEDIOUS_CALL_PROCEDURE, "callProcedure");
	subscribeQuery(CHANNELS.TEDIOUS_EXEC_BULK_LOAD, "execBulkLoad");
	subscribeQuery(CHANNELS.TEDIOUS_PREPARE, "prepare");
	subscribeQuery(CHANNELS.TEDIOUS_EXECUTE, "execute");
}
var tediousIntegration = defineIntegration(_tediousIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/ai/vercel-ai/index.js
function getProviderMetadataAttributes(providerMetadata) {
	const attributes = {};
	if (!providerMetadata || typeof providerMetadata !== "object") return attributes;
	const metadata = providerMetadata;
	const openaiMetadata = metadata.openai ?? metadata.azure;
	if (openaiMetadata) {
		setAttributeIfDefined(attributes, es, openaiMetadata.cachedPromptTokens);
		setAttributeIfDefined(attributes, ls, openaiMetadata.reasoningTokens);
		setAttributeIfDefined(attributes, "gen_ai.usage.output_tokens.prediction_accepted", openaiMetadata.acceptedPredictionTokens);
		setAttributeIfDefined(attributes, "gen_ai.usage.output_tokens.prediction_rejected", openaiMetadata.rejectedPredictionTokens);
		setAttributeIfDefined(attributes, ir, openaiMetadata.responseId);
	}
	if (metadata.anthropic) {
		const cachedInputTokens = metadata.anthropic.usage?.cache_read_input_tokens ?? metadata.anthropic.cacheReadInputTokens;
		setAttributeIfDefined(attributes, es, cachedInputTokens);
		const cacheWriteInputTokens = metadata.anthropic.usage?.cache_creation_input_tokens ?? metadata.anthropic.cacheCreationInputTokens;
		setAttributeIfDefined(attributes, $r, cacheWriteInputTokens);
	}
	if (metadata.bedrock?.usage) {
		setAttributeIfDefined(attributes, es, metadata.bedrock.usage.cacheReadInputTokens);
		setAttributeIfDefined(attributes, $r, metadata.bedrock.usage.cacheWriteInputTokens);
	}
	if (metadata.deepseek) {
		setAttributeIfDefined(attributes, es, metadata.deepseek.promptCacheHitTokens);
		setAttributeIfDefined(attributes, "gen_ai.usage.input_tokens.cache_miss", metadata.deepseek.promptCacheMissTokens);
	}
	return attributes;
}
function setAttributeIfDefined(attributes, key, value) {
	if (value != null) attributes[key] = value;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/vercel-ai/util.js
function asString(value) {
	return typeof value === "string" ? value : void 0;
}
function asNumber(value) {
	return typeof value === "number" && !isNaN(value) ? value : void 0;
}
function sum(a, b) {
	return a === void 0 && b === void 0 ? void 0 : (a ?? 0) + (b ?? 0);
}
function isReadableStream(value) {
	return isObjectLike(value) && typeof value.pipeThrough === "function" && typeof value.getReader === "function";
}
function tapModelCallStream(stream, onFinal, onError) {
	const reader = stream.getReader();
	const state = { toolCalls: [] };
	let text = "";
	let settled = false;
	const finalize = () => {
		if (settled) return;
		settled = true;
		if (text) state.text = text;
		onFinal(state);
	};
	const fail = (error) => {
		if (settled) return;
		settled = true;
		onError(error);
	};
	return new ReadableStream({
		async pull(controller) {
			try {
				const { done, value } = await reader.read();
				if (done) {
					finalize();
					controller.close();
					return;
				}
				text += accumulateChunk(state, value) ?? "";
				controller.enqueue(value);
			} catch (error) {
				fail(error);
				controller.error(error);
			}
		},
		cancel(reason) {
			finalize();
			return reader.cancel(reason);
		}
	});
}
function accumulateChunk(state, chunk) {
	if (!isObjectLike(chunk)) return;
	const { type, delta, textDelta, id, modelId, toolCallId, toolName, input, args, finishReason, usage, providerMetadata } = chunk;
	switch (type) {
		case "text-delta": {
			const textChunk = delta ?? textDelta;
			return typeof textChunk === "string" ? textChunk : void 0;
		}
		case "tool-call":
			state.toolCalls.push({
				toolCallId,
				toolName,
				input: input ?? args
			});
			return;
		case "response-metadata":
			if (typeof id === "string") state.responseId = id;
			if (typeof modelId === "string") state.responseModel = modelId;
			return;
		case "finish":
			state.finishReason = finishReason;
			state.usage = usage;
			if (providerMetadata !== void 0) state.providerMetadata = providerMetadata;
			return;
		default: return;
	}
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/vercel-ai/vercel-ai-dc-subscriber.js
var AI_SDK_TELEMETRY_TRACING_CHANNEL = "ai:telemetry";
var ORIGIN$1 = "auto.vercelai.channel";
var GEN_AI_OPERATION_SPAN_OPS = {
	embeddings: ae,
	rerank: ne,
	invoke_agent: Ce,
	execute_tool: Oe,
	generate_content: Ae
};
var VERCEL_AI_OPERATION_ID_ATTRIBUTE = "vercel.ai.operationId";
var VERCEL_AI_MODEL_PROVIDER_ATTRIBUTE = "vercel.ai.model.provider";
var VERCEL_AI_SETTINGS_MAX_RETRIES_ATTRIBUTE = "vercel.ai.settings.maxRetries";
var operationIdByCallId = /* @__PURE__ */ new Map();
var toolDescriptionsByCallId = /* @__PURE__ */ new Map();
var invokeAgentSpanByCallId = /* @__PURE__ */ new Map();
var ROOT_OPERATION_TYPES = /* @__PURE__ */ new Set([
	"generateText",
	"streamText",
	"generateObject",
	"embed",
	"embedMany",
	"rerank"
]);
function clearOperationId(data) {
	if (!ROOT_OPERATION_TYPES.has(data.type)) return;
	const callId = asString(data.event.callId);
	if (callId) clearOperationCallId(callId);
}
function clearOperationCallId(callId) {
	operationIdByCallId.delete(callId);
	toolDescriptionsByCallId.delete(callId);
	invokeAgentSpanByCallId.delete(callId);
}
function recordToolDescriptions(callId, tools) {
	if (!callId || !Array.isArray(tools)) return;
	let descriptions = toolDescriptionsByCallId.get(callId);
	for (const tool of tools) if (isObjectLike(tool) && typeof tool.name === "string" && typeof tool.description === "string") {
		descriptions = descriptions ?? /* @__PURE__ */ new Map();
		if (!descriptions.has(tool.name)) descriptions.set(tool.name, tool.description);
	}
	if (descriptions) toolDescriptionsByCallId.set(callId, descriptions);
}
function resolveToolDescription(callId, toolName, tools) {
	const fromMap = callId ? toolDescriptionsByCallId.get(callId)?.get(toolName) : void 0;
	if (fromMap) return fromMap;
	if (Array.isArray(tools)) {
		const match = tools.find((tool) => isObjectLike(tool) && tool.name === toolName);
		return isObjectLike(match) ? asString(match.description) : void 0;
	}
	if (isObjectLike(tools)) {
		const tool = tools[toolName];
		return isObjectLike(tool) ? asString(tool.description) : void 0;
	}
}
function subscribeVercelAiTracingChannel(tracingChannel, options = {}) {
	bindTracingChannelToSpan(tracingChannel(AI_SDK_TELEMETRY_TRACING_CHANNEL), (data) => createSpanFromMessage(data, options), {
		beforeSpanEnd: (span, data) => {
			enrichSpanOnEnd(span, data, options);
			clearOperationId(data);
		},
		deferSpanEnd: ({ data, end }) => deferStreamedModelCallEnd(data, options, end)
	});
}
function deferStreamedModelCallEnd(data, options, end) {
	if (data.type !== "languageModelCall" || !isObjectLike(data.result)) return false;
	const result = data.result;
	const stream = result.stream;
	if (!isReadableStream(stream)) return false;
	const callId = asString(data.event.callId);
	const { recordOutputs } = getRecordingOptions(data.event, options);
	result.stream = tapModelCallStream(stream, (final) => {
		data.result = {
			...result,
			...streamedResultToChannelResult(final)
		};
		end();
		enrichInvokeAgentFromStream(callId, final, recordOutputs);
	}, (error) => end(error));
	return true;
}
function streamedResultToChannelResult(final) {
	const content = [];
	if (final.text) content.push({
		type: "text",
		text: final.text
	});
	for (const toolCall of final.toolCalls) content.push({
		type: "tool-call",
		...toolCall
	});
	return {
		content,
		...final.usage !== void 0 ? { usage: final.usage } : {},
		...final.finishReason !== void 0 ? { finishReason: final.finishReason } : {},
		...final.providerMetadata !== void 0 ? { providerMetadata: final.providerMetadata } : {},
		...final.responseId || final.responseModel ? { response: {
			...final.responseId ? { id: final.responseId } : {},
			...final.responseModel ? { modelId: final.responseModel } : {}
		} } : {}
	};
}
function enrichInvokeAgentFromStream(callId, final, recordOutputs) {
	const span = callId ? invokeAgentSpanByCallId.get(callId) : void 0;
	if (!span) return;
	const usage = isObjectLike(final.usage) ? final.usage : void 0;
	if (usage) {
		const input = tokenCount(usage.inputTokens) ?? tokenCount(usage.promptTokens) ?? tokenCount(usage.tokens);
		const output = tokenCount(usage.outputTokens) ?? tokenCount(usage.completionTokens);
		addTokensToSpan(span, is, input);
		addTokensToSpan(span, rs, output);
		addTokensToSpan(span, ps, tokenCount(usage.totalTokens) ?? sum(input, output));
	}
	if (recordOutputs) {
		const outputMessages = buildOutputMessages(partsFromTextAndToolCalls(final.text, final.toolCalls), getFinishReason({ finishReason: final.finishReason }));
		if (outputMessages) span.setAttribute(gr, outputMessages);
	}
}
function addTokensToSpan(span, attribute, value) {
	if (value === void 0) return;
	const current = spanToJSON(span).attributes[attribute];
	span.setAttribute(attribute, (typeof current === "number" ? current : 0) + value);
}
function createSpanFromMessage(data, channelOptions) {
	const { type, event } = data;
	if (type === "step" || !event || typeof event !== "object") return;
	const { recordInputs } = getRecordingOptions(event, channelOptions);
	const provider = asString(event.provider);
	const modelId = asString(event.modelId);
	const callId = asString(event.callId);
	const maxRetries = asNumber(event.maxRetries);
	if (recordInputs) recordToolDescriptions(callId, event.tools);
	const baseAttributes = {
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$1,
		...provider ? {
			[fr]: provider,
			[VERCEL_AI_MODEL_PROVIDER_ATTRIBUTE]: provider
		} : {},
		...modelId ? { [wr]: modelId } : {},
		...maxRetries !== void 0 ? { [VERCEL_AI_SETTINGS_MAX_RETRIES_ATTRIBUTE]: maxRetries } : {}
	};
	switch (type) {
		case "generateText":
		case "streamText":
		case "generateObject": return buildInvokeAgentSpan(event, baseAttributes, recordInputs, callId, type === "streamText");
		case "languageModelCall":
			_INTERNAL_skipAiProviderWrapping([WORKERS_AI_INTEGRATION_NAME]);
			return buildModelCallSpan(event, baseAttributes, recordInputs, callId, modelId);
		case "executeTool": return buildToolSpan(event, recordInputs);
		case "embed":
		case "embedMany": {
			const input = type === "embedMany" ? event.values : event.value;
			return startGenAiSpan("embeddings", modelId, {
				...baseAttributes,
				...recordInputs && input !== void 0 ? { [pr]: stringify(input) } : {}
			});
		}
		case "rerank": return startGenAiSpan("rerank", modelId, baseAttributes);
		default: return;
	}
}
function startGenAiSpan(operation, suffix, attributes) {
	return startInactiveSpan({
		name: suffix ? `${operation} ${suffix}` : operation,
		attributes: {
			[Ed]: GEN_AI_OPERATION_SPAN_OPS[operation],
			[ur]: operation,
			...attributes
		}
	});
}
function buildInvokeAgentSpan(event, baseAttributes, recordInputs, callId, isStream) {
	const functionId = asString(event.functionId);
	const operationId = asString(event.operationId) ?? (isStream ? "ai.streamText" : "ai.generateText");
	if (callId) operationIdByCallId.set(callId, {
		operationId,
		isStream
	});
	const span = startGenAiSpan("invoke_agent", functionId, {
		...baseAttributes,
		[VERCEL_AI_OPERATION_ID_ATTRIBUTE]: operationId,
		[Dr]: isStream,
		...functionId ? { [cr]: functionId } : {},
		...recordInputs ? buildInputMessageAttributes(event) : {}
	});
	if (isStream && callId) invokeAgentSpanByCallId.set(callId, span);
	return span;
}
function buildModelCallSpan(event, baseAttributes, recordInputs, callId, modelId) {
	const parent = callId ? operationIdByCallId.get(callId) : void 0;
	const operationId = parent ? `${parent.operationId}.${parent.isStream ? "doStream" : "doGenerate"}` : "ai.generateText.doGenerate";
	return startGenAiSpan("generate_content", modelId, {
		...baseAttributes,
		[VERCEL_AI_OPERATION_ID_ATTRIBUTE]: operationId,
		...recordInputs ? buildInputMessageAttributes(event) : {},
		...recordInputs && Array.isArray(event.tools) ? { [Hr]: stringify(event.tools) } : {}
	});
}
function buildToolSpan(event, recordInputs) {
	const toolCall = isObjectLike(event.toolCall) ? event.toolCall : {};
	const toolName = asString(toolCall.toolName);
	const toolCallId = asString(event.toolCallId) ?? asString(toolCall.toolCallId);
	const toolInput = toolCall.input ?? toolCall.args;
	const description = recordInputs && toolName ? resolveToolDescription(asString(event.callId), toolName, event.tools) : void 0;
	return startGenAiSpan("execute_tool", toolName, {
		[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN$1,
		...toolName ? { [Xr]: toolName } : {},
		...toolCallId ? { [GEN_AI_TOOL_CALL_ID_ATTRIBUTE]: toolCallId } : {},
		...description ? { [Br]: description } : {},
		...recordInputs && toolInput !== void 0 ? { [Yr]: stringify(toolInput) } : {}
	});
}
function enrichSpanOnEnd(span, data, channelOptions) {
	const { type, result } = data;
	if (!isObjectLike(result)) return;
	const { recordOutputs } = getRecordingOptions(data.event, channelOptions);
	if (type === "executeTool") {
		if (recordOutputs) span.setAttribute(Vr, stringify(result.output ?? result));
		const output = isObjectLike(result.output) ? result.output : void 0;
		if (output?.type === "tool-error") captureToolError(span, data, output.error);
		return;
	}
	const usage = isObjectLike(result.usage) ? result.usage : void 0;
	if (usage) {
		const inputTokens = tokenCount(usage.inputTokens) ?? tokenCount(usage.promptTokens) ?? tokenCount(usage.tokens);
		const outputTokens = tokenCount(usage.outputTokens) ?? tokenCount(usage.completionTokens);
		const totalTokens = tokenCount(usage.totalTokens) ?? sum(inputTokens, outputTokens);
		if (inputTokens !== void 0) span.setAttribute(is, inputTokens);
		if (outputTokens !== void 0) span.setAttribute(rs, outputTokens);
		if (totalTokens !== void 0) span.setAttribute(ps, totalTokens);
	}
	const finishReason = getFinishReason(result);
	if (finishReason && type === "languageModelCall") span.setAttribute(Rr, stringify([finishReason]));
	const response = isObjectLike(result.response) ? result.response : void 0;
	const responseId = asString(response?.id) ?? asString(result.responseId);
	if (responseId) span.setAttribute(qr, responseId);
	const responseModel = asString(response?.modelId) ?? asString(data.event.modelId);
	if (responseModel) span.setAttribute(Pr, responseModel);
	const providerMetadata = result.providerMetadata;
	const providerAttributes = getProviderMetadataAttributes(providerMetadata);
	if ("gen_ai.conversation.id" in providerAttributes && spanToJSON(span).attributes["gen_ai.conversation.id"]) delete providerAttributes[ir];
	span.setAttributes(providerAttributes);
	if (recordOutputs) {
		const outputMessages = buildOutputMessages(type === "languageModelCall" && Array.isArray(result.content) ? partsFromContent(result.content) : partsFromTextAndToolCalls(result.text, result.toolCalls), finishReason);
		if (outputMessages) span.setAttribute(gr, outputMessages);
	}
}
function normalizeFinishReason(finishReason) {
	return finishReason === "tool-calls" ? "tool_call" : finishReason ?? "stop";
}
function getFinishReason(result) {
	const finishReason = result.finishReason;
	if (typeof finishReason === "string") return finishReason;
	return isObjectLike(finishReason) ? asString(finishReason.unified) : void 0;
}
function tokenCount(value) {
	return asNumber(value) ?? (isObjectLike(value) ? asNumber(value.total) : void 0);
}
function buildOutputMessages(parts, finishReason) {
	if (!parts.length) return;
	return stringify([{
		role: "assistant",
		parts,
		finish_reason: normalizeFinishReason(finishReason)
	}]);
}
function toolCallPart(toolCall) {
	const args = toolCall.input ?? toolCall.args;
	return {
		type: "tool_call",
		id: asString(toolCall.toolCallId),
		name: asString(toolCall.toolName),
		arguments: typeof args === "string" ? args : stringify(args ?? {})
	};
}
function partsFromContent(content) {
	const parts = [];
	for (const item of content) {
		if (!isObjectLike(item)) continue;
		if (item.type === "text" && typeof item.text === "string") parts.push({
			type: "text",
			content: item.text
		});
		else if (item.type === "tool-call") parts.push(toolCallPart(item));
	}
	return parts;
}
function partsFromTextAndToolCalls(text, toolCalls) {
	const parts = [];
	if (typeof text === "string" && text.length) parts.push({
		type: "text",
		content: text
	});
	if (Array.isArray(toolCalls)) {
		for (const toolCall of toolCalls) if (isObjectLike(toolCall)) parts.push(toolCallPart(toolCall));
	}
	return parts;
}
function captureToolError(span, data, error) {
	span.setStatus({
		code: 2,
		message: error instanceof Error ? error.message : "tool_error"
	});
	const toolCall = isObjectLike(data.event.toolCall) ? data.event.toolCall : {};
	const toolName = asString(toolCall.toolName);
	const toolCallId = asString(data.event.toolCallId) ?? asString(toolCall.toolCallId);
	withScope((scope) => {
		scope.setContext("trace", spanToTraceContext(span));
		if (toolName) scope.setTag("vercel.ai.tool.name", toolName);
		if (toolCallId) scope.setTag("vercel.ai.tool.callId", toolCallId);
		scope.setLevel("error");
		captureException(error instanceof Error ? error : new Error(typeof error === "string" ? error : "Tool execution failed"), { mechanism: {
			type: "auto.vercelai.channel",
			handled: false
		} });
	});
}
function getRecordingOptions(event, channelOptions) {
	const genAI = getClient()?.getDataCollectionOptions().genAI;
	return {
		recordInputs: resolveRecording(channelOptions.recordInputs, event.recordInputs, genAI?.inputs),
		recordOutputs: resolveRecording(channelOptions.recordOutputs, event.recordOutputs, genAI?.outputs)
	};
}
function resolveRecording(integrationOption, perCallOption, globalDefault) {
	if (typeof integrationOption === "boolean") return integrationOption;
	if (typeof perCallOption === "boolean") return perCallOption;
	return globalDefault === true;
}
function buildInputMessageAttributes(event) {
	const attributes = {};
	const instructions = asString(event.instructions);
	if (instructions) attributes[Wr] = stringify([{
		type: "text",
		content: instructions
	}]);
	const messages = event.messages ?? event.prompt;
	if (messages !== void 0) attributes[dr] = stringify(messages);
	return attributes;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/vercel-ai/vercel-ai-orchestrion-subscriber.js
var PATCHED = /* @__PURE__ */ Symbol("SentryVercelAiModelPatched");
var TOOL_PATCHED = /* @__PURE__ */ Symbol("SentryVercelAiToolPatched");
var callIdCounter = 0;
function nextCallId() {
	return `v6-${++callIdCounter}`;
}
var messages = /* @__PURE__ */ new WeakMap();
var operationSpans = /* @__PURE__ */ new WeakSet();
var toolCallSpans = /* @__PURE__ */ new WeakSet();
var callIdBySpan = /* @__PURE__ */ new WeakMap();
var recordingBySpan = /* @__PURE__ */ new WeakMap();
var operationErrorInfoBySpan = /* @__PURE__ */ new WeakMap();
var suppressedTelemetry = /* @__PURE__ */ new WeakSet();
var subscribed = false;
function subscribeVercelAiOrchestrionChannels(tracingChannel, options = {}) {
	if (subscribed) return;
	subscribed = true;
	try {
		bindOperation(tracingChannel, CHANNELS.VERCEL_AI_GENERATE_TEXT, buildTextMessage("generateText"), options);
		bindOperation(tracingChannel, CHANNELS.VERCEL_AI_STREAM_TEXT, buildTextMessage("streamText"), options);
		bindOperation(tracingChannel, CHANNELS.VERCEL_AI_GENERATE_OBJECT, buildTextMessage("generateObject"), options);
		bindOperation(tracingChannel, CHANNELS.VERCEL_AI_EMBED, (callOptions, telemetry) => ({
			type: "embed",
			event: {
				callId: nextCallId(),
				...modelFields(callOptions.model),
				maxRetries: callOptions.maxRetries,
				value: callOptions.value,
				...recording(telemetry)
			}
		}), options);
		bindOperation(tracingChannel, CHANNELS.VERCEL_AI_EMBED_MANY, (callOptions, telemetry) => ({
			type: "embedMany",
			event: {
				callId: nextCallId(),
				...modelFields(callOptions.model),
				maxRetries: callOptions.maxRetries,
				values: callOptions.values,
				...recording(telemetry)
			}
		}), options);
		bindOperation(tracingChannel, CHANNELS.VERCEL_AI_EXECUTE_TOOL_CALL, (callOptions, telemetry) => ({
			type: "executeTool",
			event: {
				callId: nextCallId(),
				toolCall: callOptions.toolCall,
				tools: callOptions.tools,
				...recording(telemetry)
			}
		}), options);
		subscribeResolveLanguageModel(tracingChannel, CHANNELS.VERCEL_AI_RESOLVE_LANGUAGE_MODEL, options);
	} catch {
		DEBUG_BUILD$1 && debug$2.log("Vercel AI channel subscription failed.");
	}
}
function bindOperation(tracingChannel, channelName, build, options) {
	const channel = tracingChannel(channelName);
	const buildOperationSpan = (data) => {
		const callOptions = isObjectLike(data.arguments[0]) ? data.arguments[0] : {};
		const telemetry = isObjectLike(callOptions.experimental_telemetry) ? callOptions.experimental_telemetry : {};
		if (telemetry.isEnabled === false && !suppressedTelemetry.has(telemetry)) return;
		const message = build(callOptions, telemetry);
		suppressNativeTelemetry(callOptions, telemetry);
		const callSiteSpan = getActiveSpan$1();
		const span = createSpanFromMessage(message, options);
		if (span) {
			messages.set(data, message);
			operationSpans.add(span);
			const isV4 = isObjectLike(callOptions.model) && callOptions.model.specificationVersion === "v1";
			operationErrorInfoBySpan.set(span, {
				callSiteSpan,
				toolErrorsBubbleToCaller: isV4
			});
			if (message.type === "executeTool") toolCallSpans.add(span);
			const callId = asString(message.event.callId);
			if (callId) callIdBySpan.set(span, callId);
			recordingBySpan.set(span, recording(telemetry));
			if (isObjectLike(callOptions.tools)) patchOperationTools(callOptions.tools, options);
			if (isV4) patchModelMethods(callOptions.model, options);
		}
		return span;
	};
	bindTracingChannelToSpan(channel, (data) => buildOperationSpan(data), {
		beforeSpanEnd: (span, data) => {
			const message = messages.get(data);
			if (!message) return;
			if ("error" in data) {
				const callSiteSpan = operationErrorInfoBySpan.get(span)?.callSiteSpan;
				if (callSiteSpan && isObjectLike(data.error)) addNonEnumerableProperty(data.error, "_sentry_active_span", callSiteSpan);
			} else {
				message.result = message.type === "executeTool" ? { output: data.result } : data.result;
				enrichSpanOnEnd(span, message, options);
			}
			if (message.type !== "streamText") clearOperationId(message);
			messages.delete(data);
		},
		deferSpanEnd: ({ data, end }) => deferStreamTextOperationEnd(data, end)
	});
}
function deferStreamTextOperationEnd(data, end) {
	if (messages.get(data)?.type !== "streamText" || "error" in data || !isStreamingResult(data.result)) return false;
	const streamResult = data.result;
	(async () => {
		try {
			const [usage, text, toolCalls, finishReason, response] = await Promise.all([
				streamResult.totalUsage ?? streamResult.usage,
				streamResult.text,
				streamResult.toolCalls,
				streamResult.finishReason,
				streamResult.response
			]);
			data.result = {
				usage,
				text,
				toolCalls,
				finishReason,
				response
			};
			end();
		} catch (error) {
			end(error);
		}
	})();
	return true;
}
function isStreamingResult(result) {
	return isObjectLike(result) && (isThenable(result.totalUsage) || isThenable(result.usage));
}
function isThenable(value) {
	return isObjectLike(value) && typeof value.then === "function";
}
function suppressNativeTelemetry(callOptions, telemetry) {
	if (telemetry.isEnabled !== true) return;
	const suppressed = {
		...telemetry,
		isEnabled: false
	};
	suppressedTelemetry.add(suppressed);
	callOptions.experimental_telemetry = suppressed;
}
function subscribeResolveLanguageModel(tracingChannel, channelName, options) {
	tracingChannel(channelName).subscribe({
		end(rawCtx) {
			const ctx = rawCtx;
			if (!isObjectLike(ctx.result)) return;
			patchModelMethods(ctx.result, options);
		},
		start() {},
		asyncStart() {},
		asyncEnd() {},
		error() {}
	});
}
function resolveModelCallParent() {
	const active = getActiveSpan$1();
	return active && operationSpans.has(active) ? active : void 0;
}
function patchModelMethods(model, options) {
	if (model[PATCHED]) return;
	model[PATCHED] = true;
	patchModelMethod(model, "doGenerate", options);
	patchModelMethod(model, "doStream", options);
}
function patchModelMethod(model, method, options) {
	const original = model[method];
	if (typeof original !== "function") return;
	model[method] = function(...args) {
		const parent = resolveModelCallParent();
		if (!parent) return Promise.resolve(original.apply(this, args));
		const callArgs = isObjectLike(args[0]) ? args[0] : {};
		const callId = callIdBySpan.get(parent);
		const message = {
			type: "languageModelCall",
			event: {
				callId,
				provider: model.provider,
				modelId: model.modelId,
				tools: callArgs.tools ?? (isObjectLike(callArgs.mode) ? callArgs.mode.tools : void 0),
				messages: callArgs.prompt,
				...recordingBySpan.get(parent)
			}
		};
		const span = withActiveSpan$1(parent, () => createSpanFromMessage(message, options));
		if (!span) return Promise.resolve(original.apply(this, args));
		const clearStreamCallId = () => {
			if (method === "doStream" && callId) clearOperationCallId(callId);
		};
		const failSpan = (error) => {
			span.setStatus({
				code: 2,
				message: error instanceof Error ? error.message : "unknown_error"
			});
			span.end();
			clearStreamCallId();
			throw error;
		};
		try {
			return Promise.resolve(original.apply(this, args)).then((value) => {
				if (method === "doStream" && isObjectLike(value) && isReadableStream(value.stream)) {
					value.stream = tapModelCallStream(value.stream, (final) => {
						message.result = {
							...value,
							...streamedResultToChannelResult(final)
						};
						enrichSpanOnEnd(span, message, options);
						span.end();
						clearStreamCallId();
					}, (error) => {
						span.setStatus({
							code: 2,
							message: error instanceof Error ? error.message : "unknown_error"
						});
						span.end();
						clearStreamCallId();
					});
					return value;
				}
				message.result = value;
				enrichSpanOnEnd(span, message, options);
				span.end();
				clearStreamCallId();
				return value;
			}, failSpan);
		} catch (error) {
			return failSpan(error);
		}
	};
}
function patchOperationTools(tools, options) {
	try {
		for (const [toolName, tool] of Object.entries(tools)) if (isObjectLike(tool)) patchToolExecute(toolName, tool, tools, options);
	} catch {
		DEBUG_BUILD$1 && debug$2.log("Vercel AI tool patching failed.");
	}
}
function patchToolExecute(toolName, tool, tools, options) {
	const original = tool.execute;
	if (typeof original !== "function" || tool[TOOL_PATCHED]) return;
	tool[TOOL_PATCHED] = true;
	tool.execute = function(input, ...rest) {
		const parent = resolveModelCallParent();
		if (!parent || toolCallSpans.has(parent)) return original.apply(this, [input, ...rest]);
		const callOptions = isObjectLike(rest[0]) ? rest[0] : {};
		const message = {
			type: "executeTool",
			event: {
				callId: callIdBySpan.get(parent),
				toolCall: {
					toolName,
					toolCallId: asString(callOptions.toolCallId),
					input
				},
				tools,
				...recordingBySpan.get(parent)
			}
		};
		const span = withActiveSpan$1(parent, () => createSpanFromMessage(message, options));
		if (!span) return original.apply(this, [input, ...rest]);
		const failSpan = (error) => {
			if (operationErrorInfoBySpan.get(parent)?.toolErrorsBubbleToCaller) span.setStatus({
				code: 2,
				message: error instanceof Error ? error.message : "tool_error"
			});
			else captureToolError(span, message, error);
			span.end();
			throw error;
		};
		try {
			return Promise.resolve(original.apply(this, [input, ...rest])).then((value) => {
				message.result = { output: value };
				enrichSpanOnEnd(span, message, options);
				span.end();
				return value;
			}, failSpan);
		} catch (error) {
			return failSpan(error);
		}
	};
}
function buildTextMessage(type) {
	return (options, telemetry) => ({
		type,
		event: {
			callId: nextCallId(),
			operationId: `ai.${type}`,
			functionId: asString(telemetry.functionId),
			...modelFields(options.model),
			maxRetries: options.maxRetries,
			instructions: asString(options.system),
			messages: normalizePromptMessages(options),
			...recording(telemetry)
		}
	});
}
function normalizePromptMessages(options) {
	if (Array.isArray(options.messages)) return options.messages;
	if (typeof options.prompt === "string") return [{
		role: "user",
		content: options.prompt
	}];
	return options.messages ?? options.prompt;
}
function recording(telemetry) {
	const enabledDefault = telemetry.isEnabled === true ? true : void 0;
	return {
		recordInputs: telemetry.recordInputs ?? enabledDefault,
		recordOutputs: telemetry.recordOutputs ?? enabledDefault
	};
}
function modelFields(model) {
	return {
		provider: modelField(model, "provider"),
		modelId: modelField(model, "modelId")
	};
}
function modelField(model, field) {
	return isObjectLike(model) ? asString(model[field]) : void 0;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/vercel-ai/index.js
var _vercelAIIntegration = (options = {}) => {
	return {
		name: "VercelAI",
		setupOnce() {
			if (!diagnosticsChannel.tracingChannel) return;
			waitForTracingChannelBinding(() => {
				subscribeVercelAiTracingChannel(diagnosticsChannel.tracingChannel, options);
			});
		},
		setup(client) {
			invokeOrchestrionInstrumentation(client, vercelAiModuleNames, instrumentVercelAiOrchestrion, [options]);
		}
	};
};
var vercelAIIntegration = defineIntegration(_vercelAIIntegration);
function instrumentVercelAiOrchestrion(options) {
	subscribeVercelAiOrchestrionChannels(diagnosticsChannel.tracingChannel, options);
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/express/route.js
var layerRegisteredPaths = /* @__PURE__ */ new WeakMap();
function setLayerRegisteredPath(layer, path) {
	layerRegisteredPaths.set(layer, path);
}
function getLayerRegisteredPath(layer) {
	return layerRegisteredPaths.get(layer);
}
var requestLayerPaths = /* @__PURE__ */ new WeakMap();
function getStore(req) {
	let store = requestLayerPaths.get(req);
	if (!store) {
		store = [];
		requestLayerPaths.set(req, store);
	}
	return store;
}
function pushLayerPath(req, path) {
	getStore(req).push(path);
}
function popLayerPath(req) {
	getStore(req).pop();
}
function getLayerPath(args) {
	const firstArg = args[0];
	if (Array.isArray(firstArg)) return firstArg.map((segment) => extractLayerPathSegment(segment) ?? "").join(",");
	return extractLayerPathSegment(firstArg);
}
function extractLayerPathSegment(segment) {
	return typeof segment === "string" ? segment : segment instanceof RegExp || typeof segment === "number" ? String(segment) : void 0;
}
function getConstructedRoute(req) {
	const layersStore = getStore(req);
	let constructedRoute = "";
	for (const path of layersStore) {
		if (path === "/" || path === "/*") continue;
		constructedRoute += !constructedRoute || constructedRoute.endsWith("/") ? path : `/${path}`;
	}
	return constructedRoute.replace(/\/{2,}/g, "/");
}
function getActualMatchedRoute(req, constructedRoute) {
	const layersStore = getStore(req);
	if (layersStore.length === 0) return;
	const originalUrl = typeof req.originalUrl === "string" ? req.originalUrl : "";
	if (layersStore.every((path) => path === "/")) return originalUrl === "/" ? "/" : void 0;
	if (constructedRoute === "*") return constructedRoute;
	if (constructedRoute.includes("/") && (constructedRoute.includes(",") || constructedRoute.includes("\\") || constructedRoute.includes("*") || constructedRoute.includes("["))) return constructedRoute;
	const normalizedRoute = constructedRoute.startsWith("/") ? constructedRoute : `/${constructedRoute}`;
	return normalizedRoute.length > 0 && (originalUrl === normalizedRoute || originalUrl.startsWith(normalizedRoute) || isRoutePattern(normalizedRoute)) ? normalizedRoute : void 0;
}
function isRoutePattern(route) {
	return route.includes(":") || route.includes("*");
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/express/utils.js
function getStatusCodeFromResponse(error) {
	const statusCode = error.status || error.statusCode || error.status_code || error.output?.statusCode;
	return statusCode ? parseInt(statusCode, 10) : 500;
}
function defaultShouldHandleError(error) {
	return getStatusCodeFromResponse(error) >= 500;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/express/error-handled.js
var EXPRESS_ERROR_HANDLED = "__sentry_express_error_handled__";
function markExpressErrorHandled(request) {
	if (request && typeof request === "object") addNonEnumerableProperty(request, EXPRESS_ERROR_HANDLED, true);
}
function isExpressErrorHandled(request) {
	return !!(request && typeof request === "object" && request[EXPRESS_ERROR_HANDLED]);
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/express/instrumentation.js
var ORIGIN = "auto.http.express";
var ATTR_EXPRESS_NAME = "express.name";
var ATTR_EXPRESS_TYPE = "express.type";
var EXPRESS_TYPE_TO_SPAN_OP = {
	middleware: tE,
	request_handler: TE,
	router: Xe
};
var NOOP$1 = () => {};
var _isInstrumented = false;
function instrumentExpress(options, tracingChannel) {
	if (_isInstrumented) return;
	_isInstrumented = true;
	for (const channelName of [CHANNELS.EXPRESS_REGISTER, CHANNELS.ROUTER_REGISTER]) tracingChannel(channelName).subscribe({
		start: NOOP$1,
		asyncStart: NOOP$1,
		asyncEnd: NOOP$1,
		error: NOOP$1,
		end: captureRegisteredLayerPath
	});
	for (const channelName of [CHANNELS.EXPRESS_HANDLE, CHANNELS.ROUTER_HANDLE]) {
		const channel = tracingChannel(channelName);
		bindTracingChannelToSpan(channel, (data) => getSpanForLayer(data, options), { beforeSpanEnd(_span, data) {
			data._sentryCleanup?.();
		} });
		channel.subscribe({
			start: NOOP$1,
			asyncEnd: NOOP$1,
			end: NOOP$1,
			error: (data) => captureLayerError(data, options.shouldHandleError),
			asyncStart: popLayerPathForLayer
		});
	}
}
function captureLayerError(data, shouldHandleError) {
	const error = data.error;
	if (!error || error === "route" || error === "router") return;
	const request = data.arguments?.[0];
	if (request) {
		if (isExpressErrorHandled(request)) return;
		markExpressErrorHandled(request);
	}
	if (shouldHandleError === false) return;
	if (!(shouldHandleError ?? defaultShouldHandleError)(error)) return;
	const capture = () => captureException(error, { mechanism: {
		type: "auto.http.express",
		handled: false
	} });
	if (data._sentrySpan) withActiveSpan$1(data._sentrySpan, capture);
	else capture();
}
function captureRegisteredLayerPath(data) {
	const stack = data.self?.stack;
	if (!Array.isArray(stack)) return;
	const layer = stack[stack.length - 1];
	if (layer) setLayerRegisteredPath(layer, getLayerPath(data.arguments ?? []));
}
function popLayerPathForLayer(data) {
	if (!data._sentryStoredLayer) return;
	data._sentryStoredLayer = false;
	const req = data.arguments?.[0];
	if (req) popLayerPath(req);
}
function getSpanForLayer(data, options) {
	const layer = data.self;
	const args = data.arguments;
	if (!layer || !Array.isArray(args)) return;
	if (layer.handle?.length === 4) return;
	if (layer.method && !layer.route) return;
	const req = args[0];
	const res = args[1];
	if (!req) return;
	if (!getActiveSpan$1()) return;
	const type = getLayerType(layer);
	const registeredPath = getLayerRegisteredPath(layer);
	if (registeredPath != null) {
		pushLayerPath(req, registeredPath);
		data._sentryStoredLayer = true;
	}
	const constructedRoute = getConstructedRoute(req);
	const matchedRoute = constructedRoute != null ? getActualMatchedRoute(req, constructedRoute) : void 0;
	const name = type === "request_handler" ? constructedRoute || "request handler" : type === "router" ? layer.path ?? "/" : layer.name ?? "<anonymous>";
	if (matchedRoute) setHttpServerSpanRouteAttribute(matchedRoute);
	if (type === "request_handler" && constructedRoute) {
		const isolationScope = getIsolationScope();
		if (isolationScope !== getDefaultIsolationScope()) {
			const method = typeof req.method === "string" ? req.method.toUpperCase() : "GET";
			isolationScope.setTransactionName(`${method} ${constructedRoute}`);
		} else DEBUG_BUILD$1 && debug$2.warn("[instrumentation:express] Isolation scope is still default isolation scope - skipping transaction name");
	}
	if (isLayerIgnored(name, type, options)) return;
	const client = getClient();
	const isStreamedSpan = !!client && hasSpanStreamingEnabled(client);
	const span = startInactiveSpan({
		name: isStreamedSpan && type === "router" ? matchedRoute || "Router" : isStreamedSpan && type === "request_handler" ? matchedRoute || "Request handler" : name,
		attributes: {
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN,
			[Ed]: EXPRESS_TYPE_TO_SPAN_OP[type],
			[ATTR_EXPRESS_NAME]: name,
			[ATTR_EXPRESS_TYPE]: type,
			...matchedRoute ? { [po]: matchedRoute } : {}
		}
	});
	if (res && typeof res.once === "function") {
		const onFinish = () => {
			span.end();
		};
		res.once("finish", onFinish);
		data._sentryCleanup = () => res.removeListener("finish", onFinish);
	}
	return span;
}
function getLayerType(layer) {
	if (layer.name === "router") return "router";
	if (layer.name === "bound dispatch" || layer.name === "handle") return "request_handler";
	return "middleware";
}
function isLayerIgnored(name, type, options) {
	const { ignoreLayers, ignoreLayersType } = options;
	if (Array.isArray(ignoreLayersType) && ignoreLayersType.includes(type)) return true;
	if (!Array.isArray(ignoreLayers)) return false;
	try {
		return stringMatchesSomePattern(name, ignoreLayers, true);
	} catch {
		return false;
	}
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/express/index.js
var INTEGRATION_NAME$11 = "Express";
var _expressIntegration = (options = {}) => {
	return {
		name: INTEGRATION_NAME$11,
		setup(client) {
			invokeOrchestrionInstrumentation(client, expressModuleNames, instrumentExpress, [options, diagnosticsChannel.tracingChannel]);
		}
	};
};
var expressIntegration = defineIntegration(_expressIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/firebase/firestore.js
function startFirestoreSpan(spanName, reference) {
	return startInactiveSpan({
		name: `${spanName} ${reference.path}`,
		attributes: {
			[Ed]: _e,
			[dd]: "client",
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.firebase.firestore",
			[ea]: spanName,
			...buildAttributes(reference)
		}
	});
}
function getPortAndAddress(settings) {
	let address;
	let port;
	if (typeof settings.host === "string") {
		if (settings.host.startsWith("[")) {
			if (settings.host.endsWith("]")) address = settings.host.replace(/^\[|\]$/g, "");
			else if (settings.host.includes("]:")) {
				const lastColonIndex = settings.host.lastIndexOf(":");
				if (lastColonIndex !== -1) {
					address = settings.host.slice(1, lastColonIndex).replace(/^\[|\]$/g, "");
					port = settings.host.slice(lastColonIndex + 1);
				}
			}
		} else if (net.isIPv6(settings.host)) address = settings.host;
		else {
			const lastColonIndex = settings.host.lastIndexOf(":");
			if (lastColonIndex !== -1) {
				address = settings.host.slice(0, lastColonIndex);
				port = settings.host.slice(lastColonIndex + 1);
			} else address = settings.host;
		}
	}
	return {
		address,
		port: port ? parseInt(port, 10) : void 0
	};
}
function buildAttributes(reference) {
	const firestoreApp = reference.firestore.app;
	const firestoreOptions = firestoreApp.options;
	const settings = reference.firestore.toJSON()?.settings || {};
	const attributes = {
		[Bi]: reference.path,
		[Ji]: firestoreApp.name,
		[ga]: "firebase.firestore",
		"firebase.firestore.type": reference.type,
		"firebase.firestore.options.projectId": firestoreOptions.projectId,
		"firebase.firestore.options.appId": firestoreOptions.appId,
		"firebase.firestore.options.messagingSenderId": firestoreOptions.messagingSenderId,
		"firebase.firestore.options.storageBucket": firestoreOptions.storageBucket
	};
	const { address, port } = getPortAndAddress(settings);
	if (address) attributes[mu] = address;
	if (port) attributes[bu] = port;
	return attributes;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/firebase/functions.js
var FUNCTIONS_ORIGIN = "auto.firebase.functions";
var WRAPPED = "__sentryFirebaseWrapped";
function wrapFunctionsRegistration(data, triggerType) {
	const args = data.arguments;
	if (!Array.isArray(args) || args.length === 0) return;
	const handlerIndex = typeof args[0] === "function" ? 0 : 1;
	const handler = args[handlerIndex];
	if (typeof handler !== "function" || handler[WRAPPED]) return;
	args[handlerIndex] = wrapHandler(handler, triggerType);
}
function wrapHandler(handler, triggerType) {
	const wrapped = async function(...handlerArgs) {
		const functionName = process.env.FUNCTION_TARGET || process.env.K_SERVICE || "unknown";
		const attributes = {
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: FUNCTIONS_ORIGIN,
			[En]: functionName,
			[Nn]: triggerType,
			"faas.provider": "firebase",
			[dd]: "server",
			[Ed]: Ue$1,
			[jd]: "component"
		};
		if (process.env.GCLOUD_PROJECT) attributes["cloud.project_id"] = process.env.GCLOUD_PROJECT;
		if (process.env.EVENTARC_CLOUD_EVENT_SOURCE) attributes["cloud.event_source"] = process.env.EVENTARC_CLOUD_EVENT_SOURCE;
		return startSpanManual({
			name: `firebase.function.${triggerType}`,
			attributes
		}, async (span) => {
			try {
				const result = await handler.apply(this, handlerArgs);
				span.end();
				return result;
			} catch (error) {
				span.setStatus({ code: 2 });
				captureException(error, { mechanism: {
					type: FUNCTIONS_ORIGIN,
					handled: false
				} });
				span.end();
				await flush(2e3);
				throw error;
			}
		});
	};
	wrapped[WRAPPED] = true;
	return wrapped;
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/firebase/instrumentation.js
var FIRESTORE_OPERATIONS = [
	{
		channel: CHANNELS.FIREBASE_FIRESTORE_ADD_DOC,
		spanName: "addDoc",
		useParent: false
	},
	{
		channel: CHANNELS.FIREBASE_FIRESTORE_GET_DOCS,
		spanName: "getDocs",
		useParent: false
	},
	{
		channel: CHANNELS.FIREBASE_FIRESTORE_SET_DOC,
		spanName: "setDoc",
		useParent: true
	},
	{
		channel: CHANNELS.FIREBASE_FIRESTORE_DELETE_DOC,
		spanName: "deleteDoc",
		useParent: true
	}
];
var FUNCTIONS_TRIGGERS = [
	{
		channel: CHANNELS.FIREBASE_FUNCTIONS_HTTP_REQUEST,
		triggerType: "http.request"
	},
	{
		channel: CHANNELS.FIREBASE_FUNCTIONS_HTTP_CALL,
		triggerType: "http.call"
	},
	{
		channel: CHANNELS.FIREBASE_FUNCTIONS_FIRESTORE_CREATED,
		triggerType: "firestore.document.created"
	},
	{
		channel: CHANNELS.FIREBASE_FUNCTIONS_FIRESTORE_UPDATED,
		triggerType: "firestore.document.updated"
	},
	{
		channel: CHANNELS.FIREBASE_FUNCTIONS_FIRESTORE_DELETED,
		triggerType: "firestore.document.deleted"
	},
	{
		channel: CHANNELS.FIREBASE_FUNCTIONS_FIRESTORE_WRITTEN,
		triggerType: "firestore.document.written"
	},
	{
		channel: CHANNELS.FIREBASE_FUNCTIONS_SCHEDULER,
		triggerType: "scheduler.scheduled"
	},
	{
		channel: CHANNELS.FIREBASE_FUNCTIONS_STORAGE_FINALIZED,
		triggerType: "storage.object.finalized"
	},
	{
		channel: CHANNELS.FIREBASE_FUNCTIONS_STORAGE_ARCHIVED,
		triggerType: "storage.object.archived"
	},
	{
		channel: CHANNELS.FIREBASE_FUNCTIONS_STORAGE_DELETED,
		triggerType: "storage.object.deleted"
	},
	{
		channel: CHANNELS.FIREBASE_FUNCTIONS_STORAGE_METADATA_UPDATED,
		triggerType: "storage.object.metadataUpdated"
	}
];
var NOOP = () => {};
function instrumentFirebase() {
	for (const { channel, spanName, useParent } of FIRESTORE_OPERATIONS) bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(channel), (data) => safeChannelCallback(() => {
		const reference = data.arguments[0];
		if (!reference) return;
		const spanReference = useParent ? reference.parent || reference : reference;
		return startFirestoreSpan(spanName, spanReference);
	}));
	for (const { channel, triggerType } of FUNCTIONS_TRIGGERS) diagnosticsChannel.tracingChannel(channel).subscribe({
		start: (data) => safeChannelCallback(() => wrapFunctionsRegistration(data, triggerType)),
		end: NOOP,
		asyncStart: NOOP,
		asyncEnd: NOOP,
		error: NOOP
	});
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/firebase/index.js
var INTEGRATION_NAME$10 = "Firebase";
var _firebaseIntegration = () => {
	return {
		name: INTEGRATION_NAME$10,
		setup(client) {
			invokeOrchestrionInstrumentation(client, firebaseModuleNames, instrumentFirebase, []);
		}
	};
};
var firebaseIntegration = defineIntegration(_firebaseIntegration);
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/integrations/index.js
function getTracingIntegrations() {
	return [
		graphqlIntegration(),
		mongoIntegration(),
		mongooseIntegration(),
		mysqlIntegration(),
		mysql2Integration(),
		redisIntegration(),
		postgresIntegration(),
		prismaIntegration(),
		tediousIntegration(),
		genericPoolIntegration(),
		kafkaIntegration(),
		amqplibIntegration(),
		lruMemoizerIntegration(),
		awsIntegration(),
		langChainIntegration(),
		langGraphIntegration(),
		vercelAIIntegration(),
		openAIIntegration(),
		anthropicAIIntegration(),
		googleGenAIIntegration(),
		postgresJsIntegration(),
		firebaseIntegration()
	];
}
function getErrorIntegrations() {
	return [
		expressIntegration(),
		fastifyIntegration(),
		hapiIntegration(),
		koaIntegration()
	];
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/orchestrion/config/index.js
var SENTRY_INSTRUMENTATIONS = [
	...amqplibConfig,
	...anthropicAiConfig,
	...awsSdkConfig,
	...dataloaderConfig,
	...expressConfig,
	...firebaseConfig,
	...genericPoolConfig,
	...googleGenAiConfig,
	...graphqlConfig,
	...hapiConfig,
	...ioredisConfig,
	...kafkajsConfig,
	...knexConfig,
	...koaConfig,
	...langchainConfig,
	...langgraphConfig,
	...lruMemoizerConfig,
	...mongodbConfig,
	...mongooseConfig,
	...mysql2Config,
	...mysqlConfig,
	...nestjsConfig,
	...openaiConfig,
	...pgConfig,
	...postgresJsConfig,
	...redisConfig,
	...remixConfig,
	...tediousConfig,
	...vercelAiConfig
];
function instrumentedModuleNames(instrumentations = []) {
	return [...uniq([...SENTRY_INSTRUMENTATIONS, ...instrumentations].map((i) => i.module.name)), "@remix-run/node"];
}
instrumentedModuleNames();
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/_virtual/_commonjsHelpers.js
function getDefaultExportFromCjs(x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/semifies/index.js
var semifies$1 = satisfies;
function satisfies(v, t) {
	const [version] = parse$5(v, "");
	for (const checks of compile(t)) if (checkAll(checks, version)) return true;
	return false;
}
function checkAll(checks, v) {
	for (const [ok2, t] of checks) if (!test(v, t, ok2)) return false;
	return true;
}
function match(t) {
	if (t === "latest") t = ">=0";
	return t.match(/^([^\d+]*)(\d.*)$/) || [
		null,
		"",
		"*.*.*"
	];
}
function compile(t) {
	const result = [];
	let checks = [];
	const tokens = t.trim().split(/\s+/);
	for (let i = 0; i < tokens.length; i++) {
		const t2 = tokens[i];
		if (t2 === "-") continue;
		if (t2 === "||") {
			result.push(checks);
			checks = [];
			continue;
		}
		if (/^[<>=~v^]+$/.test(t2) && i + 1 < tokens.length) {
			tokens[i + 1] = t2 + tokens[i + 1];
			continue;
		}
		const res = match(t2);
		let cmp = res[1] || "=";
		if (cmp.endsWith("v")) cmp = cmp.slice(0, -1);
		let [v, c] = parse$5(res[2], cmp);
		if (i + 2 < tokens.length && tokens[i + 1] === "-") {
			const m = match(tokens[i + 2]);
			tokens[i + 2] = "<=" + (m[2].indexOf("-") === -1 ? m[2] + ".*.*" : m[2]);
			c = ">=";
		}
		if (c[0] === "~") {
			const digs = res[2].split("-")[0].split(".").length;
			checks.push([">=", v]);
			checks.push(["<", digs === 1 ? inc(v, 0) : digs === 2 ? inc(v, 1) : inc(v, 1)]);
		} else if (c[0] === "^") {
			const digs = v[0] !== 0 ? 0 : v[1] !== 0 ? 1 : 2;
			checks.push([">=", v]);
			checks.push(["<", digs === 0 ? inc(v, 0) : digs === 1 ? inc(v, 1) : inc(v, 2)]);
		} else checks.push([c.replace("~", "").replace("^", ""), v]);
	}
	if (checks.length) result.push(checks);
	return result;
}
function inc(v, n) {
	const cpy = v.slice(0);
	if (v[n] === -1) return cpy;
	cpy[n++]++;
	for (; n < 3; n++) cpy[n] = 0;
	return cpy;
}
function num(n) {
	return n === "x" || n === "X" || n === "*" || n === "latest" ? -1 : Number(n);
}
function numOrString(s) {
	return /^\d+$/.test(s) ? Number(s) : s;
}
function ok(c, a, b) {
	return b === -1 ? c !== "<" : c === "=" ? a === b : c === ">" ? a > b : c === ">=" ? a >= b : c === "<" ? a < b : c === "<=" ? a <= b : false;
}
function parse$5(v, c) {
	v = v.split("+")[0];
	const [a, b] = v.split("-");
	const nums = a.split(".").map(num).slice(0, 3);
	const last = Math.max(nums.length - 1, 0);
	if (c === ">") {
		c = ">=";
		nums.push(0, 0, 0);
		nums[last]++;
	} else if (c === "") nums.push(0, 0, 0);
	else nums.push(-1, -1, -1);
	if (!b) return [nums.slice(0, 3), c];
	return [nums.slice(0, 3).concat(b.split(".").map(numOrString)), c];
}
function test(v, t, c) {
	if (!ok("=", v[0], t[0])) return ok(c, v[0], t[0]);
	if (!ok("=", v[1], t[1])) return ok(c, v[1], t[1]);
	if (!ok("=", v[2], t[2])) return ok(c, v[2], t[2]);
	if (v.length === 3 && t.length === 3) return ok(c, v[2], t[2]);
	if (c[0] === "<" && (t.length === 3 || v.length === 3)) return false;
	if (c[0] === ">") {
		if (v.length === 3) return true;
		if (t.length === 3) return false;
	}
	for (let i = 3; i < Math.max(v.length, t.length); i++) if (ok(c, v[i] || "", t[i] || "")) return true;
	return false;
}
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/esquery/dist/esquery.esm.min.js
function e(e2, t2) {
	(null == t2 || t2 > e2.length) && (t2 = e2.length);
	for (var r2 = 0, n2 = Array(t2); r2 < t2; r2++) n2[r2] = e2[r2];
	return n2;
}
function t(e2, t2) {
	return function(e3) {
		if (Array.isArray(e3)) return e3;
	}(e2) || function(e3, t3) {
		var r2 = null == e3 ? null : "undefined" != typeof Symbol && e3[Symbol.iterator] || e3["@@iterator"];
		if (null != r2) {
			var n2, o2, a2, i2, s2 = [], u2 = true, l2 = false;
			try {
				if (a2 = (r2 = r2.call(e3)).next, 0 === t3);
				else for (; !(u2 = (n2 = a2.call(r2)).done) && (s2.push(n2.value), s2.length !== t3); u2 = true);
			} catch (e4) {
				l2 = true, o2 = e4;
			} finally {
				try {
					if (!u2 && null != r2.return && (i2 = r2.return(), Object(i2) !== i2)) return;
				} finally {
					if (l2) throw o2;
				}
			}
			return s2;
		}
	}(e2, t2) || o(e2, t2) || function() {
		throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}();
}
function r(t2) {
	return function(t3) {
		if (Array.isArray(t3)) return e(t3);
	}(t2) || function(e2) {
		if ("undefined" != typeof Symbol && null != e2[Symbol.iterator] || null != e2["@@iterator"]) return Array.from(e2);
	}(t2) || o(t2) || function() {
		throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}();
}
function n(e2) {
	return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e3) {
		return typeof e3;
	} : function(e3) {
		return e3 && "function" == typeof Symbol && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
	})(e2);
}
function o(t2, r2) {
	if (t2) {
		if ("string" == typeof t2) return e(t2, r2);
		var n2 = {}.toString.call(t2).slice(8, -1);
		return "Object" === n2 && t2.constructor && (n2 = t2.constructor.name), "Map" === n2 || "Set" === n2 ? Array.from(t2) : "Arguments" === n2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? e(t2, r2) : void 0;
	}
}
function a(e2, t2) {
	return e2(t2 = { exports: {} }, t2.exports), t2.exports;
}
var i = a(function(e2, t2) {
	(function e3(t3) {
		var r2, n2, o2, a2, i2, s2;
		function u2(e4) {
			var t4, r3, n3 = {};
			for (t4 in e4) e4.hasOwnProperty(t4) && (r3 = e4[t4], n3[t4] = "object" == typeof r3 && null !== r3 ? u2(r3) : r3);
			return n3;
		}
		function l2(e4, t4) {
			this.parent = e4, this.key = t4;
		}
		function c2(e4, t4, r3, n3) {
			this.node = e4, this.path = t4, this.wrap = r3, this.ref = n3;
		}
		function f2() {}
		function p2(e4) {
			return null != e4 && "object" == typeof e4 && "string" == typeof e4.type;
		}
		function h2(e4, t4) {
			return (e4 === r2.ObjectExpression || e4 === r2.ObjectPattern) && "properties" === t4;
		}
		function y2(e4, t4) {
			for (var r3 = e4.length - 1; r3 >= 0; --r3) if (e4[r3].node === t4) return true;
			return false;
		}
		function d2(e4, t4) {
			return new f2().traverse(e4, t4);
		}
		function m2(e4, t4) {
			var r3 = function(e5, t5) {
				var r4, n3 = e5.length, o3 = 0, a3;
				for (; n3;) t5(e5[a3 = o3 + (r4 = n3 >>> 1)]) ? n3 = r4 : (o3 = a3 + 1, n3 -= r4 + 1);
				return o3;
			}(t4, function(t5) {
				return t5.range[0] > e4.range[0];
			});
			return e4.extendedRange = [e4.range[0], e4.range[1]], r3 !== t4.length && (e4.extendedRange[1] = t4[r3].range[0]), (r3 -= 1) >= 0 && (e4.extendedRange[0] = t4[r3].range[1]), e4;
		}
		return r2 = {
			AssignmentExpression: "AssignmentExpression",
			AssignmentPattern: "AssignmentPattern",
			ArrayExpression: "ArrayExpression",
			ArrayPattern: "ArrayPattern",
			ArrowFunctionExpression: "ArrowFunctionExpression",
			AwaitExpression: "AwaitExpression",
			BlockStatement: "BlockStatement",
			BinaryExpression: "BinaryExpression",
			BreakStatement: "BreakStatement",
			CallExpression: "CallExpression",
			CatchClause: "CatchClause",
			ChainExpression: "ChainExpression",
			ClassBody: "ClassBody",
			ClassDeclaration: "ClassDeclaration",
			ClassExpression: "ClassExpression",
			ComprehensionBlock: "ComprehensionBlock",
			ComprehensionExpression: "ComprehensionExpression",
			ConditionalExpression: "ConditionalExpression",
			ContinueStatement: "ContinueStatement",
			DebuggerStatement: "DebuggerStatement",
			DirectiveStatement: "DirectiveStatement",
			DoWhileStatement: "DoWhileStatement",
			EmptyStatement: "EmptyStatement",
			ExportAllDeclaration: "ExportAllDeclaration",
			ExportDefaultDeclaration: "ExportDefaultDeclaration",
			ExportNamedDeclaration: "ExportNamedDeclaration",
			ExportSpecifier: "ExportSpecifier",
			ExpressionStatement: "ExpressionStatement",
			ForStatement: "ForStatement",
			ForInStatement: "ForInStatement",
			ForOfStatement: "ForOfStatement",
			FunctionDeclaration: "FunctionDeclaration",
			FunctionExpression: "FunctionExpression",
			GeneratorExpression: "GeneratorExpression",
			Identifier: "Identifier",
			IfStatement: "IfStatement",
			ImportExpression: "ImportExpression",
			ImportDeclaration: "ImportDeclaration",
			ImportDefaultSpecifier: "ImportDefaultSpecifier",
			ImportNamespaceSpecifier: "ImportNamespaceSpecifier",
			ImportSpecifier: "ImportSpecifier",
			Literal: "Literal",
			LabeledStatement: "LabeledStatement",
			LogicalExpression: "LogicalExpression",
			MemberExpression: "MemberExpression",
			MetaProperty: "MetaProperty",
			MethodDefinition: "MethodDefinition",
			ModuleSpecifier: "ModuleSpecifier",
			NewExpression: "NewExpression",
			ObjectExpression: "ObjectExpression",
			ObjectPattern: "ObjectPattern",
			PrivateIdentifier: "PrivateIdentifier",
			Program: "Program",
			Property: "Property",
			PropertyDefinition: "PropertyDefinition",
			RestElement: "RestElement",
			ReturnStatement: "ReturnStatement",
			SequenceExpression: "SequenceExpression",
			SpreadElement: "SpreadElement",
			Super: "Super",
			SwitchStatement: "SwitchStatement",
			SwitchCase: "SwitchCase",
			TaggedTemplateExpression: "TaggedTemplateExpression",
			TemplateElement: "TemplateElement",
			TemplateLiteral: "TemplateLiteral",
			ThisExpression: "ThisExpression",
			ThrowStatement: "ThrowStatement",
			TryStatement: "TryStatement",
			UnaryExpression: "UnaryExpression",
			UpdateExpression: "UpdateExpression",
			VariableDeclaration: "VariableDeclaration",
			VariableDeclarator: "VariableDeclarator",
			WhileStatement: "WhileStatement",
			WithStatement: "WithStatement",
			YieldExpression: "YieldExpression"
		}, o2 = {
			AssignmentExpression: ["left", "right"],
			AssignmentPattern: ["left", "right"],
			ArrayExpression: ["elements"],
			ArrayPattern: ["elements"],
			ArrowFunctionExpression: ["params", "body"],
			AwaitExpression: ["argument"],
			BlockStatement: ["body"],
			BinaryExpression: ["left", "right"],
			BreakStatement: ["label"],
			CallExpression: ["callee", "arguments"],
			CatchClause: ["param", "body"],
			ChainExpression: ["expression"],
			ClassBody: ["body"],
			ClassDeclaration: [
				"id",
				"superClass",
				"body"
			],
			ClassExpression: [
				"id",
				"superClass",
				"body"
			],
			ComprehensionBlock: ["left", "right"],
			ComprehensionExpression: [
				"blocks",
				"filter",
				"body"
			],
			ConditionalExpression: [
				"test",
				"consequent",
				"alternate"
			],
			ContinueStatement: ["label"],
			DebuggerStatement: [],
			DirectiveStatement: [],
			DoWhileStatement: ["body", "test"],
			EmptyStatement: [],
			ExportAllDeclaration: ["source"],
			ExportDefaultDeclaration: ["declaration"],
			ExportNamedDeclaration: [
				"declaration",
				"specifiers",
				"source"
			],
			ExportSpecifier: ["exported", "local"],
			ExpressionStatement: ["expression"],
			ForStatement: [
				"init",
				"test",
				"update",
				"body"
			],
			ForInStatement: [
				"left",
				"right",
				"body"
			],
			ForOfStatement: [
				"left",
				"right",
				"body"
			],
			FunctionDeclaration: [
				"id",
				"params",
				"body"
			],
			FunctionExpression: [
				"id",
				"params",
				"body"
			],
			GeneratorExpression: [
				"blocks",
				"filter",
				"body"
			],
			Identifier: [],
			IfStatement: [
				"test",
				"consequent",
				"alternate"
			],
			ImportExpression: ["source"],
			ImportDeclaration: ["specifiers", "source"],
			ImportDefaultSpecifier: ["local"],
			ImportNamespaceSpecifier: ["local"],
			ImportSpecifier: ["imported", "local"],
			Literal: [],
			LabeledStatement: ["label", "body"],
			LogicalExpression: ["left", "right"],
			MemberExpression: ["object", "property"],
			MetaProperty: ["meta", "property"],
			MethodDefinition: ["key", "value"],
			ModuleSpecifier: [],
			NewExpression: ["callee", "arguments"],
			ObjectExpression: ["properties"],
			ObjectPattern: ["properties"],
			PrivateIdentifier: [],
			Program: ["body"],
			Property: ["key", "value"],
			PropertyDefinition: ["key", "value"],
			RestElement: ["argument"],
			ReturnStatement: ["argument"],
			SequenceExpression: ["expressions"],
			SpreadElement: ["argument"],
			Super: [],
			SwitchStatement: ["discriminant", "cases"],
			SwitchCase: ["test", "consequent"],
			TaggedTemplateExpression: ["tag", "quasi"],
			TemplateElement: [],
			TemplateLiteral: ["quasis", "expressions"],
			ThisExpression: [],
			ThrowStatement: ["argument"],
			TryStatement: [
				"block",
				"handler",
				"finalizer"
			],
			UnaryExpression: ["argument"],
			UpdateExpression: ["argument"],
			VariableDeclaration: ["declarations"],
			VariableDeclarator: ["id", "init"],
			WhileStatement: ["test", "body"],
			WithStatement: ["object", "body"],
			YieldExpression: ["argument"]
		}, n2 = {
			Break: a2 = {},
			Skip: i2 = {},
			Remove: s2 = {}
		}, l2.prototype.replace = function(e4) {
			this.parent[this.key] = e4;
		}, l2.prototype.remove = function() {
			return Array.isArray(this.parent) ? (this.parent.splice(this.key, 1), true) : (this.replace(null), false);
		}, f2.prototype.path = function() {
			var e4, t4, r3, n3, o3;
			function a3(e5, t5) {
				if (Array.isArray(t5)) for (r3 = 0, n3 = t5.length; r3 < n3; ++r3) e5.push(t5[r3]);
				else e5.push(t5);
			}
			if (!this.__current.path) return null;
			for (o3 = [], e4 = 2, t4 = this.__leavelist.length; e4 < t4; ++e4) a3(o3, this.__leavelist[e4].path);
			return a3(o3, this.__current.path), o3;
		}, f2.prototype.type = function() {
			return this.current().type || this.__current.wrap;
		}, f2.prototype.parents = function() {
			var e4, t4, r3 = [];
			for (e4 = 1, t4 = this.__leavelist.length; e4 < t4; ++e4) r3.push(this.__leavelist[e4].node);
			return r3;
		}, f2.prototype.current = function() {
			return this.__current.node;
		}, f2.prototype.__execute = function(e4, t4) {
			var r3, n3 = void 0;
			return r3 = this.__current, this.__current = t4, this.__state = null, e4 && (n3 = e4.call(this, t4.node, this.__leavelist[this.__leavelist.length - 1].node)), this.__current = r3, n3;
		}, f2.prototype.notify = function(e4) {
			this.__state = e4;
		}, f2.prototype.skip = function() {
			this.notify(i2);
		}, f2.prototype.break = function() {
			this.notify(a2);
		}, f2.prototype.remove = function() {
			this.notify(s2);
		}, f2.prototype.__initialize = function(e4, t4) {
			this.visitor = t4, this.root = e4, this.__worklist = [], this.__leavelist = [], this.__current = null, this.__state = null, this.__fallback = null, "iteration" === t4.fallback ? this.__fallback = Object.keys : "function" == typeof t4.fallback && (this.__fallback = t4.fallback), this.__keys = o2, t4.keys && (this.__keys = Object.assign(Object.create(this.__keys), t4.keys));
		}, f2.prototype.traverse = function(e4, t4) {
			var r3, n3, o3, s3, u3, l3, f3, d3, m3, x2, v2, g2;
			for (this.__initialize(e4, t4), g2 = {}, r3 = this.__worklist, n3 = this.__leavelist, r3.push(new c2(e4, null, null, null)), n3.push(new c2(null, null, null, null)); r3.length;) if ((o3 = r3.pop()) !== g2) {
				if (o3.node) {
					if (l3 = this.__execute(t4.enter, o3), this.__state === a2 || l3 === a2) return;
					if (r3.push(g2), n3.push(o3), this.__state === i2 || l3 === i2) continue;
					if (u3 = (s3 = o3.node).type || o3.wrap, !(x2 = this.__keys[u3])) {
						if (!this.__fallback) throw new Error("Unknown node type " + u3 + ".");
						x2 = this.__fallback(s3);
					}
					for (d3 = x2.length; (d3 -= 1) >= 0;) if (v2 = s3[f3 = x2[d3]]) {
						if (Array.isArray(v2)) {
							for (m3 = v2.length; (m3 -= 1) >= 0;) if (v2[m3] && !y2(n3, v2[m3])) {
								if (h2(u3, x2[d3])) o3 = new c2(v2[m3], [f3, m3], "Property", null);
								else {
									if (!p2(v2[m3])) continue;
									o3 = new c2(v2[m3], [f3, m3], null, null);
								}
								r3.push(o3);
							}
						} else if (p2(v2)) {
							if (y2(n3, v2)) continue;
							r3.push(new c2(v2, f3, null, null));
						}
					}
				}
			} else if (o3 = n3.pop(), l3 = this.__execute(t4.leave, o3), this.__state === a2 || l3 === a2) return;
		}, f2.prototype.replace = function(e4, t4) {
			var r3, n3, o3, u3, f3, y3, d3, m3, x2, v2, g2, A2, E;
			function b(e5) {
				var t5, n4, o4, a3;
				if (e5.ref.remove()) {
					for (n4 = e5.ref.key, a3 = e5.ref.parent, t5 = r3.length; t5--;) if ((o4 = r3[t5]).ref && o4.ref.parent === a3) {
						if (o4.ref.key < n4) break;
						--o4.ref.key;
					}
				}
			}
			for (this.__initialize(e4, t4), g2 = {}, r3 = this.__worklist, n3 = this.__leavelist, y3 = new c2(e4, null, null, new l2(A2 = { root: e4 }, "root")), r3.push(y3), n3.push(y3); r3.length;) if ((y3 = r3.pop()) !== g2) {
				if (void 0 !== (f3 = this.__execute(t4.enter, y3)) && f3 !== a2 && f3 !== i2 && f3 !== s2 && (y3.ref.replace(f3), y3.node = f3), this.__state !== s2 && f3 !== s2 || (b(y3), y3.node = null), this.__state === a2 || f3 === a2) return A2.root;
				if ((o3 = y3.node) && (r3.push(g2), n3.push(y3), this.__state !== i2 && f3 !== i2)) {
					if (u3 = o3.type || y3.wrap, !(x2 = this.__keys[u3])) {
						if (!this.__fallback) throw new Error("Unknown node type " + u3 + ".");
						x2 = this.__fallback(o3);
					}
					for (d3 = x2.length; (d3 -= 1) >= 0;) if (v2 = o3[E = x2[d3]]) if (Array.isArray(v2)) {
						for (m3 = v2.length; (m3 -= 1) >= 0;) if (v2[m3]) {
							if (h2(u3, x2[d3])) y3 = new c2(v2[m3], [E, m3], "Property", new l2(v2, m3));
							else {
								if (!p2(v2[m3])) continue;
								y3 = new c2(v2[m3], [E, m3], null, new l2(v2, m3));
							}
							r3.push(y3);
						}
					} else p2(v2) && r3.push(new c2(v2, E, null, new l2(o3, E)));
				}
			} else if (y3 = n3.pop(), void 0 !== (f3 = this.__execute(t4.leave, y3)) && f3 !== a2 && f3 !== i2 && f3 !== s2 && y3.ref.replace(f3), this.__state !== s2 && f3 !== s2 || b(y3), this.__state === a2 || f3 === a2) return A2.root;
			return A2.root;
		}, t3.Syntax = r2, t3.traverse = d2, t3.replace = function(e4, t4) {
			return new f2().replace(e4, t4);
		}, t3.attachComments = function(e4, t4, r3) {
			var o3, a3, i3, s3, l3 = [];
			if (!e4.range) throw new Error("attachComments needs range information");
			if (!r3.length) {
				if (t4.length) {
					for (i3 = 0, a3 = t4.length; i3 < a3; i3 += 1) (o3 = u2(t4[i3])).extendedRange = [0, e4.range[0]], l3.push(o3);
					e4.leadingComments = l3;
				}
				return e4;
			}
			for (i3 = 0, a3 = t4.length; i3 < a3; i3 += 1) l3.push(m2(u2(t4[i3]), r3));
			return s3 = 0, d2(e4, { enter: function(e5) {
				for (var t5; s3 < l3.length && !((t5 = l3[s3]).extendedRange[1] > e5.range[0]);) t5.extendedRange[1] === e5.range[0] ? (e5.leadingComments || (e5.leadingComments = []), e5.leadingComments.push(t5), l3.splice(s3, 1)) : s3 += 1;
				return s3 === l3.length ? n2.Break : l3[s3].extendedRange[0] > e5.range[1] ? n2.Skip : void 0;
			} }), s3 = 0, d2(e4, { leave: function(e5) {
				for (var t5; s3 < l3.length && (t5 = l3[s3], !(e5.range[1] < t5.extendedRange[0]));) e5.range[1] === t5.extendedRange[0] ? (e5.trailingComments || (e5.trailingComments = []), e5.trailingComments.push(t5), l3.splice(s3, 1)) : s3 += 1;
				return s3 === l3.length ? n2.Break : l3[s3].extendedRange[0] > e5.range[1] ? n2.Skip : void 0;
			} }), e4;
		}, t3.VisitorKeys = o2, t3.VisitorOption = n2, t3.Controller = f2, t3.cloneEnvironment = function() {
			return e3({});
		}, t3;
	})(t2);
});
var s$1 = a(function(e2) {
	e2.exports && (e2.exports = function() {
		function e3(t2, r2, n2, o2) {
			this.message = t2, this.expected = r2, this.found = n2, this.location = o2, this.name = "SyntaxError", "function" == typeof Error.captureStackTrace && Error.captureStackTrace(this, e3);
		}
		return function(e4, t2) {
			function r2() {
				this.constructor = e4;
			}
			r2.prototype = t2.prototype, e4.prototype = new r2();
		}(e3, Error), e3.buildMessage = function(e4, t2) {
			var r2 = {
				literal: function(e5) {
					return "\"" + o2(e5.text) + "\"";
				},
				class: function(e5) {
					var t3, r3 = "";
					for (t3 = 0; t3 < e5.parts.length; t3++) r3 += e5.parts[t3] instanceof Array ? a2(e5.parts[t3][0]) + "-" + a2(e5.parts[t3][1]) : a2(e5.parts[t3]);
					return "[" + (e5.inverted ? "^" : "") + r3 + "]";
				},
				any: function(e5) {
					return "any character";
				},
				end: function(e5) {
					return "end of input";
				},
				other: function(e5) {
					return e5.description;
				}
			};
			function n2(e5) {
				return e5.charCodeAt(0).toString(16).toUpperCase();
			}
			function o2(e5) {
				return e5.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(e6) {
					return "\\x0" + n2(e6);
				}).replace(/[\x10-\x1F\x7F-\x9F]/g, function(e6) {
					return "\\x" + n2(e6);
				});
			}
			function a2(e5) {
				return e5.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(e6) {
					return "\\x0" + n2(e6);
				}).replace(/[\x10-\x1F\x7F-\x9F]/g, function(e6) {
					return "\\x" + n2(e6);
				});
			}
			return "Expected " + function(e5) {
				var t3, n3, o3, a3 = new Array(e5.length);
				for (t3 = 0; t3 < e5.length; t3++) a3[t3] = (o3 = e5[t3], r2[o3.type](o3));
				if (a3.sort(), a3.length > 0) {
					for (t3 = 1, n3 = 1; t3 < a3.length; t3++) a3[t3 - 1] !== a3[t3] && (a3[n3] = a3[t3], n3++);
					a3.length = n3;
				}
				switch (a3.length) {
					case 1: return a3[0];
					case 2: return a3[0] + " or " + a3[1];
					default: return a3.slice(0, -1).join(", ") + ", or " + a3[a3.length - 1];
				}
			}(e4) + " but " + function(e5) {
				return e5 ? "\"" + o2(e5) + "\"" : "end of input";
			}(t2) + " found.";
		}, {
			SyntaxError: e3,
			parse: function(t2, r2) {
				r2 = void 0 !== r2 ? r2 : {};
				var n2, o2, a2, i2, s2 = {}, u2 = { start: Ae }, l2 = Ae, c2 = de(" ", false), f2 = /^[^ [\],():#!=><~+.]/, p2 = me([
					" ",
					"[",
					"]",
					",",
					"(",
					")",
					":",
					"#",
					"!",
					"=",
					">",
					"<",
					"~",
					"+",
					"."
				], true, false), h2 = de(">", false), y2 = de("~", false), d2 = de("+", false), m2 = de(",", false), x2 = function(e4, t3) {
					return [e4].concat(t3.map(function(e5) {
						return e5[3];
					}));
				}, v2 = de("!", false), g2 = de("*", false), A2 = de("#", false), E = de("[", false), b = de("]", false), S = /^[><!]/, _ = me([
					">",
					"<",
					"!"
				], false, false), C = de("=", false), P = function(e4) {
					return (e4 || "") + "=";
				}, w = /^[><]/, k = me([">", "<"], false, false), D = de(".", false), I = function(e4, t3, r3) {
					return {
						type: "attribute",
						name: e4,
						operator: t3,
						value: r3
					};
				}, j = de("\"", false), T = /^[^\\"]/, F = me(["\\", "\""], true, false), R = de("\\", false), O = { type: "any" }, L = function(e4, t3) {
					return e4 + t3;
				}, M = function(e4) {
					return {
						type: "literal",
						value: (t3 = e4.join(""), t3.replace(/\\(.)/g, function(e5, t4) {
							switch (t4) {
								case "b": return "\b";
								case "f": return "\f";
								case "n": return "\n";
								case "r": return "\r";
								case "t": return "	";
								case "v": return "\v";
								default: return t4;
							}
						}))
					};
					var t3;
				}, B = de("'", false), U = /^[^\\']/, K = me(["\\", "'"], true, false), N = /^[0-9]/, W = me([["0", "9"]], false, false), V = de("type(", false), q = /^[^ )]/, G = me([" ", ")"], true, false), z = de(")", false), H = /^[imsu]/, Y = me([
					"i",
					"m",
					"s",
					"u"
				], false, false), $ = de("/", false), J = /^[^\]\\]/, Q = me(["]", "\\"], true, false), X = /^[^\/\\[]/, Z = me([
					"/",
					"\\",
					"["
				], true, false), ee = de(":not(", false), te = de(":matches(", false), re = function(e4) {
					return {
						type: "matches",
						selectors: e4
					};
				}, ne = de(":is(", false), oe = de(":has(", false), ae = de(":first-child", false), ie = de(":last-child", false), se = de(":nth-child(", false), ue = de(":nth-last-child(", false), le = de(":", false), ce = 0, fe = [{
					line: 1,
					column: 1
				}], pe = 0, he = [], ye = {};
				if ("startRule" in r2) {
					if (!(r2.startRule in u2)) throw new Error(`Can't start parsing from rule "` + r2.startRule + "\".");
					l2 = u2[r2.startRule];
				}
				function de(e4, t3) {
					return {
						type: "literal",
						text: e4,
						ignoreCase: t3
					};
				}
				function me(e4, t3, r3) {
					return {
						type: "class",
						parts: e4,
						inverted: t3,
						ignoreCase: r3
					};
				}
				function xe(e4) {
					var r3, n3 = fe[e4];
					if (n3) return n3;
					for (r3 = e4 - 1; !fe[r3];) r3--;
					for (n3 = {
						line: (n3 = fe[r3]).line,
						column: n3.column
					}; r3 < e4;) 10 === t2.charCodeAt(r3) ? (n3.line++, n3.column = 1) : n3.column++, r3++;
					return fe[e4] = n3, n3;
				}
				function ve(e4, t3) {
					var r3 = xe(e4), n3 = xe(t3);
					return {
						start: {
							offset: e4,
							line: r3.line,
							column: r3.column
						},
						end: {
							offset: t3,
							line: n3.line,
							column: n3.column
						}
					};
				}
				function ge(e4) {
					ce < pe || (ce > pe && (pe = ce, he = []), he.push(e4));
				}
				function Ae() {
					var e4, t3, r3, n3, o3 = 36 * ce + 0, a3 = ye[o3];
					return a3 ? (ce = a3.nextPos, a3.result) : (e4 = ce, (t3 = Ee()) !== s2 && (r3 = _e()) !== s2 && Ee() !== s2 ? e4 = t3 = 1 === (n3 = r3).length ? n3[0] : {
						type: "matches",
						selectors: n3
					} : (ce = e4, e4 = s2), e4 === s2 && (e4 = ce, (t3 = Ee()) !== s2 && (t3 = void 0), e4 = t3), ye[o3] = {
						nextPos: ce,
						result: e4
					}, e4);
				}
				function Ee() {
					var e4, r3, n3 = 36 * ce + 1, o3 = ye[n3];
					if (o3) return ce = o3.nextPos, o3.result;
					for (e4 = [], 32 === t2.charCodeAt(ce) ? (r3 = " ", ce++) : (r3 = s2, ge(c2)); r3 !== s2;) e4.push(r3), 32 === t2.charCodeAt(ce) ? (r3 = " ", ce++) : (r3 = s2, ge(c2));
					return ye[n3] = {
						nextPos: ce,
						result: e4
					}, e4;
				}
				function be() {
					var e4, r3, n3, o3 = 36 * ce + 2, a3 = ye[o3];
					if (a3) return ce = a3.nextPos, a3.result;
					if (r3 = [], f2.test(t2.charAt(ce)) ? (n3 = t2.charAt(ce), ce++) : (n3 = s2, ge(p2)), n3 !== s2) for (; n3 !== s2;) r3.push(n3), f2.test(t2.charAt(ce)) ? (n3 = t2.charAt(ce), ce++) : (n3 = s2, ge(p2));
					else r3 = s2;
					return r3 !== s2 && (r3 = r3.join("")), e4 = r3, ye[o3] = {
						nextPos: ce,
						result: e4
					}, e4;
				}
				function Se() {
					var e4, r3, n3, o3 = 36 * ce + 3, a3 = ye[o3];
					return a3 ? (ce = a3.nextPos, a3.result) : (e4 = ce, (r3 = Ee()) !== s2 ? (62 === t2.charCodeAt(ce) ? (n3 = ">", ce++) : (n3 = s2, ge(h2)), n3 !== s2 && Ee() !== s2 ? e4 = r3 = "child" : (ce = e4, e4 = s2)) : (ce = e4, e4 = s2), e4 === s2 && (e4 = ce, (r3 = Ee()) !== s2 ? (126 === t2.charCodeAt(ce) ? (n3 = "~", ce++) : (n3 = s2, ge(y2)), n3 !== s2 && Ee() !== s2 ? e4 = r3 = "sibling" : (ce = e4, e4 = s2)) : (ce = e4, e4 = s2), e4 === s2 && (e4 = ce, (r3 = Ee()) !== s2 ? (43 === t2.charCodeAt(ce) ? (n3 = "+", ce++) : (n3 = s2, ge(d2)), n3 !== s2 && Ee() !== s2 ? e4 = r3 = "adjacent" : (ce = e4, e4 = s2)) : (ce = e4, e4 = s2), e4 === s2 && (e4 = ce, 32 === t2.charCodeAt(ce) ? (r3 = " ", ce++) : (r3 = s2, ge(c2)), r3 !== s2 && (n3 = Ee()) !== s2 ? e4 = r3 = "descendant" : (ce = e4, e4 = s2)))), ye[o3] = {
						nextPos: ce,
						result: e4
					}, e4);
				}
				function _e() {
					var e4, r3, n3, o3, a3, i3, u3, l3, c3 = 36 * ce + 5, f3 = ye[c3];
					if (f3) return ce = f3.nextPos, f3.result;
					if (e4 = ce, (r3 = Pe()) !== s2) {
						for (n3 = [], o3 = ce, (a3 = Ee()) !== s2 ? (44 === t2.charCodeAt(ce) ? (i3 = ",", ce++) : (i3 = s2, ge(m2)), i3 !== s2 && (u3 = Ee()) !== s2 && (l3 = Pe()) !== s2 ? o3 = a3 = [
							a3,
							i3,
							u3,
							l3
						] : (ce = o3, o3 = s2)) : (ce = o3, o3 = s2); o3 !== s2;) n3.push(o3), o3 = ce, (a3 = Ee()) !== s2 ? (44 === t2.charCodeAt(ce) ? (i3 = ",", ce++) : (i3 = s2, ge(m2)), i3 !== s2 && (u3 = Ee()) !== s2 && (l3 = Pe()) !== s2 ? o3 = a3 = [
							a3,
							i3,
							u3,
							l3
						] : (ce = o3, o3 = s2)) : (ce = o3, o3 = s2);
						n3 !== s2 ? e4 = r3 = x2(r3, n3) : (ce = e4, e4 = s2);
					} else ce = e4, e4 = s2;
					return ye[c3] = {
						nextPos: ce,
						result: e4
					}, e4;
				}
				function Ce() {
					var e4, t3, r3, n3, o3, a3 = 36 * ce + 6, i3 = ye[a3];
					return i3 ? (ce = i3.nextPos, i3.result) : (e4 = ce, (t3 = Se()) === s2 && (t3 = null), t3 !== s2 && (r3 = Pe()) !== s2 ? (o3 = r3, e4 = t3 = (n3 = t3) ? {
						type: n3,
						left: { type: "exactNode" },
						right: o3
					} : o3) : (ce = e4, e4 = s2), ye[a3] = {
						nextPos: ce,
						result: e4
					}, e4);
				}
				function Pe() {
					var e4, t3, r3, n3, o3, a3, i3, u3 = 36 * ce + 7, l3 = ye[u3];
					if (l3) return ce = l3.nextPos, l3.result;
					if (e4 = ce, (t3 = we()) !== s2) {
						for (r3 = [], n3 = ce, (o3 = Se()) !== s2 && (a3 = we()) !== s2 ? n3 = o3 = [o3, a3] : (ce = n3, n3 = s2); n3 !== s2;) r3.push(n3), n3 = ce, (o3 = Se()) !== s2 && (a3 = we()) !== s2 ? n3 = o3 = [o3, a3] : (ce = n3, n3 = s2);
						r3 !== s2 ? (i3 = t3, e4 = t3 = r3.reduce(function(e5, t4) {
							return {
								type: t4[0],
								left: e5,
								right: t4[1]
							};
						}, i3)) : (ce = e4, e4 = s2);
					} else ce = e4, e4 = s2;
					return ye[u3] = {
						nextPos: ce,
						result: e4
					}, e4;
				}
				function we() {
					var e4, r3, n3, o3, a3, i3, u3, l3 = 36 * ce + 8, c3 = ye[l3];
					if (c3) return ce = c3.nextPos, c3.result;
					if (e4 = ce, 33 === t2.charCodeAt(ce) ? (r3 = "!", ce++) : (r3 = s2, ge(v2)), r3 === s2 && (r3 = null), r3 !== s2) {
						if (n3 = [], (o3 = ke()) !== s2) for (; o3 !== s2;) n3.push(o3), o3 = ke();
						else n3 = s2;
						n3 !== s2 ? (a3 = r3, u3 = 1 === (i3 = n3).length ? i3[0] : {
							type: "compound",
							selectors: i3
						}, a3 && (u3.subject = true), e4 = r3 = u3) : (ce = e4, e4 = s2);
					} else ce = e4, e4 = s2;
					return ye[l3] = {
						nextPos: ce,
						result: e4
					}, e4;
				}
				function ke() {
					var e4, r3 = 36 * ce + 9, n3 = ye[r3];
					return n3 ? (ce = n3.nextPos, n3.result) : ((e4 = function() {
						var e5, r4, n4 = 36 * ce + 10, o3 = ye[n4];
						return o3 ? (ce = o3.nextPos, o3.result) : (42 === t2.charCodeAt(ce) ? (r4 = "*", ce++) : (r4 = s2, ge(g2)), r4 !== s2 && (r4 = {
							type: "wildcard",
							value: r4
						}), e5 = r4, ye[n4] = {
							nextPos: ce,
							result: e5
						}, e5);
					}()) === s2 && (e4 = function() {
						var e5, r4, n4, o3 = 36 * ce + 11, a3 = ye[o3];
						return a3 ? (ce = a3.nextPos, a3.result) : (e5 = ce, 35 === t2.charCodeAt(ce) ? (r4 = "#", ce++) : (r4 = s2, ge(A2)), r4 === s2 && (r4 = null), r4 !== s2 && (n4 = be()) !== s2 ? e5 = r4 = {
							type: "identifier",
							value: n4
						} : (ce = e5, e5 = s2), ye[o3] = {
							nextPos: ce,
							result: e5
						}, e5);
					}()) === s2 && (e4 = function() {
						var e5, r4, n4, o3, a3 = 36 * ce + 12, i3 = ye[a3];
						return i3 ? (ce = i3.nextPos, i3.result) : (e5 = ce, 91 === t2.charCodeAt(ce) ? (r4 = "[", ce++) : (r4 = s2, ge(E)), r4 !== s2 && Ee() !== s2 && (n4 = function() {
							var e6, r5, n5, o4, a4 = 36 * ce + 16, i4 = ye[a4];
							return i4 ? (ce = i4.nextPos, i4.result) : (e6 = ce, (r5 = De()) !== s2 && Ee() !== s2 && (n5 = function() {
								var e7, r6, n6, o5 = 36 * ce + 14, a5 = ye[o5];
								return a5 ? (ce = a5.nextPos, a5.result) : (e7 = ce, 33 === t2.charCodeAt(ce) ? (r6 = "!", ce++) : (r6 = s2, ge(v2)), r6 === s2 && (r6 = null), r6 !== s2 ? (61 === t2.charCodeAt(ce) ? (n6 = "=", ce++) : (n6 = s2, ge(C)), n6 !== s2 ? (r6 = P(r6), e7 = r6) : (ce = e7, e7 = s2)) : (ce = e7, e7 = s2), ye[o5] = {
									nextPos: ce,
									result: e7
								}, e7);
							}()) !== s2 && Ee() !== s2 ? ((o4 = function() {
								var e7, r6, n6, o5, a5, i5 = 36 * ce + 20, u3 = ye[i5];
								if (u3) return ce = u3.nextPos, u3.result;
								if (e7 = ce, "type(" === t2.substr(ce, 5) ? (r6 = "type(", ce += 5) : (r6 = s2, ge(V)), r6 !== s2) {
									if (Ee() !== s2) {
										if (n6 = [], q.test(t2.charAt(ce)) ? (o5 = t2.charAt(ce), ce++) : (o5 = s2, ge(G)), o5 !== s2) for (; o5 !== s2;) n6.push(o5), q.test(t2.charAt(ce)) ? (o5 = t2.charAt(ce), ce++) : (o5 = s2, ge(G));
										else n6 = s2;
										n6 !== s2 && (o5 = Ee()) !== s2 ? (41 === t2.charCodeAt(ce) ? (a5 = ")", ce++) : (a5 = s2, ge(z)), a5 !== s2 ? (r6 = {
											type: "type",
											value: n6.join("")
										}, e7 = r6) : (ce = e7, e7 = s2)) : (ce = e7, e7 = s2);
									} else ce = e7, e7 = s2;
								} else ce = e7, e7 = s2;
								return ye[i5] = {
									nextPos: ce,
									result: e7
								}, e7;
							}()) === s2 && (o4 = function() {
								var e7, r6, n6, o5, a5, i5, u3 = 36 * ce + 22, l3 = ye[u3];
								if (l3) return ce = l3.nextPos, l3.result;
								if (e7 = ce, 47 === t2.charCodeAt(ce) ? (r6 = "/", ce++) : (r6 = s2, ge($)), r6 !== s2) {
									if (n6 = [], (o5 = Ie()) === s2 && (o5 = je()) === s2 && (o5 = Te()), o5 !== s2) for (; o5 !== s2;) n6.push(o5), (o5 = Ie()) === s2 && (o5 = je()) === s2 && (o5 = Te());
									else n6 = s2;
									n6 !== s2 ? (47 === t2.charCodeAt(ce) ? (o5 = "/", ce++) : (o5 = s2, ge($)), o5 !== s2 ? ((a5 = function() {
										var e8, r7, n7 = 36 * ce + 21, o6 = ye[n7];
										if (o6) return ce = o6.nextPos, o6.result;
										if (e8 = [], H.test(t2.charAt(ce)) ? (r7 = t2.charAt(ce), ce++) : (r7 = s2, ge(Y)), r7 !== s2) for (; r7 !== s2;) e8.push(r7), H.test(t2.charAt(ce)) ? (r7 = t2.charAt(ce), ce++) : (r7 = s2, ge(Y));
										else e8 = s2;
										return ye[n7] = {
											nextPos: ce,
											result: e8
										}, e8;
									}()) === s2 && (a5 = null), a5 !== s2 ? (i5 = a5, r6 = {
										type: "regexp",
										value: new RegExp(n6.join(""), i5 ? i5.join("") : "")
									}, e7 = r6) : (ce = e7, e7 = s2)) : (ce = e7, e7 = s2)) : (ce = e7, e7 = s2);
								} else ce = e7, e7 = s2;
								return ye[u3] = {
									nextPos: ce,
									result: e7
								}, e7;
							}()), o4 !== s2 ? (r5 = I(r5, n5, o4), e6 = r5) : (ce = e6, e6 = s2)) : (ce = e6, e6 = s2), e6 === s2 && (e6 = ce, (r5 = De()) !== s2 && Ee() !== s2 && (n5 = function() {
								var e7, r6, n6, o5 = 36 * ce + 13, a5 = ye[o5];
								return a5 ? (ce = a5.nextPos, a5.result) : (e7 = ce, S.test(t2.charAt(ce)) ? (r6 = t2.charAt(ce), ce++) : (r6 = s2, ge(_)), r6 === s2 && (r6 = null), r6 !== s2 ? (61 === t2.charCodeAt(ce) ? (n6 = "=", ce++) : (n6 = s2, ge(C)), n6 !== s2 ? (r6 = P(r6), e7 = r6) : (ce = e7, e7 = s2)) : (ce = e7, e7 = s2), e7 === s2 && (w.test(t2.charAt(ce)) ? (e7 = t2.charAt(ce), ce++) : (e7 = s2, ge(k))), ye[o5] = {
									nextPos: ce,
									result: e7
								}, e7);
							}()) !== s2 && Ee() !== s2 ? ((o4 = function() {
								var e7, r6, n6, o5, a5, i5, u3 = 36 * ce + 17, l3 = ye[u3];
								if (l3) return ce = l3.nextPos, l3.result;
								if (e7 = ce, 34 === t2.charCodeAt(ce) ? (r6 = "\"", ce++) : (r6 = s2, ge(j)), r6 !== s2) {
									for (n6 = [], T.test(t2.charAt(ce)) ? (o5 = t2.charAt(ce), ce++) : (o5 = s2, ge(F)), o5 === s2 && (o5 = ce, 92 === t2.charCodeAt(ce) ? (a5 = "\\", ce++) : (a5 = s2, ge(R)), a5 !== s2 ? (t2.length > ce ? (i5 = t2.charAt(ce), ce++) : (i5 = s2, ge(O)), i5 !== s2 ? (a5 = L(a5, i5), o5 = a5) : (ce = o5, o5 = s2)) : (ce = o5, o5 = s2)); o5 !== s2;) n6.push(o5), T.test(t2.charAt(ce)) ? (o5 = t2.charAt(ce), ce++) : (o5 = s2, ge(F)), o5 === s2 && (o5 = ce, 92 === t2.charCodeAt(ce) ? (a5 = "\\", ce++) : (a5 = s2, ge(R)), a5 !== s2 ? (t2.length > ce ? (i5 = t2.charAt(ce), ce++) : (i5 = s2, ge(O)), i5 !== s2 ? (a5 = L(a5, i5), o5 = a5) : (ce = o5, o5 = s2)) : (ce = o5, o5 = s2));
									n6 !== s2 ? (34 === t2.charCodeAt(ce) ? (o5 = "\"", ce++) : (o5 = s2, ge(j)), o5 !== s2 ? (r6 = M(n6), e7 = r6) : (ce = e7, e7 = s2)) : (ce = e7, e7 = s2);
								} else ce = e7, e7 = s2;
								if (e7 === s2) if (e7 = ce, 39 === t2.charCodeAt(ce) ? (r6 = "'", ce++) : (r6 = s2, ge(B)), r6 !== s2) {
									for (n6 = [], U.test(t2.charAt(ce)) ? (o5 = t2.charAt(ce), ce++) : (o5 = s2, ge(K)), o5 === s2 && (o5 = ce, 92 === t2.charCodeAt(ce) ? (a5 = "\\", ce++) : (a5 = s2, ge(R)), a5 !== s2 ? (t2.length > ce ? (i5 = t2.charAt(ce), ce++) : (i5 = s2, ge(O)), i5 !== s2 ? (a5 = L(a5, i5), o5 = a5) : (ce = o5, o5 = s2)) : (ce = o5, o5 = s2)); o5 !== s2;) n6.push(o5), U.test(t2.charAt(ce)) ? (o5 = t2.charAt(ce), ce++) : (o5 = s2, ge(K)), o5 === s2 && (o5 = ce, 92 === t2.charCodeAt(ce) ? (a5 = "\\", ce++) : (a5 = s2, ge(R)), a5 !== s2 ? (t2.length > ce ? (i5 = t2.charAt(ce), ce++) : (i5 = s2, ge(O)), i5 !== s2 ? (a5 = L(a5, i5), o5 = a5) : (ce = o5, o5 = s2)) : (ce = o5, o5 = s2));
									n6 !== s2 ? (39 === t2.charCodeAt(ce) ? (o5 = "'", ce++) : (o5 = s2, ge(B)), o5 !== s2 ? (r6 = M(n6), e7 = r6) : (ce = e7, e7 = s2)) : (ce = e7, e7 = s2);
								} else ce = e7, e7 = s2;
								return ye[u3] = {
									nextPos: ce,
									result: e7
								}, e7;
							}()) === s2 && (o4 = function() {
								var e7, r6, n6, o5, a5, i5, u3, l3 = 36 * ce + 18, c3 = ye[l3];
								if (c3) return ce = c3.nextPos, c3.result;
								for (e7 = ce, r6 = ce, n6 = [], N.test(t2.charAt(ce)) ? (o5 = t2.charAt(ce), ce++) : (o5 = s2, ge(W)); o5 !== s2;) n6.push(o5), N.test(t2.charAt(ce)) ? (o5 = t2.charAt(ce), ce++) : (o5 = s2, ge(W));
								if (n6 !== s2 ? (46 === t2.charCodeAt(ce) ? (o5 = ".", ce++) : (o5 = s2, ge(D)), o5 !== s2 ? r6 = n6 = [n6, o5] : (ce = r6, r6 = s2)) : (ce = r6, r6 = s2), r6 === s2 && (r6 = null), r6 !== s2) {
									if (n6 = [], N.test(t2.charAt(ce)) ? (o5 = t2.charAt(ce), ce++) : (o5 = s2, ge(W)), o5 !== s2) for (; o5 !== s2;) n6.push(o5), N.test(t2.charAt(ce)) ? (o5 = t2.charAt(ce), ce++) : (o5 = s2, ge(W));
									else n6 = s2;
									n6 !== s2 ? (i5 = n6, u3 = (a5 = r6) ? [].concat.apply([], a5).join("") : "", r6 = {
										type: "literal",
										value: parseFloat(u3 + i5.join(""))
									}, e7 = r6) : (ce = e7, e7 = s2);
								} else ce = e7, e7 = s2;
								return ye[l3] = {
									nextPos: ce,
									result: e7
								}, e7;
							}()) === s2 && (o4 = function() {
								var e7, t3, r6 = 36 * ce + 19, n6 = ye[r6];
								return n6 ? (ce = n6.nextPos, n6.result) : ((t3 = be()) !== s2 && (t3 = {
									type: "literal",
									value: t3
								}), e7 = t3, ye[r6] = {
									nextPos: ce,
									result: e7
								}, e7);
							}()), o4 !== s2 ? (r5 = I(r5, n5, o4), e6 = r5) : (ce = e6, e6 = s2)) : (ce = e6, e6 = s2), e6 === s2 && (e6 = ce, (r5 = De()) !== s2 && (r5 = {
								type: "attribute",
								name: r5
							}), e6 = r5)), ye[a4] = {
								nextPos: ce,
								result: e6
							}, e6);
						}()) !== s2 && Ee() !== s2 ? (93 === t2.charCodeAt(ce) ? (o3 = "]", ce++) : (o3 = s2, ge(b)), o3 !== s2 ? e5 = r4 = n4 : (ce = e5, e5 = s2)) : (ce = e5, e5 = s2), ye[a3] = {
							nextPos: ce,
							result: e5
						}, e5);
					}()) === s2 && (e4 = function() {
						var e5, r4, n4, o3, a3, i3, u3, l3, c3 = 36 * ce + 26, f3 = ye[c3];
						if (f3) return ce = f3.nextPos, f3.result;
						if (e5 = ce, 46 === t2.charCodeAt(ce) ? (r4 = ".", ce++) : (r4 = s2, ge(D)), r4 !== s2) {
							if ((n4 = be()) !== s2) {
								for (o3 = [], a3 = ce, 46 === t2.charCodeAt(ce) ? (i3 = ".", ce++) : (i3 = s2, ge(D)), i3 !== s2 && (u3 = be()) !== s2 ? a3 = i3 = [i3, u3] : (ce = a3, a3 = s2); a3 !== s2;) o3.push(a3), a3 = ce, 46 === t2.charCodeAt(ce) ? (i3 = ".", ce++) : (i3 = s2, ge(D)), i3 !== s2 && (u3 = be()) !== s2 ? a3 = i3 = [i3, u3] : (ce = a3, a3 = s2);
								o3 !== s2 ? (l3 = n4, r4 = {
									type: "field",
									name: o3.reduce(function(e6, t3) {
										return e6 + t3[0] + t3[1];
									}, l3)
								}, e5 = r4) : (ce = e5, e5 = s2);
							} else ce = e5, e5 = s2;
						} else ce = e5, e5 = s2;
						return ye[c3] = {
							nextPos: ce,
							result: e5
						}, e5;
					}()) === s2 && (e4 = function() {
						var e5, r4, n4, o3, a3 = 36 * ce + 27, i3 = ye[a3];
						return i3 ? (ce = i3.nextPos, i3.result) : (e5 = ce, ":not(" === t2.substr(ce, 5) ? (r4 = ":not(", ce += 5) : (r4 = s2, ge(ee)), r4 !== s2 && Ee() !== s2 && (n4 = _e()) !== s2 && Ee() !== s2 ? (41 === t2.charCodeAt(ce) ? (o3 = ")", ce++) : (o3 = s2, ge(z)), o3 !== s2 ? e5 = r4 = {
							type: "not",
							selectors: n4
						} : (ce = e5, e5 = s2)) : (ce = e5, e5 = s2), ye[a3] = {
							nextPos: ce,
							result: e5
						}, e5);
					}()) === s2 && (e4 = function() {
						var e5, r4, n4, o3, a3 = 36 * ce + 28, i3 = ye[a3];
						return i3 ? (ce = i3.nextPos, i3.result) : (e5 = ce, ":matches(" === t2.substr(ce, 9) ? (r4 = ":matches(", ce += 9) : (r4 = s2, ge(te)), r4 !== s2 && Ee() !== s2 && (n4 = _e()) !== s2 && Ee() !== s2 ? (41 === t2.charCodeAt(ce) ? (o3 = ")", ce++) : (o3 = s2, ge(z)), o3 !== s2 ? (r4 = re(n4), e5 = r4) : (ce = e5, e5 = s2)) : (ce = e5, e5 = s2), ye[a3] = {
							nextPos: ce,
							result: e5
						}, e5);
					}()) === s2 && (e4 = function() {
						var e5, r4, n4, o3, a3 = 36 * ce + 29, i3 = ye[a3];
						return i3 ? (ce = i3.nextPos, i3.result) : (e5 = ce, ":is(" === t2.substr(ce, 4) ? (r4 = ":is(", ce += 4) : (r4 = s2, ge(ne)), r4 !== s2 && Ee() !== s2 && (n4 = _e()) !== s2 && Ee() !== s2 ? (41 === t2.charCodeAt(ce) ? (o3 = ")", ce++) : (o3 = s2, ge(z)), o3 !== s2 ? (r4 = re(n4), e5 = r4) : (ce = e5, e5 = s2)) : (ce = e5, e5 = s2), ye[a3] = {
							nextPos: ce,
							result: e5
						}, e5);
					}()) === s2 && (e4 = function() {
						var e5, r4, n4, o3, a3 = 36 * ce + 30, i3 = ye[a3];
						return i3 ? (ce = i3.nextPos, i3.result) : (e5 = ce, ":has(" === t2.substr(ce, 5) ? (r4 = ":has(", ce += 5) : (r4 = s2, ge(oe)), r4 !== s2 && Ee() !== s2 && (n4 = function() {
							var e6, r5, n5, o4, a4, i4, u3, l3, c3 = 36 * ce + 4, f3 = ye[c3];
							if (f3) return ce = f3.nextPos, f3.result;
							if (e6 = ce, (r5 = Ce()) !== s2) {
								for (n5 = [], o4 = ce, (a4 = Ee()) !== s2 ? (44 === t2.charCodeAt(ce) ? (i4 = ",", ce++) : (i4 = s2, ge(m2)), i4 !== s2 && (u3 = Ee()) !== s2 && (l3 = Ce()) !== s2 ? o4 = a4 = [
									a4,
									i4,
									u3,
									l3
								] : (ce = o4, o4 = s2)) : (ce = o4, o4 = s2); o4 !== s2;) n5.push(o4), o4 = ce, (a4 = Ee()) !== s2 ? (44 === t2.charCodeAt(ce) ? (i4 = ",", ce++) : (i4 = s2, ge(m2)), i4 !== s2 && (u3 = Ee()) !== s2 && (l3 = Ce()) !== s2 ? o4 = a4 = [
									a4,
									i4,
									u3,
									l3
								] : (ce = o4, o4 = s2)) : (ce = o4, o4 = s2);
								n5 !== s2 ? e6 = r5 = x2(r5, n5) : (ce = e6, e6 = s2);
							} else ce = e6, e6 = s2;
							return ye[c3] = {
								nextPos: ce,
								result: e6
							}, e6;
						}()) !== s2 && Ee() !== s2 ? (41 === t2.charCodeAt(ce) ? (o3 = ")", ce++) : (o3 = s2, ge(z)), o3 !== s2 ? e5 = r4 = {
							type: "has",
							selectors: n4
						} : (ce = e5, e5 = s2)) : (ce = e5, e5 = s2), ye[a3] = {
							nextPos: ce,
							result: e5
						}, e5);
					}()) === s2 && (e4 = function() {
						var e5, r4, n4 = 36 * ce + 31, o3 = ye[n4];
						return o3 ? (ce = o3.nextPos, o3.result) : (":first-child" === t2.substr(ce, 12) ? (r4 = ":first-child", ce += 12) : (r4 = s2, ge(ae)), r4 !== s2 && (r4 = Fe(1)), e5 = r4, ye[n4] = {
							nextPos: ce,
							result: e5
						}, e5);
					}()) === s2 && (e4 = function() {
						var e5, r4, n4 = 36 * ce + 32, o3 = ye[n4];
						return o3 ? (ce = o3.nextPos, o3.result) : (":last-child" === t2.substr(ce, 11) ? (r4 = ":last-child", ce += 11) : (r4 = s2, ge(ie)), r4 !== s2 && (r4 = Re(1)), e5 = r4, ye[n4] = {
							nextPos: ce,
							result: e5
						}, e5);
					}()) === s2 && (e4 = function() {
						var e5, r4, n4, o3, a3, i3 = 36 * ce + 33, u3 = ye[i3];
						if (u3) return ce = u3.nextPos, u3.result;
						if (e5 = ce, ":nth-child(" === t2.substr(ce, 11) ? (r4 = ":nth-child(", ce += 11) : (r4 = s2, ge(se)), r4 !== s2) {
							if (Ee() !== s2) {
								if (n4 = [], N.test(t2.charAt(ce)) ? (o3 = t2.charAt(ce), ce++) : (o3 = s2, ge(W)), o3 !== s2) for (; o3 !== s2;) n4.push(o3), N.test(t2.charAt(ce)) ? (o3 = t2.charAt(ce), ce++) : (o3 = s2, ge(W));
								else n4 = s2;
								n4 !== s2 && (o3 = Ee()) !== s2 ? (41 === t2.charCodeAt(ce) ? (a3 = ")", ce++) : (a3 = s2, ge(z)), a3 !== s2 ? (r4 = Fe(parseInt(n4.join(""), 10)), e5 = r4) : (ce = e5, e5 = s2)) : (ce = e5, e5 = s2);
							} else ce = e5, e5 = s2;
						} else ce = e5, e5 = s2;
						return ye[i3] = {
							nextPos: ce,
							result: e5
						}, e5;
					}()) === s2 && (e4 = function() {
						var e5, r4, n4, o3, a3, i3 = 36 * ce + 34, u3 = ye[i3];
						if (u3) return ce = u3.nextPos, u3.result;
						if (e5 = ce, ":nth-last-child(" === t2.substr(ce, 16) ? (r4 = ":nth-last-child(", ce += 16) : (r4 = s2, ge(ue)), r4 !== s2) {
							if (Ee() !== s2) {
								if (n4 = [], N.test(t2.charAt(ce)) ? (o3 = t2.charAt(ce), ce++) : (o3 = s2, ge(W)), o3 !== s2) for (; o3 !== s2;) n4.push(o3), N.test(t2.charAt(ce)) ? (o3 = t2.charAt(ce), ce++) : (o3 = s2, ge(W));
								else n4 = s2;
								n4 !== s2 && (o3 = Ee()) !== s2 ? (41 === t2.charCodeAt(ce) ? (a3 = ")", ce++) : (a3 = s2, ge(z)), a3 !== s2 ? (r4 = Re(parseInt(n4.join(""), 10)), e5 = r4) : (ce = e5, e5 = s2)) : (ce = e5, e5 = s2);
							} else ce = e5, e5 = s2;
						} else ce = e5, e5 = s2;
						return ye[i3] = {
							nextPos: ce,
							result: e5
						}, e5;
					}()) === s2 && (e4 = function() {
						var e5, r4, n4, o3 = 36 * ce + 35, a3 = ye[o3];
						return a3 ? (ce = a3.nextPos, a3.result) : (e5 = ce, 58 === t2.charCodeAt(ce) ? (r4 = ":", ce++) : (r4 = s2, ge(le)), r4 !== s2 && (n4 = be()) !== s2 ? e5 = r4 = {
							type: "class",
							name: n4
						} : (ce = e5, e5 = s2), ye[o3] = {
							nextPos: ce,
							result: e5
						}, e5);
					}()), ye[r3] = {
						nextPos: ce,
						result: e4
					}, e4);
				}
				function De() {
					var e4, r3, n3, o3, a3, i3, u3, l3, c3 = 36 * ce + 15, f3 = ye[c3];
					if (f3) return ce = f3.nextPos, f3.result;
					if (e4 = ce, (r3 = be()) !== s2) {
						for (n3 = [], o3 = ce, 46 === t2.charCodeAt(ce) ? (a3 = ".", ce++) : (a3 = s2, ge(D)), a3 !== s2 && (i3 = be()) !== s2 ? o3 = a3 = [a3, i3] : (ce = o3, o3 = s2); o3 !== s2;) n3.push(o3), o3 = ce, 46 === t2.charCodeAt(ce) ? (a3 = ".", ce++) : (a3 = s2, ge(D)), a3 !== s2 && (i3 = be()) !== s2 ? o3 = a3 = [a3, i3] : (ce = o3, o3 = s2);
						n3 !== s2 ? (u3 = r3, l3 = n3, e4 = r3 = [].concat.apply([u3], l3).join("")) : (ce = e4, e4 = s2);
					} else ce = e4, e4 = s2;
					return ye[c3] = {
						nextPos: ce,
						result: e4
					}, e4;
				}
				function Ie() {
					var e4, r3, n3, o3, a3 = 36 * ce + 23, i3 = ye[a3];
					if (i3) return ce = i3.nextPos, i3.result;
					if (e4 = ce, 91 === t2.charCodeAt(ce) ? (r3 = "[", ce++) : (r3 = s2, ge(E)), r3 !== s2) {
						if (n3 = [], J.test(t2.charAt(ce)) ? (o3 = t2.charAt(ce), ce++) : (o3 = s2, ge(Q)), o3 === s2 && (o3 = je()), o3 !== s2) for (; o3 !== s2;) n3.push(o3), J.test(t2.charAt(ce)) ? (o3 = t2.charAt(ce), ce++) : (o3 = s2, ge(Q)), o3 === s2 && (o3 = je());
						else n3 = s2;
						n3 !== s2 ? (93 === t2.charCodeAt(ce) ? (o3 = "]", ce++) : (o3 = s2, ge(b)), o3 !== s2 ? e4 = r3 = "[" + n3.join("") + "]" : (ce = e4, e4 = s2)) : (ce = e4, e4 = s2);
					} else ce = e4, e4 = s2;
					return ye[a3] = {
						nextPos: ce,
						result: e4
					}, e4;
				}
				function je() {
					var e4, r3, n3, o3 = 36 * ce + 24, a3 = ye[o3];
					return a3 ? (ce = a3.nextPos, a3.result) : (e4 = ce, 92 === t2.charCodeAt(ce) ? (r3 = "\\", ce++) : (r3 = s2, ge(R)), r3 !== s2 ? (t2.length > ce ? (n3 = t2.charAt(ce), ce++) : (n3 = s2, ge(O)), n3 !== s2 ? e4 = r3 = "\\" + n3 : (ce = e4, e4 = s2)) : (ce = e4, e4 = s2), ye[o3] = {
						nextPos: ce,
						result: e4
					}, e4);
				}
				function Te() {
					var e4, r3, n3, o3 = 36 * ce + 25, a3 = ye[o3];
					if (a3) return ce = a3.nextPos, a3.result;
					if (r3 = [], X.test(t2.charAt(ce)) ? (n3 = t2.charAt(ce), ce++) : (n3 = s2, ge(Z)), n3 !== s2) for (; n3 !== s2;) r3.push(n3), X.test(t2.charAt(ce)) ? (n3 = t2.charAt(ce), ce++) : (n3 = s2, ge(Z));
					else r3 = s2;
					return r3 !== s2 && (r3 = r3.join("")), e4 = r3, ye[o3] = {
						nextPos: ce,
						result: e4
					}, e4;
				}
				function Fe(e4) {
					return {
						type: "nth-child",
						index: {
							type: "literal",
							value: e4
						}
					};
				}
				function Re(e4) {
					return {
						type: "nth-last-child",
						index: {
							type: "literal",
							value: e4
						}
					};
				}
				if ((n2 = l2()) !== s2 && ce === t2.length) return n2;
				throw n2 !== s2 && ce < t2.length && ge({ type: "end" }), o2 = he, a2 = pe < t2.length ? t2.charAt(pe) : null, i2 = pe < t2.length ? ve(pe, pe + 1) : ve(pe, pe), new e3(e3.buildMessage(o2, a2), o2, a2, i2);
			}
		};
	}());
});
function u(e2, t2) {
	for (var r2 = 0; r2 < t2.length; ++r2) {
		if (null == e2) return e2;
		e2 = e2[t2[r2]];
	}
	return e2;
}
var l = "function" == typeof WeakMap ? /* @__PURE__ */ new WeakMap() : null;
function c(e2) {
	if (null == e2) return function() {
		return true;
	};
	if (null != l) {
		var t2 = l.get(e2);
		return t2 ?? (t2 = f(e2), l.set(e2, t2)), t2;
	}
	return f(e2);
}
function f(e2) {
	switch (e2.type) {
		case "wildcard": return function() {
			return true;
		};
		case "identifier":
			var t2 = e2.value.toLowerCase();
			return function(e3, r3, n2) {
				return t2 === e3[n2 && n2.nodeTypeKey || "type"].toLowerCase();
			};
		case "exactNode": return function(e3, t3) {
			return 0 === t3.length;
		};
		case "field":
			var r2 = e2.name.split(".");
			return function(e3, t3) {
				return function e4(t4, r3, n2, o3) {
					for (var a3 = r3, i2 = o3; i2 < n2.length; ++i2) {
						if (null == a3) return false;
						var s3 = a3[n2[i2]];
						if (Array.isArray(s3)) {
							for (var u2 = 0; u2 < s3.length; ++u2) if (e4(t4, s3[u2], n2, i2 + 1)) return true;
							return false;
						}
						a3 = s3;
					}
					return t4 === a3;
				}(e3, t3[r2.length - 1], r2, 0);
			};
		case "matches":
			var o2 = e2.selectors.map(c);
			return function(e3, t3, r3) {
				for (var n2 = 0; n2 < o2.length; ++n2) if (o2[n2](e3, t3, r3)) return true;
				return false;
			};
		case "compound":
			var a2 = e2.selectors.map(c);
			return function(e3, t3, r3) {
				for (var n2 = 0; n2 < a2.length; ++n2) if (!a2[n2](e3, t3, r3)) return false;
				return true;
			};
		case "not":
			var s2 = e2.selectors.map(c);
			return function(e3, t3, r3) {
				for (var n2 = 0; n2 < s2.length; ++n2) if (s2[n2](e3, t3, r3)) return false;
				return true;
			};
		case "has":
			var l2 = e2.selectors.map(c);
			return function(e3, t3, r3) {
				var n2 = false, o3 = [];
				return i.traverse(e3, {
					enter: function(e4, t4) {
						null != t4 && o3.unshift(t4);
						for (var a3 = 0; a3 < l2.length; ++a3) if (l2[a3](e4, o3, r3)) return n2 = true, void this.break();
					},
					leave: function() {
						o3.shift();
					},
					keys: r3 && r3.visitorKeys,
					fallback: r3 && r3.fallback || "iteration"
				}), n2;
			};
		case "child":
			var f2 = c(e2.left), p2 = c(e2.right);
			return function(e3, t3, r3) {
				return !!(t3.length > 0 && p2(e3, t3, r3)) && f2(t3[0], t3.slice(1), r3);
			};
		case "descendant":
			var h2 = c(e2.left), x2 = c(e2.right);
			return function(e3, t3, r3) {
				if (x2(e3, t3, r3)) {
					for (var n2 = 0, o3 = t3.length; n2 < o3; ++n2) if (h2(t3[n2], t3.slice(n2 + 1), r3)) return true;
				}
				return false;
			};
		case "attribute":
			var v2 = e2.name.split(".");
			switch (e2.operator) {
				case void 0: return function(e3) {
					return null != u(e3, v2);
				};
				case "=":
					switch (e2.value.type) {
						case "regexp": return function(t3) {
							var r3 = u(t3, v2);
							return "string" == typeof r3 && e2.value.value.test(r3);
						};
						case "literal":
							var g2 = "".concat(e2.value.value);
							return function(e3) {
								return g2 === "".concat(u(e3, v2));
							};
						case "type": return function(t3) {
							return e2.value.value === n(u(t3, v2));
						};
					}
					throw new Error("Unknown selector value type: ".concat(e2.value.type));
				case "!=":
					switch (e2.value.type) {
						case "regexp": return function(t3) {
							return !e2.value.value.test(u(t3, v2));
						};
						case "literal":
							var A2 = "".concat(e2.value.value);
							return function(e3) {
								return A2 !== "".concat(u(e3, v2));
							};
						case "type": return function(t3) {
							return e2.value.value !== n(u(t3, v2));
						};
					}
					throw new Error("Unknown selector value type: ".concat(e2.value.type));
				case "<=": return function(t3) {
					return u(t3, v2) <= e2.value.value;
				};
				case "<": return function(t3) {
					return u(t3, v2) < e2.value.value;
				};
				case ">": return function(t3) {
					return u(t3, v2) > e2.value.value;
				};
				case ">=": return function(t3) {
					return u(t3, v2) >= e2.value.value;
				};
			}
			throw new Error("Unknown operator: ".concat(e2.operator));
		case "sibling":
			var E = c(e2.left), b = c(e2.right);
			return function(t3, r3, n2) {
				return b(t3, r3, n2) && y$1(t3, E, r3, "LEFT_SIDE", n2) || e2.left.subject && E(t3, r3, n2) && y$1(t3, b, r3, "RIGHT_SIDE", n2);
			};
		case "adjacent":
			var S = c(e2.left), _ = c(e2.right);
			return function(t3, r3, n2) {
				return _(t3, r3, n2) && d$1(t3, S, r3, "LEFT_SIDE", n2) || e2.right.subject && S(t3, r3, n2) && d$1(t3, _, r3, "RIGHT_SIDE", n2);
			};
		case "nth-child":
			var C = e2.index.value, P = c(e2.right);
			return function(e3, t3, r3) {
				return P(e3, t3, r3) && m$1(e3, t3, C, r3);
			};
		case "nth-last-child":
			var w = -e2.index.value, k = c(e2.right);
			return function(e3, t3, r3) {
				return k(e3, t3, r3) && m$1(e3, t3, w, r3);
			};
		case "class":
			var D = e2.name.toLowerCase();
			return function(t3, r3, n2) {
				if (n2 && n2.matchClass) return n2.matchClass(e2.name, t3, r3);
				if (n2 && n2.nodeTypeKey) return false;
				switch (D) {
					case "statement": if ("Statement" === t3.type.slice(-9)) return true;
					case "declaration": return "Declaration" === t3.type.slice(-11);
					case "pattern": if ("Pattern" === t3.type.slice(-7)) return true;
					case "expression": return "Expression" === t3.type.slice(-10) || "Literal" === t3.type.slice(-7) || "Identifier" === t3.type && (0 === r3.length || "MetaProperty" !== r3[0].type) || "MetaProperty" === t3.type;
					case "function": return "FunctionDeclaration" === t3.type || "FunctionExpression" === t3.type || "ArrowFunctionExpression" === t3.type;
				}
				throw new Error("Unknown class name: ".concat(e2.name));
			};
	}
	throw new Error("Unknown selector type: ".concat(e2.type));
}
function p(e2, t2) {
	var r2 = t2 && t2.nodeTypeKey || "type", n2 = e2[r2];
	return t2 && t2.visitorKeys && t2.visitorKeys[n2] ? t2.visitorKeys[n2] : i.VisitorKeys[n2] ? i.VisitorKeys[n2] : t2 && "function" == typeof t2.fallback ? t2.fallback(e2) : Object.keys(e2).filter(function(e3) {
		return e3 !== r2;
	});
}
function h$1(e2, t2) {
	var r2 = t2 && t2.nodeTypeKey || "type";
	return null !== e2 && "object" === n(e2) && "string" == typeof e2[r2];
}
function y$1(e2, r2, n2, o2, a2) {
	var i2 = t(n2, 1)[0];
	if (!i2) return false;
	for (var s2 = p(i2, a2), u2 = 0; u2 < s2.length; ++u2) {
		var l2 = i2[s2[u2]];
		if (Array.isArray(l2)) {
			var c2 = l2.indexOf(e2);
			if (c2 < 0) continue;
			var f2 = void 0, y2 = void 0;
			"LEFT_SIDE" === o2 ? (f2 = 0, y2 = c2) : (f2 = c2 + 1, y2 = l2.length);
			for (var d2 = f2; d2 < y2; ++d2) if (h$1(l2[d2], a2) && r2(l2[d2], n2, a2)) return true;
		}
	}
	return false;
}
function d$1(e2, r2, n2, o2, a2) {
	var i2 = t(n2, 1)[0];
	if (!i2) return false;
	for (var s2 = p(i2, a2), u2 = 0; u2 < s2.length; ++u2) {
		var l2 = i2[s2[u2]];
		if (Array.isArray(l2)) {
			var c2 = l2.indexOf(e2);
			if (c2 < 0) continue;
			if ("LEFT_SIDE" === o2 && c2 > 0 && h$1(l2[c2 - 1], a2) && r2(l2[c2 - 1], n2, a2)) return true;
			if ("RIGHT_SIDE" === o2 && c2 < l2.length - 1 && h$1(l2[c2 + 1], a2) && r2(l2[c2 + 1], n2, a2)) return true;
		}
	}
	return false;
}
function m$1(e2, r2, n2, o2) {
	if (0 === n2) return false;
	var a2 = t(r2, 1)[0];
	if (!a2) return false;
	for (var i2 = p(a2, o2), s2 = 0; s2 < i2.length; ++s2) {
		var u2 = a2[i2[s2]];
		if (Array.isArray(u2)) {
			var l2 = n2 < 0 ? u2.length + n2 : n2 - 1;
			if (l2 >= 0 && l2 < u2.length && u2[l2] === e2) return true;
		}
	}
	return false;
}
function x(e2, t2, o2, a2) {
	if (t2) {
		var s2 = [], u2 = c(t2), l2 = function e3(t3, o3) {
			if (null == t3 || "object" != n(t3)) return [];
			o3 ??= t3;
			for (var a3 = t3.subject ? [o3] : [], i2 = Object.keys(t3), s3 = 0; s3 < i2.length; ++s3) {
				var u3 = i2[s3], l3 = t3[u3];
				a3.push.apply(a3, r(e3(l3, "left" === u3 ? l3 : o3)));
			}
			return a3;
		}(t2).map(c);
		i.traverse(e2, {
			enter: function(e3, t3) {
				if (null != t3 && s2.unshift(t3), u2(e3, s2, a2)) if (l2.length) for (var r2 = 0, n2 = l2.length; r2 < n2; ++r2) {
					l2[r2](e3, s2, a2) && o2(e3, t3, s2);
					for (var i2 = 0, c2 = s2.length; i2 < c2; ++i2) {
						var f2 = s2.slice(i2 + 1);
						l2[r2](s2[i2], f2, a2) && o2(s2[i2], t3, f2);
					}
				}
				else o2(e3, t3, s2);
			},
			leave: function() {
				s2.shift();
			},
			keys: a2 && a2.visitorKeys,
			fallback: a2 && a2.fallback || "iteration"
		});
	}
}
function v(e2, t2, r2) {
	var n2 = [];
	return x(e2, t2, function(e3) {
		n2.push(e3);
	}, r2), n2;
}
function g(e2) {
	return s$1.parse(e2);
}
function A(e2, t2, r2) {
	return v(e2, g(t2), r2);
}
A.parse = g, A.match = v, A.traverse = x, A.matches = function(e2, t2, r2, n2) {
	return !t2 || !!e2 && (r2 || (r2 = []), c(t2)(e2, r2, n2));
}, A.query = A;
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/_virtual/meriyah.js
var meriyah = {};
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/_virtual/astring.js
var astring = {};
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/code-transformer/lib/transforms.js
var esquery$1 = A;
var { parse: parse$4 } = meriyah;
var tracingChannelPredicate = (node) => node.declarations?.[0]?.id?.properties?.[0]?.value?.name === "tr_ch_apm_tracingChannel";
var CHANNEL_REGEX = /[^\w]/g;
var formatChannelVariable = (channelName) => `tr_ch_apm$${channelName.replace(CHANNEL_REGEX, "_")}`;
var transforms$1 = {
	/**
	* Injects a `tracingChannel` import/require into the program body if one is not
	* already present.
	*
	* @param {{ dcModule: string, sourceType: 'module'|'script' }} state
	* @param {import('estree').Program} node - The program root node.
	*/
	tracingChannelImport({ dcModule, moduleType }, node) {
		if (node.body.some(tracingChannelPredicate)) return;
		const options = { module: moduleType === "esm" };
		const index = node.body.findIndex((child) => child.directive === "use strict");
		const dc = moduleType === "esm" ? `import tr_ch_apm_dc from "${dcModule}"` : `const tr_ch_apm_dc = require("${dcModule}")`;
		node.body.splice(index + 1, 0, parse$4(dc, options).body[0], parse$4("const { tracingChannel: tr_ch_apm_tracingChannel } = tr_ch_apm_dc", options).body[0], parse$4(`const tr_ch_apm_hasSubscribers = ch => ch.start.hasSubscribers
      || ch.end.hasSubscribers
      || ch.asyncStart.hasSubscribers
      || ch.asyncEnd.hasSubscribers
      || ch.error.hasSubscribers`, options).body[0]);
	},
	/**
	* Injects a `tracingChannel(...)` variable declaration for the config's channel
	* into the program body, also ensuring the import is present.
	*
	* @param {{ channelName: string, module: { name: string }, dcModule: string, sourceType: 'module'|'script', transforms: Record<string, Function> }} state
	* @param {import('estree').Program} node - The program root node.
	*/
	tracingChannelDeclaration(state, node) {
		const { channelName, module: { name } } = state;
		const channelVariable = formatChannelVariable(channelName);
		if (node.body.some((child) => child.declarations?.[0]?.id?.name === channelVariable)) return;
		state.transforms.tracingChannelImport(state, node);
		const index = node.body.findIndex(tracingChannelPredicate);
		const code = `
      const ${channelVariable} = tr_ch_apm_tracingChannel("orchestrion:${name}:${channelName}")
    `;
		node.body.splice(index + 1, 0, parse$4(code).body[0]);
	},
	traceCallback: traceAny,
	tracePromise: traceAny,
	traceSync: traceAny,
	traceAuto: traceAny
};
function wrapParams(params) {
	return [...(params || []).filter((param) => param.type !== "RestElement" && param.type !== "AssignmentPattern").map((_, i) => ({
		type: "Identifier",
		name: `__apm$arg${i}`
	})), {
		type: "RestElement",
		argument: {
			type: "Identifier",
			name: "__apm$args"
		}
	}];
}
function traceAny(state, node, _parent, ancestry) {
	const program = ancestry[ancestry.length - 1];
	if (node.type === "ClassDeclaration" || node.type === "ClassExpression") traceInstanceMethod(state, node, program);
	else traceFunction(state, node, program);
}
function isChannelRunStoresReturn(stmt, channelVariable) {
	if (stmt.type !== "ReturnStatement") return false;
	const callee = stmt.argument?.type === "CallExpression" ? stmt.argument.callee : null;
	return callee?.type === "MemberExpression" && callee.property?.name === "runStores" && callee.object?.type === "MemberExpression" && callee.object.property?.name === "start" && callee.object.object?.type === "Identifier" && callee.object.object.name === channelVariable;
}
function nextWrappedFunction(body) {
	const declInit = (stmts, name) => {
		return (stmts?.find((stmt) => stmt.type === "VariableDeclaration" && stmt.declarations.some((d) => d.id?.name === name)))?.declarations.find((d) => d.id?.name === name)?.init ?? null;
	};
	const wrapped = declInit(declInit(body, "__apm$traced")?.body?.body, "__apm$wrapped");
	const type = wrapped?.type;
	return type === "FunctionExpression" || type === "ArrowFunctionExpression" || type === "FunctionDeclaration" ? wrapped : null;
}
function isWrappedForChannel(node, channelVariable) {
	const visited = /* @__PURE__ */ new Set();
	let fn = node;
	while (fn && !visited.has(fn)) {
		visited.add(fn);
		const body = fn.body?.body;
		if (!Array.isArray(body)) return false;
		if (body.some((stmt) => isChannelRunStoresReturn(stmt, channelVariable))) return true;
		fn = nextWrappedFunction(body);
	}
	return false;
}
function constructorPatchesMethod(ctor, bindingName) {
	const body = ctor?.value?.body?.body;
	if (!Array.isArray(body)) return false;
	return body.some((stmt) => stmt.type === "VariableDeclaration" && stmt.declarations.some((decl) => decl.id?.name === bindingName));
}
function traceFunction(state, node, program) {
	if (isWrappedForChannel(node, formatChannelVariable(state.channelName))) return;
	state.transforms.tracingChannelDeclaration(state, program);
	const { functionQuery: { methodName, privateMethodName, functionName, expressionName, propertyName } } = state;
	const type = methodName === "constructor" || !methodName && !privateMethodName && !functionName && !expressionName && !propertyName ? "ArrowFunctionExpression" : node.type;
	const params = node.params;
	node.body = wrap(state, {
		type,
		params,
		body: node.body,
		async: node.async,
		expression: false,
		generator: node.generator
	}, program);
	node.params = wrapParams(params);
	node.generator = false;
	node.async = false;
	wrapSuper(state, node);
}
function traceInstanceMethod(state, node, program) {
	const { functionQuery, operator, channelName } = state;
	const { methodName } = functionQuery;
	if (!methodName) return;
	const classBody = node.body;
	if (classBody.body.some(({ key }) => key?.name === methodName)) return;
	let ctor = classBody.body.find(({ kind }) => kind === "constructor");
	const savedBinding = `${formatChannelVariable(channelName)}$${methodName}`;
	if (ctor && constructorPatchesMethod(ctor, savedBinding)) return;
	state.transforms.tracingChannelDeclaration(state, program);
	if (!ctor) {
		ctor = parse$4(node.superClass ? "class A extends Object { constructor (...args) { super(...args) } }" : "class A { constructor () {} }").body[0].body.body[0];
		classBody.body.unshift(ctor);
	}
	const ctorBody = parse$4(`
    const ${savedBinding} = this["${methodName}"]
    this["${methodName}"] = function () {}
    if (typeof ${savedBinding} === 'function') {
      Object.defineProperty(this["${methodName}"], 'length', {
        value: ${savedBinding}.length,
        configurable: true
      })
    }
  `).body;
	const fn = ctorBody[1].expression.right;
	fn.params = [{
		type: "RestElement",
		argument: {
			type: "Identifier",
			name: "__apm$args"
		}
	}];
	fn.async = operator === "tracePromise";
	fn.body = wrap(state, {
		type: "Identifier",
		name: savedBinding
	}, program);
	wrapSuper(state, fn);
	ctor.value.body.body.push(...ctorBody);
}
function wrap(state, node, program) {
	const { operator, moduleVersion } = state;
	const { returnKind } = state.functionQuery;
	const iterPatch = returnKind ? generateIterPatch(state, returnKind, program) : "";
	let wrapper;
	if (operator === "traceCallback") wrapper = wrapCallback(state, node, iterPatch);
	if (operator === "tracePromise") wrapper = wrapPromise(state, node, iterPatch);
	if (operator === "traceSync") wrapper = wrapSync(state, node, iterPatch);
	if (operator === "traceAuto") wrapper = wrapAuto(state, node, iterPatch);
	const args = (node.params || []).filter((param) => param.type !== "RestElement" && param.type !== "AssignmentPattern").map((_, i) => `__apm$arg${i}`).concat("...__apm$args").join(", ");
	const block = wrapper.body[0].body;
	const common = parse$4(node.type === "ArrowFunctionExpression" ? `
    const __apm$arguments = [${args}];
    const __apm$ctx = {
      arguments: __apm$arguments,
      moduleVersion: ${JSON.stringify(moduleVersion)}
    };
    const __apm$traced = () => {
      const __apm$wrapped = () => {};
      return __apm$wrapped(...__apm$arguments);
    };
  ` : `
    const __apm$arguments = [${args}].slice(0, arguments.length);
    const __apm$ctx = {
      arguments: __apm$arguments,
      self: this,
      moduleVersion: ${JSON.stringify(moduleVersion)}
    };
    const __apm$traced = () => {
      const __apm$wrapped = () => {};
      return __apm$wrapped.apply(this, __apm$arguments);
    };
  `).body;
	block.body.unshift(...common);
	esquery$1.query(block, "[id.name=__apm$wrapped]")[0].init = node;
	return block;
}
function wrapSuper(_state, node) {
	const members = /* @__PURE__ */ new Set();
	esquery$1.traverse(node.body, esquery$1.parse("[object.type=Super]"), (node2, parent) => {
		const { name } = node2.property;
		let child;
		if (parent.callee) {
			const { expression } = parse$4(`__apm$super['${name}'].call(this)`).body[0];
			parent.callee = child = expression.callee;
			parent.arguments.unshift(...expression.arguments);
		} else parent.expression = child = parse$4(`__apm$super['${name}']`).body[0];
		child.computed = parent.callee.computed;
		child.optional = parent.callee.optional;
		members.add(name);
	});
	for (const name of members) {
		const member = parse$4(`
      class Wrapper {
        wrapper () {
          __apm$super['${name}'] = super['${name}']
        }
      }
    `).body[0].body.body[0].value.body.body[0];
		node.body.body.unshift(member);
	}
	if (members.size > 0) node.body.body.unshift(parse$4("const __apm$super = {}").body[0]);
}
function wrapAuto(state, node, iterPatch = "") {
	const cbWrapperAST = wrapCallback(state, node, iterPatch);
	const promiseWrapperAST = wrapPromise(state, node, iterPatch);
	const [getCbArg, checkHasSubscribers, defineWrappedCb, checkCbIsFunction, spliceCbArg, runStores] = cbWrapperAST.body[0].body.body;
	const fallbackToPromise = {
		type: "IfStatement",
		test: checkCbIsFunction.test,
		consequent: {
			type: "BlockStatement",
			body: promiseWrapperAST.body[0].body.body
		},
		alternate: null
	};
	cbWrapperAST.body[0].body.body = [
		getCbArg,
		fallbackToPromise,
		checkHasSubscribers,
		defineWrappedCb,
		spliceCbArg,
		runStores
	];
	return cbWrapperAST;
}
function wrapCallback(state, node, iterPatch = "") {
	const { channelName, functionQuery: { callbackIndex = -1 } } = state;
	const channelVariable = formatChannelVariable(channelName);
	return parse$4(`
    function wrapper () {
      const __apm$cb = Array.prototype.at.call(__apm$arguments, ${callbackIndex});

      if (!${channelVariable}.start.hasSubscribers) return __apm$traced();

      function __apm$wrappedCb(err, res) {
        if (err) {
          __apm$ctx.error = err;
          ${channelVariable}.error.publish(__apm$ctx);
        } else {
          __apm$ctx.result = res;
          ${iterPatch}
        }

        ${channelVariable}.asyncStart.runStores(__apm$ctx, () => {
          try {
            if (__apm$cb) {
              return __apm$cb.apply(this, arguments);
            }
          } finally {
            ${channelVariable}.asyncEnd.publish(__apm$ctx);
          }
        });
      }

      if (typeof __apm$cb !== 'function') {
        return __apm$traced();
      }
      Array.prototype.splice.call(__apm$arguments, ${callbackIndex}, 1, __apm$wrappedCb);

      return ${channelVariable}.start.runStores(__apm$ctx, () => {
        try {
          return __apm$traced();
        } catch (err) {
          __apm$ctx.error = err;
          ${channelVariable}.error.publish(__apm$ctx);
          throw err;
        } finally {
         __apm$ctx.self ??= this;
          ${channelVariable}.end.publish(__apm$ctx);
        }
      });
    }
  `);
}
function wrapPromise(state, node, iterPatch = "") {
	const { channelName } = state;
	const channelVariable = formatChannelVariable(channelName);
	return parse$4(`
    function wrapper () {
      if (!tr_ch_apm_hasSubscribers(${channelVariable})) return __apm$traced();

      return ${channelVariable}.start.runStores(__apm$ctx, () => {
        try {
          let promise = __apm$traced();
          if (typeof promise?.then !== 'function') {
            __apm$ctx.result = promise;
            ${iterPatch}
            return __apm$ctx.result;
          }
          // Mirror Node.js core diagnostics_channel behaviour: for native Promise
          // instances, chain normally (safe since there is no subclass API to
          // preserve). For Promise subclasses and other thenables, side-chain the
          // callbacks for event publishing and return the original so that any
          // subclass-specific methods (e.g. APIPromise.withResponse()) remain
          // accessible to the caller.
          if (promise instanceof Promise && promise.constructor === Promise) {
            return promise.then(
              result => {
                __apm$ctx.result = result;
                ${iterPatch}
                ${channelVariable}.asyncStart.publish(__apm$ctx);
                ${channelVariable}.asyncEnd.publish(__apm$ctx);
                return __apm$ctx.result;
              },
              err => {
                __apm$ctx.error = err;
                ${channelVariable}.error.publish(__apm$ctx);
                ${channelVariable}.asyncStart.publish(__apm$ctx);
                ${channelVariable}.asyncEnd.publish(__apm$ctx);
                throw err;
              }
            );
          }
          promise.then(
            result => {
              __apm$ctx.result = result;
              ${iterPatch}
              ${channelVariable}.asyncStart.publish(__apm$ctx);
              ${channelVariable}.asyncEnd.publish(__apm$ctx);
            },
            err => {
              __apm$ctx.error = err;
              ${channelVariable}.error.publish(__apm$ctx);
              ${channelVariable}.asyncStart.publish(__apm$ctx);
              ${channelVariable}.asyncEnd.publish(__apm$ctx);
            }
          );
          return promise;
        } catch (err) {
          __apm$ctx.error = err;
          ${channelVariable}.error.publish(__apm$ctx);
          throw err;
        } finally {
          __apm$ctx.self ??= this;
          ${channelVariable}.end.publish(__apm$ctx);
        }
      });
    }
  `);
}
function wrapSync(state, node, iterPatch = "") {
	const { channelName } = state;
	const channelVariable = formatChannelVariable(channelName);
	return parse$4(`
    function wrapper () {
      if (!tr_ch_apm_hasSubscribers(${channelVariable})) return __apm$traced();

      return ${channelVariable}.start.runStores(__apm$ctx, () => {
        try {
          __apm$ctx.result = __apm$traced();
          ${iterPatch}
        } catch (err) {
          __apm$ctx.error = err;
          ${channelVariable}.error.publish(__apm$ctx);
          throw err;
        } finally {
         __apm$ctx.self ??= this;
          ${channelVariable}.end.publish(__apm$ctx);
        }
        return __apm$ctx.result;
      });
    }
  `);
}
function declareIteratorChannel(state, program) {
	const { channelName, module: { name } } = state;
	const iterChannelVariable = formatChannelVariable(channelName + ":next");
	if (program.body.some((child) => child.declarations?.[0]?.id?.name === iterChannelVariable)) return;
	const channelVariable = formatChannelVariable(channelName);
	const index = program.body.findIndex((child) => child.declarations?.[0]?.id?.name === channelVariable);
	const code = `const ${iterChannelVariable} = tr_ch_apm_tracingChannel("orchestrion:${name}:${channelName}:next")`;
	program.body.splice(index + 1, 0, parse$4(code).body[0]);
}
function generateIterPatch(state, returnKind, program) {
	const { channelName } = state;
	const traceMethod = returnKind === "Iterator" ? "traceSync" : "tracePromise";
	const iterChannelVariable = formatChannelVariable(channelName + ":next");
	declareIteratorChannel(state, program);
	return `
    const __apm$iter = __apm$ctx.result;
    if (__apm$iter != null && typeof __apm$iter.next === 'function') {
      const __apm$patchIter = function (method) {
        const __apm$orig = __apm$iter[method];
        if (typeof __apm$orig !== 'function') return;
        __apm$iter[method] = function () {
          const __apm$iterArgs = Array.prototype.slice.call(arguments);
          if (!tr_ch_apm_hasSubscribers(${iterChannelVariable})) return __apm$orig.apply(this, __apm$iterArgs);
          __apm$ctx.method = method;
          __apm$ctx.arguments = __apm$iterArgs;
          return ${iterChannelVariable}.${traceMethod}(__apm$orig, __apm$ctx, this, ...__apm$iterArgs);
        };
      };
      __apm$patchIter('next');
      __apm$patchIter('throw');
      __apm$patchIter('return');
    }
  `;
}
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/_virtual/source-map.js
var sourceMap = {};
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/code-transformer/lib/transformer.js
var __typeError$1 = (msg) => {
	throw TypeError(msg);
};
var __accessCheck$1 = (obj, member, msg) => member.has(obj) || __typeError$1("Cannot " + msg);
var __privateGet$1 = (obj, member, getter) => (__accessCheck$1(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd$1 = (obj, member, value) => member.has(obj) ? __typeError$1("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet$1 = (obj, member, value, setter) => (__accessCheck$1(obj, member, "write to private field"), member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck$1(obj, member, "access private method"), method);
var _moduleName;
var _version;
var _filePath;
var _configs$1;
var _dcModule$1;
var _customTransforms$1;
var _Transformer_instances;
var visit_fn;
var getOperator_fn;
var collectExportAliases_fn;
var resolveExportAlias_fn;
var fromFunctionQuery_fn;
var esquery = A;
var { parse: parse$3 } = meriyah;
var { generate } = astring;
var transforms = transforms$1;
var SourceMapConsumer;
var SourceMapGenerator;
var Transformer$1 = class {
	/**
	* @param {string} moduleName - The npm package name being instrumented.
	* @param {string} version - The installed semver version string.
	* @param {string} filePath - The relative file path within the package.
	* @param {object[]} configs - Instrumentation configuration objects for this file.
	* @param {string} dcModule - The diagnostics_channel module specifier to inject.
	* @param {Record<string, Function>} [customTransforms] - Optional custom operator overrides.
	*/
	constructor(moduleName, version, filePath, configs, dcModule, customTransforms = {}) {
		__privateAdd$1(this, _Transformer_instances);
		__privateAdd$1(this, _moduleName, null);
		__privateAdd$1(this, _version, null);
		__privateAdd$1(this, _filePath, null);
		__privateAdd$1(this, _configs$1, []);
		__privateAdd$1(this, _dcModule$1, null);
		__privateAdd$1(this, _customTransforms$1, {});
		__privateSet$1(this, _moduleName, moduleName);
		__privateSet$1(this, _version, version);
		__privateSet$1(this, _filePath, filePath);
		__privateSet$1(this, _configs$1, configs);
		__privateSet$1(this, _dcModule$1, dcModule);
		__privateSet$1(this, _customTransforms$1, customTransforms);
	}
	/** No-op — freeing resources is not needed for the JavaScript implementation. */
	free() {}
	/**
	* The npm package name being instrumented.
	*
	* @returns {string}
	*/
	get moduleName() {
		return __privateGet$1(this, _moduleName);
	}
	/**
	* The relative file path within the npm package being instrumented.
	*
	* @returns {string}
	*/
	get filePath() {
		return __privateGet$1(this, _filePath);
	}
	/**
	* Instruments `code` by injecting diagnostics_channel tracing around the
	* target functions defined by this transformer's configs.
	*
	* @param {string|Buffer} code - Original JavaScript source, or a Buffer containing UTF-8 source.
	* @param {'esm'|'cjs'|'unknown'} moduleType - Whether the source is an ES module or CommonJS.
	* @param {string|object|null} [sourcemap] - Existing source map (raw string or object) to chain from.
	* @returns {{ code: string, map?: string }}
	*   The transformed source and an optional updated source map.
	* @throws {Error} If no injection points are found for any config.
	*/
	transform(code, moduleType, sourcemap) {
		if (Buffer.isBuffer(code)) code = code.toString();
		if (!code) return { code };
		let ast;
		let aliases = {};
		let injectionCount = 0;
		const mergedTransforms = {
			...transforms,
			...__privateGet$1(this, _customTransforms$1),
			defaults: { ...transforms }
		};
		for (const config of __privateGet$1(this, _configs$1)) {
			const { astQuery, functionQuery = {} } = config;
			if (!ast) {
				const options = {
					loc: true,
					ranges: true,
					raw: true,
					module: moduleType === "esm"
				};
				try {
					ast = parse$3(code, options);
				} catch {
					ast = parse$3(code, {
						...options,
						module: !options.module
					});
				}
				if (moduleType === "esm") aliases = __privateMethod(this, _Transformer_instances, collectExportAliases_fn).call(this, ast);
			}
			const resolvedFunctionQuery = __privateMethod(this, _Transformer_instances, resolveExportAlias_fn).call(this, functionQuery, aliases);
			const query = astQuery || __privateMethod(this, _Transformer_instances, fromFunctionQuery_fn).call(this, resolvedFunctionQuery);
			const state = {
				...config,
				dcModule: __privateGet$1(this, _dcModule$1),
				moduleType,
				moduleVersion: __privateGet$1(this, _version),
				functionQuery: resolvedFunctionQuery,
				transforms: mergedTransforms
			};
			state.operator = __privateMethod(this, _Transformer_instances, getOperator_fn).call(this, state);
			esquery.traverse(ast, esquery.parse(query), (...args) => {
				injectionCount++;
				__privateMethod(this, _Transformer_instances, visit_fn).call(this, state, ...args);
			});
		}
		if (injectionCount === 0 && __privateGet$1(this, _configs$1).length > 0) {
			const names = __privateGet$1(this, _configs$1).map(({ astQuery, functionQuery = {} }) => {
				if (astQuery) return astQuery;
				const resolvedQuery = __privateMethod(this, _Transformer_instances, resolveExportAlias_fn).call(this, functionQuery, aliases);
				const queryName = (q) => q.methodName || q.privateMethodName || q.functionName || q.expressionName || "constructor";
				const originalName = queryName(functionQuery);
				const originalAlias = functionQuery.className || functionQuery.functionName || functionQuery.expressionName;
				const resolvedAlias = resolvedQuery.className || resolvedQuery.functionName || resolvedQuery.expressionName;
				if (originalAlias && originalAlias !== resolvedAlias) return `${originalAlias} (local name: ${resolvedAlias})`;
				return originalName;
			});
			throw new Error(`Failed to find injection points for: ${JSON.stringify(names)}`);
		}
		if (ast) {
			SourceMapConsumer ?? (SourceMapConsumer = sourceMap.SourceMapConsumer);
			SourceMapGenerator ?? (SourceMapGenerator = sourceMap.SourceMapGenerator);
			const file = `${__privateGet$1(this, _moduleName)}/${__privateGet$1(this, _filePath)}`;
			let generator;
			if (sourcemap) {
				const consumer = new SourceMapConsumer(sourcemap);
				consumer.file = file;
				generator = SourceMapGenerator.fromSourceMap(consumer);
			} else generator = new SourceMapGenerator({ file });
			return {
				code: generate(ast, { sourceMap: generator }),
				map: generator.toString()
			};
		}
		return { code };
	}
};
_moduleName = /* @__PURE__ */ new WeakMap();
_version = /* @__PURE__ */ new WeakMap();
_filePath = /* @__PURE__ */ new WeakMap();
_configs$1 = /* @__PURE__ */ new WeakMap();
_dcModule$1 = /* @__PURE__ */ new WeakMap();
_customTransforms$1 = /* @__PURE__ */ new WeakMap();
_Transformer_instances = /* @__PURE__ */ new WeakSet();
/**
* Visitor called for each AST node that matches a config's query.
* Handles index-based filtering and delegates to the appropriate transform.
*
* @param {object} state - Merged config + runtime state for this traversal.
* @param {...unknown} args - `(node, parent, ancestry)` from esquery traverse.
*/
visit_fn = function(state, ...args) {
	const transform = state.transforms[state.operator];
	const { index = 0 } = state.functionQuery;
	const [node] = args;
	const type = node.init?.type || node.type;
	if (type !== "ClassDeclaration" && type !== "ClassExpression") {
		if (node.type === "VariableDeclarator") return;
		state.functionIndex = ++state.functionIndex || 0;
		if (index !== null && index !== state.functionIndex) return;
	}
	transform(state, ...args);
};
/**
* Resolves the operator name (transform function key) for a config.
*
* If the config has an explicit `transform` name it is used directly;
* otherwise the operator is derived from the `kind` field of `functionQuery`.
*
* @param {{ transform?: string, functionQuery: { kind?: string } }} state
* @returns {string} Operator name, e.g. `'tracePromise'`.
*/
getOperator_fn = function({ transform, functionQuery: { kind } }) {
	if (transform) return transform;
	switch (kind) {
		case "Async": return "tracePromise";
		case "Auto": return "traceAuto";
		case "Callback": return "traceCallback";
		case "Sync": return "traceSync";
		default: return "traceSync";
	}
};
/**
* Collects a map of exported name → local name from `export { local as exported }`
* declarations so that instrumentation configs that reference export names can be
* resolved to local identifiers.
*
* @param {import('estree').Program} ast
* @returns {Record<string, string>} Map of exported name to local name.
*/
collectExportAliases_fn = function(ast) {
	const aliases = {};
	for (const node of ast.body) if (node.type === "ExportNamedDeclaration" && !node.source) {
		for (const spec of node.specifiers) if (spec.exported && spec.local) {
			const exportedName = spec.exported.name ?? spec.exported.value;
			const localName = spec.local.name ?? spec.local.value;
			if (exportedName && localName) aliases[exportedName] = localName;
		}
	}
	return aliases;
};
/**
* If `functionQuery.isExportAlias` is set, replaces the exported identifier in
* `functionQuery` with the corresponding local name from `aliases`.
*
* @param {object} functionQuery
* @param {Record<string, string>} aliases - Map produced by {@link #collectExportAliases}.
* @returns {object} Resolved function query (may be the original object if unchanged).
*/
resolveExportAlias_fn = function(functionQuery, aliases) {
	if (!functionQuery.isExportAlias) return functionQuery;
	const { functionName, expressionName, className } = functionQuery;
	if (functionName && aliases[functionName]) return {
		...functionQuery,
		functionName: aliases[functionName]
	};
	if (expressionName && aliases[expressionName]) return {
		...functionQuery,
		expressionName: aliases[expressionName]
	};
	if (className && aliases[className]) return {
		...functionQuery,
		className: aliases[className]
	};
	return functionQuery;
};
/**
* Builds a comma-separated esquery selector string from a `functionQuery` descriptor.
*
* Handles class methods, standalone functions, and expression assignments, producing
* multiple selector alternatives joined with `, `.
*
* @param {object} functionQuery
* @param {string} [functionQuery.className]
* @param {string} [functionQuery.methodName]
* @param {string} [functionQuery.privateMethodName]
* @param {string} [functionQuery.functionName]
* @param {string} [functionQuery.expressionName]
* @returns {string} esquery selector.
*/
fromFunctionQuery_fn = function(functionQuery) {
	const { functionName, expressionName, className, objectName, propertyName } = functionQuery;
	const type = functionQuery.privateMethodName ? "PrivateIdentifier" : "Identifier";
	const queries = [];
	let method = functionQuery.methodName || functionQuery.privateMethodName;
	if (className) {
		method ?? (method = "constructor");
		queries.push(`[id.name="${className}"]`, `[id.name="${className}"] > ClassExpression`, `[id.name="${className}"] > ClassBody > [key.name="${method}"][key.type=${type}] > [async]`, `[id.name="${className}"] > ClassExpression > ClassBody > [key.name="${method}"][key.type=${type}] > [async]`);
	} else if (method) queries.push(`ClassBody > [key.name="${method}"][key.type=${type}] > [async]`, `Property[key.name="${method}"][key.type=${type}] > [async]`);
	if (functionName) queries.push(`FunctionDeclaration[id.name="${functionName}"][async]`);
	else if (expressionName) queries.push(`FunctionExpression[id.name="${expressionName}"][async]`, `ArrowFunctionExpression[id.name="${expressionName}"][async]`, `VariableDeclarator[id.name="${expressionName}"] > FunctionExpression[async]`, `VariableDeclarator[id.name="${expressionName}"] > ArrowFunctionExpression[async]`, `AssignmentExpression[left.property.name="${expressionName}"] > FunctionExpression[async]`, `AssignmentExpression[left.property.name="${expressionName}"] > ArrowFunctionExpression[async]`, `AssignmentExpression[left.name="${expressionName}"] > FunctionExpression[async]`, `AssignmentExpression[left.name="${expressionName}"] > ArrowFunctionExpression[async]`);
	if (objectName || propertyName) {
		if (!objectName || !propertyName) throw new Error(`functionQuery: 'objectName' and 'propertyName' must be used together (got objectName=${objectName}, propertyName=${propertyName})`);
		const objectSelector = objectName === "this" ? "left.object.type=ThisExpression" : `left.object.name="${objectName}"`;
		queries.push(`AssignmentExpression[${objectSelector}][left.property.name="${propertyName}"] > [async]`);
	}
	return queries.join(", ");
};
var transformer = { Transformer: Transformer$1 };
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/code-transformer/lib/matcher.js
var __typeError = (msg) => {
	throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), member.set(obj, value), value);
var _configs;
var _dcModule;
var _transformers;
var _customTransforms;
var semifies = semifies$1;
var { Transformer } = transformer;
var InstrumentationMatcher$1 = class {
	/**
	* @param {object[]} configs - Array of instrumentation configuration objects.
	* @param {string} [dcModule] - The diagnostics_channel module specifier to inject.
	*   Defaults to `'diagnostics_channel'`.
	*/
	constructor(configs, dcModule) {
		__privateAdd(this, _configs, []);
		__privateAdd(this, _dcModule, null);
		__privateAdd(this, _transformers, {});
		__privateAdd(this, _customTransforms, {});
		__privateSet(this, _configs, configs);
		__privateSet(this, _dcModule, dcModule || "diagnostics_channel");
	}
	/** Releases all cached transformers, freeing any associated resources. */
	free() {
		__privateSet(this, _transformers, {});
	}
	/**
	* Registers a custom transform function under the given operator name.
	*
	* Custom transforms override built-in ones of the same name everywhere they
	* are dispatched: when an instrumentation config references the name via
	* `transform`, when it is selected via `functionQuery.kind`, and when one
	* transform invokes another internally (e.g. `tracingChannelDeclaration`
	* calling `tracingChannelImport`).
	*
	* @param {string} name - Operator name (e.g. `'traceSync'`).
	* @param {Function} fn - Transform function `(state, node, parent, ancestry) => void`.
	*/
	addTransform(name, fn) {
		__privateGet(this, _customTransforms)[name] = fn;
	}
	/**
	* Returns a {@link Transformer} for the given module/file/version, or `undefined`
	* if no registered config matches.
	*
	* Results are cached by a `moduleName/filePath@version` key.
	*
	* @param {string} moduleName - The npm package name (e.g. `'express'`).
	* @param {string} version - The installed semver version string.
	* @param {string} filePath - The relative file path within the package.
	* @returns {import('./transformer').Transformer|undefined}
	*/
	getTransformer(moduleName, version, filePath) {
		filePath = filePath.replace(/\\/g, "/");
		const id = `${moduleName}/${filePath}@${version}`;
		if (__privateGet(this, _transformers)[id]) return __privateGet(this, _transformers)[id];
		const configs = __privateGet(this, _configs).filter(({ module: mod }) => mod.name === moduleName && (typeof mod.filePath === "string" ? mod.filePath === filePath : mod.filePath.test(filePath)) && semifies(version, mod.versionRange));
		if (configs.length === 0) return;
		__privateGet(this, _transformers)[id] = new Transformer(moduleName, version, filePath, configs, __privateGet(this, _dcModule), __privateGet(this, _customTransforms));
		return __privateGet(this, _transformers)[id];
	}
};
_configs = /* @__PURE__ */ new WeakMap();
_dcModule = /* @__PURE__ */ new WeakMap();
_transformers = /* @__PURE__ */ new WeakMap();
_customTransforms = /* @__PURE__ */ new WeakMap();
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/code-transformer/lib/index.js
var { InstrumentationMatcher } = { InstrumentationMatcher: InstrumentationMatcher$1 };
function create$1(configs, dcModule) {
	return new InstrumentationMatcher(configs, dcModule);
}
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/code-transformer/index.js
var codeTransformer = { create: create$1 };
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/module-details-from-path/index.js
var sep$1 = require$$0$1.sep;
var moduleDetailsFromPath = function(file) {
	var segments = file.split(sep$1);
	var index = segments.lastIndexOf("node_modules");
	if (index === -1) return;
	if (!segments[index + 1]) return;
	var scoped = segments[index + 1][0] === "@";
	var name = scoped ? segments[index + 1] + "/" + segments[index + 2] : segments[index + 1];
	var offset = scoped ? 3 : 2;
	var basedir = "";
	var lastBaseDirSegmentIndex = index + offset - 1;
	for (var i = 0; i <= lastBaseDirSegmentIndex; i++) if (i === lastBaseDirSegmentIndex) basedir += segments[i];
	else basedir += segments[i] + sep$1;
	var path = "";
	var lastSegmentIndex = segments.length - 1;
	for (var i2 = index + offset; i2 <= lastSegmentIndex; i2++) if (i2 === lastSegmentIndex) path += segments[i2];
	else path += segments[i2] + sep$1;
	return {
		name,
		basedir,
		path
	};
};
var parse$2 = /*@__PURE__*/ getDefaultExportFromCjs(moduleDetailsFromPath);
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/tracing-hooks/lib/get-package-version.js
var { readFileSync: readFileSync$1 } = require$$0;
var { join: join$1 } = require$$0$1;
var packageVersions = /* @__PURE__ */ new Map();
function getPackageVersion$1(baseDir) {
	if (packageVersions.has(baseDir)) return packageVersions.get(baseDir);
	try {
		const jsonFile = readFileSync$1(join$1(baseDir, "package.json"));
		const { version } = JSON.parse(jsonFile);
		packageVersions.set(baseDir, version);
		return version;
	} catch {
		return process.version.slice(1);
	}
}
var getPackageVersion_1 = getPackageVersion$1;
var getPackageVersion$1$1 = /*@__PURE__*/ getDefaultExportFromCjs(getPackageVersion_1);
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/tracing-hooks/lib/diagnostics.js
var diagnosticsHook;
function setDiagnosticsHook$1(hook) {
	diagnosticsHook = hook;
}
function emitDiagnostics$1(diag) {
	if (diagnosticsHook) diagnosticsHook(diag);
}
var diagnostics = {
	setDiagnosticsHook: setDiagnosticsHook$1,
	emitDiagnostics: emitDiagnostics$1
};
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/_virtual/node.js
var node = { exports: {} };
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/has-flag/index.js
var hasFlag$1 = (flag, argv = process.argv) => {
	const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
	const position = argv.indexOf(prefix + flag);
	const terminatorPosition = argv.indexOf("--");
	return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/supports-color/index.js
var os$1 = require$$0$2;
var tty = require$$1;
var hasFlag = hasFlag$1;
var { env } = process;
var forceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) forceColor = 0;
else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) forceColor = 1;
if ("FORCE_COLOR" in env) {
	if (env.FORCE_COLOR === "true") forceColor = 1;
	else if (env.FORCE_COLOR === "false") forceColor = 0;
	else forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
}
function translateLevel(level) {
	if (level === 0) return false;
	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}
function supportsColor(haveStream, streamIsTTY) {
	if (forceColor === 0) return 0;
	if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) return 3;
	if (hasFlag("color=256")) return 2;
	if (haveStream && !streamIsTTY && forceColor === void 0) return 0;
	const min = forceColor || 0;
	if (env.TERM === "dumb") return min;
	if (process.platform === "win32") {
		const osRelease = os$1.release().split(".");
		if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) return Number(osRelease[2]) >= 14931 ? 3 : 2;
		return 1;
	}
	if ("CI" in env) {
		if ([
			"TRAVIS",
			"CIRCLECI",
			"APPVEYOR",
			"GITLAB_CI",
			"GITHUB_ACTIONS",
			"BUILDKITE"
		].some((sign) => sign in env) || env.CI_NAME === "codeship") return 1;
		return min;
	}
	if ("TEAMCITY_VERSION" in env) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	if (env.COLORTERM === "truecolor") return 3;
	if ("TERM_PROGRAM" in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
		switch (env.TERM_PROGRAM) {
			case "iTerm.app": return version >= 3 ? 3 : 2;
			case "Apple_Terminal": return 2;
		}
	}
	if (/-256(color)?$/i.test(env.TERM)) return 2;
	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) return 1;
	if ("COLORTERM" in env) return 1;
	return min;
}
function getSupportLevel(stream) {
	return translateLevel(supportsColor(stream, stream && stream.isTTY));
}
var supportsColor_1 = {
	supportsColor: getSupportLevel,
	stdout: translateLevel(supportsColor(true, tty.isatty(1))),
	stderr: translateLevel(supportsColor(true, tty.isatty(2)))
};
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/ms/index.js
var s = 1e3;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;
var ms = function(val, options) {
	options = options || {};
	var type = typeof val;
	if (type === "string" && val.length > 0) return parse$1(val);
	else if (type === "number" && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
	throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
};
function parse$1(str) {
	str = String(str);
	if (str.length > 100) return;
	var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
	if (!match) return;
	var n = parseFloat(match[1]);
	switch ((match[2] || "ms").toLowerCase()) {
		case "years":
		case "year":
		case "yrs":
		case "yr":
		case "y": return n * y;
		case "weeks":
		case "week":
		case "w": return n * w;
		case "days":
		case "day":
		case "d": return n * d;
		case "hours":
		case "hour":
		case "hrs":
		case "hr":
		case "h": return n * h;
		case "minutes":
		case "minute":
		case "mins":
		case "min":
		case "m": return n * m;
		case "seconds":
		case "second":
		case "secs":
		case "sec":
		case "s": return n * s;
		case "milliseconds":
		case "millisecond":
		case "msecs":
		case "msec":
		case "ms": return n;
		default: return;
	}
}
function fmtShort(ms) {
	var msAbs = Math.abs(ms);
	if (msAbs >= d) return Math.round(ms / d) + "d";
	if (msAbs >= h) return Math.round(ms / h) + "h";
	if (msAbs >= m) return Math.round(ms / m) + "m";
	if (msAbs >= s) return Math.round(ms / s) + "s";
	return ms + "ms";
}
function fmtLong(ms) {
	var msAbs = Math.abs(ms);
	if (msAbs >= d) return plural(ms, msAbs, d, "day");
	if (msAbs >= h) return plural(ms, msAbs, h, "hour");
	if (msAbs >= m) return plural(ms, msAbs, m, "minute");
	if (msAbs >= s) return plural(ms, msAbs, s, "second");
	return ms + " ms";
}
function plural(ms, msAbs, n, name) {
	var isPlural = msAbs >= n * 1.5;
	return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
}
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/common.js
function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = ms;
	createDebug.destroy = destroy;
	Object.keys(env).forEach((key) => {
		createDebug[key] = env[key];
	});
	createDebug.names = [];
	createDebug.skips = [];
	createDebug.formatters = {};
	function selectColor(namespace) {
		let hash = 0;
		for (let i = 0; i < namespace.length; i++) {
			hash = (hash << 5) - hash + namespace.charCodeAt(i);
			hash |= 0;
		}
		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;
		function debug(...args) {
			if (!debug.enabled) return;
			const self = debug;
			const curr = Number(/* @__PURE__ */ new Date());
			self.diff = curr - (prevTime || curr);
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;
			args[0] = createDebug.coerce(args[0]);
			if (typeof args[0] !== "string") args.unshift("%O");
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				if (match === "%%") return "%";
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === "function") {
					const val = args[index];
					match = formatter.call(self, val);
					args.splice(index, 1);
					index--;
				}
				return match;
			});
			createDebug.formatArgs.call(self, args);
			(self.log || createDebug.log).apply(self, args);
		}
		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy;
		Object.defineProperty(debug, "enabled", {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) return enableOverride;
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}
				return enabledCache;
			},
			set: (v) => {
				enableOverride = v;
			}
		});
		if (typeof createDebug.init === "function") createDebug.init(debug);
		return debug;
	}
	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;
		createDebug.names = [];
		createDebug.skips = [];
		const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
		for (const ns of split) if (ns[0] === "-") createDebug.skips.push(ns.slice(1));
		else createDebug.names.push(ns);
	}
	function matchesTemplate(search, template) {
		let searchIndex = 0;
		let templateIndex = 0;
		let starIndex = -1;
		let matchIndex = 0;
		while (searchIndex < search.length) if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
			if (template[templateIndex] === "*") {
				starIndex = templateIndex;
				matchIndex = searchIndex;
				templateIndex++;
			} else {
				searchIndex++;
				templateIndex++;
			}
		} else if (starIndex !== -1) {
			templateIndex = starIndex + 1;
			matchIndex++;
			searchIndex = matchIndex;
		} else return false;
		while (templateIndex < template.length && template[templateIndex] === "*") templateIndex++;
		return templateIndex === template.length;
	}
	function disable() {
		const namespaces = [...createDebug.names, ...createDebug.skips.map((namespace) => "-" + namespace)].join(",");
		createDebug.enable("");
		return namespaces;
	}
	function enabled(name) {
		for (const skip of createDebug.skips) if (matchesTemplate(name, skip)) return false;
		for (const ns of createDebug.names) if (matchesTemplate(name, ns)) return true;
		return false;
	}
	function coerce(val) {
		if (val instanceof Error) return val.stack || val.message;
		return val;
	}
	function destroy() {
		console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
	}
	createDebug.enable(createDebug.load());
	return createDebug;
}
var common = setup;
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js
(function(module, exports) {
	const tty = require$$1;
	const util = require$$1$1;
	exports.init = init;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.destroy = util.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
	exports.colors = [
		6,
		2,
		3,
		4,
		5,
		1
	];
	try {
		const supportsColor = supportsColor_1;
		if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	} catch (error) {}
	exports.inspectOpts = Object.keys(process.env).filter((key) => {
		return /^debug_/i.test(key);
	}).reduce((obj, key) => {
		const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});
		let val = process.env[key];
		if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
		else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
		else if (val === "null") val = null;
		else val = Number(val);
		obj[prop] = val;
		return obj;
	}, {});
	function useColors() {
		return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
	}
	function formatArgs(args) {
		const { namespace: name, useColors: useColors2 } = this;
		if (useColors2) {
			const c = this.color;
			const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
			const prefix = `  ${colorCode};1m${name} \x1B[0m`;
			args[0] = prefix + args[0].split("\n").join("\n" + prefix);
			args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
		} else args[0] = getDate() + name + " " + args[0];
	}
	function getDate() {
		if (exports.inspectOpts.hideDate) return "";
		return (/* @__PURE__ */ new Date()).toISOString() + " ";
	}
	function log(...args) {
		return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
	}
	function save(namespaces) {
		if (namespaces) process.env.DEBUG = namespaces;
		else delete process.env.DEBUG;
	}
	function load() {
		return process.env.DEBUG;
	}
	function init(debug) {
		debug.inspectOpts = {};
		const keys = Object.keys(exports.inspectOpts);
		for (let i = 0; i < keys.length; i++) debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
	module.exports = common(exports);
	const { formatters } = module.exports;
	formatters.o = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
	};
	formatters.O = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts);
	};
})(node, node.exports);
var nodeExports = node.exports;
var createDebug = /*@__PURE__*/ getDefaultExportFromCjs(nodeExports);
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/tracing-hooks/index.js
var { create } = codeTransformer;
var Module = require$$1__default;
var parse = moduleDetailsFromPath;
var { pathToFileURL } = require$$3;
var getPackageVersion = getPackageVersion_1;
var { emitDiagnostics } = diagnostics;
var debug$1 = nodeExports("@apm-js-collab/tracing-hooks:module-patch");
var ModulePatch = class {
	constructor({ instrumentations = [] } = {}) {
		this.packages = new Set(instrumentations.map((i) => i.module.name));
		this.instrumentator = create(instrumentations);
		this.compile = Module.prototype._compile;
	}
	/**
	* Patches the Node.js module class method that is responsible for compiling code.
	* If a module is found that has an instrumentator, it will transform the code before compiling it
	* with tracing channel methods.
	*/
	patch() {
		const self = this;
		Module.prototype._compile = function wrappedCompile(...args) {
			const [content, filename] = args;
			const resolvedModule = parse(filename);
			if (resolvedModule && self.packages.has(resolvedModule.name)) {
				debug$1("found resolved module, checking if there is a transformer %s", filename);
				const version = getPackageVersion(resolvedModule.basedir, resolvedModule.name);
				const transformer = self.instrumentator.getTransformer(resolvedModule.name, version, resolvedModule.path);
				if (transformer) {
					debug$1("transforming file %s", filename);
					try {
						args[0] = transformer.transform(content, "cjs")?.code;
						emitDiagnostics({
							url: pathToFileURL(filename).href,
							moduleName: transformer.moduleName
						});
						if (process.env.TRACING_DUMP) dump(args[0], filename);
					} catch (error) {
						debug$1("Error transforming module %s: %o", filename, error);
						emitDiagnostics({
							url: pathToFileURL(filename).href,
							moduleName: transformer.moduleName,
							error
						});
					} finally {
						transformer.free();
					}
				}
			}
			return self.compile.apply(this, args);
		};
	}
	/**
	* Restores the original Module.prototype._compile method
	* **Note**: This is intended to be used in testing only.
	*/
	unpatch() {
		Module.prototype._compile = this.compile;
	}
};
function dump(code, filename) {
	const os = require$$0$2;
	const path = require$$0$1;
	const fs = require$$0;
	const base = process.env.TRACING_DUMP_DIR ?? os.tmpdir();
	const dirname = path.dirname(filename);
	const basename = path.basename(filename);
	const targetDir = path.join(base, dirname);
	const targetFile = path.join(targetDir, basename);
	debug$1("Dumping patched code to: %s", targetFile);
	fs.mkdirSync(targetDir, { recursive: true });
	fs.writeFileSync(targetFile, code);
}
var ModulePatch$1 = /*@__PURE__*/ getDefaultExportFromCjs(ModulePatch);
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/tracing-hooks/hook.js
var debug = createDebug("@apm-js-collab/tracing-hooks:esm-hook");
var transformers = null;
var packages = null;
var instrumentator = null;
var emit = diagnostics.emitDiagnostics;
/**
* Creates a MessagePort that forwards diagnostics posted by the `Module.register`
* loader thread to the hook set via `setDiagnosticsHook` on this thread. Pass the
* returned port to `Module.register` in both `data.diagnosticsPort` and
* `transferList`.
*/
function createDiagnosticsPort() {
	const { port1, port2 } = new MessageChannel();
	port1.on("message", diagnostics.emitDiagnostics);
	port1.unref();
	return port2;
}
function initializeSync(data = {}) {
	const instrumentations = data?.instrumentations || [];
	instrumentator = codeTransformer.create(instrumentations);
	packages = new Set(instrumentations.map((i) => i.module.name));
	transformers = /* @__PURE__ */ new Map();
	emit = data?.diagnosticsPort ? createPortEmitter(data.diagnosticsPort) : diagnostics.emitDiagnostics;
}
function createPortEmitter(port) {
	return (diag) => {
		try {
			const error = diag.error === void 0 || diag.error instanceof Error ? diag.error : new Error(String(diag.error));
			port.postMessage({
				...diag,
				error
			});
		} catch (err) {
			debug("failed to post diagnostics for %s: %o", diag.url, err);
		}
	};
}
function resolveFromURL(url) {
	const resolvedModule = parse$2(url.url);
	if (resolvedModule && packages.has(resolvedModule.name)) {
		const version = getPackageVersion$1$1(fileURLToPath(resolvedModule.basedir));
		const transformer = instrumentator.getTransformer(resolvedModule.name, version, resolvedModule.path);
		if (transformer) transformers.set(url.url, transformer);
	}
	return url;
}
function resolveSync(specifier, context, nextResolve) {
	return resolveFromURL(nextResolve(specifier, context));
}
function loadSync(url, context, nextLoad) {
	const result = nextLoad(url, context);
	if (transformers.has(url) === false) return result;
	if (result.format === "commonjs") {
		const parsedUrl = new URL(result.responseURL ?? url);
		result.source ??= readFileSync(parsedUrl);
	}
	return loadResult(url, result);
}
function loadResult(url, result) {
	const code = result.source;
	if (code) {
		const transformer = transformers.get(url);
		try {
			const moduleType = result.format === "module" ? "esm" : result.format === "commonjs" ? "cjs" : "unknown";
			const source = typeof code === "string" ? code : Buffer.from(code).toString("utf8");
			result.source = transformer.transform(source, moduleType)?.code;
			result.shortCircuit = true;
			emit({
				url,
				moduleName: transformer.moduleName
			});
		} catch (err) {
			debug("Error transforming module %s: %o", url, err);
			emit({
				url,
				moduleName: transformer.moduleName,
				error: err
			});
		} finally {
			transformer.free();
		}
	}
	return result;
}
diagnostics.setDiagnosticsHook;
//#endregion
//#region node_modules/@sentry/server-runtime-injection/build/esm/register.js
var BUNDLING_DOCS_URL = "https://docs.sentry.io/platforms/javascript/guides/node/troubleshooting/";
function hasStableSyncModuleHooks(isDeno) {
	if (isDeno) return true;
	const { major = 0, minor = 0 } = parseSemver(process.versions.node ?? "0.0.0");
	return major > 25 || major === 25 && minor >= 1 || major === 24 && minor >= 13;
}
function warnRuntimeUnavailable(message) {
	consoleSandbox(() => {
		console.warn(`[Sentry] ${message} See ${BUNDLING_DOCS_URL}`);
	});
}
var warnedTransformerUnavailable = false;
function warnTransformerUnavailable(moduleName) {
	if (warnedTransformerUnavailable) return;
	warnedTransformerUnavailable = true;
	warnRuntimeUnavailable(`\`@sentry/server-runtime-injection\` was bundled into your application, so ${moduleName} and any other instrumented dependency load uninstrumented. Keep \`@sentry/server-runtime-injection\` external in your server bundle, or use the Sentry bundler plugin for build-time instrumentation.`);
}
function registerDiagnosticsChannelInjection() {
	var _a;
	const marker = (_a = GLOBAL_OBJ).__SENTRY_ORCHESTRION__ ?? (_a.__SENTRY_ORCHESTRION__ = {});
	if (marker.runtime || marker.runtimeUnavailable) return;
	const globalAny = globalThis;
	const stableSyncHooks = hasStableSyncModuleHooks(Boolean(globalAny.Deno));
	const mod = require$$1$2;
	diagnostics.setDiagnosticsHook(({ moduleName, error }) => {
		if (error) {
			if (error instanceof TypeError) warnTransformerUnavailable(moduleName);
			debug$2.warn(`[instrumentation] failed to inject diagnostics-channel into ${moduleName}:`, error);
		} else {
			GLOBAL_OBJ.__SENTRY_ORCHESTRION__ = GLOBAL_OBJ.__SENTRY_ORCHESTRION__ || {};
			GLOBAL_OBJ.__SENTRY_ORCHESTRION__.runtime = GLOBAL_OBJ.__SENTRY_ORCHESTRION__.runtime || [];
			GLOBAL_OBJ.__SENTRY_ORCHESTRION__.runtime.push(moduleName);
			getClient()?.emit("orchestrion.module-injected", moduleName);
		}
	});
	try {
		if (typeof mod.registerHooks === "function" && stableSyncHooks) {
			initializeSync({ instrumentations: SENTRY_INSTRUMENTATIONS });
			mod.registerHooks({
				resolve: resolveSync,
				load: loadSync
			});
			debug$2.log("Registered diagnostics-channel injection via Module.registerHooks()");
		} else if (typeof mod.register === "function" && !globalAny.Bun && !globalAny.Deno) {
			const diagnosticsPort = createDiagnosticsPort();
			let parentURL;
			parentURL = import.meta.url;
			mod.register("@sentry/server-runtime-injection/hook", {
				parentURL,
				data: {
					instrumentations: SENTRY_INSTRUMENTATIONS,
					diagnosticsPort
				},
				transferList: [diagnosticsPort]
			});
			new ModulePatch$1({ instrumentations: SENTRY_INSTRUMENTATIONS }).patch();
			debug$2.log("Registered diagnostics-channel injection via Module.register()");
		} else {
			marker.runtimeUnavailable = true;
			debug$2.warn("No available Node API to register diagnostics-channel injection hooks; skipping.");
			return;
		}
	} catch (error) {
		marker.runtimeUnavailable = true;
		warnRuntimeUnavailable("Failed to register diagnostics-channel injection hooks, so channel-based integrations will not record spans.");
		debug$2.warn("Diagnostics-channel injection registration error:", error);
		return;
	}
	marker.runtime = marker.runtime || [];
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/childProcess.js
var INTEGRATION_NAME$9 = "ChildProcess";
var childProcessIntegration = defineIntegration((options = {}) => {
	return {
		name: INTEGRATION_NAME$9,
		setup() {
			diagnosticsChannel.channel("child_process").subscribe((event) => {
				if (isObjectLike(event) && "process" in event) captureChildProcessEvents(event.process, options);
			});
		}
	};
});
function captureChildProcessEvents(child, options) {
	let hasExited = false;
	let data;
	child.on("spawn", () => {
		if (child.spawnfile === "/usr/bin/sw_vers") {
			hasExited = true;
			return;
		}
		data = { spawnfile: child.spawnfile };
		if (options.includeChildProcessArgs) data.spawnargs = child.spawnargs;
	}).on("exit", (code) => {
		if (!hasExited) {
			hasExited = true;
			if (code !== null && code !== 0) addBreadcrumb({
				category: "child_process",
				message: `Child process exited with code '${code}'`,
				level: code === 0 ? "info" : "warning",
				data
			});
		}
	}).on("error", (error) => {
		if (!hasExited) {
			hasExited = true;
			addBreadcrumb({
				category: "child_process",
				message: `Child process errored with '${error.message}'`,
				level: "error",
				data
			});
		}
	});
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/console.js
var consoleIntegration = defineIntegration((options = {}) => {
	return {
		name: "Console",
		setup(client) {
			if (process.env.LAMBDA_TASK_ROOT) maybeInstrument("console", instrumentConsoleLambda);
			consoleIntegration$1({
				...options,
				filter: [...options.filter || [], "[DEP0205] DeprecationWarning"]
			}).setup?.(client);
		}
	};
});
function instrumentConsoleLambda() {
	const consoleObj = GLOBAL_OBJ?.console;
	if (!consoleObj) return;
	CONSOLE_LEVELS.forEach((level) => {
		if (level in consoleObj) patchWithDefineProperty(consoleObj, level);
	});
}
function patchWithDefineProperty(consoleObj, level) {
	const nativeMethod = consoleObj[level];
	originalConsoleMethods[level] = nativeMethod;
	let delegate = nativeMethod;
	let savedDelegate;
	let isExecuting = false;
	const wrapper = function(...args) {
		if (isExecuting) {
			nativeMethod.apply(consoleObj, args);
			return;
		}
		isExecuting = true;
		try {
			triggerHandlers("console", {
				args,
				level
			});
			delegate.apply(consoleObj, args);
		} finally {
			isExecuting = false;
		}
	};
	markFunctionWrapped(wrapper, nativeMethod);
	const sandboxBypass = nativeMethod.bind(consoleObj);
	originalConsoleMethods[level] = sandboxBypass;
	try {
		let current = wrapper;
		Object.defineProperty(consoleObj, level, {
			configurable: true,
			enumerable: true,
			get() {
				return current;
			},
			set(newValue) {
				if (newValue === wrapper) {
					if (savedDelegate !== void 0) {
						delegate = savedDelegate;
						savedDelegate = void 0;
					}
					current = wrapper;
				} else if (newValue === sandboxBypass) {
					savedDelegate = delegate;
					current = sandboxBypass;
				} else if (typeof newValue === "function" && !newValue.__sentry_original__) {
					delegate = newValue;
					current = wrapper;
				} else current = newValue;
			}
		});
	} catch {
		fill(consoleObj, level, function(originalConsoleMethod) {
			originalConsoleMethods[level] = originalConsoleMethod;
			return function(...args) {
				triggerHandlers("console", {
					args,
					level
				});
				originalConsoleMethods[level]?.apply(this, args);
			};
		});
	}
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/context.js
var readFileAsync = promisify(readFile);
var readDirAsync = promisify(readdir);
var INTEGRATION_NAME$8 = "Context";
var _nodeContextIntegration = (options = {}) => {
	const _options = {
		app: true,
		os: true,
		device: true,
		culture: true,
		cloudResource: true,
		...options
	};
	const appContext = _options.app ? getAppContext() : void 0;
	const deviceContext = _options.device ? getDeviceContext(_options.device) : void 0;
	const cultureContext = _options.culture ? getCultureContext() : void 0;
	const cloudResourceContext = _options.cloudResource ? getCloudResourceContext() : void 0;
	const osContextPromise = _options.os ? getOsContext() : void 0;
	const cachedSpanAttributes = {
		"process.runtime.engine.name": "v8",
		"process.runtime.engine.version": process.versions.v8,
		...contextsToSpanAttributes({
			app: appContext,
			device: deviceContext,
			culture: cultureContext,
			cloud_resource: cloudResourceContext
		})
	};
	if (osContextPromise) osContextPromise.then((osCtx) => Object.assign(cachedSpanAttributes, contextsToSpanAttributes({ os: osCtx }))).catch(() => {});
	const contextsPromise = (async () => {
		const contexts = {};
		if (osContextPromise) contexts.os = await osContextPromise;
		if (appContext) contexts.app = appContext;
		if (deviceContext) contexts.device = deviceContext;
		if (cultureContext) contexts.culture = cultureContext;
		if (cloudResourceContext) contexts.cloud_resource = cloudResourceContext;
		return contexts;
	})();
	async function addContext(event) {
		const updatedContext = _updateContext(await contextsPromise);
		event.contexts = {
			...event.contexts,
			app: {
				...updatedContext.app,
				...event.contexts?.app
			},
			os: {
				...updatedContext.os,
				...event.contexts?.os
			},
			device: {
				...updatedContext.device,
				...event.contexts?.device
			},
			culture: {
				...updatedContext.culture,
				...event.contexts?.culture
			},
			cloud_resource: {
				...updatedContext.cloud_resource,
				...event.contexts?.cloud_resource
			}
		};
		return event;
	}
	return {
		name: INTEGRATION_NAME$8,
		processEvent(event) {
			return addContext(event);
		},
		processSegmentSpan(span) {
			safeSetSpanJSONAttributes(span, cachedSpanAttributes);
			safeSetSpanJSONAttributes(span, getDynamicSpanAttributes(appContext, deviceContext));
		}
	};
};
var nodeContextIntegration = defineIntegration(_nodeContextIntegration);
function _updateContext(contexts) {
	if (contexts.app?.app_memory) contexts.app.app_memory = process.memoryUsage().rss;
	if (contexts.app?.free_memory && typeof process.availableMemory === "function") {
		const freeMemory = process.availableMemory?.();
		if (freeMemory != null) contexts.app.free_memory = freeMemory;
	}
	if (contexts.device?.free_memory) contexts.device.free_memory = os.freemem();
	return contexts;
}
function contextsToSpanAttributes(contexts) {
	const attrs = {};
	const { app, device, os: osCtx, culture, cloud_resource } = contexts;
	if (app) {
		if (app.app_start_time) attrs["app.start_time"] = app.app_start_time;
	}
	if (device) {
		if (device.arch) attrs["device.archs"] = [device.arch];
		if (device.boot_time) attrs["device.boot_time"] = device.boot_time;
		if (device.memory_size != null) attrs["device.memory_size"] = device.memory_size;
		if (device.processor_count != null) attrs["device.processor_count"] = device.processor_count;
		if (device.cpu_description) attrs["device.cpu_description"] = device.cpu_description;
		if (device.processor_frequency != null) attrs["device.processor_frequency"] = device.processor_frequency;
	}
	if (osCtx) {
		if (osCtx.name) attrs["os.name"] = osCtx.name;
		if (osCtx.version) attrs["os.version"] = osCtx.version;
		if (osCtx.kernel_version) attrs["os.kernel_version"] = osCtx.kernel_version;
		if (osCtx.build) attrs["os.build"] = osCtx.build;
	}
	if (culture) {
		if (culture.locale) attrs["culture.locale"] = culture.locale;
		if (culture.timezone) attrs["culture.timezone"] = culture.timezone;
	}
	if (cloud_resource) {
		for (const [key, value] of Object.entries(cloud_resource)) if (value != null) attrs[key] = value;
	}
	return attrs;
}
function getDynamicSpanAttributes(appContext, deviceContext) {
	const attrs = {};
	if (appContext) {
		attrs["app.memory"] = process.memoryUsage().rss;
		if (typeof process.availableMemory === "function") {
			const freeMemory = process.availableMemory?.();
			if (freeMemory != null) attrs["app.free_memory"] = freeMemory;
		}
	}
	if (deviceContext?.free_memory != null) attrs["device.free_memory"] = os.freemem();
	return attrs;
}
async function getOsContext() {
	const platformId = os.platform();
	switch (platformId) {
		case "darwin": return getDarwinInfo();
		case "linux": return getLinuxInfo();
		default: return {
			name: PLATFORM_NAMES[platformId] || platformId,
			version: os.release()
		};
	}
}
function getCultureContext() {
	try {
		if (typeof process.versions.icu !== "string") return;
		const january = /* @__PURE__ */ new Date(9e8);
		if (new Intl.DateTimeFormat("es", { month: "long" }).format(january) === "enero") {
			const options = Intl.DateTimeFormat().resolvedOptions();
			return {
				locale: options.locale,
				timezone: options.timeZone
			};
		}
	} catch {}
}
function getAppContext() {
	const app_memory = process.memoryUsage().rss;
	const appContext = {
		app_start_time: (/* @__PURE__ */ new Date(Date.now() - process.uptime() * 1e3)).toISOString(),
		app_memory
	};
	if (typeof process.availableMemory === "function") {
		const freeMemory = process.availableMemory?.();
		if (freeMemory != null) appContext.free_memory = freeMemory;
	}
	return appContext;
}
function getDeviceContext(deviceOpt) {
	const device = {};
	let uptime;
	try {
		uptime = os.uptime();
	} catch {}
	if (typeof uptime === "number") device.boot_time = (/* @__PURE__ */ new Date(Date.now() - uptime * 1e3)).toISOString();
	device.arch = os.arch();
	if (deviceOpt === true || deviceOpt.memory) {
		device.memory_size = os.totalmem();
		device.free_memory = os.freemem();
	}
	if (deviceOpt === true || deviceOpt.cpu) {
		const cpuInfo = os.cpus();
		const firstCpu = cpuInfo?.[0];
		if (firstCpu) {
			device.processor_count = cpuInfo.length;
			device.cpu_description = firstCpu.model;
			device.processor_frequency = firstCpu.speed;
		}
	}
	return device;
}
var PLATFORM_NAMES = {
	aix: "IBM AIX",
	freebsd: "FreeBSD",
	openbsd: "OpenBSD",
	sunos: "SunOS",
	win32: "Windows",
	ohos: "OpenHarmony",
	android: "Android"
};
var LINUX_DISTROS = [
	{
		name: "fedora-release",
		distros: ["Fedora"]
	},
	{
		name: "redhat-release",
		distros: ["Red Hat Linux", "Centos"]
	},
	{
		name: "redhat_version",
		distros: ["Red Hat Linux"]
	},
	{
		name: "SuSE-release",
		distros: ["SUSE Linux"]
	},
	{
		name: "lsb-release",
		distros: ["Ubuntu Linux", "Arch Linux"]
	},
	{
		name: "debian_version",
		distros: ["Debian"]
	},
	{
		name: "debian_release",
		distros: ["Debian"]
	},
	{
		name: "arch-release",
		distros: ["Arch Linux"]
	},
	{
		name: "gentoo-release",
		distros: ["Gentoo Linux"]
	},
	{
		name: "novell-release",
		distros: ["SUSE Linux"]
	},
	{
		name: "alpine-release",
		distros: ["Alpine Linux"]
	}
];
var LINUX_VERSIONS = {
	alpine: (content) => content,
	arch: (content) => matchFirst(/distrib_release=(.*)/, content),
	centos: (content) => matchFirst(/release ([^ ]+)/, content),
	debian: (content) => content,
	fedora: (content) => matchFirst(/release (..)/, content),
	mint: (content) => matchFirst(/distrib_release=(.*)/, content),
	red: (content) => matchFirst(/release ([^ ]+)/, content),
	suse: (content) => matchFirst(/VERSION = (.*)\n/, content),
	ubuntu: (content) => matchFirst(/distrib_release=(.*)/, content)
};
function matchFirst(regex, text) {
	const match = regex.exec(text);
	return match ? match[1] : void 0;
}
async function getDarwinInfo() {
	const darwinInfo = {
		kernel_version: os.release(),
		name: "Mac OS X",
		version: `10.${Number(os.release().split(".")[0]) - 4}`
	};
	try {
		const output = await new Promise((resolve, reject) => {
			execFile("/usr/bin/sw_vers", (error, stdout) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(stdout);
			});
		});
		darwinInfo.name = matchFirst(/^ProductName:\s+(.*)$/m, output);
		darwinInfo.version = matchFirst(/^ProductVersion:\s+(.*)$/m, output);
		darwinInfo.build = matchFirst(/^BuildVersion:\s+(.*)$/m, output);
	} catch {}
	return darwinInfo;
}
function getLinuxDistroId(name) {
	return name.split(" ")[0].toLowerCase();
}
async function getLinuxInfo() {
	const linuxInfo = {
		kernel_version: os.release(),
		name: "Linux"
	};
	try {
		const etcFiles = await readDirAsync("/etc");
		const distroFile = LINUX_DISTROS.find((file) => etcFiles.includes(file.name));
		if (!distroFile) return linuxInfo;
		const contents = (await readFileAsync(join("/etc", distroFile.name), { encoding: "utf-8" })).toLowerCase();
		const { distros } = distroFile;
		linuxInfo.name = distros.find((d) => contents.indexOf(getLinuxDistroId(d)) >= 0) || distros[0];
		linuxInfo.version = LINUX_VERSIONS[getLinuxDistroId(linuxInfo.name)]?.(contents);
	} catch {}
	return linuxInfo;
}
function getCloudResourceContext() {
	if (process.env.VERCEL) return {
		"cloud.provider": "vercel",
		"cloud.region": process.env.VERCEL_REGION
	};
	else if (process.env.AWS_REGION) return {
		"cloud.provider": "aws",
		"cloud.region": process.env.AWS_REGION,
		"cloud.platform": process.env.AWS_EXECUTION_ENV
	};
	else if (process.env.GCP_PROJECT) return { "cloud.provider": "gcp" };
	else if (process.env.ALIYUN_REGION_ID) return {
		"cloud.provider": "alibaba_cloud",
		"cloud.region": process.env.ALIYUN_REGION_ID
	};
	else if (process.env.WEBSITE_SITE_NAME && process.env.REGION_NAME) return {
		"cloud.provider": "azure",
		"cloud.region": process.env.REGION_NAME
	};
	else if (process.env.IBM_CLOUD_REGION) return {
		"cloud.provider": "ibm_cloud",
		"cloud.region": process.env.IBM_CLOUD_REGION
	};
	else if (process.env.TENCENTCLOUD_REGION) return {
		"cloud.provider": "tencent_cloud",
		"cloud.region": process.env.TENCENTCLOUD_REGION,
		"cloud.account.id": process.env.TENCENTCLOUD_APPID,
		"cloud.availability_zone": process.env.TENCENTCLOUD_ZONE
	};
	else if (process.env.NETLIFY) return { "cloud.provider": "netlify" };
	else if (process.env.FLY_REGION) return {
		"cloud.provider": "fly.io",
		"cloud.region": process.env.FLY_REGION
	};
	else if (process.env.DYNO) return { "cloud.provider": "heroku" };
	else return;
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/contextlines.js
var LRU_FILE_CONTENTS_CACHE = new LRUMap(10);
var LRU_FILE_CONTENTS_FS_READ_FAILED = new LRUMap(20);
var DEFAULT_LINES_OF_CONTEXT = 7;
var INTEGRATION_NAME$7 = "ContextLines";
function emplace(map, key, contents) {
	const value = map.get(key);
	if (value === void 0) {
		map.set(key, contents);
		return contents;
	}
	return value;
}
function shouldSkipContextLinesForFile(path) {
	if (path.startsWith("node:")) return true;
	if (path.endsWith(".min.js")) return true;
	if (path.endsWith(".min.cjs")) return true;
	if (path.endsWith(".min.mjs")) return true;
	if (path.startsWith("data:")) return true;
	return false;
}
function shouldSkipContextLinesForFrame(frame) {
	if (frame.lineno !== void 0 && frame.lineno > 1e4) return true;
	if (frame.colno !== void 0 && frame.colno > 1e3) return true;
	return false;
}
function rangeExistsInContentCache(file, range) {
	const contents = LRU_FILE_CONTENTS_CACHE.get(file);
	if (contents === void 0) return false;
	for (let i = range[0]; i <= range[1]; i++) if (contents[i] === void 0) return false;
	return true;
}
function makeLineReaderRanges(lines, linecontext) {
	if (!lines.length) return [];
	let i = 0;
	const line = lines[0];
	if (typeof line !== "number") return [];
	let current = makeContextRange(line, linecontext);
	const out = [];
	while (true) {
		if (i === lines.length - 1) {
			out.push(current);
			break;
		}
		const next = lines[i + 1];
		if (typeof next !== "number") break;
		if (next <= current[1]) current[1] = next + linecontext;
		else {
			out.push(current);
			current = makeContextRange(next, linecontext);
		}
		i++;
	}
	return out;
}
function getContextLinesFromFile(path, ranges, output) {
	return new Promise((resolve, _reject) => {
		const stream = createReadStream(path);
		const lineReaded = createInterface({ input: stream });
		function destroyStreamAndResolve() {
			stream.destroy();
			resolve();
		}
		let lineNumber = 0;
		let currentRangeIndex = 0;
		const range = ranges[currentRangeIndex];
		if (range === void 0) {
			destroyStreamAndResolve();
			return;
		}
		let rangeStart = range[0];
		let rangeEnd = range[1];
		function onStreamError(e) {
			LRU_FILE_CONTENTS_FS_READ_FAILED.set(path, 1);
			DEBUG_BUILD && debug$2.error(`Failed to read file: ${path}. Error: ${e}`);
			lineReaded.close();
			lineReaded.removeAllListeners();
			destroyStreamAndResolve();
		}
		stream.on("error", onStreamError);
		lineReaded.on("error", onStreamError);
		lineReaded.on("close", destroyStreamAndResolve);
		lineReaded.on("line", (line) => {
			lineNumber++;
			if (lineNumber < rangeStart) return;
			output[lineNumber] = snipLine(line, 0);
			if (lineNumber >= rangeEnd) {
				if (currentRangeIndex === ranges.length - 1) {
					lineReaded.close();
					lineReaded.removeAllListeners();
					return;
				}
				currentRangeIndex++;
				const range2 = ranges[currentRangeIndex];
				if (range2 === void 0) {
					lineReaded.close();
					lineReaded.removeAllListeners();
					return;
				}
				rangeStart = range2[0];
				rangeEnd = range2[1];
			}
		});
	});
}
async function addSourceContext(event, contextLines) {
	const filesToLines = {};
	if (contextLines > 0 && event.exception?.values) for (const exception of event.exception.values) {
		if (!exception.stacktrace?.frames?.length) continue;
		for (let i = exception.stacktrace.frames.length - 1; i >= 0; i--) {
			const frame = exception.stacktrace.frames[i];
			const filename = frame?.filename;
			if (!frame || typeof filename !== "string" || typeof frame.lineno !== "number" || shouldSkipContextLinesForFile(filename) || shouldSkipContextLinesForFrame(frame)) continue;
			if (!filesToLines[filename]) filesToLines[filename] = [];
			filesToLines[filename].push(frame.lineno);
		}
	}
	const files = Object.keys(filesToLines);
	if (files.length == 0) return event;
	const readlinePromises = [];
	for (const file of files) {
		if (LRU_FILE_CONTENTS_FS_READ_FAILED.get(file)) continue;
		const filesToLineRanges = filesToLines[file];
		if (!filesToLineRanges) continue;
		filesToLineRanges.sort((a, b) => a - b);
		const ranges = makeLineReaderRanges(filesToLineRanges, contextLines);
		if (ranges.every((r) => rangeExistsInContentCache(file, r))) continue;
		const cache = emplace(LRU_FILE_CONTENTS_CACHE, file, {});
		readlinePromises.push(getContextLinesFromFile(file, ranges, cache));
	}
	await Promise.all(readlinePromises).catch(() => {
		DEBUG_BUILD && debug$2.log("Failed to read one or more source files and resolve context lines");
	});
	if (contextLines > 0 && event.exception?.values) {
		for (const exception of event.exception.values) if (exception.stacktrace?.frames && exception.stacktrace.frames.length > 0) addSourceContextToFrames(exception.stacktrace.frames, contextLines, LRU_FILE_CONTENTS_CACHE);
	}
	return event;
}
function addSourceContextToFrames(frames, contextLines, cache) {
	for (const frame of frames) if (frame.filename && frame.context_line === void 0 && typeof frame.lineno === "number") {
		const contents = cache.get(frame.filename);
		if (contents === void 0) continue;
		addContextToFrame(frame.lineno, frame, contextLines, contents);
	}
}
function clearLineContext(frame) {
	delete frame.pre_context;
	delete frame.context_line;
	delete frame.post_context;
}
function addContextToFrame(lineno, frame, contextLines, contents) {
	if (frame.lineno === void 0 || contents === void 0) {
		DEBUG_BUILD && debug$2.error("Cannot resolve context for frame with no lineno or file contents");
		return;
	}
	frame.pre_context = [];
	for (let i = makeRangeStart(lineno, contextLines); i < lineno; i++) {
		const line = contents[i];
		if (line === void 0) {
			clearLineContext(frame);
			DEBUG_BUILD && debug$2.error(`Could not find line ${i} in file ${frame.filename}`);
			return;
		}
		frame.pre_context.push(line);
	}
	if (contents[lineno] === void 0) {
		clearLineContext(frame);
		DEBUG_BUILD && debug$2.error(`Could not find line ${lineno} in file ${frame.filename}`);
		return;
	}
	frame.context_line = contents[lineno];
	const end = makeRangeEnd(lineno, contextLines);
	frame.post_context = [];
	for (let i = lineno + 1; i <= end; i++) {
		const line = contents[i];
		if (line === void 0) break;
		frame.post_context.push(line);
	}
}
function makeRangeStart(line, linecontext) {
	return Math.max(1, line - linecontext);
}
function makeRangeEnd(line, linecontext) {
	return line + linecontext;
}
function makeContextRange(line, linecontext) {
	return [makeRangeStart(line, linecontext), makeRangeEnd(line, linecontext)];
}
var _contextLinesIntegration = (options = {}) => {
	return {
		name: INTEGRATION_NAME$7,
		processEvent(event, _hint, client) {
			return addSourceContext(event, options.frameContextLines ?? client?.getDataCollectionOptions().frameContextLines ?? DEFAULT_LINES_OF_CONTEXT);
		}
	};
};
var contextLinesIntegration = defineIntegration(_contextLinesIntegration);
//#endregion
//#region node_modules/@sentry/node/build/esm/utils/debug.js
var cachedDebuggerEnabled;
async function isDebuggerEnabled() {
	if (cachedDebuggerEnabled === void 0) try {
		cachedDebuggerEnabled = !!(await import("node:inspector")).url();
	} catch {
		cachedDebuggerEnabled = false;
	}
	return cachedDebuggerEnabled;
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/local-variables/common.js
function filterFrameVariables(vars, behavior) {
	return filterKeyValueData(vars, behavior);
}
var LOCAL_VARIABLES_KEY = "__SENTRY_ERROR_LOCAL_VARIABLES__";
function isAnonymous(name) {
	return name !== void 0 && (name.length === 0 || name === "?" || name === "<anonymous>");
}
function functionNamesMatch(a, b) {
	return a === b || `Object.${a}` === b || a === `Object.${b}` || isAnonymous(a) && isAnonymous(b);
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/local-variables/local-variables-async.js
var base64WorkerScript = "LyohIEBzZW50cnkvbm9kZSAxMC42Ny4wIChlMmZmN2M3MjJjKSB8IGh0dHBzOi8vZ2l0aHViLmNvbS9nZXRzZW50cnkvc2VudHJ5LWphdmFzY3JpcHQgKi8KaW1wb3J0e1Nlc3Npb24gYXMgZX1mcm9tIm5vZGU6aW5zcGVjdG9yL3Byb21pc2VzIjtpbXBvcnR7d29ya2VyRGF0YSBhcyB0fWZyb20ibm9kZTp3b3JrZXJfdGhyZWFkcyI7Y29uc3Qgbj1nbG9iYWxUaGlzLGk9e307Y29uc3Qgbz0iX19TRU5UUllfRVJST1JfTE9DQUxfVkFSSUFCTEVTX18iO2NvbnN0IGE9dDtmdW5jdGlvbiBzKC4uLmUpe2EuZGVidWcmJmZ1bmN0aW9uKGUpe2lmKCEoImNvbnNvbGUiaW4gbikpcmV0dXJuIGUoKTtjb25zdCB0PW4uY29uc29sZSxvPXt9LGE9T2JqZWN0LmtleXMoaSk7YS5mb3JFYWNoKGU9Pntjb25zdCBuPWlbZV07b1tlXT10W2VdLHRbZV09bn0pO3RyeXtyZXR1cm4gZSgpfWZpbmFsbHl7YS5mb3JFYWNoKGU9Pnt0W2VdPW9bZV19KX19KCgpPT5jb25zb2xlLmxvZygiW0xvY2FsVmFyaWFibGVzIFdvcmtlcl0iLC4uLmUpKX1hc3luYyBmdW5jdGlvbiBjKGUsdCxuLGkpe2NvbnN0IG89YXdhaXQgZS5wb3N0KCJSdW50aW1lLmdldFByb3BlcnRpZXMiLHtvYmplY3RJZDp0LG93blByb3BlcnRpZXM6ITB9KTtpW25dPW8ucmVzdWx0LmZpbHRlcihlPT4ibGVuZ3RoIiE9PWUubmFtZSYmIWlzTmFOKHBhcnNlSW50KGUubmFtZSwxMCkpKS5zb3J0KChlLHQpPT5wYXJzZUludChlLm5hbWUsMTApLXBhcnNlSW50KHQubmFtZSwxMCkpLm1hcChlPT5lLnZhbHVlPy52YWx1ZSl9YXN5bmMgZnVuY3Rpb24gcihlLHQsbixpKXtjb25zdCBvPWF3YWl0IGUucG9zdCgiUnVudGltZS5nZXRQcm9wZXJ0aWVzIix7b2JqZWN0SWQ6dCxvd25Qcm9wZXJ0aWVzOiEwfSk7aVtuXT1vLnJlc3VsdC5tYXAoZT0+W2UubmFtZSxlLnZhbHVlPy52YWx1ZV0pLnJlZHVjZSgoZSxbdCxuXSk9PihlW3RdPW4sZSkse30pfWZ1bmN0aW9uIHUoZSx0KXtlLnZhbHVlJiYoInZhbHVlImluIGUudmFsdWU/dm9pZCAwPT09ZS52YWx1ZS52YWx1ZXx8bnVsbD09PWUudmFsdWUudmFsdWU/dFtlLm5hbWVdPWA8JHtlLnZhbHVlLnZhbHVlfT5gOnRbZS5uYW1lXT1lLnZhbHVlLnZhbHVlOiJkZXNjcmlwdGlvbiJpbiBlLnZhbHVlJiYiZnVuY3Rpb24iIT09ZS52YWx1ZS50eXBlP3RbZS5uYW1lXT1gPCR7ZS52YWx1ZS5kZXNjcmlwdGlvbn0+YDoidW5kZWZpbmVkIj09PWUudmFsdWUudHlwZSYmKHRbZS5uYW1lXT0iPHVuZGVmaW5lZD4iKSl9YXN5bmMgZnVuY3Rpb24gbChlLHQpe2NvbnN0IG49YXdhaXQgZS5wb3N0KCJSdW50aW1lLmdldFByb3BlcnRpZXMiLHtvYmplY3RJZDp0LG93blByb3BlcnRpZXM6ITB9KSxpPXt9O2Zvcihjb25zdCB0IG9mIG4ucmVzdWx0KWlmKHQudmFsdWU/Lm9iamVjdElkJiYiQXJyYXkiPT09dC52YWx1ZS5jbGFzc05hbWUpe2NvbnN0IG49dC52YWx1ZS5vYmplY3RJZDthd2FpdCBjKGUsbix0Lm5hbWUsaSl9ZWxzZSBpZih0LnZhbHVlPy5vYmplY3RJZCYmIk9iamVjdCI9PT10LnZhbHVlLmNsYXNzTmFtZSl7Y29uc3Qgbj10LnZhbHVlLm9iamVjdElkO2F3YWl0IHIoZSxuLHQubmFtZSxpKX1lbHNlIHQudmFsdWUmJnUodCxpKTtyZXR1cm4gaX1sZXQgZjsoYXN5bmMgZnVuY3Rpb24oKXtjb25zdCB0PW5ldyBlO3QuY29ubmVjdFRvTWFpblRocmVhZCgpLHMoIkNvbm5lY3RlZCB0byBtYWluIHRocmVhZCIpO2xldCBuPSExO3Qub24oIkRlYnVnZ2VyLnJlc3VtZWQiLCgpPT57bj0hMX0pLHQub24oIkRlYnVnZ2VyLnBhdXNlZCIsZT0+e249ITAsYXN5bmMgZnVuY3Rpb24oZSx7cmVhc29uOnQsZGF0YTp7b2JqZWN0SWQ6bn0sY2FsbEZyYW1lczppfSl7aWYoImV4Y2VwdGlvbiIhPT10JiYicHJvbWlzZVJlamVjdGlvbiIhPT10KXJldHVybjtpZihmPy4oKSxudWxsPT1uKXJldHVybjtjb25zdCBhPVtdO2ZvcihsZXQgdD0wO3Q8aS5sZW5ndGg7dCsrKXtjb25zdHtzY29wZUNoYWluOm4sZnVuY3Rpb25OYW1lOm8sdGhpczpzfT1pW3RdLGM9bi5maW5kKGU9PiJsb2NhbCI9PT1lLnR5cGUpLHI9Imdsb2JhbCIhPT1zLmNsYXNzTmFtZSYmcy5jbGFzc05hbWU/YCR7cy5jbGFzc05hbWV9LiR7b31gOm87aWYodm9pZCAwPT09Yz8ub2JqZWN0Lm9iamVjdElkKWFbdF09e2Z1bmN0aW9uOnJ9O2Vsc2V7Y29uc3Qgbj1hd2FpdCBsKGUsYy5vYmplY3Qub2JqZWN0SWQpO2FbdF09e2Z1bmN0aW9uOnIsdmFyczpufX19YXdhaXQgZS5wb3N0KCJSdW50aW1lLmNhbGxGdW5jdGlvbk9uIix7ZnVuY3Rpb25EZWNsYXJhdGlvbjpgZnVuY3Rpb24oKSB7IHRoaXMuJHtvfSA9IHRoaXMuJHtvfSB8fCAke0pTT04uc3RyaW5naWZ5KGEpfTsgfWAsc2lsZW50OiEwLG9iamVjdElkOm59KSxhd2FpdCBlLnBvc3QoIlJ1bnRpbWUucmVsZWFzZU9iamVjdCIse29iamVjdElkOm59KX0odCxlLnBhcmFtcykudGhlbihhc3luYygpPT57biYmYXdhaXQgdC5wb3N0KCJEZWJ1Z2dlci5yZXN1bWUiKX0sYXN5bmMgZT0+e24mJmF3YWl0IHQucG9zdCgiRGVidWdnZXIucmVzdW1lIil9KX0pLGF3YWl0IHQucG9zdCgiRGVidWdnZXIuZW5hYmxlIik7Y29uc3QgaT0hMSE9PWEuY2FwdHVyZUFsbEV4Y2VwdGlvbnM7aWYoYXdhaXQgdC5wb3N0KCJEZWJ1Z2dlci5zZXRQYXVzZU9uRXhjZXB0aW9ucyIse3N0YXRlOmk/ImFsbCI6InVuY2F1Z2h0In0pLGkpe2NvbnN0IGU9YS5tYXhFeGNlcHRpb25zUGVyU2Vjb25kfHw1MDtmPWZ1bmN0aW9uKGUsdCxuKXtsZXQgaT0wLG89NSxhPTA7cmV0dXJuIHNldEludGVydmFsKCgpPT57MD09PWE/aT5lJiYobyo9MixuKG8pLG8+ODY0MDAmJihvPTg2NDAwKSxhPW8pOihhLT0xLDA9PT1hJiZ0KCkpLGk9MH0sMWUzKS51bnJlZigpLCgpPT57aSs9MX19KGUsYXN5bmMoKT0+e3MoIlJhdGUtbGltaXQgbGlmdGVkLiIpLGF3YWl0IHQucG9zdCgiRGVidWdnZXIuc2V0UGF1c2VPbkV4Y2VwdGlvbnMiLHtzdGF0ZToiYWxsIn0pfSxhc3luYyBlPT57cyhgUmF0ZS1saW1pdCBleGNlZWRlZC4gRGlzYWJsaW5nIGNhcHR1cmluZyBvZiBjYXVnaHQgZXhjZXB0aW9ucyBmb3IgJHtlfSBzZWNvbmRzLmApLGF3YWl0IHQucG9zdCgiRGVidWdnZXIuc2V0UGF1c2VPbkV4Y2VwdGlvbnMiLHtzdGF0ZToidW5jYXVnaHQifSl9KX19KSgpLmNhdGNoKGU9PntzKCJGYWlsZWQgdG8gc3RhcnQgZGVidWdnZXIiLGUpfSksc2V0SW50ZXJ2YWwoKCk9Pnt9LDFlNCk7";
function log(...args) {
	debug$2.log("[LocalVariables]", ...args);
}
var localVariablesAsyncIntegration = defineIntegration((integrationOptions = {}) => {
	function addLocalVariablesToException(exception, localVariables, behavior) {
		if (behavior === false) return;
		const frames = (exception.stacktrace?.frames || []).filter((frame) => frame.function !== "new Promise");
		for (let i = 0; i < frames.length; i++) {
			const frameIndex = frames.length - i - 1;
			const frameLocalVariables = localVariables[i];
			const frame = frames[frameIndex];
			if (!frame || !frameLocalVariables) break;
			if (frameLocalVariables.vars === void 0 || frame.in_app === false && integrationOptions.includeOutOfAppFrames !== true || !functionNamesMatch(frame.function, frameLocalVariables.function)) continue;
			frame.vars = filterFrameVariables(frameLocalVariables.vars, behavior);
		}
	}
	function addLocalVariablesToEvent(event, hint) {
		if (hint.originalException && typeof hint.originalException === "object" && "__SENTRY_ERROR_LOCAL_VARIABLES__" in hint.originalException && Array.isArray(hint.originalException["__SENTRY_ERROR_LOCAL_VARIABLES__"])) {
			const behavior = getClient()?.getDataCollectionOptions().stackFrameVariables ?? true;
			for (const exception of event.exception?.values || []) addLocalVariablesToException(exception, hint.originalException[LOCAL_VARIABLES_KEY], behavior);
			hint.originalException[LOCAL_VARIABLES_KEY] = void 0;
		}
		return event;
	}
	async function startInspector() {
		const inspector = await import("node:inspector");
		if (!inspector.url()) inspector.open(0);
	}
	function startWorker(options) {
		const worker = new Worker(new URL(`data:application/javascript;base64,${base64WorkerScript}`), {
			workerData: options,
			execArgv: [],
			env: {
				...process.env,
				NODE_OPTIONS: void 0
			}
		});
		process.on("exit", () => {
			worker.terminate();
		});
		worker.once("error", (err) => {
			log("Worker error", err);
		});
		worker.once("exit", (code) => {
			log("Worker exit", code);
		});
		worker.unref();
	}
	return {
		name: "LocalVariablesAsync",
		async setup(client) {
			if (!client.getOptions().includeLocalVariables) return;
			if (await isDebuggerEnabled()) {
				debug$2.warn("Local variables capture has been disabled because the debugger was already enabled");
				return;
			}
			const options = {
				...integrationOptions,
				debug: debug$2.isEnabled()
			};
			startInspector().then(() => {
				try {
					startWorker(options);
				} catch (e) {
					debug$2.error("Failed to start worker", e);
				}
			}, (e) => {
				debug$2.error("Failed to start inspector", e);
			});
		},
		processEvent(event, hint) {
			return addLocalVariablesToEvent(event, hint);
		}
	};
});
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/local-variables/index.js
var localVariablesIntegration = (options = {}) => {
	return localVariablesAsyncIntegration(options);
};
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/modules.js
var moduleCache;
var INTEGRATION_NAME$6 = "Modules";
function getServerModules() {
	if (typeof __SENTRY_SERVER_MODULES__ !== "undefined") return __SENTRY_SERVER_MODULES__;
	return GLOBAL_OBJ.__SENTRY_SERVER_MODULES__ ?? {};
}
var _modulesIntegration = () => {
	return {
		name: INTEGRATION_NAME$6,
		processEvent(event) {
			event.modules = {
				...event.modules,
				..._getModules()
			};
			return event;
		},
		getModules: _getModules
	};
};
var modulesIntegration = _modulesIntegration;
function collectModules() {
	return {
		...getServerModules(),
		...getModulesFromPackageJson()
	};
}
function _getModules() {
	if (!moduleCache) moduleCache = collectModules();
	return moduleCache;
}
function getPackageJson() {
	try {
		const filePath = join(process.cwd(), "package.json");
		return JSON.parse(readFileSync(filePath, "utf8"));
	} catch {
		return {};
	}
}
function getModulesFromPackageJson() {
	const packageJson = getPackageJson();
	return {
		...packageJson.dependencies,
		...packageJson.devDependencies
	};
}
//#endregion
//#region node_modules/@sentry/node/build/esm/utils/errorhandling.js
var DEFAULT_SHUTDOWN_TIMEOUT = 2e3;
function logAndExitProcess(error) {
	consoleSandbox(() => {
		console.error(error);
	});
	const client = getClient();
	if (client === void 0) {
		DEBUG_BUILD && debug$2.warn("No NodeClient was defined, we are exiting the process now.");
		global.process.exit(1);
		return;
	}
	const options = client.getOptions();
	const timeout = options?.shutdownTimeout && options.shutdownTimeout > 0 ? options.shutdownTimeout : DEFAULT_SHUTDOWN_TIMEOUT;
	client.close(timeout).then((result) => {
		if (!result) DEBUG_BUILD && debug$2.warn("We reached the timeout for emptying the request buffer, still exiting now!");
		global.process.exit(1);
	}, (error2) => {
		DEBUG_BUILD && debug$2.error(error2);
	});
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/onuncaughtexception.js
var INTEGRATION_NAME$5 = "OnUncaughtException";
var onUncaughtExceptionIntegration = defineIntegration((options = {}) => {
	const optionsWithDefaults = {
		exitEvenIfOtherHandlersAreRegistered: false,
		...options
	};
	return {
		name: INTEGRATION_NAME$5,
		setup(client) {
			if (!isMainThread$1) return;
			global.process.on("uncaughtException", makeErrorHandler(client, optionsWithDefaults));
		}
	};
});
function makeErrorHandler(client, options) {
	const timeout = 2e3;
	let caughtFirstError = false;
	let caughtSecondError = false;
	let calledFatalError = false;
	let firstError;
	const clientOptions = client.getOptions();
	return Object.assign((error) => {
		let onFatalError = logAndExitProcess;
		if (options.onFatalError) onFatalError = options.onFatalError;
		else if (clientOptions.onFatalError) onFatalError = clientOptions.onFatalError;
		const processWouldExit = global.process.listeners("uncaughtException").filter((listener) => {
			return listener.name !== "domainUncaughtExceptionClear" && listener._errorHandler !== true;
		}).length === 0;
		const shouldApplyFatalHandlingLogic = options.exitEvenIfOtherHandlersAreRegistered || processWouldExit;
		if (!caughtFirstError) {
			firstError = error;
			caughtFirstError = true;
			if (getClient() === client) captureException(error, {
				originalException: error,
				captureContext: { level: "fatal" },
				mechanism: {
					handled: false,
					type: "auto.node.onuncaughtexception"
				}
			});
			if (!calledFatalError && shouldApplyFatalHandlingLogic) {
				calledFatalError = true;
				onFatalError(error);
			}
		} else if (shouldApplyFatalHandlingLogic) {
			if (calledFatalError) {
				DEBUG_BUILD && debug$2.warn("uncaught exception after calling fatal error shutdown callback - this is bad! forcing shutdown");
				logAndExitProcess(error);
			} else if (!caughtSecondError) {
				caughtSecondError = true;
				setTimeout(() => {
					if (!calledFatalError) {
						calledFatalError = true;
						onFatalError(firstError, error);
					}
				}, timeout);
			}
		}
	}, { _errorHandler: true });
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/onunhandledrejection.js
var INTEGRATION_NAME$4 = "OnUnhandledRejection";
var DEFAULT_IGNORES = [{ name: "AI_NoOutputGeneratedError" }, { name: "AbortError" }];
var _onUnhandledRejectionIntegration = (options = {}) => {
	const opts = {
		mode: options.mode ?? "warn",
		ignore: [...DEFAULT_IGNORES, ...options.ignore ?? []]
	};
	return {
		name: INTEGRATION_NAME$4,
		setup(client) {
			global.process.on("unhandledRejection", makeUnhandledPromiseHandler(client, opts));
		}
	};
};
var onUnhandledRejectionIntegration = defineIntegration(_onUnhandledRejectionIntegration);
function extractErrorInfo(reason) {
	if (!isObjectLike(reason)) return {
		name: "",
		message: String(reason ?? "")
	};
	const errorLike = reason;
	return {
		name: typeof errorLike.name === "string" ? errorLike.name : "",
		message: typeof errorLike.message === "string" ? errorLike.message : String(reason)
	};
}
function isMatchingReason(matcher, errorInfo) {
	const nameMatches = matcher.name === void 0 || isMatchingPattern(errorInfo.name, matcher.name, true);
	const messageMatches = matcher.message === void 0 || isMatchingPattern(errorInfo.message, matcher.message);
	return nameMatches && messageMatches;
}
function matchesIgnore(list, reason) {
	const errorInfo = extractErrorInfo(reason);
	return list.some((matcher) => isMatchingReason(matcher, errorInfo));
}
function makeUnhandledPromiseHandler(client, options) {
	return function sendUnhandledPromise(reason, _promise) {
		if (getClient() !== client) return;
		if (matchesIgnore(options.ignore ?? [], reason)) return;
		const level = options.mode === "strict" ? "fatal" : "error";
		const activeSpanForError = isObjectLike(reason) ? reason._sentry_active_span : void 0;
		(activeSpanForError ? (fn) => withActiveSpan$1(activeSpanForError, fn) : (fn) => fn())(() => {
			captureException(reason, {
				originalException: reason,
				captureContext: {
					extra: { unhandledPromiseRejection: true },
					level
				},
				mechanism: {
					handled: false,
					type: "auto.node.onunhandledrejection"
				}
			});
		});
		handleRejection(reason, options.mode);
	};
}
function handleRejection(reason, mode) {
	const rejectionWarning = "This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason:";
	if (mode === "warn") consoleSandbox(() => {
		console.warn(rejectionWarning);
		console.error(isObjectLike(reason) && "stack" in reason ? reason.stack : reason);
	});
	else if (mode === "strict") {
		if (!(isObjectLike(reason) && "stack" in reason)) consoleSandbox(() => {
			console.warn(rejectionWarning);
		});
		logAndExitProcess(reason);
	}
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/processSession.js
var INTEGRATION_NAME$3 = "ProcessSession";
var processSessionIntegration = defineIntegration(() => {
	return {
		name: INTEGRATION_NAME$3,
		setupOnce() {
			startSession();
			process.on("beforeExit", () => {
				if (getIsolationScope().getSession()?.status === "ok") endSession();
			});
		}
	};
});
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/spotlight.js
var INTEGRATION_NAME$2 = "Spotlight";
var _spotlightIntegration = (options = {}) => {
	const _options = { sidecarUrl: options.sidecarUrl || "http://localhost:8969/stream" };
	return {
		name: INTEGRATION_NAME$2,
		setup(client) {
			try {
				debug$2.warn("[Spotlight] It seems you're not in dev mode. Do you really want to have Spotlight enabled?");
			} catch {}
			connectToSpotlight(client, _options);
		}
	};
};
var spotlightIntegration = defineIntegration(_spotlightIntegration);
function connectToSpotlight(client, options) {
	const spotlightUrl = parseSidecarUrl(options.sidecarUrl);
	if (!spotlightUrl) return;
	let failedRequests = 0;
	client.on("beforeEnvelope", (envelope) => {
		if (failedRequests > 3) {
			debug$2.warn("[Spotlight] Disabled Sentry -> Spotlight integration due to too many failed requests");
			return;
		}
		const serializedEnvelope = serializeEnvelope(envelope);
		suppressTracing(() => {
			const req = http.request({
				method: "POST",
				path: spotlightUrl.pathname,
				hostname: spotlightUrl.hostname,
				port: spotlightUrl.port,
				headers: { "Content-Type": "application/x-sentry-envelope" }
			}, (res) => {
				if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) failedRequests = 0;
				res.on("data", () => {});
				res.on("end", () => {});
				res.setEncoding("utf8");
			});
			req.on("error", () => {
				failedRequests++;
				debug$2.warn("[Spotlight] Failed to send envelope to Spotlight Sidecar");
			});
			req.write(serializedEnvelope);
			req.end();
		});
	});
}
function parseSidecarUrl(url) {
	try {
		return new URL(`${url}`);
	} catch {
		debug$2.warn(`[Spotlight] Invalid sidecar URL: ${url}`);
		return;
	}
}
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/systemError.js
var INTEGRATION_NAME$1 = "NodeSystemError";
function isSystemError(error) {
	if (!(error instanceof Error)) return false;
	if (!("errno" in error) || typeof error.errno !== "number") return false;
	if (typeof util.getSystemErrorMap !== "function") return false;
	return util.getSystemErrorMap().has(error.errno);
}
var systemErrorIntegration = defineIntegration((options = {}) => {
	return {
		name: INTEGRATION_NAME$1,
		processEvent: (event, hint, client) => {
			if (!isSystemError(hint.originalException)) return event;
			const error = hint.originalException;
			const errorContext = { ...error };
			if (!client.getDataCollectionOptions().userInfo && options.includePaths !== true) {
				delete errorContext.path;
				delete errorContext.dest;
			}
			event.contexts = {
				...event.contexts,
				node_system_error: errorContext
			};
			for (const exception of event.exception?.values || []) if (exception.value) {
				if (error.path && exception.value.includes(error.path)) exception.value = exception.value.replace(`'${error.path}'`, "").trim();
				if (error.dest && exception.value.includes(error.dest)) exception.value = exception.value.replace(`'${error.dest}'`, "").trim();
			}
			return event;
		}
	};
});
//#endregion
//#region node_modules/@sentry/node/build/esm/integrations/workerThreads.js
var INTEGRATION_NAME = "WorkerThreads";
var workerThreadsIntegration = defineIntegration(() => {
	return {
		name: INTEGRATION_NAME,
		setup() {
			diagnosticsChannel.channel("worker_threads").subscribe((event) => {
				if (isObjectLike(event) && "worker" in event) captureWorkerThreadEvents(event.worker);
			});
		}
	};
});
function captureWorkerThreadEvents(worker) {
	let threadId;
	worker.on("online", () => {
		threadId = worker.threadId;
	}).on("error", (error) => {
		captureException(error, { mechanism: {
			type: "auto.node.worker_threads",
			handled: false,
			data: threadId !== void 0 ? { threadId: String(threadId) } : void 0
		} });
	});
}
//#endregion
//#region node_modules/@sentry/node/build/esm/proxy/base.js
var _a;
var INTERNAL = /* @__PURE__ */ Symbol("AgentBaseInternalState");
var Agent = class extends (_a = http.Agent, _a) {
	constructor(opts) {
		super(opts);
		this[INTERNAL] = {};
	}
	/**
	* Determine whether this is an `http` or `https` request.
	*/
	isSecureEndpoint(options) {
		if (options) {
			if (typeof options.secureEndpoint === "boolean") return options.secureEndpoint;
			if (typeof options.protocol === "string") return options.protocol === "https:";
		}
		const { stack } = /* @__PURE__ */ new Error();
		if (typeof stack !== "string") return false;
		return stack.split("\n").some((l) => l.indexOf("(https.js:") !== -1 || l.indexOf("node:https:") !== -1);
	}
	createSocket(req, options, cb) {
		const connectOpts = {
			...options,
			secureEndpoint: this.isSecureEndpoint(options)
		};
		Promise.resolve().then(() => this.connect(req, connectOpts)).then((socket) => {
			if (socket instanceof http.Agent) return socket.addRequest(req, connectOpts);
			this[INTERNAL].currentSocket = socket;
			super.createSocket(req, options, cb);
		}, cb);
	}
	createConnection() {
		const socket = this[INTERNAL].currentSocket;
		this[INTERNAL].currentSocket = void 0;
		if (!socket) throw new Error("No socket was returned in the `connect()` function");
		return socket;
	}
	get defaultPort() {
		return this[INTERNAL].defaultPort ?? (this.protocol === "https:" ? 443 : 80);
	}
	set defaultPort(v) {
		if (this[INTERNAL]) this[INTERNAL].defaultPort = v;
	}
	get protocol() {
		return this[INTERNAL].protocol ?? (this.isSecureEndpoint() ? "https:" : "http:");
	}
	set protocol(v) {
		if (this[INTERNAL]) this[INTERNAL].protocol = v;
	}
};
//#endregion
//#region node_modules/@sentry/node/build/esm/proxy/parse-proxy-response.js
function debugLog$1(...args) {
	debug$2.log("[https-proxy-agent:parse-proxy-response]", ...args);
}
function parseProxyResponse(socket) {
	return new Promise((resolve, reject) => {
		let buffersLength = 0;
		const buffers = [];
		function read() {
			const b = socket.read();
			if (b) ondata(b);
			else socket.once("readable", read);
		}
		function cleanup() {
			socket.removeListener("end", onend);
			socket.removeListener("error", onerror);
			socket.removeListener("readable", read);
		}
		function onend() {
			cleanup();
			debugLog$1("onend");
			reject(/* @__PURE__ */ new Error("Proxy connection ended before receiving CONNECT response"));
		}
		function onerror(err) {
			cleanup();
			debugLog$1("onerror %o", err);
			reject(err);
		}
		function ondata(b) {
			buffers.push(b);
			buffersLength += b.length;
			const buffered = Buffer.concat(buffers, buffersLength);
			const endOfHeaders = buffered.indexOf("\r\n\r\n");
			if (endOfHeaders === -1) {
				debugLog$1("have not received end of HTTP headers yet...");
				read();
				return;
			}
			const headerParts = buffered.subarray(0, endOfHeaders).toString("ascii").split("\r\n");
			const firstLine = headerParts.shift();
			if (!firstLine) {
				socket.destroy();
				return reject(/* @__PURE__ */ new Error("No header received from proxy CONNECT response"));
			}
			const firstLineParts = firstLine.split(" ");
			const statusCode = +(firstLineParts[1] || 0);
			const statusText = firstLineParts.slice(2).join(" ");
			const headers = {};
			for (const header of headerParts) {
				if (!header) continue;
				const firstColon = header.indexOf(":");
				if (firstColon === -1) {
					socket.destroy();
					return reject(/* @__PURE__ */ new Error(`Invalid header from proxy CONNECT response: "${header}"`));
				}
				const key = header.slice(0, firstColon).toLowerCase();
				const value = header.slice(firstColon + 1).trimStart();
				const current = headers[key];
				if (typeof current === "string") headers[key] = [current, value];
				else if (Array.isArray(current)) current.push(value);
				else headers[key] = value;
			}
			debugLog$1("got proxy server response: %o %o", firstLine, headers);
			cleanup();
			resolve({
				connect: {
					statusCode,
					statusText,
					headers
				},
				buffered
			});
		}
		socket.on("error", onerror);
		socket.on("end", onend);
		read();
	});
}
//#endregion
//#region node_modules/@sentry/node/build/esm/proxy/index.js
function debugLog(...args) {
	debug$2.log("[https-proxy-agent]", ...args);
}
var HttpsProxyAgent = class extends Agent {
	constructor(proxy, opts) {
		super(opts);
		this.options = {};
		this.proxy = typeof proxy === "string" ? new URL(proxy) : proxy;
		this.proxyHeaders = opts?.headers ?? {};
		debugLog("Creating new HttpsProxyAgent instance: %o", this.proxy.href);
		const host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, "");
		const port = this.proxy.port ? parseInt(this.proxy.port, 10) : this.proxy.protocol === "https:" ? 443 : 80;
		this.connectOpts = {
			ALPNProtocols: ["http/1.1"],
			...opts ? omit(opts, "headers") : null,
			host,
			port
		};
	}
	/**
	* Called when the HTTP client library is creating a
	* new HTTP request.
	*/
	async connect(req, opts) {
		const { proxy } = this;
		if (!opts.host) throw new TypeError("No \"host\" provided");
		let socket;
		if (proxy.protocol === "https:") {
			debugLog("Creating `tls.Socket`: %o", this.connectOpts);
			const servername = this.connectOpts.servername || this.connectOpts.host;
			socket = tls.connect({
				...this.connectOpts,
				servername: servername && net.isIP(servername) ? void 0 : servername
			});
		} else {
			debugLog("Creating `net.Socket`: %o", this.connectOpts);
			socket = net.connect(this.connectOpts);
		}
		const headers = typeof this.proxyHeaders === "function" ? this.proxyHeaders() : { ...this.proxyHeaders };
		const host = net.isIPv6(opts.host) ? `[${opts.host}]` : opts.host;
		let payload = `CONNECT ${host}:${opts.port} HTTP/1.1\r
`;
		if (proxy.username || proxy.password) {
			const auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
			headers["Proxy-Authorization"] = `Basic ${Buffer.from(auth).toString("base64")}`;
		}
		headers.Host = `${host}:${opts.port}`;
		if (!headers["Proxy-Connection"]) headers["Proxy-Connection"] = this.keepAlive ? "Keep-Alive" : "close";
		for (const name of Object.keys(headers)) payload += `${name}: ${headers[name]}\r
`;
		const proxyResponsePromise = parseProxyResponse(socket);
		socket.write(`${payload}\r
`);
		const { connect, buffered } = await proxyResponsePromise;
		req.emit("proxyConnect", connect);
		this.emit("proxyConnect", connect, req);
		if (connect.statusCode === 200) {
			req.once("socket", resume);
			if (opts.secureEndpoint) {
				debugLog("Upgrading socket connection to TLS");
				const servername = opts.servername || opts.host;
				return tls.connect({
					...omit(opts, "host", "path", "port"),
					socket,
					servername: net.isIP(servername) ? void 0 : servername
				});
			}
			return socket;
		}
		socket.destroy();
		const fakeSocket = new net.Socket({ writable: false });
		fakeSocket.readable = true;
		req.once("socket", (s) => {
			debugLog("Replaying proxy buffer for failed request");
			s.push(buffered);
			s.push(null);
		});
		return fakeSocket;
	}
};
HttpsProxyAgent.protocols = ["http", "https"];
function resume(socket) {
	socket.resume();
}
function omit(obj, ...keys) {
	const ret = {};
	let key;
	for (key in obj) if (!keys.includes(key)) ret[key] = obj[key];
	return ret;
}
//#endregion
//#region node_modules/@sentry/node/build/esm/transports/http.js
var GZIP_THRESHOLD = 32768;
function streamFromBody(body) {
	return new Readable({ read() {
		this.push(body);
		this.push(null);
	} });
}
function makeNodeTransport(options) {
	let urlSegments;
	try {
		urlSegments = new URL(options.url);
	} catch {
		consoleSandbox(() => {
			console.warn("[@sentry/node]: Invalid dsn or tunnel option, will not send any events. The tunnel option must be a full URL when used.");
		});
		return createTransport(options, () => Promise.resolve({}));
	}
	const isHttps = urlSegments.protocol === "https:";
	const proxy = applyNoProxyOption(urlSegments, options.proxy || (isHttps ? process.env.https_proxy : void 0) || process.env.http_proxy);
	const nativeHttpModule = isHttps ? https : http;
	const keepAlive = options.keepAlive ?? true;
	const agent = proxy ? new HttpsProxyAgent(proxy) : new nativeHttpModule.Agent({
		keepAlive,
		maxSockets: 30,
		timeout: 2e3
	});
	const requestExecutor = createRequestExecutor(options, options.httpModule ?? nativeHttpModule, agent);
	return createTransport(options, requestExecutor);
}
function applyNoProxyOption(transportUrlSegments, proxy) {
	const { no_proxy } = process.env;
	if (no_proxy?.split(",").some((exemption) => transportUrlSegments.host.endsWith(exemption) || transportUrlSegments.hostname.endsWith(exemption))) return;
	else return proxy;
}
function createRequestExecutor(options, httpModule, agent) {
	const { hostname, pathname, port, protocol, search } = new URL(options.url);
	return function makeRequest(request) {
		const sendRequest = (canRetry) => new Promise((resolve, reject) => {
			suppressTracing(() => {
				let body = streamFromBody(request.body);
				const headers = { ...options.headers };
				if (request.body.length > GZIP_THRESHOLD) {
					headers["content-encoding"] = "gzip";
					body = body.pipe(createGzip());
				}
				const hostnameIsIPv6 = hostname.startsWith("[");
				const req = httpModule.request({
					method: "POST",
					agent,
					headers,
					hostname: hostnameIsIPv6 ? hostname.slice(1, -1) : hostname,
					path: `${pathname}${search}`,
					port,
					protocol,
					ca: options.caCerts
				}, (res) => {
					res.on("data", () => {});
					res.on("end", () => {});
					res.setEncoding("utf8");
					const retryAfterHeader = res.headers["retry-after"] ?? null;
					const rateLimitsHeader = res.headers["x-sentry-rate-limits"] ?? null;
					resolve({
						statusCode: res.statusCode,
						headers: {
							"retry-after": retryAfterHeader,
							"x-sentry-rate-limits": Array.isArray(rateLimitsHeader) ? rateLimitsHeader[0] || null : rateLimitsHeader
						}
					});
				});
				req.on("error", (error) => {
					if (canRetry && req.reusedSocket && error.code === "ECONNRESET") resolve(sendRequest(false));
					else reject(error);
				});
				body.pipe(req);
			});
		});
		return sendRequest(true);
	};
}
//#endregion
//#region node_modules/@sentry/node/build/esm/utils/module.js
function normalizeWindowsPath(path) {
	return path.replace(/^[A-Z]:/, "").replace(/\\/g, "/");
}
function createGetModuleFromFilename(basePath = process.argv[1] ? dirname$1(process.argv[1]) : process.cwd(), isWindows = sep === "\\") {
	const normalizedBase = isWindows ? normalizeWindowsPath(basePath) : basePath;
	return (filename) => {
		if (!filename) return;
		const normalizedFilename = isWindows ? normalizeWindowsPath(filename) : filename;
		let { dir, base: file, ext } = posix.parse(normalizedFilename);
		if (ext === ".js" || ext === ".mjs" || ext === ".cjs") file = file.slice(0, ext.length * -1);
		const decodedFile = decodeURIComponent(file);
		if (!dir) dir = ".";
		const n = dir.lastIndexOf("/node_modules");
		if (n > -1) return `${dir.slice(n + 14).replace(/\//g, ".")}:${decodedFile}`;
		if (dir.startsWith(normalizedBase)) {
			const moduleName = dir.slice(normalizedBase.length + 1).replace(/\//g, ".");
			return moduleName ? `${moduleName}:${decodedFile}` : decodedFile;
		}
		return decodedFile;
	};
}
//#endregion
//#region node_modules/@sentry/node/build/esm/sdk/api.js
function getSentryRelease(fallback) {
	if (process.env.SENTRY_RELEASE) return process.env.SENTRY_RELEASE;
	if (GLOBAL_OBJ.SENTRY_RELEASE?.id) return GLOBAL_OBJ.SENTRY_RELEASE.id;
	const possibleReleaseNameOfGitProvider = process.env["GITHUB_SHA"] || process.env["CI_MERGE_REQUEST_SOURCE_BRANCH_SHA"] || process.env["CI_BUILD_REF"] || process.env["CI_COMMIT_SHA"] || process.env["BITBUCKET_COMMIT"];
	const possibleReleaseNameOfCiProvidersWithSpecificEnvVar = process.env["APPVEYOR_PULL_REQUEST_HEAD_COMMIT"] || process.env["APPVEYOR_REPO_COMMIT"] || process.env["CODEBUILD_RESOLVED_SOURCE_VERSION"] || process.env["AWS_COMMIT_ID"] || process.env["BUILD_SOURCEVERSION"] || process.env["GIT_CLONE_COMMIT_HASH"] || process.env["BUDDY_EXECUTION_REVISION"] || process.env["BUILDKITE_COMMIT"] || process.env["CIRCLE_SHA1"] || process.env["CIRRUS_CHANGE_IN_REPO"] || process.env["CF_REVISION"] || process.env["CM_COMMIT"] || process.env["CF_PAGES_COMMIT_SHA"] || process.env["DRONE_COMMIT_SHA"] || process.env["FC_GIT_COMMIT_SHA"] || process.env["HEROKU_TEST_RUN_COMMIT_VERSION"] || process.env["HEROKU_BUILD_COMMIT"] || process.env["HEROKU_SLUG_COMMIT"] || process.env["RAILWAY_GIT_COMMIT_SHA"] || process.env["RENDER_GIT_COMMIT"] || process.env["SEMAPHORE_GIT_SHA"] || process.env["TRAVIS_PULL_REQUEST_SHA"] || process.env["VERCEL_GIT_COMMIT_SHA"] || process.env["VERCEL_GITHUB_COMMIT_SHA"] || process.env["VERCEL_GITLAB_COMMIT_SHA"] || process.env["VERCEL_BITBUCKET_COMMIT_SHA"] || process.env["ZEIT_GITHUB_COMMIT_SHA"] || process.env["ZEIT_GITLAB_COMMIT_SHA"] || process.env["ZEIT_BITBUCKET_COMMIT_SHA"];
	const possibleReleaseNameOfCiProvidersWithGenericEnvVar = process.env["CI_COMMIT_ID"] || process.env["SOURCE_COMMIT"] || process.env["SOURCE_VERSION"] || process.env["GIT_COMMIT"] || process.env["COMMIT_REF"] || process.env["BUILD_VCS_NUMBER"] || process.env["CI_COMMIT_SHA"];
	return possibleReleaseNameOfGitProvider || possibleReleaseNameOfCiProvidersWithSpecificEnvVar || possibleReleaseNameOfCiProvidersWithGenericEnvVar || fallback;
}
var defaultStackParser = createStackParser(nodeStackLineParser(createGetModuleFromFilename()));
//#endregion
//#region node_modules/@sentry/node/build/esm/utils/entry-point.js
function parseProcessPaths(proc) {
	const { execArgv, argv, cwd: getCwd } = proc;
	const cwd = getCwd();
	const appPath = resolve(cwd, argv[1] || "");
	const joinedArgs = execArgv.join(" ");
	return {
		appPath,
		importPaths: Array.from(joinedArgs.matchAll(/--import[ =](\S+)/g)).map((e) => resolve(cwd, e[1] || "")),
		requirePaths: Array.from(joinedArgs.matchAll(/(?:--require|-r)[ =](\S+)/g)).map((e) => resolve(cwd, e[1] || ""))
	};
}
function getEntryPointType(proc = process) {
	const filenames = defaultStackParser((/* @__PURE__ */ new Error()).stack || "").map((f) => f.filename).filter(Boolean);
	const { appPath, importPaths, requirePaths } = parseProcessPaths(proc);
	const output = [];
	if (appPath && filenames.includes(appPath)) output.push("app");
	if (importPaths.some((p) => filenames.includes(p))) output.push("import");
	if (requirePaths.some((p) => filenames.includes(p))) output.push("require");
	if (output.length === 1) return output[0];
	return "unknown";
}
//#endregion
//#region node_modules/@sentry/node/build/esm/utils/spotlight.js
function getSpotlightConfig(optionsSpotlight) {
	if (optionsSpotlight === false) return false;
	if (typeof optionsSpotlight === "string") return optionsSpotlight;
	const envBool = envToBool(process.env.SENTRY_SPOTLIGHT, { strict: true });
	const envUrl = envBool === null && process.env.SENTRY_SPOTLIGHT ? process.env.SENTRY_SPOTLIGHT : void 0;
	return optionsSpotlight === true ? envUrl ?? true : envBool ?? envUrl;
}
//#endregion
//#region node_modules/@sentry/opentelemetry/build/esm/index.js
var SENTRY_TRACE_STATE_DSC = "sentry.dsc";
var SENTRY_TRACE_STATE_SAMPLED_NOT_RECORDING = "sentry.sampled_not_recording";
var SENTRY_SCOPES_CONTEXT_KEY = (0, import_src.createContextKey)("sentry_scopes");
var SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY = (0, import_src.createContextKey)("sentry_fork_isolation_scope");
var SENTRY_FORK_SET_SCOPE_CONTEXT_KEY = (0, import_src.createContextKey)("sentry_fork_set_scope");
var SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY = (0, import_src.createContextKey)("sentry_fork_set_isolation_scope");
var SCOPE_CONTEXT_FIELD = "context";
function getScopesFromContext(context) {
	return context.getValue(SENTRY_SCOPES_CONTEXT_KEY);
}
function setScopesOnContext(context, scopes) {
	return context.setValue(SENTRY_SCOPES_CONTEXT_KEY, scopes);
}
function setContextOnScope(scope, context) {
	scope.refs[SCOPE_CONTEXT_FIELD] = makeWeakRef(context);
}
function getContextFromScope(scope) {
	return derefWeakRef(scope.refs[SCOPE_CONTEXT_FIELD]);
}
var TraceState = class TraceState {
	constructor() {
		this._internalState = /* @__PURE__ */ new Map();
	}
	/** @inheritDoc */
	set(key, value) {
		const next = this._clone();
		if (next._internalState.has(key)) next._internalState.delete(key);
		next._internalState.set(key, value);
		return next;
	}
	/** @inheritDoc */
	unset(key) {
		const next = this._clone();
		next._internalState.delete(key);
		return next;
	}
	/** @inheritDoc */
	get(key) {
		return this._internalState.get(key);
	}
	/** @inheritDoc */
	serialize() {
		return Array.from(this._internalState.keys()).reverse().map((key) => `${key}=${this._internalState.get(key)}`).join(",");
	}
	_clone() {
		const next = new TraceState();
		next._internalState = new Map(this._internalState);
		return next;
	}
};
function makeTraceState({ dsc, sampled }) {
	const dscString = dsc ? dynamicSamplingContextToSentryBaggageHeader(dsc) : void 0;
	const traceStateBase = new TraceState();
	const traceStateWithDsc = dscString ? traceStateBase.set(SENTRY_TRACE_STATE_DSC, dscString) : traceStateBase;
	return sampled === false ? traceStateWithDsc.set(SENTRY_TRACE_STATE_SAMPLED_NOT_RECORDING, "1") : traceStateWithDsc;
}
var SENTRY_TRACE_HEADER = "sentry-trace";
var SENTRY_BAGGAGE_HEADER = "baggage";
var W3C_TRACEPARENT_HEADER = "traceparent";
var SentryPropagator = class {
	/** @inheritDoc */
	inject(ctx, carrier, setter) {
		if (ctx !== import_src.context.active()) {
			consoleSandbox(() => {
				console.warn("SentryPropagator: Injecting trace data of a different context than the active one is not supported. Skipping injection.");
			});
			return;
		}
		if (isTracingSuppressed$1()) return;
		const { propagateTraceparent } = getClient()?.getOptions() ?? {};
		const { "sentry-trace": sentryTrace, baggage, traceparent } = getTraceData({ propagateTraceparent });
		if (sentryTrace) setter.set(carrier, SENTRY_TRACE_HEADER, sentryTrace);
		if (baggage) setter.set(carrier, SENTRY_BAGGAGE_HEADER, baggage);
		if (traceparent) setter.set(carrier, W3C_TRACEPARENT_HEADER, traceparent);
	}
	/** @inheritDoc */
	extract(ctx, carrier, getter) {
		const maybeSentryTraceHeader = getter.get(carrier, SENTRY_TRACE_HEADER);
		const baggage = getter.get(carrier, SENTRY_BAGGAGE_HEADER);
		return getContextWithRemoteActiveSpanAndScopes(ctx, {
			sentryTrace: Array.isArray(maybeSentryTraceHeader) ? maybeSentryTraceHeader[0] : maybeSentryTraceHeader,
			baggage
		});
	}
	/** @inheritDoc */
	fields() {
		return [
			SENTRY_TRACE_HEADER,
			SENTRY_BAGGAGE_HEADER,
			W3C_TRACEPARENT_HEADER
		];
	}
};
function getContextWithRemoteActiveSpan(ctx, { sentryTrace, baggage }) {
	const { traceId, parentSpanId, sampled, dsc } = propagationContextFromHeaders(sentryTrace, baggage);
	const client = getClient();
	const incomingDsc = baggageHeaderToDynamicSamplingContext(baggage);
	if (!parentSpanId || client && !shouldContinueTrace(client, incomingDsc?.org_id)) return ctx;
	const spanContext = generateRemoteSpanContext({
		traceId,
		spanId: parentSpanId,
		sampled,
		dsc
	});
	return import_src.trace.setSpanContext(ctx, spanContext);
}
function getContextWithRemoteActiveSpanAndScopes(ctx, options) {
	const ctxWithRemoteSpan = getContextWithRemoteActiveSpan(ctx, options);
	return ensureScopesOnContext(ctxWithRemoteSpan, import_src.trace.getSpanContext(ctxWithRemoteSpan) !== void 0);
}
function ensureScopesOnContext(ctx, isContinuingTrace) {
	const scopes = getScopesFromContext(ctx);
	const scope = scopes ? scopes.scope : getCurrentScope().clone();
	if (!scopes && !isContinuingTrace) {
		const propagationContext = scope.getPropagationContext();
		scope.setPropagationContext({
			...propagationContext,
			traceId: generateTraceId(),
			sampleRand: safeMathRandom()
		});
	}
	return setScopesOnContext(ctx, {
		scope,
		isolationScope: scopes ? scopes.isolationScope : getIsolationScope()
	});
}
function generateRemoteSpanContext({ spanId, traceId, sampled, dsc }) {
	const traceState = makeTraceState({
		dsc,
		sampled
	});
	return {
		traceId,
		spanId,
		isRemote: true,
		traceFlags: sampled ? import_src.TraceFlags.SAMPLED : import_src.TraceFlags.NONE,
		traceState
	};
}
var SUPPRESS_TRACING_KEY = (0, import_src.createContextKey)("OpenTelemetry SDK Context Key SUPPRESS_TRACING");
function isTracingSuppressed(context) {
	return context.getValue(SUPPRESS_TRACING_KEY) === true;
}
var SentryTracer = class {
	/** @inheritdoc */
	startSpan(name, options = {}, ctx) {
		const parentContext = ctx || import_src.context.active();
		const parentSpanCandidate = options.root ? void 0 : import_src.trace.getSpan(parentContext);
		const parentSpan = parentSpanCandidate && (0, import_src.isSpanContextValid)(parentSpanCandidate.spanContext()) ? parentSpanCandidate : void 0;
		if (isTracingSuppressed(parentContext)) return this._createNonRecordingSpan(parentSpan);
		const span = this._startSentrySpan(name, options, parentSpan, ctx !== void 0);
		markSpanAsTracerProviderSpan(span);
		return span;
	}
	startActiveSpan(name, optionsOrFn, contextOrFn, fn) {
		const options = typeof optionsOrFn === "function" ? {} : optionsOrFn;
		const explicitCtx = typeof contextOrFn === "function" || contextOrFn === void 0 ? void 0 : contextOrFn;
		const ctx = explicitCtx ?? import_src.context.active();
		const callback = typeof optionsOrFn === "function" ? optionsOrFn : typeof contextOrFn === "function" ? contextOrFn : fn;
		const span = this.startSpan(name, options, explicitCtx);
		const capturedIsolationScope = getCapturedScopesOnSpan(span).isolationScope;
		const withCapturedIsolationScope = (contextToFork) => capturedIsolationScope ? contextToFork.setValue(SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY, capturedIsolationScope) : contextToFork;
		if (spanIsIgnored(span) && this._hasParentSpan(options, explicitCtx)) return import_src.context.with(withCapturedIsolationScope(ctx), () => callback(span));
		return import_src.context.with(withCapturedIsolationScope(import_src.trace.setSpan(ctx, span)), () => {
			if (import_src.trace.getSpan(import_src.context.active()) !== span) return withScope((scope) => {
				_setSpanForScope(scope, span);
				return callback(span);
			});
			_setSpanForScope(getCurrentScope(), span);
			return callback(span);
		});
	}
	/**
	* Whether a span started with these arguments gets a parent. Mirrors the parent lookup in `startSpan`
	* plus core's fallback to the scope's active span, which is what parents the span on runtimes without an
	* OTel context manager.
	*/
	_hasParentSpan(options, explicitCtx) {
		if (options.root) return false;
		const parentSpan = explicitCtx ? import_src.trace.getSpan(explicitCtx) : getActiveSpan$1();
		return !!parentSpan && (0, import_src.isSpanContextValid)(parentSpan.spanContext());
	}
	_startSentrySpan(name, options, parentSpan, hasExplicitContext) {
		const sentryOptions = {
			name,
			attributes: options.attributes || {},
			links: options.links,
			startTime: options.startTime
		};
		if (options.kind) sentryOptions.attributes[dd] = spanKindToName(options.kind);
		if (options.root) return startNewTrace(() => startInactiveSpan({
			...sentryOptions,
			parentSpan: null
		}));
		if (parentSpan) return startInactiveSpan({
			...sentryOptions,
			parentSpan
		});
		return startInactiveSpan({
			...sentryOptions,
			parentSpan: hasExplicitContext ? null : void 0
		});
	}
	_createNonRecordingSpan(parentSpan) {
		const traceId = parentSpan?.spanContext().traceId ?? getCurrentScope().getPropagationContext().traceId;
		const span = new SentryNonRecordingSpan({ traceId });
		if (parentSpan) addChildSpanToSpan(parentSpan, span);
		setCapturedScopesOnSpan(span, getCurrentScope(), getIsolationScope());
		return span;
	}
};
var SentryTracerProvider = class {
	constructor() {
		this._tracers = /* @__PURE__ */ new Map();
	}
	/** @inheritdoc */
	getTracer(name, version, options) {
		const key = JSON.stringify([
			name,
			version,
			options
		]);
		const cachedTracer = this._tracers.get(key);
		if (cachedTracer) return cachedTracer;
		const tracer = new SentryTracer();
		this._tracers.set(key, tracer);
		return tracer;
	}
	/** Compatibility with SDK tracer providers. */
	forceFlush() {
		return Promise.resolve();
	}
	/** Compatibility with SDK tracer providers. */
	shutdown() {
		return Promise.resolve();
	}
};
function withActiveSpan(span, callback) {
	const newContextWithActiveSpan = span ? import_src.trace.setSpan(import_src.context.active(), span) : import_src.trace.deleteSpan(import_src.context.active());
	return import_src.context.with(newContextWithActiveSpan, () => {
		const scope = getCurrentScope();
		_setSpanForScope(scope, span ?? void 0);
		return callback(scope);
	});
}
function getActiveSpan(scope) {
	const span = scope ? getSpanFromScope(scope) : import_src.trace.getActiveSpan();
	return span && (0, import_src.isSpanContextValid)(span.spanContext()) ? span : void 0;
}
function getSpanFromScope(scope) {
	const ctx = getContextFromScope(scope);
	return ctx ? import_src.trace.getSpan(ctx) : void 0;
}
function buildContextWithSentryScopes(context) {
	const currentScopes = getScopesFromContext(context);
	const currentScope = currentScopes?.scope || getCurrentScope();
	const currentIsolationScope = currentScopes?.isolationScope || getIsolationScope();
	const shouldForkIsolationScope = context.getValue(SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY) === true;
	const scope = context.getValue(SENTRY_FORK_SET_SCOPE_CONTEXT_KEY);
	const isolationScope = context.getValue(SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY);
	const newCurrentScope = scope || currentScope.clone();
	const ctx2 = setScopesOnContext(context, {
		scope: newCurrentScope,
		isolationScope: isolationScope || (shouldForkIsolationScope ? currentIsolationScope.clone() : currentIsolationScope)
	}).deleteValue(SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY).deleteValue(SENTRY_FORK_SET_SCOPE_CONTEXT_KEY).deleteValue(SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY);
	setContextOnScope(newCurrentScope, ctx2);
	return ctx2;
}
var ADD_LISTENER_METHODS = [
	"addListener",
	"on",
	"once",
	"prependListener",
	"prependOnceListener"
];
var SentryAsyncLocalStorageContextManager = class {
	constructor(asyncLocalStorage) {
		this._kOtListeners = /* @__PURE__ */ Symbol("OtListeners");
		this._wrapped = false;
		this._asyncLocalStorage = asyncLocalStorage;
	}
	active() {
		return this._asyncLocalStorage.getStore() ?? import_src.ROOT_CONTEXT;
	}
	with(context, fn, thisArg, ...args) {
		const ctx2 = buildContextWithSentryScopes(context);
		const cb = thisArg == null ? fn : fn.bind(thisArg);
		return this._asyncLocalStorage.run(ctx2, cb, ...args);
	}
	enable() {
		return this;
	}
	disable() {
		try {
			this._asyncLocalStorage.disable();
		} catch {}
		return this;
	}
	bind(context, target) {
		if (isEventEmitter(target)) return this._bindEventEmitter(context, target);
		if (typeof target === "function") return this._bindFunction(context, target);
		return target;
	}
	/**
	* Gets underlying AsyncLocalStorage and symbol to allow lookup of scope.
	* This is Sentry-specific.
	*/
	getAsyncLocalStorageLookup() {
		return {
			asyncLocalStorage: this._asyncLocalStorage,
			contextSymbol: SENTRY_SCOPES_CONTEXT_KEY
		};
	}
	_bindFunction(context, target) {
		const managerWith = this.with.bind(this);
		const contextWrapper = function(...args) {
			return managerWith(context, () => target.apply(this, args));
		};
		Object.defineProperty(contextWrapper, "length", {
			enumerable: false,
			configurable: true,
			writable: false,
			value: target.length
		});
		return contextWrapper;
	}
	_bindEventEmitter(context, ee) {
		if (this._getPatchMap(ee) !== void 0) return ee;
		if (this._createPatchMap(ee) === void 0) return ee;
		for (const methodName of ADD_LISTENER_METHODS) {
			const original = getMethod(ee, methodName);
			if (!original) continue;
			trySetMethod(ee, methodName, this._patchAddListener(ee, original, context));
		}
		for (const methodName of ["removeListener", "off"]) {
			const original = getMethod(ee, methodName);
			if (!original) continue;
			trySetMethod(ee, methodName, this._patchRemoveListener(ee, original));
		}
		const removeAllListeners = getMethod(ee, "removeAllListeners");
		if (removeAllListeners) trySetMethod(ee, "removeAllListeners", this._patchRemoveAllListeners(ee, removeAllListeners));
		return ee;
	}
	_patchRemoveListener(ee, original) {
		const contextManager = this;
		return function(event, listener) {
			const events = contextManager._getPatchMap(ee)?.[event];
			if (events === void 0) return original.call(this, event, listener);
			const patchedListener = events.get(listener);
			return original.call(this, event, patchedListener || listener);
		};
	}
	_patchRemoveAllListeners(ee, original) {
		const contextManager = this;
		return function(event) {
			const map = contextManager._getPatchMap(ee);
			if (map !== void 0) {
				if (arguments.length === 0) contextManager._createPatchMap(ee);
				else if (event !== void 0 && map[event] !== void 0) delete map[event];
			}
			return original.apply(this, arguments);
		};
	}
	_patchAddListener(ee, original, context) {
		const contextManager = this;
		return function(event, listener) {
			if (contextManager._wrapped) return original.call(this, event, listener);
			const map = contextManager._getPatchMap(ee) ?? contextManager._createPatchMap(ee);
			if (map === void 0) return original.call(this, event, listener);
			let listeners = map[event];
			if (listeners === void 0) {
				listeners = /* @__PURE__ */ new WeakMap();
				map[event] = listeners;
			}
			const patchedListener = contextManager.bind(context, listener);
			listeners.set(listener, patchedListener);
			contextManager._wrapped = true;
			try {
				return original.call(this, event, patchedListener);
			} finally {
				contextManager._wrapped = false;
			}
		};
	}
	/**
	* Attach a fresh patch map to the emitter. Returns `undefined` if the emitter does not accept the
	* property (e.g. it is frozen or sealed), in which case the emitter must not be patched at all —
	* without a patch map the remove-listener patches could not resolve their wrapped listeners.
	*/
	_createPatchMap(ee) {
		const map = /* @__PURE__ */ Object.create(null);
		try {
			ee[this._kOtListeners] = map;
		} catch {
			return;
		}
		return this._getPatchMap(ee) === map ? map : void 0;
	}
	_getPatchMap(ee) {
		return ee[this._kOtListeners];
	}
};
function isEventEmitter(target) {
	if (typeof target !== "object" || !target) return false;
	const candidate = target;
	return typeof candidate.on === "function" && typeof candidate.emit === "function";
}
function getMethod(ee, methodName) {
	const value = ee[methodName];
	return typeof value === "function" ? value : void 0;
}
function trySetMethod(ee, methodName, patched) {
	try {
		ee[methodName] = patched;
	} catch {}
}
function setOpenTelemetryContextAsyncContextStrategy() {
	const asyncLocalStorage = getAsyncContextStrategy(getMainCarrier()).getTracingChannelBinding?.()?.asyncLocalStorage ?? new AsyncLocalStorage();
	function getScopes() {
		const scopes = getScopesFromContext(import_src.context.active());
		if (scopes) return scopes;
		return {
			scope: getDefaultCurrentScope(),
			isolationScope: getDefaultIsolationScope()
		};
	}
	function withScope(callback) {
		const ctx = import_src.context.active();
		return import_src.context.with(ctx, () => {
			return callback(getCurrentScope());
		});
	}
	function withSetScope(scope, callback) {
		const ctx = getContextFromScope(scope) || import_src.context.active();
		return import_src.context.with(ctx.setValue(SENTRY_FORK_SET_SCOPE_CONTEXT_KEY, scope), () => {
			return callback(scope);
		});
	}
	function withIsolationScope(callback) {
		const ctx = import_src.context.active();
		return import_src.context.with(ctx.setValue(SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY, true), () => {
			const scope = getCurrentScope();
			if (!isContinuingTrace(scope.getPropagationContext())) scope.setPropagationContext({
				traceId: generateTraceId(),
				sampleRand: safeMathRandom()
			});
			return callback(getIsolationScope());
		});
	}
	function withSetIsolationScope(isolationScope, callback) {
		const ctx = import_src.context.active();
		return import_src.context.with(ctx.setValue(SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY, isolationScope), () => {
			return callback(getIsolationScope());
		});
	}
	function getCurrentScope() {
		return getScopes().scope;
	}
	function getIsolationScope() {
		return getScopes().isolationScope;
	}
	function getTracingChannelBinding() {
		return { asyncLocalStorage };
	}
	setAsyncContextStrategy({
		withScope,
		withSetScope,
		withSetIsolationScope,
		withIsolationScope,
		getCurrentScope,
		getIsolationScope,
		getActiveSpan,
		withActiveSpan,
		getTracingChannelBinding
	});
	const ctxManager = new SentryAsyncLocalStorageContextManager(asyncLocalStorage);
	import_src.context.setGlobalContextManager(ctxManager);
	return ctxManager.getAsyncLocalStorageLookup();
}
function getSamplingDecision(spanContext) {
	const { traceFlags, traceState } = spanContext;
	const sampledNotRecording = traceState ? traceState.get(SENTRY_TRACE_STATE_SAMPLED_NOT_RECORDING) === "1" : false;
	if (traceFlags === import_src.TraceFlags.SAMPLED) return true;
	if (sampledNotRecording) return false;
	const dscString = traceState ? traceState.get(SENTRY_TRACE_STATE_DSC) : void 0;
	const dsc = dscString ? baggageHeaderToDynamicSamplingContext(dscString) : void 0;
	if (dsc?.sampled === "true") return true;
	if (dsc?.sampled === "false") return false;
}
function registerPrepareSpanScope(client) {
	client.on("prepareSpanScope", (spanScope) => {
		const { scope, parentSpan } = spanScope;
		if (!parentSpan?.spanContext().isRemote) return;
		const { spanId, traceId, traceState } = parentSpan.spanContext();
		const dsc = getDynamicSamplingContextFromSpan(parentSpan);
		const sampleRand = typeof dsc.sample_rand === "string" ? Number(dsc.sample_rand) : void 0;
		const hasIncomingDsc = !!traceState?.get(SENTRY_TRACE_STATE_DSC);
		const forkedScope = scope.clone();
		forkedScope.setPropagationContext({
			traceId,
			parentSpanId: spanId,
			sampled: getSamplingDecision(parentSpan.spanContext()),
			dsc: hasIncomingDsc ? dsc : void 0,
			sampleRand: typeof sampleRand === "number" && !Number.isNaN(sampleRand) ? sampleRand : safeMathRandom()
		});
		_setSpanForScope(forkedScope, void 0);
		spanScope.scope = forkedScope;
		spanScope.parentSpan = void 0;
	});
}
//#endregion
//#region node_modules/@sentry/node/build/esm/sdk/client.js
var DEFAULT_CLIENT_REPORT_FLUSH_INTERVAL_MS = 6e4;
var NodeClient = class extends ServerRuntimeClient {
	constructor(options) {
		const serverName = options.includeServerName === false ? void 0 : options.serverName || global.process.env.SENTRY_NAME || os.hostname();
		const clientOptions = {
			...options,
			platform: "node",
			runtime: options.runtime || {
				name: "node",
				version: global.process.version
			},
			serverName
		};
		applySdkMetadata(clientOptions, "node");
		debug$2.log(`Initializing Sentry: process: ${process.pid}, thread: ${isMainThread$1 ? "main" : `worker-${threadId}`}.`);
		super(clientOptions);
		this._logOnExitFlushListener = () => {
			_INTERNAL_flushLogsBuffer(this);
		};
		if (serverName) this.on("beforeCaptureLog", (log) => {
			log.attributes = {
				...log.attributes,
				"server.address": serverName
			};
		});
		process.on("beforeExit", this._logOnExitFlushListener);
		_INTERNAL_setDeferSegmentSpanCapture(this);
		registerPrepareSpanScope(this);
	}
	/** @inheritDoc */
	init() {
		if (this.getOptions().enableOpenTelemetrySetup) this.asyncLocalStorageLookup = setOpenTelemetryContextAsyncContextStrategy();
		else this.asyncLocalStorageLookup = { asyncLocalStorage: setAsyncLocalStorageAsyncContextStrategy() };
		super.init();
	}
	/** Get the OTEL tracer. */
	get tracer() {
		if (this._tracer) return this._tracer;
		const name = "@sentry/node";
		const version = SDK_VERSION;
		const tracer = import_src.trace.getTracer(name, version);
		this._tracer = tracer;
		return tracer;
	}
	/** @inheritDoc */
	async flush(timeout) {
		await this.traceProvider?.forceFlush();
		if (this.getOptions().sendClientReports) this._flushOutcomes();
		return super.flush(timeout);
	}
	/** @inheritDoc */
	async close(timeout) {
		if (this._clientReportInterval) clearInterval(this._clientReportInterval);
		if (this._clientReportOnExitFlushListener) process.off("beforeExit", this._clientReportOnExitFlushListener);
		if (this._logOnExitFlushListener) process.off("beforeExit", this._logOnExitFlushListener);
		const allEventsSent = await super.close(timeout);
		if (this.traceProvider) await this.traceProvider.shutdown();
		return allEventsSent;
	}
	/**
	* Will start tracking client reports for this client.
	*
	* NOTICE: This method will create an interval that is periodically called and attach a `process.on('beforeExit')`
	* hook. To clean up these resources, call `.close()` when you no longer intend to use the client. Not doing so will
	* result in a memory leak.
	*/
	startClientReportTracking() {
		const clientOptions = this.getOptions();
		if (clientOptions.sendClientReports) {
			this._clientReportOnExitFlushListener = () => {
				this._flushOutcomes();
			};
			this._clientReportInterval = setInterval(() => {
				DEBUG_BUILD && debug$2.log("Flushing client reports based on interval.");
				this._flushOutcomes();
			}, clientOptions.clientReportFlushInterval ?? DEFAULT_CLIENT_REPORT_FLUSH_INTERVAL_MS).unref();
			process.on("beforeExit", this._clientReportOnExitFlushListener);
		}
	}
	/** @inheritDoc */
	_setupIntegrations() {
		_INTERNAL_clearAiProviderSkips();
		super._setupIntegrations();
	}
};
//#endregion
//#region node_modules/@sentry/node/build/esm/otel/logger.js
function setupOpenTelemetryLogger() {
	import_src.diag.disable();
	import_src.diag.setLogger({
		error: debug$2.error,
		warn: debug$2.warn,
		info: debug$2.log,
		debug: debug$2.log,
		verbose: debug$2.log
	}, import_src.DiagLogLevel.DEBUG);
}
//#endregion
//#region node_modules/@sentry/node/build/esm/sdk/initOtel.js
var OTEL_API_GLOBAL_KEY = /* @__PURE__ */ Symbol.for("opentelemetry.js.api.1");
function registerGlobalTracerProvider(provider) {
	if (import_src.trace.setGlobalTracerProvider(provider)) return true;
	const otelGlobal = globalThis;
	const registry = otelGlobal[OTEL_API_GLOBAL_KEY];
	if (registry && !registry.trace) {
		DEBUG_BUILD && debug$2.warn("Replaced a pre-existing OpenTelemetry API registry that was created by a different @opentelemetry/api version and would have blocked tracing. If you want to manage OpenTelemetry yourself, set `enableOpenTelemetrySetup: false` in `Sentry.init()`.");
		otelGlobal[OTEL_API_GLOBAL_KEY] = void 0;
		if (!import_src.trace.setGlobalTracerProvider(provider)) return false;
		const recreatedRegistry = otelGlobal[OTEL_API_GLOBAL_KEY];
		if (recreatedRegistry) {
			const { propagation: _propagation, context: _context, ...carriedOverSlots } = registry;
			otelGlobal[OTEL_API_GLOBAL_KEY] = {
				...carriedOverSlots,
				...recreatedRegistry
			};
		}
		return true;
	}
	return false;
}
function initOpenTelemetry(client) {
	if (client.getOptions().debug) setupOpenTelemetryLogger();
	client.traceProvider = setupOtel();
}
function setupOtel() {
	const provider = new SentryTracerProvider();
	if (!registerGlobalTracerProvider(provider)) {
		DEBUG_BUILD && debug$2.warn("Could not register SentryTracerProvider because another OpenTelemetry tracer provider is already registered.");
		return;
	}
	import_src.propagation.setGlobalPropagator(new SentryPropagator());
	return provider;
}
//#endregion
//#region node_modules/@sentry/node/build/esm/sdk/index.js
function getBaseDefaultIntegrations() {
	return [
		eventFiltersIntegration(),
		functionToStringIntegration(),
		linkedErrorsIntegration(),
		requestDataIntegration(),
		systemErrorIntegration(),
		conversationIdIntegration(),
		consoleIntegration(),
		httpIntegration(),
		nativeNodeFetchIntegration(),
		onUncaughtExceptionIntegration(),
		onUnhandledRejectionIntegration(),
		contextLinesIntegration(),
		localVariablesIntegration(),
		nodeContextIntegration(),
		childProcessIntegration(),
		workerThreadsIntegration(),
		processSessionIntegration(),
		modulesIntegration(),
		...getErrorIntegrations()
	];
}
function getDefaultIntegrationsWithoutPerformance() {
	return getBaseDefaultIntegrations();
}
function getDefaultIntegrations(options) {
	return [...getDefaultIntegrationsWithoutPerformance(), ...hasSpansEnabled(options) ? getTracingIntegrations() : []];
}
function init(options = {}) {
	return _init(options, getDefaultIntegrations);
}
function _init(options = {}, getDefaultIntegrationsImpl) {
	if (!isMainThread && !parentPort) return;
	if (getEntryPointType() === "require") consoleSandbox(() => {
		console.warn("[Sentry] Initializing the SDK via the Node `--require` flag is no longer supported, because Node re-runs `--require` preloads on its module loader thread. Use `--import` instead: `node --import ./instrument.js app.js`");
	});
	applySdkMetadata(options, "node");
	if (envToBool(options.debug ?? process.env.SENTRY_DEBUG)) {
		if (DEBUG_BUILD) debug$2.enable();
		else consoleSandbox(() => {
			console.warn("[Sentry] Cannot initialize SDK with `debug` option using a non-debug bundle.");
		});
	}
	const optionsWithResolvedTracing = {
		...options,
		tracesSampleRate: getTracesSampleRate(options.tracesSampleRate)
	};
	if ((typeof __SENTRY_CHANNEL_INJECTION__ === "undefined" || __SENTRY_CHANNEL_INJECTION__) && options.enableRuntimeChannelInjection !== false) registerDiagnosticsChannelInjection();
	const defaultIntegrations = options.defaultIntegrations ?? getDefaultIntegrationsImpl(optionsWithResolvedTracing);
	const clientOptions = getClientOptions({
		...options,
		defaultIntegrations
	}, getDefaultIntegrationsImpl);
	getCurrentScope().update(clientOptions.initialScope);
	if (clientOptions.spotlight && !clientOptions.integrations.some(({ name }) => name === "Spotlight")) clientOptions.integrations.push(spotlightIntegration({ sidecarUrl: typeof clientOptions.spotlight === "string" ? clientOptions.spotlight : void 0 }));
	const client = new NodeClient(clientOptions);
	getCurrentScope().setClient(client);
	client.init();
	debug$2.log(`SDK initialized from ESM`);
	client.startClientReportTracking();
	updateScopeFromEnvVariables();
	if (process.env.VERCEL) process.on("SIGTERM", async () => {
		await client.flush(200);
	});
	if (clientOptions.enableOpenTelemetrySetup) initOpenTelemetry(client);
	detectOrchestrionSetup();
	return client;
}
function getClientOptions(options, getDefaultIntegrationsImpl) {
	const release = getRelease(options.release);
	const spotlight = getSpotlightConfig(options.spotlight);
	const tracesSampleRate = getTracesSampleRate(options.tracesSampleRate);
	const traceLifecycle = getTraceLifecycle(options.traceLifecycle);
	const mergedOptions = {
		...options,
		dsn: options.dsn ?? process.env.SENTRY_DSN,
		environment: options.environment ?? process.env.SENTRY_ENVIRONMENT,
		sendClientReports: options.sendClientReports ?? true,
		transport: options.transport ?? makeNodeTransport,
		stackParser: stackParserFromStackParserOptions(options.stackParser || defaultStackParser),
		release,
		tracesSampleRate,
		spotlight,
		traceLifecycle,
		enableOpenTelemetrySetup: options.enableOpenTelemetrySetup ?? false,
		debug: envToBool(options.debug ?? process.env.SENTRY_DEBUG)
	};
	const integrations = options.integrations;
	const defaultIntegrations = options.defaultIntegrations ?? getDefaultIntegrationsImpl(mergedOptions);
	const resolvedIntegrations = getIntegrationsToSetup({
		defaultIntegrations,
		integrations
	});
	return {
		...mergedOptions,
		integrations: resolvedIntegrations
	};
}
function getRelease(release) {
	if (release !== void 0) return release;
	const detectedRelease = getSentryRelease();
	if (detectedRelease !== void 0) return detectedRelease;
}
function getTracesSampleRate(tracesSampleRate) {
	if (tracesSampleRate !== void 0) return tracesSampleRate;
	const sampleRateFromEnv = process.env.SENTRY_TRACES_SAMPLE_RATE;
	if (!sampleRateFromEnv) return;
	const parsed = parseFloat(sampleRateFromEnv);
	return isFinite(parsed) ? parsed : void 0;
}
function getTraceLifecycle(traceLifecycle) {
	if (traceLifecycle !== void 0) return traceLifecycle;
	const lifecycleFromEnv = process.env.SENTRY_TRACE_LIFECYCLE;
	if (lifecycleFromEnv === "stream" || lifecycleFromEnv === "static") return lifecycleFromEnv;
	return "stream";
}
function updateScopeFromEnvVariables() {
	if (envToBool(process.env.SENTRY_USE_ENVIRONMENT) !== false) {
		const sentryTraceEnv = process.env.SENTRY_TRACE;
		const baggageEnv = process.env.SENTRY_BAGGAGE;
		const propagationContext = propagationContextFromHeaders(sentryTraceEnv, baggageEnv);
		getCurrentScope().setPropagationContext(propagationContext);
	}
}
//#endregion
//#region node_modules/@sentry/node/build/esm/logs/capture.js
function captureLog(level, ...args) {
	const [messageOrMessageTemplate, paramsOrAttributes, maybeAttributesOrMetadata, maybeMetadata] = args;
	if (Array.isArray(paramsOrAttributes)) {
		const attributes = { ...maybeAttributesOrMetadata };
		attributes["sentry.message.template"] = messageOrMessageTemplate;
		paramsOrAttributes.forEach((param, index) => {
			attributes[`sentry.message.parameter.${index}`] = param;
		});
		const message = format(messageOrMessageTemplate, ...paramsOrAttributes);
		_INTERNAL_captureLog({
			level,
			message,
			attributes
		}, maybeMetadata?.scope);
	} else _INTERNAL_captureLog({
		level,
		message: messageOrMessageTemplate,
		attributes: paramsOrAttributes
	}, maybeAttributesOrMetadata?.scope ?? maybeMetadata?.scope);
}
//#endregion
//#region node_modules/@sentry/node/build/esm/logs/exports.js
function info(...args) {
	captureLog("info", ...args);
}
//#endregion
export { init as n, info as t };

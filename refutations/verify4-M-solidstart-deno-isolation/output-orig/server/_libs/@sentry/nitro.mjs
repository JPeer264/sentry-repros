import { I as Ed, Sn as po, a as Re, b as tE, h as eE, in as jd, s as Te, x as te, yn as on } from "../sentry__conventions.mjs";
import { $t as SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, An as getMainCarrier, At as getActiveSpan, B as parseStringToURLObject, I as getHttpSpanDetailsFromUrlObject, Jt as SEMANTIC_ATTRIBUTE_CACHE_HIT, Mn as GLOBAL_OBJ, Mt as spanToJSON, On as debug, P as getTraceData, St as hasSpanStreamingEnabled, V as parseUrl, Xt as SEMANTIC_ATTRIBUTE_CACHE_KEY, an as getAsyncContextStrategy, bt as withActiveSpan, en as getClient, g as flushIfServerless, ht as startInactiveSpan, j as httpHeadersToSpanAttributes, jt as getRootSpan, mt as spanIsIgnored, qt as setHttpStatus, tt as captureException, xn as isObjectLike } from "../sentry__core.mjs";
import * as dc from "node:diagnostics_channel";
//#region node_modules/@sentry/server-utils/build/esm/utils/setHttpServerSpanRouteAttribute.js
function setHttpServerSpanRouteAttribute(route) {
	const activeSpan = getActiveSpan();
	if (!activeSpan) return;
	const rootSpan = getRootSpan(activeSpan);
	if (!rootSpan) return;
	const attributes = spanToJSON(rootSpan).attributes;
	if (attributes["sentry.op"] !== "http.server") return;
	const method = attributes["http.request.method"] || attributes["http.method"] || "GET";
	rootSpan.setAttribute(po, route);
	rootSpan.updateName(`${method} ${route}`);
	rootSpan.setAttribute(jd, "route");
}
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/debug-build.js
var DEBUG_BUILD = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
//#endregion
//#region node_modules/@sentry/server-utils/build/esm/tracing-channel.js
var NOOP = () => {};
function safeChannelCallback(fn) {
	try {
		return fn();
	} catch (error) {
		DEBUG_BUILD && debug.warn("[instrumentation] error handling channel event", error);
		return;
	}
}
function bindTracingChannelToSpan(channel, getSpan, opts) {
	const handle = bindSpanToChannelStore(channel, getSpan, opts);
	const beforeSpanEnd = opts?.beforeSpanEnd;
	const deferSpanEnd = opts?.deferSpanEnd;
	const getErrorHint = (e) => {
		if (typeof opts?.captureError === "function") return opts.captureError(e);
		return { mechanism: {
			type: "auto.diagnostic_channels.bind_span",
			handled: false
		} };
	};
	const annotateSpanError = (span, error) => {
		if (opts?.captureError) captureException(error, getErrorHint(error));
		const { message, attributes } = getErrorInfo(error);
		span.setStatus({
			code: 2,
			message
		});
		span.setAttributes(attributes);
	};
	const makeDeferredEnd = (span, data) => {
		let ended = false;
		return (error) => {
			if (ended) return;
			ended = true;
			if (error !== void 0) annotateSpanError(span, error);
			endBoundSpan(data, beforeSpanEnd);
		};
	};
	const subscribers = {
		start: NOOP,
		asyncStart: NOOP,
		end(data) {
			if ("error" in data || "result" in data) {
				const span = data._sentrySpan;
				if (span && deferSpanEnd?.({
					span,
					data,
					end: makeDeferredEnd(span, data)
				})) return;
				endBoundSpan(data, beforeSpanEnd);
			}
		},
		error(data) {
			const span = data._sentrySpan;
			if (!span) return;
			annotateSpanError(span, data.error);
		},
		asyncEnd(data) {
			const span = data._sentrySpan;
			if (span && deferSpanEnd?.({
				span,
				data,
				end: makeDeferredEnd(span, data)
			})) return;
			endBoundSpan(data, beforeSpanEnd);
		}
	};
	handle.channel.subscribe(subscribers);
	return {
		channel: handle.channel,
		unbind: () => {
			handle.channel.unsubscribe(subscribers);
			handle.unbind();
		}
	};
}
function bindSpanToChannelStore(channel, getSpan, opts) {
	const binding = getAsyncContextStrategy(getMainCarrier()).getTracingChannelBinding?.();
	if (!binding) {
		DEBUG_BUILD && debug.log("[TracingChannel] Could not access async context binding.");
		return {
			channel,
			unbind: NOOP
		};
	}
	const asyncLocalStorage = binding.asyncLocalStorage;
	channel.start.bindStore(asyncLocalStorage, (data) => {
		data._sentryCallerStore = asyncLocalStorage.getStore();
		const span = !opts?.requiresParentSpan || getActiveSpan() ? getSpan(data) : void 0;
		if (!span) return data._sentryCallerStore;
		data._sentrySpan = span;
		return getStoreWithActiveSpan(asyncLocalStorage, span);
	});
	channel.asyncStart.bindStore(asyncLocalStorage, (data) => {
		return data._sentryCallerStore;
	});
	return {
		channel,
		unbind: () => {
			channel.start.unbindStore(asyncLocalStorage);
			channel.asyncStart.unbindStore(asyncLocalStorage);
		}
	};
}
function endBoundSpan(data, beforeSpanEnd) {
	const span = data._sentrySpan;
	if (!span) return;
	beforeSpanEnd?.(span, data);
	span.end();
}
function getErrorInfo(error) {
	const errorIsObject = isObjectLike(error);
	const raw = errorIsObject ? "message" in error ? error.message : void 0 : error;
	const message = raw ? String(raw) : void 0;
	const type = errorIsObject && "name" in error ? String(error.name) : "unknown";
	return {
		message,
		attributes: { [on]: type }
	};
}
function getStoreWithActiveSpan(asyncLocalStorage, span) {
	if (spanIsIgnored(span) && getRootSpan(span) !== span) return asyncLocalStorage.getStore();
	return withActiveSpan(span, () => {
		return asyncLocalStorage.getStore();
	});
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/plugin.mjs
function defineNitroPlugin(def) {
	return def;
}
//#endregion
//#region node_modules/rou3/dist/index.mjs
var NullProtoObj = /* @__PURE__ */ (() => {
	const e = function() {};
	return e.prototype = Object.create(null), Object.freeze(e.prototype), e;
})();
function createRouter() {
	return {
		root: { key: "" },
		static: new NullProtoObj()
	};
}
function scanFirstGroup(path) {
	let i = 0;
	let depth = 0;
	for (; i < path.length; i++) {
		const c = path.charCodeAt(i);
		if (c === 92) i++;
		else if (c === 40) depth++;
		else if (c === 41 && depth > 0) depth--;
		else if (c === 123 && depth === 0) break;
	}
	if (i >= path.length) return;
	let j = i + 1;
	depth = 0;
	for (; j < path.length; j++) {
		const c = path.charCodeAt(j);
		if (c === 92) j++;
		else if (c === 40) depth++;
		else if (c === 41 && depth > 0) depth--;
		else if (c === 125 && depth === 0) break;
	}
	if (j >= path.length) return;
	const mod = path[j + 1];
	const hasMod = mod === "?" || mod === "+" || mod === "*";
	return [
		path.slice(0, i),
		path.slice(i + 1, j),
		path.slice(j + (hasMod ? 2 : 1)),
		hasMod ? mod : void 0
	];
}
function expandGroupDelimiters(path) {
	if (!path.includes("{")) return;
	const group = scanFirstGroup(path);
	if (!group) return;
	const [pre, body, suf, mod] = group;
	if (!mod) return [pre + body + suf];
	if (mod === "?") return [pre + body + suf, pre + suf];
	if (body.includes("/")) throw new Error("unsupported group repetition across segments");
	return [`${pre}(?:${body})${mod}${suf}`];
}
var UNNAMED_GROUP_PREFIX = "__rou3_unnamed_";
var ESCAPED_GROUP_PREFIX = "__rou3_esc_";
function toUnnamedGroupKey(index) {
	return `${UNNAMED_GROUP_PREFIX}${index}`;
}
function toGroupName(name) {
	return /^(?!__rou3_|_\d)[A-Za-z_]\w*$/.test(name) ? name : ESCAPED_GROUP_PREFIX + name.replace(/[_-]/g, (c) => c === "_" ? "__" : "_h");
}
function fromGroupName(key) {
	if (key.charCodeAt(0) !== 95) return key;
	if (key.startsWith("__rou3_esc_")) return key.slice(11).replace(/__|_h/g, (c) => c === "__" ? "_" : "-");
	return key.startsWith("__rou3_unnamed_") ? key.slice(15) : key;
}
function hasSegmentWildcard(segment) {
	let depth = 0;
	for (let i = 0; i < segment.length; i++) {
		const ch = segment.charCodeAt(i);
		if (ch === 92) {
			i++;
			continue;
		}
		if (ch === 40) {
			depth++;
			continue;
		}
		if (ch === 41 && depth > 0) {
			depth--;
			continue;
		}
		if (ch === 42 && depth === 0) return true;
	}
	return false;
}
function replaceSegmentWildcards(segment, unnamedStart, toGroupKey = toUnnamedGroupKey) {
	let depth = 0;
	let nextIndex = unnamedStart;
	let replaced = "";
	for (let i = 0; i < segment.length; i++) {
		const ch = segment.charCodeAt(i);
		if (ch === 92) {
			replaced += segment[i];
			if (i + 1 < segment.length) replaced += segment[++i];
			continue;
		}
		if (ch === 40) {
			depth++;
			replaced += segment[i];
			continue;
		}
		if (ch === 41 && depth > 0) {
			depth--;
			replaced += segment[i];
			continue;
		}
		if (ch === 42 && depth === 0) {
			replaced += `(?<${toGroupKey(nextIndex++)}>[^/]*)`;
			continue;
		}
		replaced += segment[i];
	}
	return [replaced, nextIndex];
}
function encodeEscapes(path) {
	if (!path.includes("\\")) return path;
	return path.replace(/\\([:(){}])/g, (_, c) => "�" + "ABCDE"[":(){}".indexOf(c)]);
}
function segmentKey(segment) {
	if (segment.startsWith("**")) return 2;
	if (segment === "*" || segment.includes(":") || segment.includes("(") || hasSegmentWildcard(segment)) return 1;
	if (segment === "\\*") return "*";
	if (segment === "\\*\\*") return "**";
	if (!segment.includes("�")) return segment;
	return segment.replace(/\uFFFD([A-E])/g, (_, c) => c === "A" ? ":" : c === "B" ? "(" : c === "C" ? ")" : c === "D" ? "{" : "}");
}
function expandModifiers(segments) {
	for (let i = 0; i < segments.length; i++) {
		const last = segments[i].charCodeAt(segments[i].length - 1);
		if (last !== 63 && last !== 43 && last !== 42) continue;
		const m = segments[i].match(/^(.*:[\w-]+(?:\([^)]*\))?)([?+*])$/);
		if (!m) continue;
		const pre = segments.slice(0, i);
		const suf = segments.slice(i + 1);
		if (m[2] === "?") return ["/" + pre.concat(m[1]).concat(suf).join("/"), "/" + pre.concat(suf).join("/")];
		const name = m[1].match(/:([\w-]+)/)?.[1] || "_";
		const wc = "/" + [
			...pre,
			`**:${name}`,
			...suf
		].join("/");
		const without = "/" + [...pre, ...suf].join("/");
		return m[2] === "+" ? [wc] : [wc, without];
	}
}
function normalizePath(path) {
	if (!path.includes("/.")) return path;
	const r = [];
	for (const s of path.split("/")) if (s === ".") continue;
	else if (s === ".." && r.length > 1) r.pop();
	else r.push(s);
	return r.join("/") || "/";
}
function splitPath(path) {
	const s = path.split("/");
	s.shift();
	if (s[s.length - 1] === "") s.pop();
	return s;
}
function splitRoute(path) {
	const s = splitPath(path);
	while (s[s.length - 1] === "") s.pop();
	return s;
}
function getMatchParams(segments, paramsMap) {
	const params = new NullProtoObj();
	for (const [index, name] of paramsMap) {
		const segment = index < 0 ? segments.slice(-(index + 1)).join("/") : segments[index];
		if (typeof name === "string") params[name] = segment;
		else {
			const match = segment.match(name);
			if (match) for (const key in match.groups) params[fromGroupName(key)] = match.groups[key];
		}
	}
	return params;
}
function addRoute(ctx, method = "", path, data) {
	method = method.toUpperCase();
	if (path.charCodeAt(0) !== 47) path = `/${path}`;
	const groupExpanded = expandGroupDelimiters(path);
	if (groupExpanded) {
		for (const expandedPath of groupExpanded) addRoute(ctx, method, expandedPath, data);
		return;
	}
	path = encodeEscapes(path);
	const segments = splitRoute(path);
	const expanded = expandModifiers(segments);
	if (expanded) {
		for (const p of expanded) addRoute(ctx, method, p, data);
		return;
	}
	let node = ctx.root;
	let _unnamedParamIndex = 0;
	const paramsMap = [];
	const paramsRegexp = [];
	for (let i = 0; i < segments.length; i++) {
		let segment = segments[i];
		const key = segmentKey(segment);
		if (key === 2) {
			if (!node.wildcard) node.wildcard = { key: "**" };
			node = node.wildcard;
			paramsMap.push([
				-(i + 1),
				segment.split(":")[1] || "_",
				segment.length === 2
			]);
			break;
		}
		if (key === 1) {
			if (!node.param) node.param = { key: "*" };
			node = node.param;
			if (segment === "*") paramsMap.push([
				i,
				String(_unnamedParamIndex++),
				true
			]);
			else if (segment.includes("(") || segment.includes(":", 1) || !/^:[\w-]+$/.test(segment)) {
				const [regexp, nextIndex] = getParamRegexp(segment, _unnamedParamIndex);
				_unnamedParamIndex = nextIndex;
				paramsRegexp[i] = regexp;
				node.hasRegexParam = true;
				paramsMap.push([
					i,
					regexp,
					false
				]);
			} else paramsMap.push([
				i,
				segment.slice(1),
				false
			]);
			continue;
		}
		segment = segments[i] = key;
		const child = node.static?.[segment];
		if (child) node = child;
		else {
			const staticNode = { key: segment };
			if (!node.static) node.static = new NullProtoObj();
			node.static[segment] = staticNode;
			node = staticNode;
		}
	}
	const hasParams = paramsMap.length > 0;
	const methods = node.methods ??= new NullProtoObj();
	(methods[method] ??= []).push({
		data: data || null,
		paramsRegexp,
		paramsMap: hasParams ? paramsMap : void 0
	});
	if (!hasParams) ctx.static["/" + segments.join("/")] = node;
}
function getParamRegexp(segment, unnamedStart = 0) {
	let _i = unnamedStart;
	let _s = "", _d = 0;
	for (let j = 0; j < segment.length; j++) {
		const c = segment.charCodeAt(j);
		if (c === 40) _d++;
		else if (c === 41 && _d > 0) _d--;
		else if (c === 92 && _d === 0 && j + 1 < segment.length) {
			const n = segment[j + 1];
			if (n !== ":" && n !== "(" && n !== "*" && n !== "\\") {
				_s += "￾" + n;
				j++;
				continue;
			}
		} else if (c === 46 && _d === 0) {
			_s += "\\.";
			continue;
		}
		_s += segment[j];
	}
	[_s, _i] = replaceSegmentWildcards(_s, _i);
	const regex = _s.replace(/:([\w-]+)(?:\(([^)]*)\))?/g, (_, id, p) => `(?<${toGroupName(id)}>${p || "[^/]+"})`).replace(/\((?![?<])/g, () => `(?<${toUnnamedGroupKey(_i++)}>`).replace(/\uFFFE(.)/g, (_, c) => /[.*+?^${}()|[\]\\]/.test(c) ? `\\${c}` : c);
	return [new RegExp(`^${regex}$`), _i];
}
function findRoute(ctx, method = "", path, opts) {
	if (opts?.normalize) path = normalizePath(path);
	if (path.charCodeAt(path.length - 1) === 47) path = path.slice(0, -1);
	const staticNode = ctx.static[path];
	if (staticNode && staticNode.methods) {
		const staticMatch = staticNode.methods[method] || staticNode.methods[""];
		if (staticMatch !== void 0) return staticMatch[0];
	}
	const segments = splitPath(path);
	const match = _lookupTree(ctx.root, method, segments, 0);
	if (match === void 0) return;
	if (opts?.params === false) return match;
	return {
		data: match.data,
		params: match.paramsMap ? getMatchParams(segments, match.paramsMap) : void 0
	};
}
function _lookupTree(node, method, segments, index) {
	if (index === segments.length) {
		if (node.methods) {
			const match = _selectMatcher(node.methods, method, segments, node.key === "*", false);
			if (match) return match;
		}
		return node.param?.methods && _selectMatcher(node.param.methods, method, segments, true, true) || node.wildcard?.methods && _selectMatcher(node.wildcard.methods, method, segments, true, true) || void 0;
	}
	const segment = segments[index];
	if (node.static) {
		const staticChild = node.static[segment];
		if (staticChild) {
			const match = _lookupTree(staticChild, method, segments, index + 1);
			if (match) return match;
		}
	}
	if (node.param) {
		const match = _lookupTree(node.param, method, segments, index + 1);
		if (match) return match;
	}
	if (node.wildcard && node.wildcard.methods) return _selectMatcher(node.wildcard.methods, method, segments, true, false);
}
function _selectMatcher(methods, method, segments, dynamicTerminal, optionalOnly) {
	const match = methods[method] || methods[""];
	if (!match) return;
	const first = match[0];
	if (match.length === 1 && first.paramsRegexp.length === 0) {
		if (!optionalOnly) return first;
		const pMap = first.paramsMap;
		return pMap?.[pMap.length - 1]?.[2] ? first : void 0;
	}
	let best;
	let bestWeight = -1;
	for (const m of match) {
		const pMap = m.paramsMap;
		const lastOptional = pMap?.[pMap.length - 1]?.[2];
		if (optionalOnly && !lastOptional) continue;
		let weight = dynamicTerminal && pMap && !lastOptional ? 1 : 0;
		const regexps = m.paramsRegexp;
		for (let i = 0; i < regexps.length; i++) if (regexps[i]) {
			if (!regexps[i].test(segments[i])) {
				weight = -1;
				break;
			}
			weight++;
		}
		if (weight > bestWeight) {
			best = m;
			bestWeight = weight;
		}
	}
	return best;
}
String.raw`%(?:2[146-9A-E]|3[0-9ABD]|4[0-9A-F]|5[0-9ABDF]|6[1-9A-F]|7[0-9ACE])`;
var kEventNS = "h3.internal.event.";
`${kEventNS}`;
`${kEventNS}`;
`${kEventNS}`;
`${kEventNS}`;
var DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
	return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
	if (!statusCode) return defaultStatusCode;
	if (typeof statusCode === "string") statusCode = +statusCode;
	if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) return defaultStatusCode;
	return statusCode;
}
var HTTPError = class HTTPError extends Error {
	get name() {
		return "HTTPError";
	}
	status;
	statusText;
	headers;
	cause;
	data;
	body;
	unhandled;
	static isError(input) {
		return input instanceof Error && input?.name === "HTTPError";
	}
	static status(status, statusText, details) {
		return new HTTPError({
			...details,
			statusText,
			status
		});
	}
	constructor(arg1, arg2) {
		let messageInput;
		let details;
		if (typeof arg1 === "string") {
			messageInput = arg1;
			details = arg2;
		} else details = arg1;
		const status = sanitizeStatusCode(details?.status || details?.statusCode || (details?.cause)?.status || (details?.cause)?.statusCode, 500);
		const statusText = sanitizeStatusMessage(details?.statusText || details?.statusMessage || (details?.cause)?.statusText || (details?.cause)?.statusMessage);
		const message = messageInput || details?.message || (details?.cause)?.message || details?.statusText || details?.statusMessage || [
			"HTTPError",
			status,
			statusText
		].filter(Boolean).join(" ");
		super(message, { cause: details });
		this.cause = details;
		this.status = status;
		this.statusText = statusText || void 0;
		const rawHeaders = details?.headers || (details?.cause)?.headers;
		this.headers = rawHeaders ? new Headers(rawHeaders) : void 0;
		this.unhandled = details?.unhandled ?? (details?.cause)?.unhandled ?? void 0;
		this.data = details?.data;
		this.body = details?.body;
	}
	get statusCode() {
		return this.status;
	}
	get statusMessage() {
		return this.statusText;
	}
	toJSON() {
		const unhandled = this.unhandled;
		return {
			status: this.status,
			statusText: this.statusText,
			unhandled,
			message: unhandled ? "HTTPError" : this.message,
			data: unhandled ? void 0 : this.data,
			...unhandled ? void 0 : this.body
		};
	}
};
var kHTTPResponse = /* @__PURE__ */ Symbol.for("h3.HTTPResponse");
var HTTPResponse = class {
	#headers;
	#init;
	body;
	constructor(body, init) {
		this.body = body;
		this.#init = init;
	}
	get status() {
		return this.#init?.status;
	}
	get statusText() {
		return this.#init?.statusText;
	}
	get headers() {
		return this.#headers ||= new Headers(this.#init?.headers);
	}
};
HTTPResponse.prototype[kHTTPResponse] = true;
//#endregion
//#region node_modules/@sentry/nitro/build/esm/runtime/hooks/captureErrorHook.js
function extractErrorContext(errorContext) {
	const ctx = {};
	if (!errorContext) return ctx;
	if (errorContext.event) {
		ctx.method = errorContext.event.req.method;
		ctx.path = parseUrl(errorContext.event.req.url).path;
	}
	if (Array.isArray(errorContext.tags)) ctx.tags = errorContext.tags;
	return ctx;
}
async function captureErrorHook(error, errorContext) {
	const sentryClientOptions = getClient()?.getOptions();
	if (sentryClientOptions && "enableNitroErrorHandler" in sentryClientOptions && sentryClientOptions.enableNitroErrorHandler === false) return;
	if (HTTPError.isError(error) && error.status >= 300 && error.status < 500) return;
	const structuredContext = extractErrorContext(errorContext);
	captureException(error, {
		captureContext: { contexts: { nitro: structuredContext } },
		mechanism: {
			handled: false,
			type: "auto.function.nitro.captureErrorHook"
		}
	});
	await flushIfServerless();
}
//#endregion
//#region node_modules/@sentry/nitro/build/esm/runtime/hooks/captureStorageEvents.js
var ORIGIN = "auto.cache.nitro";
var globalWithStorageChannels = GLOBAL_OBJ;
var TRACED_OPERATIONS = [
	"hasItem",
	"getItem",
	"getItemRaw",
	"getItems",
	"setItem",
	"setItemRaw",
	"setItems",
	"removeItem",
	"getKeys",
	"clear"
];
var CACHE_HIT_OPERATIONS = /* @__PURE__ */ new Set([
	"hasItem",
	"getItem",
	"getItemRaw",
	"getItems"
]);
var OPERATION_SPAN_OPS = {
	hasItem: Re,
	getItem: Re,
	getItemRaw: Re,
	getItems: Re,
	getKeys: Re,
	setItem: te,
	setItemRaw: te,
	setItems: te,
	removeItem: Te,
	clear: Te
};
var CACHED_FN_HANDLERS_RE = /^nitro:(functions|handlers):/i;
function captureStorageEvents() {
	if (globalWithStorageChannels.__SENTRY_NITRO_STORAGE_CHANNELS_INSTRUMENTED__) return;
	for (const operation of TRACED_OPERATIONS) setupStorageTracingChannel(operation);
	globalWithStorageChannels.__SENTRY_NITRO_STORAGE_CHANNELS_INSTRUMENTED__ = true;
}
function setupStorageTracingChannel(operation) {
	const keys = (data) => data.keys ?? [];
	const mountBase = (data) => (data.base ?? "").replace(/:$/, "");
	if (!dc.tracingChannel) return;
	bindTracingChannelToSpan(dc.tracingChannel(`unstorage.${operation}`), (data) => {
		const cacheKeys = keys(data);
		return startInactiveSpan({
			name: cacheKeys.join(", ") || operation,
			attributes: {
				[Ed]: OPERATION_SPAN_OPS[operation],
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: ORIGIN,
				[SEMANTIC_ATTRIBUTE_CACHE_KEY]: cacheKeys.length > 1 ? cacheKeys : cacheKeys[0],
				"db.operation.name": operation,
				"db.collection.name": mountBase(data),
				"db.system.name": data.driver?.name ?? "unknown"
			}
		});
	}, { beforeSpanEnd(span, data) {
		if (!("error" in data)) {
			const result = data.result;
			if (CACHE_HIT_OPERATIONS.has(operation)) span.setAttribute(SEMANTIC_ATTRIBUTE_CACHE_HIT, resolveCacheHit(operation, data.keys?.[0], result));
		}
		flushIfServerless();
	} });
}
function resolveCacheHit(operation, key, result) {
	if (operation === "hasItem") return Boolean(result);
	if (operation === "getItems") return Array.isArray(result) && result.some((item) => isObjectLike(item) && item.value != null);
	return isCacheHit(key, result);
}
function isCacheHit(key, value) {
	try {
		const isEmpty = value == null;
		if (isEmpty || typeof key !== "string" || !CACHED_FN_HANDLERS_RE.test(key)) return !isEmpty;
		return validateCacheEntry(key, typeof value === "string" ? JSON.parse(value) : value);
	} catch {
		return false;
	}
}
function validateCacheEntry(key, entry) {
	if (entry.value == null) return false;
	if (Date.now() > (entry.expires || 0)) return false;
	if (isResponseCacheEntry(key)) {
		if ((entry.value.status ?? 0) >= 400) return false;
		if (entry.value.body === void 0) return false;
		if (entry.value.headers?.etag === "undefined" || entry.value.headers?.["last-modified"] === "undefined") return false;
	}
	return true;
}
function isResponseCacheEntry(key, _) {
	return key.startsWith("nitro:handlers:");
}
//#endregion
//#region node_modules/@sentry/nitro/build/esm/runtime/hooks/setServerTimingHeaders.js
function setServerTimingHeaders(event) {
	if (event.context._sentryServerTimingSet) return;
	const headers = event.res?.headers;
	if (!headers) return;
	const traceData = getTraceData();
	if (traceData["sentry-trace"]) headers.append("Server-Timing", `sentry-trace;desc="${traceData["sentry-trace"]}"`);
	if (traceData.baggage) headers.append("Server-Timing", `baggage;desc="${traceData.baggage}"`);
	event.context._sentryServerTimingSet = true;
}
//#endregion
//#region node_modules/@sentry/nitro/build/esm/runtime/hooks/captureTracingEvents.js
var globalWithTraceChannels = GLOBAL_OBJ;
function captureTracingEvents() {
	if (globalWithTraceChannels.__SENTRY_NITRO_HTTP_CHANNELS_INSTRUMENTED__) return;
	setupH3TracingChannels();
	setupSrvxTracingChannels();
	globalWithTraceChannels.__SENTRY_NITRO_HTTP_CHANNELS_INSTRUMENTED__ = true;
}
function getResponseStatusCode(result) {
	if (isObjectLike(result) && "status" in result && typeof result.status === "number") return result.status;
}
function applyResponseStatus(span, data) {
	const statusCode = getResponseStatusCode(data.result);
	if (statusCode !== void 0) setHttpStatus(span, statusCode);
}
function getParameterizedRoute(event) {
	const matchedRoute = event.context?.matchedRoute;
	if (!matchedRoute) return;
	const routePath = matchedRoute.route;
	if (!routePath || routePath === "/**") return;
	return routePath;
}
function setupH3TracingChannels() {
	if (!dc.tracingChannel) return;
	const { channel: h3Channel } = bindTracingChannelToSpan(dc.tracingChannel("h3.request"), (data) => {
		const parsedUrl = parseStringToURLObject(data.event.url.href);
		const routePattern = getParameterizedRoute(data.event);
		const [spanName, urlAttributes] = getHttpSpanDetailsFromUrlObject(parsedUrl, "server", "auto.http.nitro.h3", { method: data.event.req.method }, routePattern);
		const client = getClient();
		const isUnparameterizedStreamedServerSpan = data?.type !== "middleware" && urlAttributes["sentry.segment.name.source"] !== "route" && !!client && hasSpanStreamingEnabled(client);
		const span = startInactiveSpan({
			name: isUnparameterizedStreamedServerSpan ? data.event.req.method?.toUpperCase() || "HTTP" : spanName,
			attributes: {
				...urlAttributes,
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.nitro.h3",
				[Ed]: data?.type === "middleware" ? tE : eE
			}
		});
		setParameterizedRouteAttributes(span, data.event);
		return span;
	}, {
		captureError: () => ({ mechanism: {
			handled: false,
			type: "auto.http.nitro.onTraceError"
		} }),
		beforeSpanEnd(span, data) {
			applyResponseStatus(span, data);
			const routePattern = getParameterizedRoute(data.event);
			if (routePattern) setHttpServerSpanRouteAttribute(routePattern);
		}
	});
	h3Channel.subscribe({ start: (data) => {
		setServerTimingHeaders(data.event);
	} });
}
function setupSrvxTracingChannels() {
	if (!dc.tracingChannel) return;
	const requestParentSpans = /* @__PURE__ */ new WeakMap();
	bindTracingChannelToSpan(dc.tracingChannel("srvx.request"), (data) => {
		const parsedUrl = data.request._url ? parseStringToURLObject(data.request._url.href) : void 0;
		const client = getClient();
		const [spanName, urlAttributes] = getHttpSpanDetailsFromUrlObject(parsedUrl, "server", "auto.http.nitro.srvx", { method: data.request.method }, void 0, client);
		const headerAttributes = client ? httpHeadersToSpanAttributes(Object.fromEntries(data.request.headers.entries()), client.getDataCollectionOptions()) : {};
		const isUnparameterizedStreamedServerSpan = !data.middleware && urlAttributes["sentry.segment.name.source"] !== "route" && !!client && hasSpanStreamingEnabled(client);
		return startInactiveSpan({
			name: isUnparameterizedStreamedServerSpan ? data.request.method?.toUpperCase() || "HTTP" : spanName,
			attributes: {
				...urlAttributes,
				...headerAttributes,
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.nitro.srvx",
				[Ed]: data.middleware ? tE : eE,
				"server.port": data.server.options.port
			},
			parentSpan: requestParentSpans.get(data.request) || void 0
		});
	}, { beforeSpanEnd(span, data) {
		applyResponseStatus(span, data);
		requestParentSpans.delete(data.request);
	} });
	bindTracingChannelToSpan(dc.tracingChannel("srvx.middleware"), (data) => {
		if (data.middleware?.index === 0) {
			const activeSpan = getActiveSpan();
			if (activeSpan) requestParentSpans.set(data.request, activeSpan);
		}
		const parsedUrl = data.request._url ? parseStringToURLObject(data.request._url.href) : void 0;
		const [, urlAttributes] = getHttpSpanDetailsFromUrlObject(parsedUrl, "server", "auto.http.nitro.srvx", { method: data.request.method });
		return startInactiveSpan({
			name: `${data.middleware?.handler.name ?? "unknown"} - ${data.request.method} ${data.request._url?.pathname}`,
			attributes: {
				...urlAttributes,
				[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.nitro.srvx",
				[Ed]: tE
			},
			parentSpan: requestParentSpans.get(data.request) || void 0
		});
	}, { beforeSpanEnd(span, data) {
		applyResponseStatus(span, data);
	} });
}
function setParameterizedRouteAttributes(span, event) {
	const matchedRoutePath = getParameterizedRoute(event);
	if (!matchedRoutePath) return;
	setHttpServerSpanRouteAttribute(matchedRoutePath);
	const rootSpan = getRootSpan(span);
	if (!rootSpan) return;
	const params = event.context?.params;
	if (isObjectLike(params)) Object.entries(params).forEach(([key, value]) => {
		rootSpan.setAttributes({
			[`url.path.parameter.${key}`]: String(value),
			[`params.${key}`]: String(value)
		});
	});
}
//#endregion
//#region node_modules/@sentry/nitro/build/esm/runtime/plugins/server.js
var server = defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook("error", captureErrorHook);
	captureTracingEvents();
	captureStorageEvents();
});
//#endregion
export { findRoute as a, safeChannelCallback as c, createRouter as i, DEBUG_BUILD as l, NullProtoObj as n, defineNitroPlugin as o, addRoute as r, bindTracingChannelToSpan as s, server as t, setHttpServerSpanRouteAttribute as u };

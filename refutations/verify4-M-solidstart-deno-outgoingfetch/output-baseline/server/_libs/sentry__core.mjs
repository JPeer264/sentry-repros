import { $ as Md, An as rm, At as Zu, B as Gd, Cn as pp, Et as Xu, Fn as sp, I as Ed, In as tm, It as bu, J as Ju, Jn as zd, Ln as to, Lt as cp, Mt as ai, Pn as sm, Rn as tu, Sn as po, Vt as dd, _n as nm, bn as oo, bt as Wd, dt as Qu, gn as ni, h as eE, in as jd, jn as rp, ln as ld, mn as mu, on as js, q as Ji, tn as im, u as Ze, un as lp, vn as np, xn as op } from "./sentry__conventions.mjs";
//#region node_modules/@sentry/core/build/esm/debug-build.js
var DEBUG_BUILD = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/worldwide.js
var GLOBAL_OBJ = globalThis;
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/version.js
var SDK_VERSION = "10.67.0";
//#endregion
//#region node_modules/@sentry/core/build/esm/carrier.js
function getMainCarrier() {
	getSentryCarrier(GLOBAL_OBJ);
	return GLOBAL_OBJ;
}
function getSentryCarrier(carrier) {
	const __SENTRY__ = carrier.__SENTRY__ = carrier.__SENTRY__ || {};
	__SENTRY__.version = __SENTRY__.version || "10.67.0";
	return __SENTRY__[SDK_VERSION] = __SENTRY__["10.67.0"] || {};
}
function getGlobalSingleton(name, creator, obj = GLOBAL_OBJ) {
	const __SENTRY__ = obj.__SENTRY__ = obj.__SENTRY__ || {};
	const carrier = __SENTRY__[SDK_VERSION] = __SENTRY__["10.67.0"] || {};
	return carrier[name] || (carrier[name] = creator());
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/debug-logger.js
var CONSOLE_LEVELS = [
	"debug",
	"info",
	"warn",
	"error",
	"log",
	"assert",
	"trace"
];
var PREFIX = "Sentry Logger ";
var originalConsoleMethods = {};
function consoleSandbox(callback) {
	if (!("console" in GLOBAL_OBJ)) return callback();
	const console = GLOBAL_OBJ.console;
	const wrappedFuncs = {};
	const wrappedLevels = Object.keys(originalConsoleMethods);
	wrappedLevels.forEach((level) => {
		const originalConsoleMethod = originalConsoleMethods[level];
		wrappedFuncs[level] = console[level];
		console[level] = originalConsoleMethod;
	});
	try {
		return callback();
	} finally {
		wrappedLevels.forEach((level) => {
			console[level] = wrappedFuncs[level];
		});
	}
}
function enable() {
	_getLoggerSettings().enabled = true;
}
function disable() {
	_getLoggerSettings().enabled = false;
}
function isEnabled$1() {
	return _getLoggerSettings().enabled;
}
function log(...args) {
	_maybeLog("log", ...args);
}
function warn(...args) {
	_maybeLog("warn", ...args);
}
function error(...args) {
	_maybeLog("error", ...args);
}
function _maybeLog(level, ...args) {
	if (!DEBUG_BUILD) return;
	if (isEnabled$1()) consoleSandbox(() => {
		GLOBAL_OBJ.console[level](`${PREFIX}[${level}]:`, ...args);
	});
}
function _getLoggerSettings() {
	if (!DEBUG_BUILD) return { enabled: false };
	return getGlobalSingleton("loggerSettings", () => ({ enabled: false }));
}
var debug = {
	/** Enable logging. */
	enable,
	/** Disable logging. */
	disable,
	/** Check if logging is enabled. */
	isEnabled: isEnabled$1,
	/** Log a message. */
	log,
	/** Log a warning. */
	warn,
	/** Log an error. */
	error
};
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/stacktrace.js
var STACKTRACE_FRAME_LIMIT = 50;
var WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
var STRIP_FRAME_REGEXP = /captureMessage|captureException/;
function createStackParser(...parsers) {
	const sortedParsers = parsers.sort((a, b) => a[0] - b[0]).map((p) => p[1]);
	return (stack, skipFirstLines = 0, framesToPop = 0) => {
		const frames = [];
		const lines = stack.split("\n");
		for (let i = skipFirstLines; i < lines.length; i++) {
			let line = lines[i];
			if (line.length > 1024) line = line.slice(0, 1024);
			const cleanedLine = WEBPACK_ERROR_REGEXP.test(line) ? line.replace(WEBPACK_ERROR_REGEXP, "$1") : line;
			if (cleanedLine.includes("Error: ")) continue;
			for (const parser of sortedParsers) {
				const frame = parser(cleanedLine);
				if (frame) {
					frames.push(frame);
					break;
				}
			}
			if (frames.length >= STACKTRACE_FRAME_LIMIT + framesToPop) break;
		}
		return stripSentryFramesAndReverse(frames.slice(framesToPop));
	};
}
function stackParserFromStackParserOptions(stackParser) {
	if (Array.isArray(stackParser)) return createStackParser(...stackParser);
	return stackParser;
}
function stripSentryFramesAndReverse(stack) {
	if (!stack.length) return [];
	const localStack = Array.from(stack);
	if (/sentryWrapped/.test(getLastStackFrame(localStack).function || "")) localStack.pop();
	localStack.reverse();
	if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
		localStack.pop();
		if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) localStack.pop();
	}
	return localStack.slice(0, STACKTRACE_FRAME_LIMIT).map((frame) => ({
		...frame,
		filename: frame.filename || getLastStackFrame(localStack).filename,
		function: frame.function || "?"
	}));
}
function getLastStackFrame(arr) {
	return arr[arr.length - 1] || {};
}
var defaultFunctionName = "<anonymous>";
function getFunctionName(fn) {
	try {
		if (!fn || typeof fn !== "function") return defaultFunctionName;
		return fn.name || defaultFunctionName;
	} catch {
		return defaultFunctionName;
	}
}
function normalizeStackTracePath(path) {
	let filename = path?.startsWith("file://") ? path.slice(7) : path;
	if (filename?.match(/\/[A-Z]:/)) filename = filename.slice(1);
	return filename;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/instrument/handlers.js
var handlers = {};
var instrumented = {};
function addHandler(type, handler) {
	handlers[type] = handlers[type] || [];
	handlers[type].push(handler);
	return () => {
		const typeHandlers = handlers[type];
		if (typeHandlers) {
			const index = typeHandlers.indexOf(handler);
			if (index !== -1) typeHandlers.splice(index, 1);
		}
	};
}
function maybeInstrument(type, instrumentFn) {
	if (!instrumented[type]) {
		instrumented[type] = true;
		try {
			instrumentFn();
		} catch (e) {
			DEBUG_BUILD && debug.error(`Error while instrumenting ${type}`, e);
		}
	}
}
function triggerHandlers(type, data) {
	const typeHandlers = type && handlers[type];
	if (!typeHandlers) return;
	for (const handler of typeHandlers) try {
		handler(data);
	} catch (e) {
		DEBUG_BUILD && debug.error(`Error while triggering instrumentation handler.
Type: ${type}
Name: ${getFunctionName(handler)}
Error:`, e);
	}
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/is.js
var objectToString = Object.prototype.toString;
function isError(wat) {
	switch (objectToString.call(wat)) {
		case "[object Error]":
		case "[object Exception]":
		case "[object DOMException]":
		case "[object WebAssembly.Exception]": return true;
		default: return isInstanceOf(wat, Error);
	}
}
function isBuiltin(wat, className) {
	return objectToString.call(wat) === `[object ${className}]`;
}
function isErrorEvent$1(wat) {
	return isBuiltin(wat, "ErrorEvent");
}
function isString(wat) {
	return isBuiltin(wat, "String");
}
function isParameterizedString(wat) {
	return typeof wat === "object" && wat !== null && "__sentry_template_string__" in wat && "__sentry_template_values__" in wat;
}
function isPrimitive(wat) {
	return wat === null || isParameterizedString(wat) || typeof wat !== "object" && typeof wat !== "function";
}
function isPlainObject(wat) {
	return isBuiltin(wat, "Object");
}
function isObjectLike(wat) {
	return typeof wat === "object" && wat !== null;
}
function isEvent(wat) {
	return typeof Event !== "undefined" && isInstanceOf(wat, Event);
}
function isRegExp(wat) {
	return isBuiltin(wat, "RegExp");
}
function isThenable(wat) {
	return Boolean(wat?.then && typeof wat.then === "function");
}
function isInstanceOf(wat, base) {
	try {
		return wat instanceof base;
	} catch {
		return false;
	}
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/object.js
function fill(source, name, replacementFactory) {
	if (!(name in source)) return;
	const original = source[name];
	if (typeof original !== "function") return;
	const wrapped = replacementFactory(original);
	if (typeof wrapped === "function") markFunctionWrapped(wrapped, original);
	try {
		source[name] = wrapped;
	} catch {
		DEBUG_BUILD && debug.log(`Failed to replace method "${name}" in object`, source);
	}
}
function addNonEnumerableProperty(obj, name, value) {
	try {
		Object.defineProperty(obj, name, {
			value,
			writable: true,
			configurable: true
		});
	} catch {
		DEBUG_BUILD && debug.log(`Failed to add non-enumerable property "${String(name)}" to object`, obj);
	}
}
function markFunctionWrapped(wrapped, original) {
	try {
		wrapped.prototype = original.prototype = original.prototype || {};
		addNonEnumerableProperty(wrapped, "__sentry_original__", original);
	} catch {}
}
function wrapMethod(obj, field, wrapped, enumerable = true) {
	const original = obj[field];
	if (typeof original !== "function") throw new Error(`Cannot wrap method: ${field} is not a function`);
	if (getOriginalFunction(original)) throw new Error(`Attempting to wrap method ${field} multiple times`);
	markFunctionWrapped(wrapped, original);
	Object.defineProperty(obj, field, {
		writable: true,
		configurable: true,
		enumerable,
		value: wrapped
	});
}
function getOriginalFunction(func) {
	return func.__sentry_original__;
}
function convertToPlainObject(value) {
	if (isError(value)) return {
		message: value.message,
		name: value.name,
		stack: value.stack,
		...getOwnProperties(value)
	};
	if (isEvent(value)) {
		const { type, target, currentTarget, detail } = value;
		return {
			type,
			target,
			currentTarget,
			...detail ? { detail } : {},
			...getOwnProperties(value)
		};
	}
	return value;
}
function getOwnProperties(obj) {
	if (isObjectLike(obj)) return Object.fromEntries(Object.entries(obj));
	return {};
}
function extractExceptionKeysForMessage(exception) {
	const keys = Object.keys(convertToPlainObject(exception));
	keys.sort();
	return !keys[0] ? "[object has no keys]" : keys.join(", ");
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/randomSafeContext.js
var RESOLVED_RUNNER;
function withRandomSafeContext(cb) {
	if (RESOLVED_RUNNER !== void 0) return RESOLVED_RUNNER ? RESOLVED_RUNNER(cb) : cb();
	const sym = /* @__PURE__ */ Symbol.for("__SENTRY_SAFE_RANDOM_ID_WRAPPER__");
	const globalWithSymbol = GLOBAL_OBJ;
	if (sym in globalWithSymbol && typeof globalWithSymbol[sym] === "function") {
		RESOLVED_RUNNER = globalWithSymbol[sym];
		return RESOLVED_RUNNER(cb);
	}
	RESOLVED_RUNNER = null;
	return cb();
}
function safeMathRandom() {
	return withRandomSafeContext(() => Math.random());
}
function safeDateNow() {
	return withRandomSafeContext(() => Date.now());
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/normalizationHints.js
var SENTRY_SKIP_NORMALIZATION = /* @__PURE__ */ Symbol.for("sentry.skipNormalization");
var SENTRY_OVERRIDE_NORMALIZATION_DEPTH = /* @__PURE__ */ Symbol.for("sentry.overrideNormalizationDepth");
function hasSkipNormalizationHint(value) {
	return Boolean(value[SENTRY_SKIP_NORMALIZATION]);
}
function getNormalizationDepthOverrideHint(value) {
	const v = value[SENTRY_OVERRIDE_NORMALIZATION_DEPTH];
	return typeof v === "number" ? v : void 0;
}
function normalize(input, depth = 100, maxProperties = Infinity) {
	try {
		return visit("", input, depth, maxProperties);
	} catch (err) {
		return { ERROR: `**non-serializable** (${err})` };
	}
}
function normalizeToSize(object, depth = 3, maxSize = 102400) {
	const normalized = normalize(object, depth);
	if (jsonSize(normalized) > maxSize) return normalizeToSize(object, depth - 1, maxSize);
	return normalized;
}
function visit(key, value, depth = Infinity, maxProperties = Infinity, memo = memoBuilder()) {
	const [memoize, unmemoize] = memo;
	if (value == null || ["boolean", "string"].includes(typeof value) || typeof value === "number" && Number.isFinite(value)) return value;
	const stringified = stringifyValue(key, value);
	if (!stringified.startsWith("[object ")) return stringified;
	if (hasSkipNormalizationHint(value)) return value;
	const overrideDepth = getNormalizationDepthOverrideHint(value);
	const remainingDepth = overrideDepth !== void 0 ? overrideDepth : depth;
	if (remainingDepth === 0) return stringified.replace("object ", "");
	if (memoize(value)) return "[Circular ~]";
	const valueWithToJSON = value;
	if (valueWithToJSON && typeof valueWithToJSON.toJSON === "function") try {
		return visit("", valueWithToJSON.toJSON(), remainingDepth - 1, maxProperties, memo);
	} catch {}
	const normalized = Array.isArray(value) ? [] : {};
	let numAdded = 0;
	const visitable = convertToPlainObject(value);
	for (const visitKey in visitable) {
		if (!Object.prototype.hasOwnProperty.call(visitable, visitKey)) continue;
		if (numAdded >= maxProperties) {
			normalized[visitKey] = "[MaxProperties ~]";
			break;
		}
		const visitValue = visitable[visitKey];
		normalized[visitKey] = visit(visitKey, visitValue, remainingDepth - 1, maxProperties, memo);
		numAdded++;
	}
	unmemoize(value);
	return normalized;
}
function stringifyValue(key, value) {
	try {
		if (typeof global !== "undefined" && value === global) return "[Global]";
		if (typeof value === "number" && !Number.isFinite(value)) return `[${value}]`;
		if (typeof value === "function") return `[Function: ${getFunctionName(value)}]`;
		if (typeof value === "symbol") return `[${String(value)}]`;
		if (typeof value === "bigint") return `[BigInt: ${String(value)}]`;
		return `[object ${getConstructorName(value)}]`;
	} catch (err) {
		return `**non-serializable** (${err})`;
	}
}
function getConstructorName(value) {
	const prototype = Object.getPrototypeOf(value);
	return prototype?.constructor ? prototype.constructor.name : "null prototype";
}
function utf8Length(value) {
	return ~-encodeURI(value).split(/%..|./).length;
}
function jsonSize(value) {
	return utf8Length(JSON.stringify(value));
}
function memoBuilder() {
	const inner = /* @__PURE__ */ new WeakSet();
	function memoize(obj) {
		if (inner.has(obj)) return true;
		inner.add(obj);
		return false;
	}
	function unmemoize(obj) {
		inner.delete(obj);
	}
	return [memoize, unmemoize];
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/string.js
function stringify(value, fallback = "[unserializable]") {
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value);
	} catch {
		return typeof fallback === "function" ? fallback(value) : fallback;
	}
}
function truncate$1(str, max = 0) {
	if (typeof str !== "string" || max === 0) return str;
	return str.length <= max ? str : `${str.slice(0, max)}...`;
}
function snipLine(line, colno) {
	let newLine = line;
	const lineLength = newLine.length;
	if (lineLength <= 150) return newLine;
	if (colno > lineLength) colno = lineLength;
	let start = Math.max(colno - 60, 0);
	if (start < 5) start = 0;
	let end = Math.min(start + 140, lineLength);
	if (end > lineLength - 5) end = lineLength;
	if (end === lineLength) start = Math.max(end - 140, 0);
	newLine = newLine.slice(start, end);
	if (start > 0) newLine = `'{snip} ${newLine}`;
	if (end < lineLength) newLine += " {snip}";
	return newLine;
}
function safeJoin(input, delimiter) {
	if (!Array.isArray(input)) return "";
	const output = [];
	for (let i = 0; i < input.length; i++) {
		const value = input[i];
		if (isPrimitive(value)) output.push(String(value));
		else if (value instanceof Error) output.push(value.message ? `${value.name}: ${value.message}` : value.name);
		else output.push(stringifyValue(void 0, value));
	}
	return output.join(delimiter);
}
function isMatchingPattern(value, pattern, requireExactStringMatch = false) {
	if (!isString(value)) return false;
	if (isRegExp(pattern)) return pattern.test(value);
	if (isString(pattern)) return requireExactStringMatch ? value === pattern : value.includes(pattern);
	if (typeof pattern === "function") return pattern(value);
	return false;
}
function stringMatchesSomePattern(testString, patterns = [], requireExactStringMatch = false) {
	for (const pattern of patterns) if (isMatchingPattern(testString, pattern, requireExactStringMatch)) return true;
	return false;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/misc.js
function getCrypto() {
	const gbl = GLOBAL_OBJ;
	return gbl.crypto || gbl.msCrypto;
}
var emptyUuid;
function getRandomByte() {
	return safeMathRandom() * 16;
}
function uuid4(crypto = getCrypto()) {
	try {
		if (crypto?.randomUUID) return withRandomSafeContext(() => crypto.randomUUID()).replace(/-/g, "");
	} catch {}
	if (!emptyUuid) emptyUuid = "10000000100040008000100000000000";
	return emptyUuid.replace(/[018]/g, (c) => (c ^ (getRandomByte() & 15) >> c / 4).toString(16));
}
function getFirstException(event) {
	return event.exception?.values?.[0];
}
function getEventDescription(event) {
	const { message, event_id: eventId } = event;
	if (message) return message;
	const firstException = getFirstException(event);
	if (firstException) {
		if (firstException.type && firstException.value) return `${firstException.type}: ${firstException.value}`;
		return firstException.type || firstException.value || eventId || "<unknown>";
	}
	return eventId || "<unknown>";
}
function addExceptionTypeValue(event, value, type) {
	const exception = event.exception = event.exception || {};
	const values = exception.values = exception.values || [];
	const firstException = values[0] = values[0] || {};
	if (!firstException.value) firstException.value = value || "";
	if (!firstException.type) firstException.type = type || "Error";
}
function addExceptionMechanism(event, newMechanism) {
	const firstException = getFirstException(event);
	if (!firstException) return;
	applyExceptionMechanism(firstException, newMechanism);
}
function addExceptionMechanismToCapturedException(event, newMechanism) {
	const exceptions = event.exception?.values;
	const capturedException = exceptions?.find((exception) => exception.mechanism?.exception_id === 0) ?? exceptions?.[0];
	if (!capturedException) return;
	applyExceptionMechanism(capturedException, newMechanism);
}
function applyExceptionMechanism(exception, newMechanism) {
	const defaultMechanism = {
		type: "generic",
		handled: true
	};
	const currentMechanism = exception.mechanism;
	exception.mechanism = {
		...defaultMechanism,
		...currentMechanism,
		...newMechanism
	};
	if (newMechanism && "data" in newMechanism) exception.mechanism.data = {
		...currentMechanism?.data,
		...newMechanism.data
	};
}
var SEMVER_REGEXP = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
function _parseInt(input) {
	return parseInt(input || "", 10);
}
function parseSemver(input) {
	const match = input.match(SEMVER_REGEXP) || [];
	const major = _parseInt(match[1]);
	const minor = _parseInt(match[2]);
	const patch = _parseInt(match[3]);
	return {
		buildmetadata: match[5],
		major: isNaN(major) ? void 0 : major,
		minor: isNaN(minor) ? void 0 : minor,
		patch: isNaN(patch) ? void 0 : patch,
		prerelease: match[4]
	};
}
function checkOrSetAlreadyCaught(exception) {
	if (isAlreadyCaptured(exception)) return true;
	try {
		addNonEnumerableProperty(exception, "__sentry_captured__", true);
	} catch {}
	return false;
}
function isAlreadyCaptured(exception) {
	try {
		return exception.__sentry_captured__;
	} catch {}
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/time.js
var ONE_SECOND_IN_MS = 1e3;
function dateTimestampInSeconds() {
	return safeDateNow() / ONE_SECOND_IN_MS;
}
function createUnixTimestampInSecondsFunc() {
	const { performance } = GLOBAL_OBJ;
	if (!performance?.now || !performance.timeOrigin) return dateTimestampInSeconds;
	const timeOrigin = performance.timeOrigin;
	return () => {
		return (timeOrigin + withRandomSafeContext(() => performance.now())) / ONE_SECOND_IN_MS;
	};
}
var _cachedTimestampInSeconds;
function timestampInSeconds() {
	return (_cachedTimestampInSeconds ?? (_cachedTimestampInSeconds = createUnixTimestampInSecondsFunc()))();
}
//#endregion
//#region node_modules/@sentry/core/build/esm/session.js
function makeSession(context) {
	const startingTime = timestampInSeconds();
	const session = {
		sid: uuid4(),
		init: true,
		timestamp: startingTime,
		started: startingTime,
		duration: 0,
		status: "ok",
		errors: 0,
		ignoreDuration: false,
		toJSON: () => sessionToJSON(session)
	};
	if (context) updateSession(session, context);
	return session;
}
function updateSession(session, context = {}) {
	if (context.user) {
		if (!session.ipAddress && context.user.ip_address) session.ipAddress = context.user.ip_address;
		if (!session.did && !context.did) session.did = context.user.id || context.user.email || context.user.username;
	}
	session.timestamp = context.timestamp || timestampInSeconds();
	if (context.abnormal_mechanism) session.abnormal_mechanism = context.abnormal_mechanism;
	if (context.ignoreDuration) session.ignoreDuration = context.ignoreDuration;
	if (context.sid) session.sid = context.sid.length === 32 ? context.sid : uuid4();
	if (context.init !== void 0) session.init = context.init;
	if (!session.did && context.did) session.did = `${context.did}`;
	if (typeof context.started === "number") session.started = context.started;
	if (session.ignoreDuration) session.duration = void 0;
	else if (typeof context.duration === "number") session.duration = context.duration;
	else {
		const duration = session.timestamp - session.started;
		session.duration = duration >= 0 ? duration : 0;
	}
	if (context.release) session.release = context.release;
	if (context.environment) session.environment = context.environment;
	if (!session.ipAddress && context.ipAddress) session.ipAddress = context.ipAddress;
	if (!session.userAgent && context.userAgent) session.userAgent = context.userAgent;
	if (typeof context.errors === "number") session.errors = context.errors;
	if (context.status) session.status = context.status;
}
function closeSession(session, status) {
	let context = {};
	if (status) context = { status };
	else if (session.status === "ok") context = { status: "exited" };
	updateSession(session, context);
}
function sessionToJSON(session) {
	return {
		sid: `${session.sid}`,
		init: session.init,
		started: (/* @__PURE__ */ new Date(session.started * 1e3)).toISOString(),
		timestamp: (/* @__PURE__ */ new Date(session.timestamp * 1e3)).toISOString(),
		status: session.status,
		errors: session.errors,
		did: typeof session.did === "number" || typeof session.did === "string" ? `${session.did}` : void 0,
		duration: session.duration,
		abnormal_mechanism: session.abnormal_mechanism,
		attrs: {
			release: session.release,
			environment: session.environment,
			ip_address: session.ipAddress,
			user_agent: session.userAgent
		}
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/merge.js
function merge(initialObj, mergeObj, levels = 2) {
	if (!mergeObj || typeof mergeObj !== "object" || levels <= 0) return mergeObj;
	if (initialObj && Object.keys(mergeObj).length === 0) return initialObj;
	const output = { ...initialObj };
	for (const key in mergeObj) if (Object.prototype.hasOwnProperty.call(mergeObj, key)) output[key] = merge(output[key], mergeObj[key], levels - 1);
	return output;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/propagationContext.js
function generateTraceId() {
	return uuid4();
}
function generateSpanId() {
	return uuid4().substring(16);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/scope.js
var DEFAULT_MAX_BREADCRUMBS = 100;
var Scope = class Scope {
	constructor() {
		this._notifyingListeners = false;
		this._scopeListeners = [];
		this._eventProcessors = [];
		this._breadcrumbs = [];
		this._attachments = [];
		this._user = {};
		this._tags = {};
		this._attributes = {};
		this._extra = {};
		this._contexts = {};
		this._sdkProcessingMetadata = {};
		addNonEnumerableProperty(this, "refs", {});
		this._propagationContext = {
			traceId: generateTraceId(),
			sampleRand: safeMathRandom()
		};
	}
	/**
	* Clone all data from this scope into a new scope.
	*/
	clone() {
		const newScope = new Scope();
		newScope._breadcrumbs = [...this._breadcrumbs];
		newScope._tags = { ...this._tags };
		newScope._attributes = { ...this._attributes };
		newScope._extra = { ...this._extra };
		newScope._contexts = { ...this._contexts };
		if (this._contexts.flags) newScope._contexts.flags = { values: [...this._contexts.flags.values] };
		newScope._user = this._user;
		newScope._level = this._level;
		newScope._session = this._session;
		newScope._transactionName = this._transactionName;
		newScope._fingerprint = this._fingerprint;
		newScope._eventProcessors = [...this._eventProcessors];
		newScope._attachments = [...this._attachments];
		newScope._sdkProcessingMetadata = { ...this._sdkProcessingMetadata };
		newScope._propagationContext = { ...this._propagationContext };
		newScope._client = this._client;
		newScope._lastEventId = this._lastEventId;
		newScope._conversationId = this._conversationId;
		newScope.refs = { ...this.refs };
		return newScope;
	}
	/**
	* Update the client assigned to this scope.
	* Note that not every scope will have a client assigned - isolation scopes & the global scope will generally not have a client,
	* as well as manually created scopes.
	*/
	setClient(client) {
		this._client = client;
	}
	/**
	* Set the ID of the last captured error event.
	* This is generally only captured on the isolation scope.
	*/
	setLastEventId(lastEventId) {
		this._lastEventId = lastEventId;
	}
	/**
	* Get the client assigned to this scope.
	*/
	getClient() {
		return this._client;
	}
	/**
	* Get the ID of the last captured error event.
	* This is generally only available on the isolation scope.
	*/
	lastEventId() {
		return this._lastEventId;
	}
	/**
	* @inheritDoc
	*/
	addScopeListener(callback) {
		this._scopeListeners.push(callback);
	}
	/**
	* Add an event processor that will be called before an event is sent.
	*/
	addEventProcessor(callback) {
		this._eventProcessors.push(callback);
		return this;
	}
	/**
	* Set the user for this scope.
	* Set to `null` to unset the user.
	*/
	setUser(user) {
		this._user = user || {
			email: void 0,
			id: void 0,
			ip_address: void 0,
			username: void 0
		};
		if (this._session) updateSession(this._session, { user });
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Get the user from this scope.
	*/
	getUser() {
		return this._user;
	}
	/**
	* Set the conversation ID for this scope.
	* Set to `null` to unset the conversation ID.
	*/
	setConversationId(conversationId) {
		this._conversationId = conversationId || void 0;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Set an object that will be merged into existing tags on the scope,
	* and will be sent as tags data with the event.
	*/
	setTags(tags) {
		this._tags = {
			...this._tags,
			...tags
		};
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Set a single tag that will be sent as tags data with the event.
	*/
	setTag(key, value) {
		return this.setTags({ [key]: value });
	}
	/**
	* Sets attributes onto the scope.
	*
	* These attributes are applied to logs, metrics and streamed spans.
	*
	* Supported attribute value types are `string`, `number`, `boolean`, `string[]`, `number[]` and `boolean[]`.
	*
	* @param newAttributes - The attributes to set on the scope, as key-value pairs.
	*
	* @example
	* ```typescript
	* scope.setAttributes({
	*   is_admin: true,
	*   payment_selection: 'credit_card',
	*   render_duration: 150,
	* });
	* ```
	*/
	setAttributes(newAttributes) {
		this._attributes = {
			...this._attributes,
			...newAttributes
		};
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Sets an attribute onto the scope.
	*
	* These attributes are applied to logs, metrics and streamed spans.
	*
	* Supported attribute value types are `string`, `number`, `boolean`, `string[]`, `number[]` and `boolean[]`.
	*
	* @param key - The attribute key.
	* @param value - The attribute value.
	*
	* @example
	* ```typescript
	* scope.setAttribute('is_admin', true);
	* scope.setAttribute('render_duration', 150);
	* ```
	*/
	setAttribute(key, value) {
		return this.setAttributes({ [key]: value });
	}
	/**
	* Removes the attribute with the given key from the scope.
	*
	* @param key - The attribute key.
	*
	* @example
	* ```typescript
	* scope.removeAttribute('is_admin');
	* ```
	*/
	removeAttribute(key) {
		if (key in this._attributes) {
			delete this._attributes[key];
			this._notifyScopeListeners();
		}
		return this;
	}
	/**
	* Set an object that will be merged into existing extra on the scope,
	* and will be sent as extra data with the event.
	*/
	setExtras(extras) {
		this._extra = {
			...this._extra,
			...extras
		};
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Set a single key:value extra entry that will be sent as extra data with the event.
	*/
	setExtra(key, extra) {
		this._extra = {
			...this._extra,
			[key]: extra
		};
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Sets the fingerprint on the scope to send with the events.
	* @param {string[]} fingerprint Fingerprint to group events in Sentry.
	*/
	setFingerprint(fingerprint) {
		this._fingerprint = fingerprint;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Sets the level on the scope for future events.
	*/
	setLevel(level) {
		this._level = level;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Sets the transaction name on the scope so that the name of e.g. taken server route or
	* the page location is attached to future events.
	*
	* IMPORTANT: Calling this function does NOT change the name of the currently active
	* root span. If you want to change the name of the active root span, use
	* `Sentry.updateSpanName(rootSpan, 'new name')` instead.
	*
	* By default, the SDK updates the scope's transaction name automatically on sensible
	* occasions, such as a page navigation or when handling a new request on the server.
	*/
	setTransactionName(name) {
		this._transactionName = name;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Sets context data with the given name.
	* Data passed as context will be normalized. You can also pass `null` to unset the context.
	* Note that context data will not be merged - calling `setContext` will overwrite an existing context with the same key.
	*/
	setContext(key, context) {
		if (context === null) delete this._contexts[key];
		else this._contexts[key] = context;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Set the session for the scope.
	*/
	setSession(session) {
		if (!session) delete this._session;
		else this._session = session;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Get the session from the scope.
	*/
	getSession() {
		return this._session;
	}
	/**
	* Updates the scope with provided data. Can work in three variations:
	* - plain object containing updatable attributes
	* - Scope instance that'll extract the attributes from
	* - callback function that'll receive the current scope as an argument and allow for modifications
	*/
	update(captureContext) {
		if (!captureContext) return this;
		const scopeToMerge = typeof captureContext === "function" ? captureContext(this) : captureContext;
		const { tags, attributes, extra, user, contexts, level, fingerprint = [], propagationContext, conversationId } = (scopeToMerge instanceof Scope ? scopeToMerge.getScopeData() : isPlainObject(scopeToMerge) ? captureContext : void 0) || {};
		this._tags = {
			...this._tags,
			...tags
		};
		this._attributes = {
			...this._attributes,
			...attributes
		};
		this._extra = {
			...this._extra,
			...extra
		};
		this._contexts = {
			...this._contexts,
			...contexts
		};
		if (user && Object.keys(user).length) this._user = user;
		if (level) this._level = level;
		if (fingerprint.length) this._fingerprint = fingerprint;
		if (propagationContext) this._propagationContext = propagationContext;
		if (conversationId) this._conversationId = conversationId;
		return this;
	}
	/**
	* Adds a breadcrumb to the scope.
	* By default, the last 100 breadcrumbs are kept.
	*/
	addBreadcrumb(breadcrumb, maxBreadcrumbs) {
		const maxCrumbs = typeof maxBreadcrumbs === "number" ? maxBreadcrumbs : DEFAULT_MAX_BREADCRUMBS;
		if (maxCrumbs <= 0) return this;
		const mergedBreadcrumb = {
			timestamp: dateTimestampInSeconds(),
			...breadcrumb,
			message: breadcrumb.message ? truncate$1(breadcrumb.message, 2048) : breadcrumb.message
		};
		this._breadcrumbs.push(mergedBreadcrumb);
		if (this._breadcrumbs.length > maxCrumbs) {
			this._breadcrumbs = this._breadcrumbs.slice(-maxCrumbs);
			this._client?.recordDroppedEvent("buffer_overflow", "log_item");
		}
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Get the last breadcrumb of the scope.
	*/
	getLastBreadcrumb() {
		return this._breadcrumbs[this._breadcrumbs.length - 1];
	}
	/**
	* Clear all breadcrumbs from the scope.
	*/
	clearBreadcrumbs() {
		this._breadcrumbs = [];
		this._notifyScopeListeners();
		return this;
	}
	/**
	* Add an attachment to the scope.
	*/
	addAttachment(attachment) {
		this._attachments.push(attachment);
		return this;
	}
	/**
	* Clear all attachments from the scope.
	*/
	clearAttachments() {
		this._attachments = [];
		return this;
	}
	/**
	* Get the data of this scope, which should be applied to an event during processing.
	*/
	getScopeData() {
		return {
			breadcrumbs: this._breadcrumbs,
			attachments: this._attachments,
			contexts: this._contexts,
			tags: this._tags,
			attributes: this._attributes,
			extra: this._extra,
			user: this._user,
			level: this._level,
			fingerprint: this._fingerprint || [],
			eventProcessors: this._eventProcessors,
			propagationContext: this._propagationContext,
			sdkProcessingMetadata: this._sdkProcessingMetadata,
			transactionName: this._transactionName,
			conversationId: this._conversationId
		};
	}
	/**
	* Add data which will be accessible during event processing but won't get sent to Sentry.
	*/
	setSDKProcessingMetadata(newData) {
		this._sdkProcessingMetadata = merge(this._sdkProcessingMetadata, newData, 2);
		return this;
	}
	/**
	* Add propagation context to the scope, used for distributed tracing
	*/
	setPropagationContext(context) {
		this._propagationContext = context;
		return this;
	}
	/**
	* Get propagation context from the scope, used for distributed tracing
	*/
	getPropagationContext() {
		return this._propagationContext;
	}
	/**
	* Capture an exception for this scope.
	*
	* @returns {string} The id of the captured Sentry event.
	*/
	captureException(exception, hint) {
		const eventId = hint?.event_id || uuid4();
		if (!this._client) {
			DEBUG_BUILD && debug.warn("No client configured on scope - will not capture exception!");
			return eventId;
		}
		const syntheticException = /* @__PURE__ */ new Error("Sentry syntheticException");
		this._client.captureException(exception, {
			originalException: exception,
			syntheticException,
			...hint,
			event_id: eventId
		}, this);
		return eventId;
	}
	/**
	* Capture a message for this scope.
	*
	* @returns {string} The id of the captured message.
	*/
	captureMessage(message, level, hint) {
		const eventId = hint?.event_id || uuid4();
		if (!this._client) {
			DEBUG_BUILD && debug.warn("No client configured on scope - will not capture message!");
			return eventId;
		}
		const syntheticException = hint?.syntheticException ?? new Error(message);
		this._client.captureMessage(message, level, {
			originalException: message,
			syntheticException,
			...hint,
			event_id: eventId
		}, this);
		return eventId;
	}
	/**
	* Capture a Sentry event for this scope.
	*
	* @returns {string} The id of the captured event.
	*/
	captureEvent(event, hint) {
		const eventId = event.event_id || hint?.event_id || uuid4();
		if (!this._client) {
			DEBUG_BUILD && debug.warn("No client configured on scope - will not capture event!");
			return eventId;
		}
		this._client.captureEvent(event, {
			...hint,
			event_id: eventId
		}, this);
		return eventId;
	}
	/**
	* This will be called on every set call.
	*/
	_notifyScopeListeners() {
		if (!this._notifyingListeners) {
			this._notifyingListeners = true;
			this._scopeListeners.forEach((callback) => {
				callback(this);
			});
			this._notifyingListeners = false;
		}
	}
};
//#endregion
//#region node_modules/@sentry/core/build/esm/defaultScopes.js
function getDefaultCurrentScope() {
	return getGlobalSingleton("defaultCurrentScope", () => new Scope());
}
function getDefaultIsolationScope() {
	return getGlobalSingleton("defaultIsolationScope", () => new Scope());
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/constants.js
var SUPPRESS_TRACING_KEY = "__SENTRY_SUPPRESS_TRACING__";
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/chain-and-copy-promiselike.js
var isActualPromise = (p) => p instanceof Promise && !p[kChainedCopy];
var kChainedCopy = /* @__PURE__ */ Symbol("chained PromiseLike");
var chainAndCopyPromiseLike = (original, onSuccess, onError) => {
	const chained = original.then((value) => {
		onSuccess(value);
		return value;
	}, (err) => {
		onError(err);
		throw err;
	});
	return isActualPromise(chained) && isActualPromise(original) ? chained : copyProps(original, chained);
};
var copyProps = (original, chained) => {
	if (!chained) return original;
	let mutated = false;
	for (const key in original) {
		if (key in chained) continue;
		mutated = true;
		const value = original[key];
		if (typeof value === "function") Object.defineProperty(chained, key, {
			value: (...args) => value.apply(original, args),
			enumerable: true,
			configurable: true,
			writable: true
		});
		else chained[key] = value;
	}
	if (mutated) Object.assign(chained, { [kChainedCopy]: true });
	return chained;
};
//#endregion
//#region node_modules/@sentry/core/build/esm/asyncContext/stackStrategy.js
var AsyncContextStack = class {
	constructor(scope, isolationScope) {
		let assignedScope;
		if (!scope) assignedScope = new Scope();
		else assignedScope = scope;
		let assignedIsolationScope;
		if (!isolationScope) assignedIsolationScope = new Scope();
		else assignedIsolationScope = isolationScope;
		this._stack = [{ scope: assignedScope }];
		this._isolationScope = assignedIsolationScope;
	}
	/**
	* Fork a scope for the stack.
	*/
	withScope(callback) {
		const scope = this._pushScope();
		let maybePromiseResult;
		try {
			maybePromiseResult = callback(scope);
		} catch (e) {
			this._popScope();
			throw e;
		}
		if (isThenable(maybePromiseResult)) return chainAndCopyPromiseLike(maybePromiseResult, () => this._popScope(), () => this._popScope());
		this._popScope();
		return maybePromiseResult;
	}
	/**
	* Get the client of the stack.
	*/
	getClient() {
		return this.getStackTop().client;
	}
	/**
	* Returns the scope of the top stack.
	*/
	getScope() {
		return this.getStackTop().scope;
	}
	/**
	* Get the isolation scope for the stack.
	*/
	getIsolationScope() {
		return this._isolationScope;
	}
	/**
	* Returns the topmost scope layer in the order domain > local > process.
	*/
	getStackTop() {
		return this._stack[this._stack.length - 1];
	}
	/**
	* Push a scope to the stack.
	*/
	_pushScope() {
		const scope = this.getScope().clone();
		this._stack.push({
			client: this.getClient(),
			scope
		});
		return scope;
	}
	/**
	* Pop a scope from the stack.
	*/
	_popScope() {
		if (this._stack.length <= 1) return false;
		return !!this._stack.pop();
	}
};
function getAsyncContextStack() {
	const sentry = getSentryCarrier(getMainCarrier());
	return sentry.stack = sentry.stack || new AsyncContextStack(getDefaultCurrentScope(), getDefaultIsolationScope());
}
function withScope$1(callback) {
	return getAsyncContextStack().withScope(callback);
}
function withSetScope(scope, callback) {
	const stack = getAsyncContextStack();
	return stack.withScope(() => {
		stack.getStackTop().scope = scope;
		return callback(scope);
	});
}
function withIsolationScope$1(callback) {
	return getAsyncContextStack().withScope(() => {
		return callback(getAsyncContextStack().getIsolationScope());
	});
}
function getStackAsyncContextStrategy() {
	return {
		suppressTracing: suppressTracingInStack,
		withIsolationScope: withIsolationScope$1,
		withScope: withScope$1,
		withSetScope,
		withSetIsolationScope: (_isolationScope, callback) => {
			return withIsolationScope$1(callback);
		},
		getCurrentScope: () => getAsyncContextStack().getScope(),
		getIsolationScope: () => getAsyncContextStack().getIsolationScope()
	};
}
function suppressTracingInStack(callback) {
	return withScope$1((scope) => {
		scope.setSDKProcessingMetadata({ [SUPPRESS_TRACING_KEY]: true });
		const res = callback();
		scope.setSDKProcessingMetadata({ [SUPPRESS_TRACING_KEY]: void 0 });
		return res;
	});
}
//#endregion
//#region node_modules/@sentry/core/build/esm/asyncContext/index.js
function setAsyncContextStrategy(strategy) {
	const sentry = getSentryCarrier(getMainCarrier());
	sentry.acs = strategy;
}
function getAsyncContextStrategy(carrier) {
	const sentry = getSentryCarrier(carrier);
	if (sentry.acs) return sentry.acs;
	return getStackAsyncContextStrategy();
}
//#endregion
//#region node_modules/@sentry/core/build/esm/attributes.js
function isAttributeObject(maybeObj) {
	return typeof maybeObj === "object" && maybeObj != null && !Array.isArray(maybeObj) && Object.keys(maybeObj).includes("value");
}
function attributeValueToTypedAttributeValue(rawValue, useFallback) {
	const { value, unit } = isAttributeObject(rawValue) ? rawValue : {
		value: rawValue,
		unit: void 0
	};
	const attributeValue = getTypedAttributeValue(value);
	const checkedUnit = unit && typeof unit === "string" ? { unit } : {};
	if (attributeValue) return {
		...attributeValue,
		...checkedUnit
	};
	if (!useFallback || useFallback === "skip-undefined" && value === void 0) return;
	let stringValue = "";
	try {
		stringValue = JSON.stringify(value) ?? "";
	} catch {}
	return {
		value: stringValue,
		type: "string",
		...checkedUnit
	};
}
function serializeAttributes(attributes, fallback = false) {
	const serializedAttributes = {};
	for (const [key, value] of Object.entries(attributes ?? {})) {
		const typedValue = attributeValueToTypedAttributeValue(value, fallback);
		if (typedValue) serializedAttributes[key] = typedValue;
	}
	return serializedAttributes;
}
function estimateTypedAttributesSizeInBytes(attributes) {
	if (!attributes) return 0;
	let weight = 0;
	for (const [key, attr] of Object.entries(attributes)) {
		weight += key.length * 2;
		weight += attr.type.length * 2;
		weight += (attr.unit?.length ?? 0) * 2;
		const val = attr.value;
		if (Array.isArray(val)) weight += estimatePrimitiveSizeInBytes$1(val[0]) * val.length;
		else if (isPrimitive(val)) weight += estimatePrimitiveSizeInBytes$1(val);
		else weight += 100;
	}
	return weight;
}
function estimatePrimitiveSizeInBytes$1(value) {
	if (typeof value === "string") return value.length * 2;
	else if (typeof value === "boolean") return 4;
	else if (typeof value === "number") return 8;
	return 0;
}
function getTypedAttributeValue(value) {
	if (Array.isArray(value)) return {
		value,
		type: "array"
	};
	const primitiveType = typeof value === "string" ? "string" : typeof value === "boolean" ? "boolean" : typeof value === "number" && !Number.isNaN(value) ? Number.isInteger(value) ? "integer" : "double" : null;
	if (primitiveType) return {
		value,
		type: primitiveType
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/currentScopes.js
function getExternalPropagationContext() {
	return getSentryCarrier(getMainCarrier()).externalPropagationContextProvider?.();
}
function hasExternalPropagationContext() {
	return getSentryCarrier(getMainCarrier()).externalPropagationContextProvider !== void 0;
}
function getCurrentScope() {
	return getAsyncContextStrategy(getMainCarrier()).getCurrentScope();
}
function getIsolationScope() {
	return getAsyncContextStrategy(getMainCarrier()).getIsolationScope();
}
function getGlobalScope() {
	return getGlobalSingleton("globalScope", () => new Scope());
}
function withScope(...rest) {
	const acs = getAsyncContextStrategy(getMainCarrier());
	if (rest.length === 2) {
		const [scope, callback] = rest;
		if (!scope) return acs.withScope(callback);
		return acs.withSetScope(scope, callback);
	}
	return acs.withScope(rest[0]);
}
function withIsolationScope(...rest) {
	const acs = getAsyncContextStrategy(getMainCarrier());
	if (rest.length === 2) {
		const [isolationScope, callback] = rest;
		if (!isolationScope) return acs.withIsolationScope(callback);
		return acs.withSetIsolationScope(isolationScope, callback);
	}
	return acs.withIsolationScope(rest[0]);
}
function getClient() {
	return getCurrentScope().getClient();
}
function getTraceContextFromScope(scope) {
	const externalContext = getExternalPropagationContext();
	if (externalContext) return {
		trace_id: externalContext.traceId,
		span_id: externalContext.spanId
	};
	const { traceId, parentSpanId, propagationSpanId } = scope.getPropagationContext();
	const traceContext = {
		trace_id: traceId,
		span_id: propagationSpanId || generateSpanId()
	};
	if (parentSpanId) traceContext.parent_span_id = parentSpanId;
	return traceContext;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/semanticAttributes.js
var SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE = "sentry.sample_rate";
var SEMANTIC_ATTRIBUTE_SENTRY_OP = "sentry.op";
var SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN = "sentry.origin";
var SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT = "sentry.measurement_unit";
var SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE = "sentry.measurement_value";
var SEMANTIC_ATTRIBUTE_SENTRY_RELEASE = "sentry.release";
var SEMANTIC_ATTRIBUTE_SENTRY_ENVIRONMENT = "sentry.environment";
var SEMANTIC_ATTRIBUTE_SENTRY_SDK_INTEGRATIONS = "sentry.sdk.integrations";
var SEMANTIC_ATTRIBUTE_USER_ID = "user.id";
var SEMANTIC_ATTRIBUTE_USER_EMAIL = "user.email";
var SEMANTIC_ATTRIBUTE_USER_IP_ADDRESS = "user.ip_address";
var SEMANTIC_ATTRIBUTE_USER_USERNAME = "user.name";
var SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME = "sentry.custom_span_name";
var SEMANTIC_ATTRIBUTE_PROFILE_ID = "sentry.profile_id";
var SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME = "sentry.exclusive_time";
var SEMANTIC_ATTRIBUTE_CACHE_HIT = "cache.hit";
var SEMANTIC_ATTRIBUTE_CACHE_KEY = "cache.key";
var SEMANTIC_ATTRIBUTE_CACHE_ITEM_SIZE = "cache.item_size";
var SEMANTIC_ATTRIBUTE_HTTP_REQUEST_METHOD = "http.request.method";
var GEN_AI_CONVERSATION_ID_ATTRIBUTE = "gen_ai.conversation.id";
//#endregion
//#region node_modules/@sentry/core/build/esm/types/spanStatus.js
var SPAN_STATUS_TYPES = [
	"ok",
	"deadline_exceeded",
	"unauthenticated",
	"permission_denied",
	"not_found",
	"resource_exhausted",
	"invalid_argument",
	"unimplemented",
	"unavailable",
	"internal_error",
	"unknown_error",
	"cancelled",
	"already_exists",
	"failed_precondition",
	"aborted",
	"out_of_range",
	"data_loss"
];
function isStatusErrorMessageValid(message) {
	return message !== "ok" && SPAN_STATUS_TYPES.includes(message);
}
function getSpanStatusFromHttpCode(httpStatus) {
	if (httpStatus < 400 && httpStatus >= 100) return { code: 1 };
	if (httpStatus >= 400 && httpStatus < 500) switch (httpStatus) {
		case 401: return {
			code: 2,
			message: "unauthenticated"
		};
		case 403: return {
			code: 2,
			message: "permission_denied"
		};
		case 404: return {
			code: 2,
			message: "not_found"
		};
		case 409: return {
			code: 2,
			message: "already_exists"
		};
		case 413: return {
			code: 2,
			message: "failed_precondition"
		};
		case 429: return {
			code: 2,
			message: "resource_exhausted"
		};
		case 499: return {
			code: 2,
			message: "cancelled"
		};
		default: return {
			code: 2,
			message: "invalid_argument"
		};
	}
	if (httpStatus >= 500 && httpStatus < 600) switch (httpStatus) {
		case 501: return {
			code: 2,
			message: "unimplemented"
		};
		case 503: return {
			code: 2,
			message: "unavailable"
		};
		case 504: return {
			code: 2,
			message: "deadline_exceeded"
		};
		default: return {
			code: 2,
			message: "internal_error"
		};
	}
	return {
		code: 2,
		message: "internal_error"
	};
}
function setHttpStatus(span, httpStatus) {
	span.setAttribute("http.response.status_code", httpStatus);
	const spanStatus = getSpanStatusFromHttpCode(httpStatus);
	if (spanStatus.message !== "unknown_error") span.setStatus(spanStatus);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/weakRef.js
function makeWeakRef(value) {
	try {
		const WeakRefImpl = GLOBAL_OBJ.WeakRef;
		if (typeof WeakRefImpl === "function") return new WeakRefImpl(value);
	} catch {}
	return value;
}
function derefWeakRef(ref) {
	if (!ref) return;
	if (typeof ref === "object" && "deref" in ref && typeof ref.deref === "function") try {
		return ref.deref();
	} catch {
		return;
	}
	return ref;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/utils.js
var SCOPE_ON_START_SPAN_FIELD = "_sentryScope";
var ISOLATION_SCOPE_ON_START_SPAN_FIELD = "_sentryIsolationScope";
var TRACER_PROVIDER_SPAN_FIELD = /* @__PURE__ */ Symbol.for("sentry.tracerProviderSpan");
function setCapturedScopesOnSpan(span, scope, isolationScope) {
	if (span) {
		addNonEnumerableProperty(span, ISOLATION_SCOPE_ON_START_SPAN_FIELD, makeWeakRef(isolationScope));
		addNonEnumerableProperty(span, SCOPE_ON_START_SPAN_FIELD, scope);
	}
}
function getCapturedScopesOnSpan(span) {
	const spanWithScopes = span;
	return {
		scope: spanWithScopes[SCOPE_ON_START_SPAN_FIELD],
		isolationScope: derefWeakRef(spanWithScopes[ISOLATION_SCOPE_ON_START_SPAN_FIELD])
	};
}
function markSpanAsTracerProviderSpan(span) {
	addNonEnumerableProperty(span, TRACER_PROVIDER_SPAN_FIELD, true);
}
function spanIsTracerProviderSpan(span) {
	return span[TRACER_PROVIDER_SPAN_FIELD] === true;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/baggage.js
var SENTRY_BAGGAGE_KEY_PREFIX = "sentry-";
function baggageHeaderToDynamicSamplingContext(baggageHeader) {
	const baggageObject = parseBaggageHeader(baggageHeader);
	if (!baggageObject) return;
	const dynamicSamplingContext = Object.entries(baggageObject).reduce((acc, [key, value]) => {
		if (key.startsWith("sentry-")) {
			const nonPrefixedKey = key.slice(7);
			acc[nonPrefixedKey] = value;
		}
		return acc;
	}, {});
	if (Object.keys(dynamicSamplingContext).length > 0) return dynamicSamplingContext;
	else return;
}
function dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext) {
	if (!dynamicSamplingContext) return;
	return objectToBaggageHeader(Object.entries(dynamicSamplingContext).reduce((acc, [dscKey, dscValue]) => {
		if (dscValue) acc[`${SENTRY_BAGGAGE_KEY_PREFIX}${dscKey}`] = dscValue;
		return acc;
	}, {}));
}
function parseBaggageHeader(baggageHeader) {
	if (!baggageHeader || !isString(baggageHeader) && !Array.isArray(baggageHeader)) return;
	if (Array.isArray(baggageHeader)) return baggageHeader.reduce((acc, curr) => {
		const currBaggageObject = baggageHeaderToObject(curr);
		Object.entries(currBaggageObject).forEach(([key, value]) => {
			acc[key] = value;
		});
		return acc;
	}, {});
	return baggageHeaderToObject(baggageHeader);
}
function baggageHeaderToObject(baggageHeader) {
	return baggageHeader.split(",").map((baggageEntry) => {
		const eqIdx = baggageEntry.indexOf("=");
		if (eqIdx === -1) return [];
		return [baggageEntry.slice(0, eqIdx), baggageEntry.slice(eqIdx + 1)].map((keyOrValue) => {
			try {
				return decodeURIComponent(keyOrValue.trim());
			} catch {
				return;
			}
		});
	}).reduce((acc, [key, value]) => {
		if (key && value) acc[key] = value;
		return acc;
	}, {});
}
function objectToBaggageHeader(object) {
	if (Object.keys(object).length === 0) return;
	return Object.entries(object).reduce((baggageHeader, [objectKey, objectValue], currentIndex) => {
		const baggageEntry = `${encodeURIComponent(objectKey)}=${encodeURIComponent(objectValue)}`;
		const newBaggageHeader = currentIndex === 0 ? baggageEntry : `${baggageHeader},${baggageEntry}`;
		if (newBaggageHeader.length > 8192) {
			DEBUG_BUILD && debug.warn(`Not adding key: ${objectKey} with val: ${objectValue} to baggage header due to exceeding baggage size limits.`);
			return baggageHeader;
		} else return newBaggageHeader;
	}, "");
}
function mergeBaggageHeaders(existing, incoming) {
	if (!existing) return incoming;
	const existingEntries = parseBaggageHeader(existing);
	const incomingEntries = parseBaggageHeader(incoming);
	if (!incomingEntries) return existing;
	const merged = {};
	let hasNewSentryEntries = false;
	const newSentryEntries = {};
	const newNonSentryEntries = {};
	for (const [key, value] of Object.entries(incomingEntries)) if (key.startsWith("sentry-")) {
		newSentryEntries[key] = value;
		hasNewSentryEntries = true;
	} else newNonSentryEntries[key] = value;
	if (existingEntries) {
		for (const [key, value] of Object.entries(existingEntries)) if (!hasNewSentryEntries || !key.startsWith("sentry-")) merged[key] = value;
	}
	if (hasNewSentryEntries) Object.assign(merged, newSentryEntries);
	for (const [key, value] of Object.entries(newNonSentryEntries)) merged[key] ?? (merged[key] = value);
	return objectToBaggageHeader(merged);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/dsn.js
var ORG_ID_REGEX = /^o(\d+)\./;
var DSN_REGEX = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)((?:\[[:.%\w]+\]|[\w.-]+))(?::(\d+))?\/(.+)/;
function isValidProtocol(protocol) {
	return protocol === "http" || protocol === "https";
}
function dsnToString(dsn, withPassword = false) {
	const { host, path, pass, port, projectId, protocol, publicKey } = dsn;
	return `${protocol}://${publicKey}${withPassword && pass ? `:${pass}` : ""}@${host}${port ? `:${port}` : ""}/${path ? `${path}/` : path}${projectId}`;
}
function dsnFromString(str) {
	const match = DSN_REGEX.exec(str);
	if (!match) {
		consoleSandbox(() => {
			console.error(`Invalid Sentry Dsn: ${str}`);
		});
		return;
	}
	const [protocol, publicKey, pass = "", host = "", port = "", lastPath = ""] = match.slice(1);
	let path = "";
	let projectId = lastPath;
	const split = projectId.split("/");
	if (split.length > 1) {
		path = split.slice(0, -1).join("/");
		projectId = split.pop();
	}
	if (projectId) {
		const projectMatch = projectId.match(/^\d+/);
		if (projectMatch) projectId = projectMatch[0];
	}
	return dsnFromComponents({
		host,
		pass,
		path,
		projectId,
		port,
		protocol,
		publicKey
	});
}
function dsnFromComponents(components) {
	return {
		protocol: components.protocol,
		publicKey: components.publicKey || "",
		pass: components.pass || "",
		host: components.host,
		port: components.port || "",
		path: components.path || "",
		projectId: components.projectId
	};
}
function validateDsn(dsn) {
	if (!DEBUG_BUILD) return true;
	const { port, projectId, protocol } = dsn;
	if ([
		"protocol",
		"publicKey",
		"host",
		"projectId"
	].find((component) => {
		if (!dsn[component]) {
			debug.error(`Invalid Sentry Dsn: ${component} missing`);
			return true;
		}
		return false;
	})) return false;
	if (!projectId.match(/^\d+$/)) {
		debug.error(`Invalid Sentry Dsn: Invalid projectId ${projectId}`);
		return false;
	}
	if (!isValidProtocol(protocol)) {
		debug.error(`Invalid Sentry Dsn: Invalid protocol ${protocol}`);
		return false;
	}
	if (port && isNaN(parseInt(port, 10))) {
		debug.error(`Invalid Sentry Dsn: Invalid port ${port}`);
		return false;
	}
	return true;
}
function extractOrgIdFromDsnHost(host) {
	return host.match(ORG_ID_REGEX)?.[1];
}
function extractOrgIdFromClient(client) {
	const options = client.getOptions();
	const { host } = client.getDsn() || {};
	let org_id;
	if (options.orgId) org_id = String(options.orgId);
	else if (host) org_id = extractOrgIdFromDsnHost(host);
	return org_id;
}
function makeDsn(from) {
	const components = typeof from === "string" ? dsnFromString(from) : dsnFromComponents(from);
	if (!components || !validateDsn(components)) return;
	return components;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/parseSampleRate.js
function parseSampleRate(sampleRate) {
	if (typeof sampleRate === "boolean") return Number(sampleRate);
	const rate = typeof sampleRate === "string" ? parseFloat(sampleRate) : sampleRate;
	if (typeof rate !== "number" || isNaN(rate) || rate < 0 || rate > 1) return;
	return rate;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/tracing.js
var TRACEPARENT_REGEXP = /* @__PURE__ */ new RegExp("^[ \\t]*([0-9a-f]{32})?-?([0-9a-f]{16})?-?([01])?[ \\t]*$");
function extractTraceparentData(traceparent) {
	if (!traceparent) return;
	const matches = traceparent.match(TRACEPARENT_REGEXP);
	if (!matches) return;
	let parentSampled;
	if (matches[3] === "1") parentSampled = true;
	else if (matches[3] === "0") parentSampled = false;
	return {
		traceId: matches[1],
		parentSampled,
		parentSpanId: matches[2]
	};
}
function isContinuingTrace(propagationContext) {
	return !!propagationContext.parentSpanId || !!propagationContext.dsc;
}
function propagationContextFromHeaders(sentryTrace, baggage) {
	const traceparentData = extractTraceparentData(sentryTrace);
	const dynamicSamplingContext = baggageHeaderToDynamicSamplingContext(baggage);
	if (!traceparentData?.traceId) return {
		traceId: generateTraceId(),
		sampleRand: safeMathRandom()
	};
	const sampleRand = getSampleRandFromTraceparentAndDsc(traceparentData, dynamicSamplingContext);
	if (dynamicSamplingContext) dynamicSamplingContext.sample_rand = sampleRand.toString();
	const { traceId, parentSpanId, parentSampled } = traceparentData;
	return {
		traceId,
		parentSpanId,
		sampled: parentSampled,
		dsc: dynamicSamplingContext || {},
		sampleRand
	};
}
function generateSentryTraceHeader(traceId = generateTraceId(), spanId = generateSpanId(), sampled) {
	let sampledString = "";
	if (sampled !== void 0) sampledString = sampled ? "-1" : "-0";
	return `${traceId}-${spanId}${sampledString}`;
}
function generateTraceparentHeader(traceId = generateTraceId(), spanId = generateSpanId(), sampled) {
	return `00-${traceId}-${spanId}-${sampled ? "01" : "00"}`;
}
function getSampleRandFromTraceparentAndDsc(traceparentData, dsc) {
	const parsedSampleRand = parseSampleRate(dsc?.sample_rand);
	if (parsedSampleRand !== void 0) return parsedSampleRand;
	const parsedSampleRate = parseSampleRate(dsc?.sample_rate);
	if (parsedSampleRate && traceparentData?.parentSampled !== void 0) return traceparentData.parentSampled ? safeMathRandom() * parsedSampleRate : parsedSampleRate + safeMathRandom() * (1 - parsedSampleRate);
	else return safeMathRandom();
}
function shouldContinueTrace(client, baggageOrgId) {
	const clientOrgId = extractOrgIdFromClient(client);
	if (baggageOrgId && clientOrgId && baggageOrgId !== clientOrgId) {
		debug.log(`Won't continue trace because org IDs don't match (incoming baggage: ${baggageOrgId}, SDK options: ${clientOrgId})`);
		return false;
	}
	if (client.getOptions().strictTraceContinuation || false) {
		if (baggageOrgId && !clientOrgId || !baggageOrgId && clientOrgId) {
			debug.log(`Starting a new trace because strict trace continuation is enabled but one org ID is missing (incoming baggage: ${baggageOrgId}, Sentry client: ${clientOrgId})`);
			return false;
		}
	}
	return true;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/spanOnScope.js
var SCOPE_SPAN_FIELD = "span";
function _setSpanForScope(scope, span) {
	if (span) scope.refs[SCOPE_SPAN_FIELD] = makeWeakRef(span);
	else delete scope.refs[SCOPE_SPAN_FIELD];
}
function _getSpanForScope(scope) {
	return derefWeakRef(scope.refs[SCOPE_SPAN_FIELD]);
}
function spanToTransactionTraceContext(span) {
	const { spanId: span_id, traceId: trace_id } = span.spanContext();
	const { data, op, parent_span_id, status, origin, links } = spanToStaticSpanJSON(span);
	return {
		parent_span_id,
		span_id,
		trace_id,
		data,
		op,
		status,
		origin,
		links
	};
}
function spanToTraceContext(span) {
	const { spanId, traceId: trace_id, isRemote } = span.spanContext();
	const parent_span_id = isRemote ? spanId : spanToStaticSpanJSON(span).parent_span_id;
	const scope = getCapturedScopesOnSpan(span).scope;
	return {
		parent_span_id,
		span_id: isRemote ? scope?.getPropagationContext().propagationSpanId || generateSpanId() : spanId,
		trace_id
	};
}
function spanToTraceHeader(span) {
	const { traceId, spanId } = span.spanContext();
	return generateSentryTraceHeader(traceId, spanId, spanIsSampled(span));
}
function spanToTraceparentHeader(span) {
	const { traceId, spanId } = span.spanContext();
	return generateTraceparentHeader(traceId, spanId, spanIsSampled(span));
}
function convertSpanLinksForEnvelope(links) {
	if (links && links.length > 0) return links.map(({ context: { spanId, traceId, traceFlags, ...restContext }, attributes }) => ({
		span_id: spanId,
		trace_id: traceId,
		sampled: traceFlags === 1,
		attributes,
		...restContext
	}));
	else return;
}
function getStreamedSpanLinks(links) {
	if (links?.length) return links.map(({ context: { spanId, traceId, traceFlags }, attributes }) => ({
		span_id: spanId,
		trace_id: traceId,
		sampled: traceFlags === 1,
		attributes
	}));
	else return;
}
function spanTimeInputToSeconds(input) {
	if (typeof input === "number") return ensureTimestampInSeconds(input);
	if (Array.isArray(input)) return input[0] + input[1] / 1e9;
	if (input instanceof Date) return ensureTimestampInSeconds(input.getTime());
	return timestampInSeconds();
}
function ensureTimestampInSeconds(timestamp) {
	return timestamp > 9999999999 ? timestamp / 1e3 : timestamp;
}
function spanToStaticSpanJSON(span) {
	if (spanIsSentrySpan(span)) return span.getStaticSpanJSON();
	const { spanId: span_id, traceId: trace_id } = span.spanContext();
	if (spanIsOpenTelemetrySdkTraceBaseSpan(span)) {
		const { attributes, startTime, name, endTime, status, links } = span;
		return {
			span_id,
			trace_id,
			data: attributes,
			description: name,
			parent_span_id: getOtelParentSpanId(span),
			start_timestamp: spanTimeInputToSeconds(startTime),
			timestamp: spanTimeInputToSeconds(endTime) || void 0,
			status: getStatusMessage(status),
			op: attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
			origin: attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
			links: convertSpanLinksForEnvelope(links)
		};
	}
	return {
		span_id,
		trace_id,
		start_timestamp: 0,
		status: "ok",
		data: {}
	};
}
function spanToJSON(span) {
	if (spanIsSentrySpan(span)) return span.getSpanJSON();
	const { spanId: span_id, traceId: trace_id } = span.spanContext();
	if (spanIsOpenTelemetrySdkTraceBaseSpan(span)) {
		const { attributes, startTime, name, endTime, status, links } = span;
		return {
			name,
			span_id,
			trace_id,
			parent_span_id: getOtelParentSpanId(span),
			start_timestamp: spanTimeInputToSeconds(startTime),
			end_timestamp: spanTimeInputToSeconds(endTime) || void 0,
			is_segment: spanIsSegment(span),
			status: getSimpleStatus(status),
			attributes: addStatusMessageAttribute(attributes, status),
			links: getStreamedSpanLinks(links)
		};
	}
	return {
		span_id,
		trace_id,
		start_timestamp: 0,
		name: "",
		status: "ok",
		is_segment: spanIsSegment(span),
		attributes: {}
	};
}
function getOtelParentSpanId(span) {
	return "parentSpanId" in span ? span.parentSpanId : "parentSpanContext" in span ? span.parentSpanContext?.spanId : void 0;
}
function streamedSpanJsonToSerializedSpan(spanJson) {
	return {
		...spanJson,
		end_timestamp: spanJson.end_timestamp ?? spanJson.start_timestamp,
		attributes: serializeAttributes(spanJson.attributes),
		links: spanJson.links?.map((link) => ({
			...link,
			attributes: serializeAttributes(link.attributes)
		}))
	};
}
function spanIsOpenTelemetrySdkTraceBaseSpan(span) {
	const castSpan = span;
	return !!castSpan.attributes && !!castSpan.startTime && !!castSpan.name && !!castSpan.endTime && !!castSpan.status;
}
function spanIsSentrySpan(span) {
	return typeof span.getSpanJSON === "function";
}
function spanIsSampled(span) {
	const { traceFlags } = span.spanContext();
	return traceFlags === 1;
}
function getStatusMessage(status) {
	if (!status || status.code === 0) return "ok";
	if (status.code === 1) return "ok";
	return status.message && isStatusErrorMessageValid(status.message) ? status.message : "internal_error";
}
function getSimpleStatus(status) {
	return !status || status.code === 1 || status.code === 0 || status.message === "cancelled" ? "ok" : "error";
}
function addStatusMessageAttribute(attributes, status) {
	const statusMessage = getSimpleStatus(status) === "error" ? status?.message : void 0;
	return {
		...statusMessage && { ["sentry.status.message"]: statusMessage },
		...attributes
	};
}
var CHILD_SPANS_FIELD = "_sentryChildSpans";
var ROOT_SPAN_FIELD = "_sentryRootSpan";
function addChildSpanToSpan(span, childSpan) {
	const rootSpan = span[ROOT_SPAN_FIELD] || span;
	addNonEnumerableProperty(childSpan, ROOT_SPAN_FIELD, rootSpan);
	childSpan.setAttribute(jd, void 0);
	if (!spanIsSampled(span)) return;
	if (!span.isRecording() && !rootSpan.isRecording()) return;
	if (span[CHILD_SPANS_FIELD]) span[CHILD_SPANS_FIELD].add(childSpan);
	else addNonEnumerableProperty(span, CHILD_SPANS_FIELD, /* @__PURE__ */ new Set([childSpan]));
}
function getSpanDescendants(span) {
	const resultSet = /* @__PURE__ */ new Set();
	function addSpanChildren(span2) {
		if (resultSet.has(span2)) return;
		else if (spanIsSampled(span2)) {
			resultSet.add(span2);
			const childSpans = span2[CHILD_SPANS_FIELD] ? Array.from(span2[CHILD_SPANS_FIELD]) : [];
			for (const childSpan of childSpans) addSpanChildren(childSpan);
		}
	}
	addSpanChildren(span);
	return Array.from(resultSet);
}
var getRootSpan = INTERNAL_getSegmentSpan;
function INTERNAL_getSegmentSpan(span) {
	return span[ROOT_SPAN_FIELD] || span;
}
function spanIsSegment(span) {
	return span === INTERNAL_getSegmentSpan(span);
}
function getActiveSpan(scope) {
	const acs = getAsyncContextStrategy(getMainCarrier());
	if (acs.getActiveSpan) return acs.getActiveSpan(scope);
	return _getSpanForScope(scope || getCurrentScope());
}
function INTERNAL_setSegmentNameSourceIfSegment(span, source) {
	if (spanIsSegment(span)) span.setAttribute(jd, source);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/hasSpansEnabled.js
function hasSpansEnabled(maybeOptions) {
	if (typeof __SENTRY_TRACING__ === "boolean" && !__SENTRY_TRACING__) return false;
	const options = maybeOptions || getClient()?.getOptions();
	return !!options && (options.tracesSampleRate != null || !!options.tracesSampler);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/should-ignore-span.js
function logIgnoredSpan(droppedSpan) {
	debug.log(`Ignoring span ${droppedSpan.op} - ${droppedSpan.description} because it matches \`ignoreSpans\`.`);
}
function shouldIgnoreSpan(span, ignoreSpans) {
	if (!ignoreSpans?.length) return false;
	for (const pattern of ignoreSpans) {
		if (isStringOrRegExp(pattern)) {
			if (span.description && isMatchingPattern(span.description, pattern)) {
				DEBUG_BUILD && logIgnoredSpan(span);
				return true;
			}
			continue;
		}
		const hasAttributes = !!pattern.attributes && Object.keys(pattern.attributes).length > 0;
		if (!pattern.name && !pattern.op && !hasAttributes) continue;
		const nameMatches = pattern.name ? span.description && isMatchingPattern(span.description, pattern.name) : true;
		const opMatches = pattern.op ? span.op && isMatchingPattern(span.op, pattern.op) : true;
		const attrsMatch = pattern.attributes ? Object.entries(pattern.attributes).every(([key, valuePattern]) => _matchesAttributeValue(span.attributes?.[key], valuePattern)) : true;
		if (nameMatches && opMatches && attrsMatch) {
			DEBUG_BUILD && logIgnoredSpan(span);
			return true;
		}
	}
	return false;
}
function _matchesAttributeValue(actual, pat) {
	if (typeof actual === "string" && (typeof pat === "string" || pat instanceof RegExp)) return isMatchingPattern(actual, pat);
	if (Array.isArray(actual) && Array.isArray(pat)) return actual.length === pat.length && actual.every((v, i) => v === pat[i]);
	return actual === pat;
}
function reparentChildSpans(spans, dropSpan) {
	const droppedSpanParentId = dropSpan.parent_span_id;
	const droppedSpanId = dropSpan.span_id;
	if (!droppedSpanParentId) return;
	for (const span of spans) if (span.parent_span_id === droppedSpanId) span.parent_span_id = droppedSpanParentId;
}
function isStringOrRegExp(value) {
	return typeof value === "string" || value instanceof RegExp;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integration.js
var installedIntegrations = [];
function filterDuplicates(integrations) {
	const integrationsByName = {};
	integrations.forEach((currentInstance) => {
		const { name } = currentInstance;
		const existingInstance = integrationsByName[name];
		if (existingInstance && !existingInstance.isDefaultInstance && currentInstance.isDefaultInstance) return;
		integrationsByName[name] = currentInstance;
	});
	return Object.values(integrationsByName);
}
function getIntegrationsToSetup(options) {
	const defaultIntegrations = options.defaultIntegrations || [];
	const userIntegrations = options.integrations;
	defaultIntegrations.forEach((integration) => {
		integration.isDefaultInstance = true;
	});
	let integrations;
	if (Array.isArray(userIntegrations)) integrations = [...defaultIntegrations, ...userIntegrations];
	else if (typeof userIntegrations === "function") {
		const resolvedUserIntegrations = userIntegrations(defaultIntegrations);
		integrations = Array.isArray(resolvedUserIntegrations) ? resolvedUserIntegrations : [resolvedUserIntegrations];
	} else integrations = defaultIntegrations;
	return filterDuplicates(integrations);
}
function setupIntegrations(client, integrations) {
	const integrationIndex = {};
	integrations.forEach((integration) => {
		if (integration?.beforeSetup) integration.beforeSetup(client);
	});
	integrations.forEach((integration) => {
		if (integration) setupIntegration(client, integration, integrationIndex);
	});
	return integrationIndex;
}
function afterSetupIntegrations(client, integrations) {
	for (const integration of integrations) if (integration?.afterAllSetup) integration.afterAllSetup(client);
}
function setupIntegration(client, integration, integrationIndex) {
	if (integrationIndex[integration.name]) {
		DEBUG_BUILD && debug.log(`Integration skipped because it was already installed: ${integration.name}`);
		return;
	}
	integrationIndex[integration.name] = integration;
	if (!installedIntegrations.includes(integration.name) && typeof integration.setupOnce === "function") {
		integration.setupOnce();
		installedIntegrations.push(integration.name);
	}
	if (integration.setup && typeof integration.setup === "function") integration.setup(client);
	if (typeof integration.preprocessEvent === "function") {
		const callback = integration.preprocessEvent.bind(integration);
		client.on("preprocessEvent", (event, hint) => callback(event, hint, client));
	}
	if (typeof integration.processEvent === "function") {
		const callback = integration.processEvent.bind(integration);
		const processor = Object.assign((event, hint) => callback(event, hint, client), { id: integration.name });
		client.addEventProcessor(processor);
	}
	["processSpan", "processSegmentSpan"].forEach((hook) => {
		const callback = integration[hook];
		if (typeof callback === "function") client.on(hook, (span) => callback.call(integration, span, client));
	});
	DEBUG_BUILD && debug.log(`Integration installed: ${integration.name}`);
}
function defineIntegration(fn) {
	return fn;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/constants.js
var DEFAULT_ENVIRONMENT = "production";
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/sentryNonRecordingSpan.js
var NON_RECORDING_SPAN_FIELD = /* @__PURE__ */ Symbol.for("sentry.nonRecordingSpan");
var SentryNonRecordingSpan = class {
	constructor(spanContext = {}) {
		this._traceId = spanContext.traceId || generateTraceId();
		this._spanId = spanContext.spanId || generateSpanId();
		this.dropReason = spanContext.dropReason;
		addNonEnumerableProperty(this, NON_RECORDING_SPAN_FIELD, true);
	}
	/** @inheritdoc */
	spanContext() {
		return {
			spanId: this._spanId,
			traceId: this._traceId,
			traceFlags: 0
		};
	}
	/** @inheritdoc */
	end(_timestamp) {}
	/** @inheritdoc */
	setAttribute(_key, _value) {
		return this;
	}
	/** @inheritdoc */
	setAttributes(_values) {
		return this;
	}
	/** @inheritdoc */
	setStatus(_status) {
		return this;
	}
	/** @inheritdoc */
	updateName(_name) {
		return this;
	}
	/** @inheritdoc */
	isRecording() {
		return false;
	}
	/** @inheritdoc */
	addEvent(_name, _attributesOrStartTime, _startTime) {
		return this;
	}
	/** @inheritDoc */
	addLink(_link) {
		return this;
	}
	/** @inheritDoc */
	addLinks(_links) {
		return this;
	}
	/**
	* This should generally not be used,
	* but we need it for being compliant with the OTEL Span interface.
	*
	* @hidden
	* @internal
	*/
	recordException(_exception, _time) {}
};
function spanIsNonRecordingSpan(span) {
	return !!span && span[NON_RECORDING_SPAN_FIELD] === true;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/dynamicSamplingContext.js
var FROZEN_DSC_FIELD = "_frozenDsc";
function freezeDscOnSpan(span, dsc) {
	addNonEnumerableProperty(span, FROZEN_DSC_FIELD, dsc);
}
function getDynamicSamplingContextFromClient(trace_id, client) {
	const options = client.getOptions();
	const { publicKey: public_key } = client.getDsn() || {};
	const dsc = {
		environment: options.environment || "production",
		release: options.release,
		public_key,
		trace_id,
		org_id: extractOrgIdFromClient(client)
	};
	client.emit("createDsc", dsc);
	return dsc;
}
function getDynamicSamplingContextFromScope(client, scope) {
	if (getExternalPropagationContext()) return;
	const propagationContext = scope.getPropagationContext();
	return propagationContext.dsc || getDynamicSamplingContextFromClient(propagationContext.traceId, client);
}
function getDynamicSamplingContextFromSpan(span) {
	const client = getClient();
	if (!client) return {};
	const rootSpan = getRootSpan(span);
	const rootSpanJson = spanToStaticSpanJSON(rootSpan);
	const rootSpanAttributes = rootSpanJson.data;
	const traceState = rootSpan.spanContext().traceState;
	const rootSpanSampleRate = traceState?.get("sentry.sample_rate") ?? rootSpanAttributes["sentry.sample_rate"] ?? rootSpanAttributes["sentry.previous_trace_sample_rate"];
	function applyLocalSampleRateToDsc(dsc2) {
		if (typeof rootSpanSampleRate === "number" || typeof rootSpanSampleRate === "string") dsc2.sample_rate = `${rootSpanSampleRate}`;
		return dsc2;
	}
	const frozenDsc = rootSpan[FROZEN_DSC_FIELD];
	if (frozenDsc) return applyLocalSampleRateToDsc(frozenDsc);
	const isNonRecordingRoot = spanIsNonRecordingSpan(rootSpan);
	const isIgnoredRoot = isNonRecordingRoot && rootSpan.dropReason === "ignored";
	if (isNonRecordingRoot && (!hasSpansEnabled(client.getOptions()) || isIgnoredRoot)) {
		const capturedScope = getCapturedScopesOnSpan(rootSpan).scope;
		const scopeDsc = capturedScope && getDynamicSamplingContextFromScope(client, capturedScope);
		if (scopeDsc) {
			const dsc2 = { ...scopeDsc };
			if (isIgnoredRoot) dsc2.sampled = "false";
			return applyLocalSampleRateToDsc(dsc2);
		}
	}
	const traceStateDsc = traceState?.get("sentry.dsc");
	const dscOnTraceState = traceStateDsc && baggageHeaderToDynamicSamplingContext(traceStateDsc);
	if (dscOnTraceState) return applyLocalSampleRateToDsc(dscOnTraceState);
	const dsc = getDynamicSamplingContextFromClient(span.spanContext().traceId, client);
	const source = rootSpanAttributes[jd];
	const name = rootSpanJson.description;
	if (source !== "url" && name) dsc.transaction = name;
	if (hasSpansEnabled()) {
		dsc.sampled = String(spanIsSampled(rootSpan));
		dsc.sample_rand = traceState?.get("sentry.sample_rand") ?? getCapturedScopesOnSpan(rootSpan).scope?.getPropagationContext().sampleRand.toString();
	}
	applyLocalSampleRateToDsc(dsc);
	client.emit("createDsc", dsc, rootSpan);
	return dsc;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/scopeData.js
function applyScopeDataToEvent(event, data) {
	const { fingerprint, breadcrumbs, sdkProcessingMetadata } = data;
	applyDataToEvent(event, data);
	applyFingerprintToEvent(event, fingerprint);
	applyBreadcrumbsToEvent(event, breadcrumbs);
	applySdkMetadataToEvent(event, sdkProcessingMetadata);
}
function mergeScopeData(data, mergeData) {
	const { extra, tags, attributes, user, contexts, level, sdkProcessingMetadata, breadcrumbs, fingerprint, eventProcessors, attachments, propagationContext, transactionName } = mergeData;
	mergeAndOverwriteScopeData(data, "extra", extra);
	mergeAndOverwriteScopeData(data, "tags", tags);
	mergeAndOverwriteScopeData(data, "attributes", attributes);
	mergeAndOverwriteScopeData(data, "user", user);
	mergeAndOverwriteScopeData(data, "contexts", contexts);
	data.sdkProcessingMetadata = merge(data.sdkProcessingMetadata, sdkProcessingMetadata, 2);
	if (level) data.level = level;
	if (transactionName) data.transactionName = transactionName;
	if (breadcrumbs.length) data.breadcrumbs = [...data.breadcrumbs, ...breadcrumbs];
	if (fingerprint.length) data.fingerprint = [...data.fingerprint, ...fingerprint];
	if (eventProcessors.length) data.eventProcessors = [...data.eventProcessors, ...eventProcessors];
	if (attachments.length) data.attachments = [...data.attachments, ...attachments];
	data.propagationContext = {
		...data.propagationContext,
		...propagationContext
	};
}
function mergeAndOverwriteScopeData(data, prop, mergeVal) {
	data[prop] = merge(data[prop], mergeVal, 1);
}
function getCombinedScopeData(isolationScope, currentScope) {
	const scopeData = getGlobalScope().getScopeData();
	isolationScope && mergeScopeData(scopeData, isolationScope.getScopeData());
	currentScope && mergeScopeData(scopeData, currentScope.getScopeData());
	return scopeData;
}
function applyDataToEvent(event, data) {
	const { extra, tags, user, contexts, level, transactionName } = data;
	if (Object.keys(extra).length) event.extra = {
		...extra,
		...event.extra
	};
	if (Object.keys(tags).length) event.tags = {
		...tags,
		...event.tags
	};
	if (Object.keys(user).length) event.user = {
		...user,
		...event.user
	};
	if (Object.keys(contexts).length) event.contexts = {
		...contexts,
		...event.contexts
	};
	if (level) event.level = level;
	if (transactionName && event.type !== "transaction") event.transaction = transactionName;
}
function applyBreadcrumbsToEvent(event, breadcrumbs) {
	const mergedBreadcrumbs = [...event.breadcrumbs || [], ...breadcrumbs];
	event.breadcrumbs = mergedBreadcrumbs.length ? mergedBreadcrumbs : void 0;
}
function applySdkMetadataToEvent(event, sdkProcessingMetadata) {
	event.sdkProcessingMetadata = {
		...event.sdkProcessingMetadata,
		...sdkProcessingMetadata
	};
}
function applySpanToEvent(event, span) {
	event.contexts = {
		trace: spanToTraceContext(span),
		...event.contexts
	};
	event.sdkProcessingMetadata = {
		dynamicSamplingContext: getDynamicSamplingContextFromSpan(span),
		...event.sdkProcessingMetadata
	};
	const transactionName = spanToStaticSpanJSON(getRootSpan(span)).description;
	if (transactionName && !event.transaction && event.type === "transaction") event.transaction = transactionName;
}
function applyFingerprintToEvent(event, fingerprint) {
	event.fingerprint = event.fingerprint ? Array.isArray(event.fingerprint) ? event.fingerprint : [event.fingerprint] : [];
	if (fingerprint) event.fingerprint = event.fingerprint.concat(fingerprint);
	if (!event.fingerprint.length) delete event.fingerprint;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/spans/beforeSendSpan.js
function isStaticBeforeSendSpanCallback(callback) {
	return !!callback && typeof callback === "function" && "_static" in callback && !!callback._static;
}
var hasShownSpanDropWarning = false;
function applyBeforeSendSpanCallback(span, beforeSendSpan) {
	try {
		const modifedSpan = beforeSendSpan(span);
		if (!modifedSpan) {
			if (!hasShownSpanDropWarning) {
				consoleSandbox(() => {
					console.warn("[Sentry] Returning null from `beforeSendSpan` is disallowed. To drop certain spans, configure the respective integrations directly or use `ignoreSpans`.");
				});
				hasShownSpanDropWarning = true;
			}
			return span;
		}
		return modifedSpan;
	} catch (error) {
		DEBUG_BUILD && debug.error("The `beforeSendSpan` callback threw an error, sending the span unmodified:", error);
		return span;
	}
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/spans/spanJsonToStreamedSpan.js
function spanJsonToSerializedStreamedSpan(span) {
	return streamedSpanJsonToSerializedSpan({
		trace_id: span.trace_id,
		span_id: span.span_id,
		parent_span_id: span.parent_span_id,
		name: span.description || "",
		start_timestamp: span.start_timestamp,
		end_timestamp: span.timestamp,
		status: !span.status || span.status === "ok" || span.status === "cancelled" ? "ok" : "error",
		is_segment: false,
		attributes: { ...span.data },
		links: span.links
	});
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/spans/scopeContextAttributes.js
function scopeContextsToSpanAttributes(contexts) {
	const attrs = {};
	const { response, profile, cloud_resource, culture, state } = contexts;
	if (response) {
		if (response.status_code != null) attrs["http.response.status_code"] = response.status_code;
		if (response.body_size != null) attrs["http.response.body.size"] = response.body_size;
	}
	if (profile) {
		if (profile.profile_id) attrs["sentry.profile_id"] = profile.profile_id;
		if (profile.profiler_id) attrs["sentry.profiler_id"] = profile.profiler_id;
	}
	if (cloud_resource) {
		for (const [key, value] of Object.entries(cloud_resource)) if (value != null) attrs[key] = value;
	}
	if (culture) {
		if (culture.locale) attrs["culture.locale"] = culture.locale;
		if (culture.timezone) attrs["culture.timezone"] = culture.timezone;
	}
	if (state?.state && typeof state.state.type === "string") attrs["state.type"] = state.state.type;
	const angular = contexts["angular"];
	if (angular) {
		const version = angular["version"];
		if (typeof version === "string" || typeof version === "number") attrs["angular.version"] = version;
	}
	const react = contexts["react"];
	if (react) {
		const version = react["version"];
		if (typeof version === "string" || typeof version === "number") attrs["react.version"] = version;
	}
	return attrs;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/spans/captureSpan.js
function captureSpan(span, client) {
	const spanJSON = spanToJSON(span);
	const segmentSpan = INTERNAL_getSegmentSpan(span);
	const serializedSegmentSpan = spanToJSON(segmentSpan);
	const { isolationScope: spanIsolationScope, scope: spanScope } = getCapturedScopesOnSpan(span);
	const finalScopeData = getCombinedScopeData(spanIsolationScope, spanScope);
	applyCommonSpanAttributes(spanJSON, serializedSegmentSpan, client, finalScopeData);
	client.emit("preprocessSpan", spanJSON);
	if (spanJSON.is_segment) {
		applyScopeToSegmentSpan(spanJSON, finalScopeData);
		applySdkMetadataToSegmentSpan(spanJSON, client);
		client.emit("processSegmentSpan", spanJSON);
	}
	client.emit("processSpan", spanJSON);
	const { beforeSendSpan, traceLifecycle } = client.getOptions();
	return {
		...streamedSpanJsonToSerializedSpan(traceLifecycle !== "static" && beforeSendSpan && !isStaticBeforeSendSpanCallback(beforeSendSpan) ? applyBeforeSendSpanCallback(spanJSON, beforeSendSpan) : spanJSON),
		_segmentSpan: segmentSpan
	};
}
function applyScopeToSegmentSpan(segmentSpanJSON, scopeData) {
	safeSetSpanJSONAttributes(segmentSpanJSON, scopeContextsToSpanAttributes(scopeData.contexts));
}
function safeSetSpanJSONAttributes(spanJSON, newAttributes) {
	const originalAttributes = spanJSON.attributes ?? (spanJSON.attributes = {});
	Object.entries(newAttributes).forEach(([key, value]) => {
		if (value != null && !(key in originalAttributes)) originalAttributes[key] = value;
	});
}
function applySdkMetadataToSegmentSpan(segmentSpanJSON, client) {
	const integrationNames = client.getIntegrationNames();
	if (!integrationNames.length) return;
	safeSetSpanJSONAttributes(segmentSpanJSON, { [SEMANTIC_ATTRIBUTE_SENTRY_SDK_INTEGRATIONS]: integrationNames });
}
function commonSpanAttributes(serializedSegmentSpan, client, scopeData, includeScopeAttributes = true) {
	const sdk = client.getSdkMetadata();
	const { release, environment } = client.getOptions();
	return {
		[tu]: "stream",
		[Wd]: serializedSegmentSpan.name,
		[Gd]: serializedSegmentSpan.span_id,
		[Md]: sdk?.sdk?.name,
		[zd]: sdk?.sdk?.version,
		[SEMANTIC_ATTRIBUTE_SENTRY_RELEASE]: release,
		[SEMANTIC_ATTRIBUTE_SENTRY_ENVIRONMENT]: environment || "production",
		[SEMANTIC_ATTRIBUTE_USER_ID]: scopeData.user?.id,
		[SEMANTIC_ATTRIBUTE_USER_EMAIL]: scopeData.user?.email,
		[SEMANTIC_ATTRIBUTE_USER_IP_ADDRESS]: scopeData.user?.ip_address,
		[SEMANTIC_ATTRIBUTE_USER_USERNAME]: scopeData.user?.username,
		...includeScopeAttributes ? scopeData.attributes : void 0
	};
}
function applyCommonSpanAttributes(spanJSON, serializedSegmentSpan, client, scopeData) {
	safeSetSpanJSONAttributes(spanJSON, commonSpanAttributes(serializedSegmentSpan, client, scopeData));
}
function captureStandaloneSpanWithStaticCallback(span, client, beforeSendSpan) {
	const spanJSON = spanToStaticSpanJSON(span);
	const serializedSegmentSpan = spanToJSON(INTERNAL_getSegmentSpan(span));
	const { isolationScope: spanIsolationScope, scope: spanScope } = getCapturedScopesOnSpan(span);
	const commonAttributes = commonSpanAttributes(serializedSegmentSpan, client, getCombinedScopeData(spanIsolationScope, spanScope), false);
	Object.entries(commonAttributes).forEach(([key, value]) => {
		if (value != null && !(key in spanJSON.data)) spanJSON.data[key] = value;
	});
	return spanJsonToSerializedStreamedSpan(applyBeforeSendSpanCallback(spanJSON, beforeSendSpan));
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/spans/hasSpanStreamingEnabled.js
function hasSpanStreamingEnabled(client) {
	return client.getOptions().traceLifecycle === "stream";
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/timer.js
function safeUnref(timer) {
	if (typeof timer === "object" && typeof timer.unref === "function") timer.unref();
	return timer;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/envelope.js
function createEnvelope(headers, items = []) {
	return [headers, items];
}
function addItemToEnvelope(envelope, newItem) {
	const [headers, items] = envelope;
	return [headers, [...items, newItem]];
}
function forEachEnvelopeItem(envelope, callback) {
	const envelopeItems = envelope[1];
	for (const envelopeItem of envelopeItems) {
		const envelopeItemType = envelopeItem[0].type;
		if (callback(envelopeItem, envelopeItemType)) return true;
	}
	return false;
}
function envelopeContainsItemType(envelope, types) {
	return forEachEnvelopeItem(envelope, (_, type) => types.includes(type));
}
function encodeUTF8(input) {
	const carrier = getSentryCarrier(GLOBAL_OBJ);
	return carrier.encodePolyfill ? carrier.encodePolyfill(input) : new TextEncoder().encode(input);
}
function serializeEnvelope(envelope) {
	const [envHeaders, items] = envelope;
	let parts = JSON.stringify(envHeaders);
	function append(next) {
		if (typeof parts === "string") parts = typeof next === "string" ? parts + next : [encodeUTF8(parts), next];
		else parts.push(typeof next === "string" ? encodeUTF8(next) : next);
	}
	for (const item of items) {
		const [itemHeaders, payload] = item;
		append(`
${JSON.stringify(itemHeaders)}
`);
		if (typeof payload === "string" || payload instanceof Uint8Array) append(payload);
		else {
			let stringifiedPayload;
			try {
				stringifiedPayload = JSON.stringify(payload);
			} catch {
				stringifiedPayload = JSON.stringify(normalize(payload));
			}
			append(stringifiedPayload);
		}
	}
	return typeof parts === "string" ? parts : concatBuffers(parts);
}
function concatBuffers(buffers) {
	const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
	const merged = new Uint8Array(totalLength);
	let offset = 0;
	for (const buffer of buffers) {
		merged.set(buffer, offset);
		offset += buffer.length;
	}
	return merged;
}
function createAttachmentEnvelopeItem(attachment) {
	const buffer = typeof attachment.data === "string" ? encodeUTF8(attachment.data) : attachment.data;
	return [{
		type: "attachment",
		length: buffer.length,
		filename: attachment.filename,
		content_type: attachment.contentType,
		attachment_type: attachment.attachmentType
	}, buffer];
}
var DATA_CATEGORY_OVERRIDES = {
	sessions: "session",
	event: "error",
	client_report: "internal",
	user_report: "default",
	profile_chunk: "profile",
	replay_event: "replay",
	replay_recording: "replay",
	check_in: "monitor",
	raw_security: "security",
	log: "log_item",
	trace_metric: "metric"
};
function _isOverriddenType(type) {
	return type in DATA_CATEGORY_OVERRIDES;
}
function envelopeItemTypeToDataCategory(type) {
	return _isOverriddenType(type) ? DATA_CATEGORY_OVERRIDES[type] : type;
}
function getSdkMetadataForEnvelopeHeader(metadataOrEvent) {
	if (!metadataOrEvent?.sdk) return;
	const { name, version } = metadataOrEvent.sdk;
	return {
		name,
		version
	};
}
function createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn) {
	const dynamicSamplingContext = event.sdkProcessingMetadata?.dynamicSamplingContext;
	return {
		event_id: event.event_id,
		sent_at: new Date(safeDateNow()).toISOString(),
		...sdkInfo && { sdk: sdkInfo },
		...!!tunnel && dsn && { dsn: dsnToString(dsn) },
		...dynamicSamplingContext && { trace: dynamicSamplingContext }
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/env.js
function isBrowserBundle() {
	return typeof __SENTRY_BROWSER_BUNDLE__ !== "undefined" && !!__SENTRY_BROWSER_BUNDLE__;
}
/*! __SENTRY_SDK_SOURCE__ */
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/node.js
function isNodeEnv() {
	return !isBrowserBundle() && Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/isBrowser.js
function isBrowser() {
	return typeof window !== "undefined" && (!isNodeEnv() || isElectronNodeRenderer());
}
function isElectronNodeRenderer() {
	return GLOBAL_OBJ.process?.type === "renderer";
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/spans/envelope.js
function createStreamedSpanEnvelope(serializedSpans, dsc, client) {
	const options = client.getOptions();
	const dsn = client.getDsn();
	const tunnel = options.tunnel;
	const sdk = getSdkMetadataForEnvelopeHeader(options._metadata);
	return createEnvelope({
		sent_at: new Date(safeDateNow()).toISOString(),
		...dscHasRequiredProps(dsc) && { trace: dsc },
		...sdk && { sdk },
		...!!tunnel && dsn && { dsn: dsnToString(dsn) }
	}, [createSpanContainerItem(serializedSpans, client)]);
}
function createSpanContainerItem(serializedSpans, client) {
	const inferSetting = client.getDataCollectionOptions().userInfo ? "auto" : "never";
	return [{
		type: "span",
		item_count: serializedSpans.length,
		content_type: "application/vnd.sentry.items.span.v2+json"
	}, {
		version: 2,
		ingest_settings: isBrowser() ? {
			infer_ip: inferSetting,
			infer_user_agent: inferSetting
		} : void 0,
		items: serializedSpans
	}];
}
function dscHasRequiredProps(dsc) {
	return !!dsc.trace_id && !!dsc.public_key;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/spans/estimateSize.js
function estimateSerializedSpanSizeInBytes(span) {
	let weight = 156;
	weight += span.name.length * 2;
	weight += estimateTypedAttributesSizeInBytes(span.attributes);
	if (span.links && span.links.length > 0) {
		const attributes = span.links[0]?.attributes;
		const linkWeight = 100 + (attributes ? estimateTypedAttributesSizeInBytes(attributes) : 0);
		weight += linkWeight * span.links.length;
	}
	return weight;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/spans/spanBuffer.js
var MAX_SPANS_PER_ENVELOPE = 1e3;
var MAX_TRACE_WEIGHT_IN_BYTES = 5e6;
var SpanBuffer = class {
	constructor(client, options) {
		this._traceBuckets = /* @__PURE__ */ new Map();
		this._client = client;
		const { maxSpanLimit, flushInterval, maxTraceWeightInBytes } = options ?? {};
		this._maxSpanLimit = maxSpanLimit && maxSpanLimit > 0 && maxSpanLimit <= MAX_SPANS_PER_ENVELOPE ? maxSpanLimit : MAX_SPANS_PER_ENVELOPE;
		this._flushInterval = flushInterval && flushInterval > 0 ? flushInterval : 5e3;
		this._maxTraceWeight = maxTraceWeightInBytes && maxTraceWeightInBytes > 0 ? maxTraceWeightInBytes : MAX_TRACE_WEIGHT_IN_BYTES;
		this._client.on("flush", () => {
			this.drain();
		});
		this._client.on("close", () => {
			this._traceBuckets.forEach((bucket) => {
				clearTimeout(bucket.timeout);
			});
			this._traceBuckets.clear();
		});
	}
	/**
	* Add a span to the buffer.
	*/
	add(spanJSON) {
		const traceId = spanJSON.trace_id;
		let bucket = this._traceBuckets.get(traceId);
		if (!bucket) {
			bucket = {
				spans: /* @__PURE__ */ new Set(),
				size: 0,
				timeout: safeUnref(setTimeout(() => {
					this.flush(traceId);
				}, this._flushInterval))
			};
			this._traceBuckets.set(traceId, bucket);
		}
		bucket.spans.add(spanJSON);
		bucket.size += estimateSerializedSpanSizeInBytes(spanJSON);
		if (bucket.spans.size >= this._maxSpanLimit || bucket.size >= this._maxTraceWeight) this.flush(traceId);
	}
	/**
	* Drain and flush all buffered traces.
	*/
	drain() {
		if (!this._traceBuckets.size) return;
		DEBUG_BUILD && debug.log(`Flushing span tree map with ${this._traceBuckets.size} traces`);
		this._traceBuckets.forEach((_, traceId) => {
			this.flush(traceId);
		});
	}
	/**
	* Flush spans of a specific trace.
	* In contrast to {@link SpanBuffer.drain}, this method does not flush all traces, but only the one with the given traceId.
	*/
	flush(traceId) {
		const bucket = this._traceBuckets.get(traceId);
		if (!bucket) return;
		if (!bucket.spans.size) {
			this._removeTrace(traceId);
			return;
		}
		const spans = Array.from(bucket.spans);
		const segmentSpan = spans[0]?._segmentSpan;
		if (!segmentSpan) {
			DEBUG_BUILD && debug.warn("No segment span reference found on span JSON, cannot compute DSC");
			this._removeTrace(traceId);
			return;
		}
		const dsc = getDynamicSamplingContextFromSpan(segmentSpan);
		const cleanedSpans = spans.map((spanJSON) => {
			const { _segmentSpan, ...cleanSpanJSON } = spanJSON;
			return cleanSpanJSON;
		});
		const envelope = createStreamedSpanEnvelope(cleanedSpans, dsc, this._client);
		DEBUG_BUILD && debug.log(`Sending span envelope for trace ${traceId} with ${cleanedSpans.length} spans`);
		this._client.sendEnvelope(envelope).then(null, (reason) => {
			DEBUG_BUILD && debug.error("Error while sending streamed span envelope:", reason);
		});
		this._removeTrace(traceId);
	}
	_removeTrace(traceId) {
		const bucket = this._traceBuckets.get(traceId);
		if (bucket) clearTimeout(bucket.timeout);
		this._traceBuckets.delete(traceId);
	}
};
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/spanStreaming.js
var INTEGRATION_NAME$7 = "SpanStreaming";
var spanStreamingIntegration = defineIntegration((options = {}) => {
	const flushOnSegmentEnd = options.flushOnSegmentEnd ?? true;
	return {
		name: INTEGRATION_NAME$7,
		setup(client) {
			if (!hasSpanStreamingEnabled(client)) {
				DEBUG_BUILD && debug.log(`[SpanStreaming] \`traceLifecycle\` is "static", skipping setup.`);
				return;
			}
			const buffer = new SpanBuffer(client);
			client.on("afterSpanEnd", (span) => {
				if (!spanIsSampled(span)) return;
				buffer.add(captureSpan(span, client));
			});
			client.on("flushTraceSpans", (traceId) => {
				buffer.flush(traceId);
			});
			if (flushOnSegmentEnd) client.on("afterSegmentSpanEnd", (segmentSpan) => {
				const traceId = segmentSpan.spanContext().traceId;
				safeUnref(setTimeout(() => {
					buffer.flush(traceId);
				}, 500));
			});
		}
	};
});
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/handleCallbackErrors.js
function handleCallbackErrors(fn, onError, onFinally = () => {}, onSuccess = () => {}) {
	let maybePromiseResult;
	try {
		maybePromiseResult = fn();
	} catch (e) {
		onError(e);
		onFinally();
		throw e;
	}
	return maybeHandlePromiseRejection(maybePromiseResult, onError, onFinally, onSuccess);
}
function maybeHandlePromiseRejection(value, onError, onFinally, onSuccess) {
	if (isThenable(value)) return chainAndCopyPromiseLike(value, (result) => {
		onFinally();
		onSuccess(result);
	}, (err) => {
		onError(err);
		onFinally();
	});
	onFinally();
	onSuccess(value);
	return value;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/logSpans.js
function logSpanStart(span) {
	if (!DEBUG_BUILD) return;
	const { description = "< unknown name >", op = "< unknown op >", parent_span_id: parentSpanId } = spanToStaticSpanJSON(span);
	const { spanId } = span.spanContext();
	const sampled = spanIsSampled(span);
	const rootSpan = getRootSpan(span);
	const isRootSpan = rootSpan === span;
	const header = `[Tracing] Starting ${sampled ? "sampled" : "unsampled"} ${isRootSpan ? "root " : ""}span`;
	const infoParts = [
		`op: ${op}`,
		`name: ${description}`,
		`ID: ${spanId}`
	];
	if (parentSpanId) infoParts.push(`parent ID: ${parentSpanId}`);
	if (!isRootSpan) {
		const { op: op2, description: description2 } = spanToStaticSpanJSON(rootSpan);
		infoParts.push(`root ID: ${rootSpan.spanContext().spanId}`);
		if (op2) infoParts.push(`root op: ${op2}`);
		if (description2) infoParts.push(`root description: ${description2}`);
	}
	debug.log(`${header}
  ${infoParts.join("\n  ")}`);
}
function logSpanEnd(span) {
	if (!DEBUG_BUILD) return;
	const { description = "< unknown name >", op = "< unknown op >" } = spanToStaticSpanJSON(span);
	const { spanId } = span.spanContext();
	const msg = `[Tracing] Finishing "${op}" ${getRootSpan(span) === span ? "root " : ""}span "${description}" with ID ${spanId}`;
	debug.log(msg);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/sampling.js
function sampleSpan(options, samplingContext, sampleRand) {
	if (!hasSpansEnabled(options)) return [false];
	let localSampleRateWasApplied = void 0;
	let sampleRate;
	if (typeof options.tracesSampler === "function") {
		sampleRate = options.tracesSampler({
			...samplingContext,
			inheritOrSampleWith: (fallbackSampleRate) => {
				if (typeof samplingContext.parentSampleRate === "number") return samplingContext.parentSampleRate;
				if (typeof samplingContext.parentSampled === "boolean") return Number(samplingContext.parentSampled);
				return fallbackSampleRate;
			}
		});
		localSampleRateWasApplied = true;
	} else if (samplingContext.parentSampled !== void 0) sampleRate = samplingContext.parentSampled;
	else if (typeof options.tracesSampleRate !== "undefined") {
		sampleRate = options.tracesSampleRate;
		localSampleRateWasApplied = true;
	}
	const parsedSampleRate = parseSampleRate(sampleRate);
	if (parsedSampleRate === void 0) {
		DEBUG_BUILD && debug.warn(`[Tracing] Discarding root span because of invalid sample rate. Sample rate must be a boolean or a number between 0 and 1. Got ${JSON.stringify(sampleRate)} of type ${JSON.stringify(typeof sampleRate)}.`);
		return [false];
	}
	if (!parsedSampleRate) {
		DEBUG_BUILD && debug.log(`[Tracing] Discarding transaction because ${typeof options.tracesSampler === "function" ? "tracesSampler returned 0 or false" : "a negative sampling decision was inherited or tracesSampleRate is set to 0"}`);
		return [
			false,
			parsedSampleRate,
			localSampleRateWasApplied
		];
	}
	const shouldSample = sampleRand < parsedSampleRate;
	if (!shouldSample) DEBUG_BUILD && debug.log(`[Tracing] Discarding transaction because it's not included in the random sample (sampling rate = ${Number(sampleRate)})`);
	return [
		shouldSample,
		parsedSampleRate,
		localSampleRateWasApplied
	];
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/measurement.js
function timedEventsToMeasurements(events) {
	if (!events || events.length === 0) return;
	const measurements = {};
	events.forEach((event) => {
		const attributes = event.attributes || {};
		const unit = attributes[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT];
		const value = attributes[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE];
		if (typeof unit === "string" && typeof value === "number") measurements[event.name] = {
			value,
			unit
		};
	});
	return measurements;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/segmentSpanCaptureStrategy.js
function setSegmentSpanCaptureStrategy(strategy) {
	getSentryCarrier(getMainCarrier()).segmentSpanCaptureStrategy = strategy;
}
function getSegmentSpanCaptureStrategy() {
	return getSentryCarrier(getMainCarrier()).segmentSpanCaptureStrategy;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/sentrySpan.js
var MAX_SPAN_COUNT = 1e3;
var SentrySpan = class {
	/**
	* You should never call the constructor manually, always use `Sentry.startSpan()`
	* or other span methods.
	* @internal
	* @hideconstructor
	* @hidden
	*/
	constructor(spanContext = {}) {
		this._traceId = spanContext.traceId || generateTraceId();
		this._spanId = spanContext.spanId || generateSpanId();
		this._startTime = spanContext.startTimestamp || timestampInSeconds();
		this._links = spanContext.links;
		this._attributes = {};
		this.setAttributes({
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "manual",
			[SEMANTIC_ATTRIBUTE_SENTRY_OP]: spanContext.op,
			...spanContext.attributes
		});
		this._name = spanContext.name;
		if (spanContext.parentSpanId) this._parentSpanId = spanContext.parentSpanId;
		if ("sampled" in spanContext) this._sampled = spanContext.sampled;
		this._events = [];
		this._isStandaloneSpan = spanContext.isStandalone;
	}
	/** @inheritDoc */
	addLink(link) {
		if (this._frozen) return this;
		if (this._links) this._links.push(link);
		else this._links = [link];
		return this;
	}
	/** @inheritDoc */
	addLinks(links) {
		if (this._frozen) return this;
		if (this._links) this._links.push(...links);
		else this._links = links;
		return this;
	}
	/**
	* This should generally not be used,
	* but it is needed for being compliant with the OTEL Span interface.
	*
	* @hidden
	* @internal
	*/
	recordException(_exception, _time) {}
	/** @inheritdoc */
	spanContext() {
		const { _spanId: spanId, _traceId: traceId, _sampled: sampled } = this;
		return {
			spanId,
			traceId,
			traceFlags: sampled ? 1 : 0
		};
	}
	/** @inheritdoc */
	setAttribute(key, value) {
		if (this._frozen) return this;
		if (key === "sentry.segment.name.source" && value !== void 0 && !spanIsSegment(this)) {
			DEBUG_BUILD && debug.warn("[Tracing] Ignoring name source on a child span: this attribute is only valid on the root span.");
			return this;
		}
		if (value === void 0) delete this._attributes[key];
		else this._attributes[key] = value;
		return this;
	}
	/** @inheritdoc */
	setAttributes(attributes) {
		Object.keys(attributes).forEach((key) => this.setAttribute(key, attributes[key]));
		return this;
	}
	/**
	* This should generally not be used,
	* but we need it for browser tracing where we want to adjust the start time afterwards.
	* USE THIS WITH CAUTION!
	*
	* @hidden
	* @internal
	*/
	updateStartTime(timeInput) {
		if (this._frozen) return;
		this._startTime = spanTimeInputToSeconds(timeInput);
	}
	/**
	* @inheritDoc
	*/
	setStatus(value) {
		if (this._frozen) return this;
		this._status = value;
		return this;
	}
	/**
	* @inheritDoc
	*/
	updateName(name) {
		if (this._frozen) return this;
		this._name = name;
		INTERNAL_setSegmentNameSourceIfSegment(this, "custom");
		return this;
	}
	/** @inheritdoc */
	end(endTimestamp) {
		if (this._endTime) return;
		this._endTime = spanTimeInputToSeconds(endTimestamp);
		logSpanEnd(this);
		this._onSpanEnded();
		this._frozen = spanIsTracerProviderSpan(this);
	}
	/**
	* Get JSON representation of this span.
	*
	* @hidden
	* @internal This method is purely for internal purposes and should not be used outside
	* of SDK code. If you need to get a JSON representation of a span,
	* use `spanToJSON(span)` instead.
	*/
	getStaticSpanJSON() {
		return {
			data: this._attributes,
			description: this._name,
			op: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
			parent_span_id: this._parentSpanId,
			span_id: this._spanId,
			start_timestamp: this._startTime,
			status: getStatusMessage(this._status),
			timestamp: this._endTime,
			trace_id: this._traceId,
			origin: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
			profile_id: this._attributes[SEMANTIC_ATTRIBUTE_PROFILE_ID],
			exclusive_time: this._attributes[SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME],
			measurements: timedEventsToMeasurements(this._events),
			links: convertSpanLinksForEnvelope(this._links)
		};
	}
	/**
	* Get {@link StreamedSpanJSON} representation of this span.
	*
	* @hidden
	* @internal This method is purely for internal purposes and should not be used outside
	* of SDK code. If you need to get a JSON representation of a span,
	* use `spanToJSON(span)` instead.
	*/
	getSpanJSON() {
		return {
			name: this._name ?? "",
			span_id: this._spanId,
			trace_id: this._traceId,
			parent_span_id: this._parentSpanId,
			start_timestamp: this._startTime,
			end_timestamp: this._endTime,
			is_segment: spanIsSegment(this),
			status: getSimpleStatus(this._status),
			attributes: addStatusMessageAttribute(this._attributes, this._status),
			links: getStreamedSpanLinks(this._links)
		};
	}
	/** @inheritdoc */
	isRecording() {
		return !this._endTime && !!this._sampled;
	}
	/**
	* @inheritdoc
	*/
	addEvent(name, attributesOrStartTime, startTime) {
		if (this._frozen) return this;
		DEBUG_BUILD && debug.log("[Tracing] Adding an event to span:", name);
		const time = isSpanTimeInput(attributesOrStartTime) ? attributesOrStartTime : startTime || timestampInSeconds();
		const attributes = isSpanTimeInput(attributesOrStartTime) ? {} : attributesOrStartTime || {};
		const event = {
			name,
			time: spanTimeInputToSeconds(time),
			attributes
		};
		this._events.push(event);
		return this;
	}
	/**
	* Whether this span is sent on its own (as a v2 streamed span) rather than as part of a
	* transaction. Used internally; see `_isStandaloneSpan`.
	* @internal
	*/
	isStandaloneSpan() {
		return !!this._isStandaloneSpan;
	}
	/** Emit `spanEnd` when the span is ended. */
	_onSpanEnded() {
		const client = getClient();
		client?.emit("spanEnd", this);
		if (this._isStandaloneSpan) {
			if (!client) return;
			if (this._sampled) {
				sendStandaloneSpan(this, client);
				return;
			}
			DEBUG_BUILD && debug.log("[Tracing] Discarding standalone span because its trace was not chosen to be sampled.");
			client.recordDroppedEvent("sample_rate", "span");
			return;
		}
		client?.emit("afterSpanEnd", this);
		const rootSpan = getRootSpan(this);
		if (rootSpan !== this) {
			const strategy2 = getSegmentSpanCaptureStrategy();
			if (strategy2) {
				const scope2 = getCapturedScopesOnSpan(this).scope || getCurrentScope();
				strategy2.onChildSpanEnded(this, rootSpan, (options) => this._convertSpanToTransaction(options), scope2);
			}
			return;
		}
		if (client && hasSpanStreamingEnabled(client)) {
			client.emit("afterSegmentSpanEnd", this);
			return;
		}
		const scope = getCapturedScopesOnSpan(this).scope || getCurrentScope();
		const strategy = getSegmentSpanCaptureStrategy();
		if (strategy) strategy.onSegmentSpanEnded((options) => this._convertSpanToTransaction(options), scope);
		else {
			const transactionEvent = this._convertSpanToTransaction();
			if (transactionEvent) scope.captureEvent(transactionEvent);
		}
	}
	/**
	* Finish the transaction & prepare the event to send to Sentry.
	*/
	_convertSpanToTransaction(options = {}) {
		if (!isFullFinishedSpan(spanToStaticSpanJSON(this))) return;
		if (!this._name) {
			DEBUG_BUILD && debug.warn("Transaction has no name, falling back to `<unlabeled transaction>`.");
			this._name = "<unlabeled transaction>";
		}
		const { scope: capturedSpanScope, isolationScope: capturedSpanIsolationScope } = getCapturedScopesOnSpan(this);
		const normalizedRequest = capturedSpanScope?.getScopeData().sdkProcessingMetadata?.normalizedRequest;
		if (this._sampled !== true) return;
		options.onSpanCaptured?.(this);
		const spans = [];
		for (const descendant of getSpanDescendants(this)) {
			if (descendant === this || isStandaloneSpan(descendant) || options.isSpanAlreadyCaptured?.(descendant)) continue;
			const spanJSON = spanToStaticSpanJSON(descendant);
			if (!isFullFinishedSpan(spanJSON)) continue;
			options.onSpanCaptured?.(descendant);
			spans.push(spanJSON);
		}
		const source = this._attributes[jd];
		delete this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
		let hasGenAiSpans = false;
		spans.forEach((span) => {
			delete span.data[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
			if (span.op?.startsWith("gen_ai.")) hasGenAiSpans = true;
		});
		const transaction = {
			contexts: { trace: spanToTransactionTraceContext(this) },
			spans: spans.length > MAX_SPAN_COUNT ? spans.sort((a, b) => a.start_timestamp - b.start_timestamp).slice(0, MAX_SPAN_COUNT) : spans,
			start_timestamp: this._startTime,
			timestamp: this._endTime,
			transaction: this._name,
			type: "transaction",
			sdkProcessingMetadata: {
				capturedSpanScope,
				capturedSpanIsolationScope,
				dynamicSamplingContext: getDynamicSamplingContextFromSpan(this),
				hasGenAiSpans
			},
			request: normalizedRequest,
			...source && { transaction_info: { source } }
		};
		const measurements = timedEventsToMeasurements(this._events);
		if (measurements && Object.keys(measurements).length) {
			DEBUG_BUILD && debug.log("[Measurements] Adding measurements to transaction event", JSON.stringify(measurements, void 0, 2));
			transaction.measurements = measurements;
		}
		return transaction;
	}
};
function isSpanTimeInput(value) {
	return value && typeof value === "number" || value instanceof Date || Array.isArray(value);
}
function isFullFinishedSpan(input) {
	return !!input.start_timestamp && !!input.timestamp && !!input.span_id && !!input.trace_id;
}
function isStandaloneSpan(span) {
	return span instanceof SentrySpan && span.isStandaloneSpan();
}
function sendStandaloneSpan(span, client) {
	const { beforeSendSpan, traceLifecycle } = client.getOptions();
	if (traceLifecycle === "static" && isStaticBeforeSendSpanCallback(beforeSendSpan)) {
		const serializedSpan2 = captureStandaloneSpanWithStaticCallback(span, client, beforeSendSpan);
		const dsc2 = getDynamicSamplingContextFromSpan(span);
		client.sendEnvelope(createStreamedSpanEnvelope([serializedSpan2], dsc2, client));
		return;
	}
	const { _segmentSpan, ...serializedSpan } = captureSpan(span, client);
	const dsc = getDynamicSamplingContextFromSpan(_segmentSpan);
	client.sendEnvelope(createStreamedSpanEnvelope([serializedSpan], dsc, client));
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/trace.js
function startSpan(options, callback) {
	const spanArguments = parseSentrySpanArguments(options);
	const { forceTransaction, parentSpan: customParentSpan, scope: customScope } = options;
	const customForkedScope = customScope?.clone();
	return withScope(customForkedScope, () => {
		return getActiveSpanWrapper(customParentSpan)(() => {
			const scope = getCurrentScope();
			const parentSpan = getParentSpan(customScope ?? scope, customParentSpan);
			const client = getClient();
			const activeSpan = options.onlyIfParent && !parentSpan ? startMissingRequiredParentSpan(scope, client) : createChildOrRootSpan({
				parentSpan,
				spanArguments,
				forceTransaction,
				scope
			});
			return runCallback(activeSpan, !spanIsIgnored(activeSpan) || !parentSpan, () => callback(activeSpan), () => activeSpan.end());
		});
	});
}
function startSpanManual(options, callback) {
	const spanArguments = parseSentrySpanArguments(options);
	const { forceTransaction, parentSpan: customParentSpan, scope: customScope } = options;
	const customForkedScope = customScope?.clone();
	return withScope(customForkedScope, () => {
		return getActiveSpanWrapper(customParentSpan)(() => {
			const scope = getCurrentScope();
			const parentSpan = getParentSpan(customScope ?? scope, customParentSpan);
			const activeSpan = options.onlyIfParent && !parentSpan ? startMissingRequiredParentSpan(scope, getClient()) : createChildOrRootSpan({
				parentSpan,
				spanArguments,
				forceTransaction,
				scope
			});
			return runCallback(activeSpan, !spanIsIgnored(activeSpan) || !parentSpan, () => callback(activeSpan, () => activeSpan.end()));
		});
	});
}
function startInactiveSpan(options) {
	const spanArguments = parseSentrySpanArguments(options);
	const { forceTransaction, parentSpan: customParentSpan, scope: customScope } = options;
	return (customScope ? (callback) => withScope(customScope, callback) : customParentSpan !== void 0 ? (callback) => withActiveSpan(customParentSpan, callback) : (callback) => callback())(() => {
		const scope = getCurrentScope();
		const parentSpan = getParentSpan(customScope ?? scope, customParentSpan);
		const client = getClient();
		if (options.onlyIfParent && !parentSpan) return startMissingRequiredParentSpan(scope, client);
		return createChildOrRootSpan({
			parentSpan,
			spanArguments,
			forceTransaction,
			scope
		});
	});
}
var continueTrace = (options, callback) => {
	const acs = getAsyncContextStrategy(getMainCarrier());
	if (acs.continueTrace) return acs.continueTrace(options, callback);
	const { sentryTrace, baggage } = options;
	const client = getClient();
	const incomingDsc = baggageHeaderToDynamicSamplingContext(baggage);
	if (client && !shouldContinueTrace(client, incomingDsc?.org_id)) return startNewTrace(callback);
	return withScope((scope) => {
		const propagationContext = propagationContextFromHeaders(sentryTrace, baggage);
		scope.setPropagationContext(propagationContext);
		return withActiveSpan(null, callback);
	});
};
function withActiveSpan(span, callback) {
	const acs = getAcs();
	if (acs.withActiveSpan) return acs.withActiveSpan(span, callback);
	return withScope((scope) => {
		_setSpanForScope(scope, span || void 0);
		return callback(scope);
	});
}
function suppressTracing(callback) {
	const acs = getAcs();
	if (acs.suppressTracing) return acs.suppressTracing(callback);
	return withScope((scope) => {
		scope.setSDKProcessingMetadata({ [SUPPRESS_TRACING_KEY]: true });
		return callback();
	});
}
function isTracingSuppressed(scope = getCurrentScope()) {
	const acs = getAcs();
	if (acs.isTracingSuppressed) return acs.isTracingSuppressed(scope);
	return scope.getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY] === true;
}
function startNewTrace(callback) {
	const acs = getAcs();
	if (acs.startNewTrace) return acs.startNewTrace(callback);
	return withActiveSpan(null, () => {
		return withScope((scope) => {
			scope.setPropagationContext({
				traceId: generateTraceId(),
				sampleRand: safeMathRandom()
			});
			DEBUG_BUILD && debug.log(`Starting a new trace with id ${scope.getPropagationContext().traceId}`);
			return callback();
		});
	});
}
function startMissingRequiredParentSpan(scope, client) {
	client?.recordDroppedEvent("no_parent_span", "span");
	const span = new SentryNonRecordingSpan({ traceId: scope.getPropagationContext().traceId });
	setCapturedScopesOnSpan(span, scope, getIsolationScope());
	return span;
}
function createChildOrRootSpan({ parentSpan: resolvedParentSpan, spanArguments, forceTransaction, scope: currentScope }) {
	const isolationScope = getIsolationScope();
	const spanScope = {
		scope: currentScope,
		parentSpan: resolvedParentSpan
	};
	getClient()?.emit("prepareSpanScope", spanScope);
	const { scope, parentSpan } = spanScope;
	if (!hasSpansEnabled()) {
		const scopePropagationContext = scope.getPropagationContext();
		const span2 = new SentryNonRecordingSpan({ traceId: parentSpan ? parentSpan.spanContext().traceId : scopePropagationContext.traceId });
		if (parentSpan && !forceTransaction) addChildSpanToSpan(parentSpan, span2);
		setCapturedScopesOnSpan(span2, scope, isolationScope);
		return span2;
	}
	const client = getClient();
	if (_shouldIgnoreStreamedSpan(client, spanArguments)) {
		if (!isTracingSuppressed(scope)) client?.recordDroppedEvent("ignored", "span");
		const ignoredSpan = new SentryNonRecordingSpan({
			dropReason: "ignored",
			traceId: parentSpan?.spanContext().traceId ?? scope.getPropagationContext().traceId
		});
		if (parentSpan && !forceTransaction) addChildSpanToSpan(parentSpan, ignoredSpan);
		setCapturedScopesOnSpan(ignoredSpan, scope, isolationScope);
		return ignoredSpan;
	}
	let span;
	if (parentSpan && !forceTransaction) {
		span = _startChildSpan(parentSpan, scope, spanArguments, isolationScope);
		addChildSpanToSpan(parentSpan, span);
	} else if (parentSpan) {
		const dsc = getDynamicSamplingContextFromSpan(parentSpan);
		const { traceId, spanId: parentSpanId } = parentSpan.spanContext();
		const parentSampled = spanIsSampled(parentSpan);
		span = _startRootSpan({
			traceId,
			parentSpanId,
			...spanArguments
		}, scope, isolationScope, parentSampled);
		freezeDscOnSpan(span, dsc);
	} else {
		const { traceId, dsc, parentSpanId, sampled: parentSampled, sampleRand } = scope.getPropagationContext();
		span = _startRootSpan({
			traceId,
			parentSpanId,
			...spanArguments
		}, scope, isolationScope, parentSampled);
		if (dsc) {
			const dscWithSampleRand = Object.keys(dsc).length === 0 && sampleRand !== void 0 ? { sample_rand: sampleRand.toString() } : dsc;
			freezeDscOnSpan(span, dscWithSampleRand);
		}
	}
	logSpanStart(span);
	return span;
}
function parseSentrySpanArguments(options) {
	const initialCtx = {
		isStandalone: options.experimental?.standalone,
		...options
	};
	if (options.op) initialCtx.attributes = {
		[SEMANTIC_ATTRIBUTE_SENTRY_OP]: options.op,
		...options.attributes
	};
	if (options.startTime) {
		const ctx = { ...initialCtx };
		ctx.startTimestamp = spanTimeInputToSeconds(options.startTime);
		delete ctx.startTime;
		return ctx;
	}
	return initialCtx;
}
function getAcs() {
	return getAsyncContextStrategy(getMainCarrier());
}
function _startRootSpan(spanArguments, scope, isolationScope, parentSampled) {
	const client = getClient();
	const options = client?.getOptions() || {};
	const { name = "" } = spanArguments;
	const mutableSpanSamplingData = {
		spanAttributes: { ...spanArguments.attributes },
		spanName: name,
		parentSampled
	};
	client?.emit("beforeSampling", mutableSpanSamplingData, { decision: false });
	const finalParentSampled = mutableSpanSamplingData.parentSampled ?? parentSampled;
	const finalAttributes = mutableSpanSamplingData.spanAttributes;
	const currentPropagationContext = scope.getPropagationContext();
	const _isTracingSuppressed = isTracingSuppressed(scope);
	const [sampled, sampleRate, localSampleRateWasApplied] = _isTracingSuppressed ? [false] : sampleSpan(options, {
		name,
		parentSampled: finalParentSampled,
		attributes: finalAttributes,
		normalizedRequest: isolationScope.getScopeData().sdkProcessingMetadata.normalizedRequest,
		parentSampleRate: parseSampleRate(currentPropagationContext.dsc?.sample_rate)
	}, currentPropagationContext.sampleRand);
	const rootSpan = new SentrySpan({
		...spanArguments,
		attributes: {
			[jd]: "custom",
			[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE]: sampleRate !== void 0 && localSampleRateWasApplied ? sampleRate : void 0,
			...finalAttributes
		},
		sampled
	});
	if (!sampled && client && !_isTracingSuppressed) {
		DEBUG_BUILD && debug.log("[Tracing] Discarding root span because its trace was not chosen to be sampled.");
		client.recordDroppedEvent("sample_rate", hasSpanStreamingEnabled(client) ? "span" : "transaction");
	}
	setCapturedScopesOnSpan(rootSpan, scope, isolationScope);
	if (client) client.emit("spanStart", rootSpan);
	return rootSpan;
}
function _startChildSpan(parentSpan, scope, spanArguments, isolationScope) {
	const { spanId, traceId } = parentSpan.spanContext();
	const _isTracingSuppressed = isTracingSuppressed(scope);
	const sampled = _isTracingSuppressed ? false : spanIsSampled(parentSpan);
	const childSpan = sampled ? new SentrySpan({
		...spanArguments,
		parentSpanId: spanId,
		traceId,
		sampled
	}) : new SentryNonRecordingSpan({ traceId });
	addChildSpanToSpan(parentSpan, childSpan);
	setCapturedScopesOnSpan(childSpan, scope, isolationScope);
	const client = getClient();
	if (!client) return childSpan;
	if (hasSpanStreamingEnabled(client) && spanIsNonRecordingSpan(childSpan)) {
		if (spanIsNonRecordingSpan(parentSpan) && parentSpan.dropReason) {
			childSpan.dropReason = parentSpan.dropReason;
			client.recordDroppedEvent(parentSpan.dropReason, "span");
		} else if (!_isTracingSuppressed) {
			childSpan.dropReason = "sample_rate";
			client.recordDroppedEvent("sample_rate", "span");
		}
	}
	client.emit("spanStart", childSpan);
	return childSpan;
}
function getParentSpan(scope, customParentSpan) {
	if (customParentSpan) return customParentSpan;
	if (customParentSpan === null) return;
	const span = getActiveSpan(scope);
	if (!span) return;
	const client = getClient();
	if ((client ? client.getOptions() : {}).parentSpanIsAlwaysRootSpan) return getRootSpan(span);
	return span;
}
function getActiveSpanWrapper(parentSpan) {
	return parentSpan !== void 0 ? (callback) => {
		return withActiveSpan(parentSpan, callback);
	} : (callback) => callback();
}
function _shouldIgnoreStreamedSpan(client, spanArguments) {
	const ignoreSpans = client?.getOptions().ignoreSpans;
	if (!client || !hasSpanStreamingEnabled(client) || !ignoreSpans?.length) return false;
	return shouldIgnoreSpan({
		description: spanArguments.name || "",
		op: spanArguments.attributes?.["sentry.op"] || spanArguments.op,
		attributes: spanArguments.attributes
	}, ignoreSpans);
}
function spanIsIgnored(span) {
	return spanIsNonRecordingSpan(span) && span.dropReason === "ignored";
}
function runCallback(span, makeSpanActive, callback, finallyCallback) {
	return (makeSpanActive ? (callback2) => {
		return withActiveSpan(span, () => {
			const scope = getCurrentScope();
			const creationScope = getCapturedScopesOnSpan(span).scope;
			if (creationScope) scope.setPropagationContext(creationScope.getPropagationContext());
			setCapturedScopesOnSpan(span, scope, getIsolationScope());
			return callback2();
		});
	} : (callback2) => callback2())(() => handleCallbackErrors(() => callback(), () => {
		const { status } = spanToStaticSpanJSON(span);
		if (span.isRecording() && status === "ok") span.setStatus({
			code: 2,
			message: "internal_error"
		});
	}, finallyCallback));
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/debounce.js
function debounce(func, wait, options) {
	let callbackReturnValue;
	let timerId;
	let maxTimerId;
	const maxWait = options?.maxWait ? Math.max(options.maxWait, wait) : 0;
	const setTimeoutImpl = options?.setTimeoutImpl || setTimeout;
	function invokeFunc() {
		cancelTimers();
		callbackReturnValue = func();
		return callbackReturnValue;
	}
	function cancelTimers() {
		timerId !== void 0 && clearTimeout(timerId);
		maxTimerId !== void 0 && clearTimeout(maxTimerId);
		timerId = maxTimerId = void 0;
	}
	function flush() {
		if (timerId !== void 0 || maxTimerId !== void 0) return invokeFunc();
		return callbackReturnValue;
	}
	function debounced() {
		if (timerId) clearTimeout(timerId);
		timerId = setTimeoutImpl(invokeFunc, wait);
		if (maxWait && maxTimerId === void 0) maxTimerId = setTimeoutImpl(invokeFunc, maxWait);
		return callbackReturnValue;
	}
	debounced.cancel = cancelTimers;
	debounced.flush = flush;
	return debounced;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/deferSegmentSpanCapture.js
var CAPTURED_SPANS = /* @__PURE__ */ new WeakSet();
var isSpanAlreadyCaptured = (span) => CAPTURED_SPANS.has(span);
var markSpanCaptured = (span) => {
	CAPTURED_SPANS.add(span);
};
var CLIENT_QUEUES = /* @__PURE__ */ new WeakMap();
function _INTERNAL_setDeferSegmentSpanCapture(client) {
	if (!getSegmentSpanCaptureStrategy()) setSegmentSpanCaptureStrategy(deferredSegmentSpanCaptureStrategy);
	if (CLIENT_QUEUES.has(client)) return;
	const pendingCaptures = /* @__PURE__ */ new Set();
	const debouncedDrain = debounce(() => {
		const captures = [...pendingCaptures];
		pendingCaptures.clear();
		for (const capture of captures) capture();
	}, 1, { maxWait: 100 });
	client.on("flush", () => {
		debouncedDrain.flush();
	});
	CLIENT_QUEUES.set(client, (capture) => {
		pendingCaptures.add(capture);
		debouncedDrain();
	});
}
var deferredSegmentSpanCaptureStrategy = {
	onSegmentSpanEnded(convert, scope) {
		const client = scope.getClient();
		const enqueue = client && CLIENT_QUEUES.get(client);
		if (!enqueue) {
			const transactionEvent = convert();
			if (transactionEvent) client?.captureEvent(transactionEvent);
			return;
		}
		enqueue(() => {
			const transactionEvent = convert({
				isSpanAlreadyCaptured,
				onSpanCaptured: markSpanCaptured
			});
			if (transactionEvent) client.captureEvent(transactionEvent);
		});
	},
	onChildSpanEnded(span, rootSpan, convert, scope) {
		if (CAPTURED_SPANS.has(span) || !CAPTURED_SPANS.has(rootSpan)) return;
		const client = scope.getClient();
		const enqueue = client && CLIENT_QUEUES.get(client);
		const captureOrphan = () => {
			const transactionEvent = convert({
				isSpanAlreadyCaptured,
				onSpanCaptured: markSpanCaptured
			});
			if (transactionEvent?.contexts?.trace?.data) transactionEvent.contexts.trace.data["sentry.parent_span_already_sent"] = true;
			if (transactionEvent) client?.captureEvent(transactionEvent);
		};
		if (enqueue) enqueue(captureOrphan);
		else captureOrphan();
	}
};
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/bindScopeToEmitter.js
var ADD_LISTENER_METHODS = [
	"addListener",
	"on",
	"once",
	"prependListener",
	"prependOnceListener",
	"addEventListener"
];
var REMOVE_LISTENER_METHODS = [
	"removeListener",
	"off",
	"removeEventListener"
];
var SCOPE_BOUND_LISTENERS = /* @__PURE__ */ Symbol("SentryScopeBoundListeners");
var registeringWrapper;
function isReentrantWrapperRegistration(listener) {
	return registeringWrapper !== void 0 && (listener === registeringWrapper || listener.listener === registeringWrapper);
}
function bindScopeToEmitter(emitter, scope = getCurrentScope()) {
	const ee = emitter;
	if (getPatchMap(ee)) return emitter;
	createPatchMap(ee);
	for (const methodName of ADD_LISTENER_METHODS) {
		if (typeof ee[methodName] !== "function") continue;
		ee[methodName] = patchAddListener(ee, ee[methodName], scope);
	}
	for (const methodName of REMOVE_LISTENER_METHODS) {
		if (typeof ee[methodName] !== "function") continue;
		ee[methodName] = patchRemoveListener(ee, ee[methodName]);
	}
	if (typeof ee.removeAllListeners === "function") ee.removeAllListeners = patchRemoveAllListeners(ee, ee.removeAllListeners);
	return emitter;
}
function bindListenerToScope(listener, scope) {
	return function(...args) {
		return withScope(scope, () => listener.apply(this, args));
	};
}
function isBoundListener(listener) {
	return typeof listener === "function";
}
function patchAddListener(ee, original, scope) {
	return function(...args) {
		const event = args[0];
		const listener = args[1];
		const rest = args.slice(2);
		if (!isBoundListener(listener) || isReentrantWrapperRegistration(listener)) return original.apply(this, args);
		const map = getPatchMap(ee) || createPatchMap(ee);
		let listeners = map.get(event);
		if (!listeners) {
			listeners = /* @__PURE__ */ new WeakMap();
			map.set(event, listeners);
		}
		let boundListener = listeners.get(listener);
		if (!boundListener) {
			boundListener = bindListenerToScope(listener, scope);
			listeners.set(listener, boundListener);
		}
		const previous = registeringWrapper;
		registeringWrapper = boundListener;
		try {
			return original.call(this, event, boundListener, ...rest);
		} finally {
			registeringWrapper = previous;
		}
	};
}
function patchRemoveListener(ee, original) {
	return function(...args) {
		const event = args[0];
		const listener = args[1];
		const rest = args.slice(2);
		const boundListener = isBoundListener(listener) ? getPatchMap(ee)?.get(event)?.get(listener) : void 0;
		if (!boundListener) return original.apply(this, args);
		return original.call(this, event, boundListener, ...rest);
	};
}
function patchRemoveAllListeners(ee, original) {
	return function(...args) {
		const map = getPatchMap(ee);
		if (map) {
			if (args.length === 0) createPatchMap(ee);
			else {
				const event = args[0];
				map.delete(event);
			}
		}
		return original.apply(this, args);
	};
}
function createPatchMap(ee) {
	const map = /* @__PURE__ */ new Map();
	ee[SCOPE_BOUND_LISTENERS] = map;
	return map;
}
function getPatchMap(ee) {
	return ee[SCOPE_BOUND_LISTENERS];
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/spans/spanNames.js
var HTTP_SPAN_NAME_FALLBACK = "HTTP";
var ROUTER_SPAN_NAME_FALLBACK = "Router";
var REQUEST_HANDLER_SPAN_NAME_FALLBACK = "Request handler";
//#endregion
//#region node_modules/@sentry/core/build/esm/envelope.js
function _enhanceEventWithSdkInfo(event, newSdkInfo) {
	if (!newSdkInfo) return event;
	const eventSdkInfo = event.sdk || {};
	event.sdk = {
		...eventSdkInfo,
		name: eventSdkInfo.name || newSdkInfo.name,
		version: eventSdkInfo.version || newSdkInfo.version,
		integrations: [...event.sdk?.integrations || [], ...newSdkInfo.integrations || []],
		packages: [...event.sdk?.packages || [], ...newSdkInfo.packages || []],
		settings: event.sdk?.settings || newSdkInfo.settings ? {
			...event.sdk?.settings,
			...newSdkInfo.settings
		} : void 0
	};
	return event;
}
function createSessionEnvelope(session, dsn, metadata, tunnel) {
	const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
	return createEnvelope({
		sent_at: new Date(safeDateNow()).toISOString(),
		...sdkInfo && { sdk: sdkInfo },
		...!!tunnel && dsn && { dsn: dsnToString(dsn) }
	}, ["aggregates" in session ? [{ type: "sessions" }, session] : [{ type: "session" }, session.toJSON()]]);
}
function createEventEnvelope(event, dsn, metadata, tunnel) {
	const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
	const eventType = event.type && event.type !== "replay_event" ? event.type : "event";
	_enhanceEventWithSdkInfo(event, metadata?.sdk);
	const envelopeHeaders = createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn);
	delete event.sdkProcessingMetadata;
	return createEnvelope(envelopeHeaders, [[{ type: eventType }, event]]);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/syncpromise.js
var STATE_PENDING = 0;
var STATE_RESOLVED = 1;
var STATE_REJECTED = 2;
function resolvedSyncPromise(value) {
	return new SyncPromise((resolve) => {
		resolve(value);
	});
}
function rejectedSyncPromise(reason) {
	return new SyncPromise((_, reject) => {
		reject(reason);
	});
}
var SyncPromise = class SyncPromise {
	constructor(executor) {
		this._state = STATE_PENDING;
		this._handlers = [];
		this._runExecutor(executor);
	}
	/** @inheritdoc */
	then(onfulfilled, onrejected) {
		return new SyncPromise((resolve, reject) => {
			this._handlers.push([
				false,
				(result) => {
					if (!onfulfilled) resolve(result);
					else try {
						resolve(onfulfilled(result));
					} catch (e) {
						reject(e);
					}
				},
				(reason) => {
					if (!onrejected) reject(reason);
					else try {
						resolve(onrejected(reason));
					} catch (e) {
						reject(e);
					}
				}
			]);
			this._executeHandlers();
		});
	}
	/** @inheritdoc */
	catch(onrejected) {
		return this.then((val) => val, onrejected);
	}
	/** @inheritdoc */
	finally(onfinally) {
		return new SyncPromise((resolve, reject) => {
			let val;
			let isRejected;
			return this.then((value) => {
				isRejected = false;
				val = value;
				if (onfinally) onfinally();
			}, (reason) => {
				isRejected = true;
				val = reason;
				if (onfinally) onfinally();
			}).then(() => {
				if (isRejected) {
					reject(val);
					return;
				}
				resolve(val);
			});
		});
	}
	/** Excute the resolve/reject handlers. */
	_executeHandlers() {
		if (this._state === STATE_PENDING) return;
		const cachedHandlers = this._handlers.slice();
		this._handlers = [];
		cachedHandlers.forEach((handler) => {
			if (handler[0]) return;
			if (this._state === STATE_RESOLVED) handler[1](this._value);
			if (this._state === STATE_REJECTED) handler[2](this._value);
			handler[0] = true;
		});
	}
	/** Run the executor for the SyncPromise. */
	_runExecutor(executor) {
		const setResult = (state, value) => {
			if (this._state !== STATE_PENDING) return;
			if (isThenable(value)) {
				value.then(resolve, reject);
				return;
			}
			this._state = state;
			this._value = value;
			this._executeHandlers();
		};
		const resolve = (value) => {
			setResult(STATE_RESOLVED, value);
		};
		const reject = (reason) => {
			setResult(STATE_REJECTED, reason);
		};
		try {
			executor(resolve, reject);
		} catch (e) {
			reject(e);
		}
	}
};
//#endregion
//#region node_modules/@sentry/core/build/esm/eventProcessors.js
function notifyEventProcessors(processors, event, hint, index = 0) {
	try {
		const result = _notifyEventProcessors(event, hint, processors, index);
		return isThenable(result) ? result : resolvedSyncPromise(result);
	} catch (error) {
		return rejectedSyncPromise(error);
	}
}
function _notifyEventProcessors(event, hint, processors, index) {
	const processor = processors[index];
	if (!event || !processor) return event;
	const result = processor({ ...event }, hint);
	DEBUG_BUILD && result === null && debug.log(`Event processor "${processor.id || "?"}" dropped event`);
	if (isThenable(result)) return result.then((final) => _notifyEventProcessors(final, hint, processors, index + 1));
	return _notifyEventProcessors(result, hint, processors, index + 1);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/debug-ids.js
var parsedStackResults;
var lastSentryKeysCount;
var lastNativeKeysCount;
var cachedFilenameDebugIds;
function getFilenameToDebugIdMap(stackParser) {
	const sentryDebugIdMap = GLOBAL_OBJ._sentryDebugIds;
	const nativeDebugIdMap = GLOBAL_OBJ._debugIds;
	if (!sentryDebugIdMap && !nativeDebugIdMap) return {};
	const sentryDebugIdKeys = sentryDebugIdMap ? Object.keys(sentryDebugIdMap) : [];
	const nativeDebugIdKeys = nativeDebugIdMap ? Object.keys(nativeDebugIdMap) : [];
	if (cachedFilenameDebugIds && sentryDebugIdKeys.length === lastSentryKeysCount && nativeDebugIdKeys.length === lastNativeKeysCount) return cachedFilenameDebugIds;
	lastSentryKeysCount = sentryDebugIdKeys.length;
	lastNativeKeysCount = nativeDebugIdKeys.length;
	cachedFilenameDebugIds = {};
	if (!parsedStackResults) parsedStackResults = {};
	const processDebugIds = (debugIdKeys, debugIdMap) => {
		for (const key of debugIdKeys) {
			const debugId = debugIdMap[key];
			const result = parsedStackResults?.[key];
			if (result && cachedFilenameDebugIds && debugId) {
				cachedFilenameDebugIds[result[0]] = debugId;
				if (parsedStackResults) parsedStackResults[key] = [result[0], debugId];
			} else if (debugId) {
				const parsedStack = stackParser(key);
				for (let i = parsedStack.length - 1; i >= 0; i--) {
					const filename = parsedStack[i]?.filename;
					if (filename && cachedFilenameDebugIds && parsedStackResults) {
						cachedFilenameDebugIds[filename] = debugId;
						parsedStackResults[key] = [filename, debugId];
						break;
					}
				}
			}
		}
	};
	if (sentryDebugIdMap) processDebugIds(sentryDebugIdKeys, sentryDebugIdMap);
	if (nativeDebugIdMap) processDebugIds(nativeDebugIdKeys, nativeDebugIdMap);
	return cachedFilenameDebugIds;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/prepareEvent.js
function prepareEvent(options, event, hint, scope, client, isolationScope) {
	const { normalizeDepth = 3, normalizeMaxBreadth = 1e3 } = options;
	const prepared = {
		...event,
		event_id: event.event_id || hint.event_id || uuid4(),
		timestamp: event.timestamp || dateTimestampInSeconds()
	};
	const integrations = hint.integrations || options.integrations.map((i) => i.name);
	applyClientOptions(prepared, options);
	applyIntegrationsMetadata(prepared, integrations);
	if (client) client.emit("applyFrameMetadata", event);
	if (event.type === void 0) applyDebugIds(prepared, options.stackParser);
	const finalScope = getFinalScope(scope, hint.captureContext);
	if (hint.mechanism) addExceptionMechanismToCapturedException(prepared, hint.mechanism);
	const clientEventProcessors = client ? client.getEventProcessors() : [];
	const data = getCombinedScopeData(isolationScope, finalScope);
	const attachments = [...hint.attachments || [], ...data.attachments];
	if (attachments.length) hint.attachments = attachments;
	applyScopeDataToEvent(prepared, data);
	const span = getActiveSpan(finalScope);
	if (span) applySpanToEvent(prepared, span);
	const eventProcessors = [...clientEventProcessors, ...data.eventProcessors];
	return (hint.data && hint.data.__sentry__ === true ? resolvedSyncPromise(prepared) : notifyEventProcessors(eventProcessors, prepared, hint)).then((evt) => {
		if (evt) applyDebugMeta(evt);
		if (typeof normalizeDepth === "number" && normalizeDepth > 0) return normalizeEvent(evt, normalizeDepth, normalizeMaxBreadth);
		return evt;
	});
}
function applyClientOptions(event, options) {
	const { environment, release, dist, maxValueLength } = options;
	event.environment = event.environment || environment || "production";
	if (!event.release && release) event.release = release;
	if (!event.dist && dist) event.dist = dist;
	const request = event.request;
	if (request?.url && maxValueLength) request.url = truncate$1(request.url, maxValueLength);
	if (maxValueLength) event.exception?.values?.forEach((exception) => {
		if (exception.value) exception.value = truncate$1(exception.value, maxValueLength);
	});
}
function applyDebugIds(event, stackParser) {
	const filenameDebugIdMap = getFilenameToDebugIdMap(stackParser);
	event.exception?.values?.forEach((exception) => {
		exception.stacktrace?.frames?.forEach((frame) => {
			if (frame.filename) frame.debug_id = filenameDebugIdMap[frame.filename];
		});
	});
}
function applyDebugMeta(event) {
	const filenameDebugIdMap = {};
	event.exception?.values?.forEach((exception) => {
		exception.stacktrace?.frames?.forEach((frame) => {
			if (frame.debug_id) {
				if (frame.abs_path) filenameDebugIdMap[frame.abs_path] = frame.debug_id;
				else if (frame.filename) filenameDebugIdMap[frame.filename] = frame.debug_id;
				delete frame.debug_id;
			}
		});
	});
	if (Object.keys(filenameDebugIdMap).length === 0) return;
	event.debug_meta = event.debug_meta || {};
	event.debug_meta.images = event.debug_meta.images || [];
	const images = event.debug_meta.images;
	Object.entries(filenameDebugIdMap).forEach(([filename, debug_id]) => {
		images.push({
			type: "sourcemap",
			code_file: filename,
			debug_id
		});
	});
}
function applyIntegrationsMetadata(event, integrationNames) {
	if (integrationNames.length > 0) {
		event.sdk = event.sdk || {};
		event.sdk.integrations = [...event.sdk.integrations || [], ...integrationNames];
	}
}
function normalizeEvent(event, depth, maxBreadth) {
	if (!event) return null;
	const normalized = {
		...event,
		...event.breadcrumbs && { breadcrumbs: event.breadcrumbs.map((b) => ({
			...b,
			...b.data && { data: normalize(b.data, depth, maxBreadth) }
		})) },
		...event.user && { user: normalize(event.user, depth, maxBreadth) },
		...event.contexts && { contexts: normalize(event.contexts, depth, maxBreadth) },
		...event.extra && { extra: normalize(event.extra, depth, maxBreadth) }
	};
	if (event.contexts?.trace && normalized.contexts) {
		normalized.contexts.trace = event.contexts.trace;
		if (event.contexts.trace.data) normalized.contexts.trace.data = normalize(event.contexts.trace.data, depth, maxBreadth);
	}
	if (event.spans) normalized.spans = event.spans.map((span) => {
		return {
			...span,
			...span.data && { data: normalize(span.data, depth, maxBreadth) }
		};
	});
	if (event.contexts?.flags && normalized.contexts) normalized.contexts.flags = normalize(event.contexts.flags, 3, maxBreadth);
	return normalized;
}
function getFinalScope(scope, captureContext) {
	if (!captureContext) return scope;
	const finalScope = scope ? scope.clone() : new Scope();
	finalScope.update(captureContext);
	return finalScope;
}
function parseEventHintOrCaptureContext(hint) {
	if (!hint) return;
	if (hintIsScopeOrFunction(hint)) return { captureContext: hint };
	if (hintIsScopeContext(hint)) return { captureContext: hint };
	return hint;
}
function hintIsScopeOrFunction(hint) {
	return hint instanceof Scope || typeof hint === "function";
}
var captureContextKeys = [
	"user",
	"level",
	"extra",
	"contexts",
	"tags",
	"fingerprint",
	"propagationContext"
];
function hintIsScopeContext(hint) {
	return Object.keys(hint).some((key) => captureContextKeys.includes(key));
}
//#endregion
//#region node_modules/@sentry/core/build/esm/exports.js
function captureException(exception, hint) {
	return getCurrentScope().captureException(exception, parseEventHintOrCaptureContext(hint));
}
function captureMessage(message, captureContext) {
	const level = typeof captureContext === "string" ? captureContext : void 0;
	const hint = typeof captureContext !== "string" ? { captureContext } : void 0;
	return getCurrentScope().captureMessage(message, level, hint);
}
function setTag(key, value) {
	getIsolationScope().setTag(key, value);
}
async function flush(timeout) {
	const client = getClient();
	if (client) return client.flush(timeout);
	DEBUG_BUILD && debug.warn("Cannot flush events. No client defined.");
	return Promise.resolve(false);
}
function isEnabled() {
	const client = getClient();
	return client?.getOptions().enabled !== false && !!client?.getTransport();
}
function startSession(context) {
	const isolationScope = getIsolationScope();
	const { user } = getCombinedScopeData(isolationScope, getCurrentScope());
	const { userAgent } = GLOBAL_OBJ.navigator || {};
	const session = makeSession({
		user,
		...userAgent && { userAgent },
		...context
	});
	const currentSession = isolationScope.getSession();
	if (currentSession?.status === "ok") updateSession(currentSession, { status: "exited" });
	endSession();
	isolationScope.setSession(session);
	return session;
}
function endSession() {
	const isolationScope = getIsolationScope();
	const session = getCurrentScope().getSession() || isolationScope.getSession();
	if (session) closeSession(session);
	_sendSessionUpdate();
	isolationScope.setSession();
}
function _sendSessionUpdate() {
	const isolationScope = getIsolationScope();
	const client = getClient();
	const session = isolationScope.getSession();
	if (session && client) client.captureSession(session);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/asyncContext/tracing-channel-binding.js
function waitForTracingChannelBinding(callback, retries = 1) {
	if (getAsyncContextStrategy(getMainCarrier()).getTracingChannelBinding?.()) {
		callback();
		return;
	}
	if (!retries) return;
	safeUnref(setTimeout(() => {
		waitForTracingChannelBinding(callback, retries - 1);
	}, 1));
}
function getBaseApiEndpoint(dsn) {
	const protocol = dsn.protocol ? `${dsn.protocol}:` : "";
	const port = dsn.port ? `:${dsn.port}` : "";
	return `${protocol}//${dsn.host}${port}${dsn.path ? `/${dsn.path}` : ""}/api/`;
}
function _getIngestEndpoint(dsn) {
	return `${getBaseApiEndpoint(dsn)}${dsn.projectId}/envelope/`;
}
function _encodedAuth(dsn, sdkInfo) {
	const params = { sentry_version: "7" };
	if (dsn.publicKey) params.sentry_key = dsn.publicKey;
	if (sdkInfo) params.sentry_client = `${sdkInfo.name}/${sdkInfo.version}`;
	return new URLSearchParams(params).toString();
}
function getEnvelopeEndpointWithUrlEncodedAuth(dsn, tunnel, sdkInfo) {
	return tunnel ? tunnel : `${_getIngestEndpoint(dsn)}?${_encodedAuth(dsn, sdkInfo)}`;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/timestampSequence.js
var SEQUENCE_ATTR_KEY = "sentry.timestamp.sequence";
var _sequenceNumber = 0;
var _previousTimestampMs;
function getSequenceAttribute(timestampInSeconds) {
	const nowMs = Math.floor(timestampInSeconds * 1e3);
	if (_previousTimestampMs !== void 0 && nowMs !== _previousTimestampMs) _sequenceNumber = 0;
	const value = _sequenceNumber;
	_sequenceNumber++;
	_previousTimestampMs = nowMs;
	return {
		key: SEQUENCE_ATTR_KEY,
		value: {
			value,
			type: "integer"
		}
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/trace-info.js
function _getTraceInfoFromScope(client, scope) {
	if (!scope) return [void 0, void 0];
	return withScope(scope, () => {
		const span = getActiveSpan();
		const traceContext = span ? spanToTraceContext(span) : getTraceContextFromScope(scope);
		return [span ? getDynamicSamplingContextFromSpan(span) : getDynamicSamplingContextFromScope(client, scope), traceContext];
	});
}
//#endregion
//#region node_modules/@sentry/core/build/esm/logs/constants.js
var SEVERITY_TEXT_TO_SEVERITY_NUMBER = {
	trace: 1,
	debug: 5,
	info: 9,
	warn: 13,
	error: 17,
	fatal: 21
};
//#endregion
//#region node_modules/@sentry/core/build/esm/logs/envelope.js
function createLogContainerEnvelopeItem(items, inferUserData) {
	const inferSetting = inferUserData ? "auto" : "never";
	return [{
		type: "log",
		item_count: items.length,
		content_type: "application/vnd.sentry.items.log+json"
	}, {
		version: 2,
		...isBrowser() && { ingest_settings: {
			infer_ip: inferSetting,
			infer_user_agent: inferSetting
		} },
		items
	}];
}
function createLogEnvelope(logs, metadata, tunnel, dsn, inferUserData) {
	const headers = {};
	if (metadata?.sdk) headers.sdk = {
		name: metadata.sdk.name,
		version: metadata.sdk.version
	};
	if (!!tunnel && !!dsn) headers.dsn = dsnToString(dsn);
	return createEnvelope(headers, [createLogContainerEnvelopeItem(logs, inferUserData)]);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/logs/internal.js
var MAX_LOG_BUFFER_SIZE = 100;
function setLogAttribute(logAttributes, key, value, setEvenIfPresent = true) {
	if (value && (!logAttributes[key] || setEvenIfPresent)) logAttributes[key] = value;
}
function _INTERNAL_captureSerializedLog(client, serializedLog) {
	const bufferMap = _getBufferMap$1();
	const logBuffer = _INTERNAL_getLogBuffer(client);
	if (logBuffer === void 0) bufferMap.set(client, [serializedLog]);
	else if (logBuffer.length >= MAX_LOG_BUFFER_SIZE) {
		_INTERNAL_flushLogsBuffer(client, logBuffer);
		bufferMap.set(client, [serializedLog]);
	} else bufferMap.set(client, [...logBuffer, serializedLog]);
}
function _INTERNAL_captureLog(beforeLog, currentScope = getCurrentScope(), captureSerializedLog = _INTERNAL_captureSerializedLog) {
	const client = currentScope?.getClient() ?? getClient();
	if (!client) {
		DEBUG_BUILD && debug.warn("No client available to capture log.");
		return;
	}
	const { release, environment, beforeSendLog } = client.getOptions();
	const [, traceContext] = _getTraceInfoFromScope(client, currentScope);
	const processedLogAttributes = { ...beforeLog.attributes };
	const { user: { id, email, username }, attributes: scopeAttributes } = getCombinedScopeData(getIsolationScope(), currentScope);
	setLogAttribute(processedLogAttributes, "user.id", id, false);
	setLogAttribute(processedLogAttributes, "user.email", email, false);
	setLogAttribute(processedLogAttributes, "user.name", username, false);
	setLogAttribute(processedLogAttributes, "sentry.release", release);
	setLogAttribute(processedLogAttributes, "sentry.environment", environment);
	const { name, version } = client.getSdkMetadata()?.sdk ?? {};
	setLogAttribute(processedLogAttributes, "sentry.sdk.name", name);
	setLogAttribute(processedLogAttributes, "sentry.sdk.version", version);
	const replay = client.getIntegrationByName("Replay");
	const replayId = replay?.getReplayId(true);
	setLogAttribute(processedLogAttributes, "sentry.replay_id", replayId);
	if (replayId && replay?.getRecordingMode() === "buffer") setLogAttribute(processedLogAttributes, "sentry._internal.replay_is_buffering", true);
	const beforeLogMessage = beforeLog.message;
	if (isParameterizedString(beforeLogMessage)) {
		const { __sentry_template_string__, __sentry_template_values__ = [] } = beforeLogMessage;
		if (__sentry_template_values__?.length) processedLogAttributes["sentry.message.template"] = __sentry_template_string__;
		__sentry_template_values__.forEach((param, index) => {
			processedLogAttributes[`sentry.message.parameter.${index}`] = param;
		});
	}
	setLogAttribute(processedLogAttributes, "sentry.trace.parent_span_id", getActiveSpan(currentScope)?.spanContext().spanId);
	const processedLog = {
		...beforeLog,
		attributes: processedLogAttributes
	};
	client.emit("beforeCaptureLog", processedLog);
	const log = beforeSendLog ? consoleSandbox(() => beforeSendLog(processedLog)) : processedLog;
	if (!log) {
		client.recordDroppedEvent("before_send", "log_item", 1);
		DEBUG_BUILD && debug.warn("beforeSendLog returned null, log will not be captured.");
		return;
	}
	const { level, message, attributes: logAttributes = {}, severityNumber } = log;
	const timestamp = timestampInSeconds();
	const sequenceAttr = getSequenceAttribute(timestamp);
	captureSerializedLog(client, {
		timestamp,
		level,
		body: _removeLoneSurrogates(String(message)),
		trace_id: traceContext?.trace_id,
		severity_number: severityNumber ?? SEVERITY_TEXT_TO_SEVERITY_NUMBER[level],
		attributes: sanitizeLogAttributes({
			...serializeAttributes(scopeAttributes),
			...serializeAttributes(logAttributes, true),
			[sequenceAttr.key]: sequenceAttr.value
		})
	});
	client.emit("afterCaptureLog", log);
}
function _INTERNAL_flushLogsBuffer(client, maybeLogBuffer) {
	const logBuffer = maybeLogBuffer ?? _INTERNAL_getLogBuffer(client) ?? [];
	if (logBuffer.length === 0) return;
	const clientOptions = client.getOptions();
	const envelope = createLogEnvelope(logBuffer, clientOptions._metadata, clientOptions.tunnel, client.getDsn(), client.getDataCollectionOptions().userInfo);
	_getBufferMap$1().set(client, []);
	client.emit("flushLogs");
	client.sendEnvelope(envelope);
}
function _INTERNAL_getLogBuffer(client) {
	return _getBufferMap$1().get(client);
}
function _getBufferMap$1() {
	return getGlobalSingleton("clientToLogBufferMap", () => /* @__PURE__ */ new WeakMap());
}
function sanitizeLogAttributes(attributes) {
	const sanitized = {};
	for (const [key, attr] of Object.entries(attributes)) {
		const sanitizedKey = _removeLoneSurrogates(key);
		if (attr.type === "string") sanitized[sanitizedKey] = {
			...attr,
			value: _removeLoneSurrogates(attr.value)
		};
		else sanitized[sanitizedKey] = attr;
	}
	return sanitized;
}
function _removeLoneSurrogates(str) {
	const strObj = Object(str);
	const isWellFormed = strObj["isWellFormed"];
	const toWellFormed = strObj["toWellFormed"];
	if (typeof isWellFormed === "function" && typeof toWellFormed === "function") return isWellFormed.call(str) ? str : toWellFormed.call(str);
	return str;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/metrics/envelope.js
function createMetricContainerEnvelopeItem(items, inferUserData) {
	const inferSetting = inferUserData ? "auto" : "never";
	return [{
		type: "trace_metric",
		item_count: items.length,
		content_type: "application/vnd.sentry.items.trace-metric+json"
	}, {
		version: 2,
		...isBrowser() && { ingest_settings: {
			infer_ip: inferSetting,
			infer_user_agent: inferSetting
		} },
		items
	}];
}
function createMetricEnvelope(metrics, metadata, tunnel, dsn, inferUserData) {
	const headers = {};
	if (metadata?.sdk) headers.sdk = {
		name: metadata.sdk.name,
		version: metadata.sdk.version
	};
	if (!!tunnel && !!dsn) headers.dsn = dsnToString(dsn);
	return createEnvelope(headers, [createMetricContainerEnvelopeItem(metrics, inferUserData)]);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/metrics/internal.js
function _INTERNAL_flushMetricsBuffer(client, maybeMetricBuffer) {
	const metricBuffer = maybeMetricBuffer ?? _INTERNAL_getMetricBuffer(client) ?? [];
	if (metricBuffer.length === 0) return;
	const clientOptions = client.getOptions();
	const envelope = createMetricEnvelope(metricBuffer, clientOptions._metadata, clientOptions.tunnel, client.getDsn(), client.getDataCollectionOptions().userInfo);
	_getBufferMap().set(client, []);
	client.emit("flushMetrics");
	client.sendEnvelope(envelope);
}
function _INTERNAL_getMetricBuffer(client) {
	return _getBufferMap().get(client);
}
function _getBufferMap() {
	return getGlobalSingleton("clientToMetricBufferMap", () => /* @__PURE__ */ new WeakMap());
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/spans/extractGenAiSpans.js
function extractGenAiSpansFromEvent(event, client) {
	if (event.type !== "transaction" || !event.spans?.length || !event.sdkProcessingMetadata?.hasGenAiSpans || hasSpanStreamingEnabled(client)) return;
	const genAiSpans = [];
	const remainingSpans = [];
	for (const span of event.spans) if (span.op?.startsWith("gen_ai.")) genAiSpans.push(spanJsonToSerializedStreamedSpan(span));
	else remainingSpans.push(span);
	if (genAiSpans.length === 0) return;
	event.spans = remainingSpans;
	return createSpanContainerItem(genAiSpans, client);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/promisebuffer.js
var SENTRY_BUFFER_FULL_ERROR = /* @__PURE__ */ Symbol.for("SentryBufferFullError");
function makePromiseBuffer(limit = 100) {
	const buffer = /* @__PURE__ */ new Set();
	function isReady() {
		return buffer.size < limit;
	}
	function remove(task) {
		buffer.delete(task);
	}
	function add(taskProducer) {
		if (!isReady()) return rejectedSyncPromise(SENTRY_BUFFER_FULL_ERROR);
		const task = taskProducer();
		buffer.add(task);
		task.then(() => remove(task), () => remove(task));
		return task;
	}
	function drain(timeout) {
		if (!buffer.size) return resolvedSyncPromise(true);
		const drainPromise = Promise.allSettled(Array.from(buffer)).then(() => true);
		if (!timeout) return drainPromise;
		const promises = [drainPromise, new Promise((resolve) => safeUnref(setTimeout(() => resolve(false), timeout)))];
		return Promise.race(promises);
	}
	return {
		get $() {
			return Array.from(buffer);
		},
		add,
		drain
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/ratelimit.js
var DEFAULT_RETRY_AFTER = 6e4;
function parseRetryAfterHeader(header, now = safeDateNow()) {
	const headerDelay = parseInt(`${header}`, 10);
	if (!isNaN(headerDelay)) return headerDelay * 1e3;
	const headerDate = Date.parse(`${header}`);
	if (!isNaN(headerDate)) return headerDate - now;
	return DEFAULT_RETRY_AFTER;
}
function disabledUntil(limits, dataCategory) {
	return limits[dataCategory] || limits.all || 0;
}
function isRateLimited(limits, dataCategory, now = safeDateNow()) {
	return disabledUntil(limits, dataCategory) > now;
}
function updateRateLimits(limits, { statusCode, headers }, now = safeDateNow()) {
	const updatedRateLimits = { ...limits };
	const rateLimitHeader = headers?.["x-sentry-rate-limits"];
	const retryAfterHeader = headers?.["retry-after"];
	if (rateLimitHeader) for (const limit of rateLimitHeader.trim().split(",")) {
		const [retryAfter, categories, , , namespaces] = limit.split(":", 5);
		const headerDelay = parseInt(retryAfter, 10);
		const delay = (!isNaN(headerDelay) ? headerDelay : 60) * 1e3;
		if (!categories) updatedRateLimits.all = now + delay;
		else for (const category of categories.split(";")) if (category === "metric_bucket") {
			if (!namespaces || namespaces.split(";").includes("custom")) updatedRateLimits[category] = now + delay;
		} else updatedRateLimits[category] = now + delay;
	}
	else if (retryAfterHeader) updatedRateLimits.all = now + parseRetryAfterHeader(retryAfterHeader, now);
	else if (statusCode === 429) updatedRateLimits.all = now + 6e4;
	return updatedRateLimits;
}
function createTransport(options, makeRequest, buffer = makePromiseBuffer(options.bufferSize || 64)) {
	let rateLimits = {};
	const flush = (timeout) => buffer.drain(timeout);
	function send(envelope) {
		const filteredEnvelopeItems = [];
		forEachEnvelopeItem(envelope, (item, type) => {
			const dataCategory = envelopeItemTypeToDataCategory(type);
			if (isRateLimited(rateLimits, dataCategory)) options.recordDroppedEvent("ratelimit_backoff", dataCategory);
			else filteredEnvelopeItems.push(item);
		});
		if (filteredEnvelopeItems.length === 0) return Promise.resolve({});
		const filteredEnvelope = createEnvelope(envelope[0], filteredEnvelopeItems);
		const recordEnvelopeLoss = (reason) => {
			if (envelopeContainsItemType(filteredEnvelope, ["client_report"])) {
				DEBUG_BUILD && debug.warn(`Dropping client report. Will not send outcomes (reason: ${reason}).`);
				return;
			}
			forEachEnvelopeItem(filteredEnvelope, (item, type) => {
				options.recordDroppedEvent(reason, envelopeItemTypeToDataCategory(type));
			});
		};
		const requestTask = () => makeRequest({ body: serializeEnvelope(filteredEnvelope) }).then((response) => {
			if (response.statusCode === 413) {
				DEBUG_BUILD && debug.error("Sentry responded with status code 413. Envelope was discarded due to exceeding size limits.");
				recordEnvelopeLoss("send_error");
				return response;
			}
			if (DEBUG_BUILD && response.statusCode !== void 0 && (response.statusCode < 200 || response.statusCode >= 300)) debug.warn(`Sentry responded with status code ${response.statusCode} to sent event.`);
			rateLimits = updateRateLimits(rateLimits, response);
			return response;
		}, (error) => {
			recordEnvelopeLoss("network_error");
			DEBUG_BUILD && debug.error("Encountered error running transport request:", error);
			throw error;
		});
		return buffer.add(requestTask).then((result) => result, (error) => {
			if (error === SENTRY_BUFFER_FULL_ERROR) {
				DEBUG_BUILD && debug.error("Skipped sending event because buffer is full.");
				recordEnvelopeLoss("queue_overflow");
				return Promise.resolve({});
			} else throw error;
		});
	}
	return {
		send,
		flush
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/clientreport.js
function createClientReportEnvelope(discarded_events, dsn, timestamp) {
	const clientReportItem = [{ type: "client_report" }, {
		timestamp: timestamp || dateTimestampInSeconds(),
		discarded_events
	}];
	return createEnvelope(dsn ? { dsn } : {}, [clientReportItem]);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/eventUtils.js
function getPossibleEventMessages(event) {
	const possibleMessages = [];
	if (event.message) possibleMessages.push(event.message);
	try {
		const lastException = event.exception.values[event.exception.values.length - 1];
		if (lastException?.value) {
			possibleMessages.push(lastException.value);
			if (lastException.type) possibleMessages.push(`${lastException.type}: ${lastException.value}`);
		}
	} catch {}
	return possibleMessages;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/transactionEvent.js
function convertTransactionEventToSpanJson(event) {
	const { trace_id, parent_span_id, span_id, status, origin, data, op } = event.contexts?.trace ?? {};
	return {
		data: data ?? {},
		description: event.transaction,
		op,
		parent_span_id,
		span_id: span_id ?? "",
		start_timestamp: event.start_timestamp ?? 0,
		status: status ?? "ok",
		timestamp: event.timestamp,
		trace_id: trace_id ?? "",
		origin,
		profile_id: data?.[SEMANTIC_ATTRIBUTE_PROFILE_ID],
		exclusive_time: data?.[SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME],
		measurements: event.measurements,
		is_segment: true
	};
}
function convertSpanJsonToTransactionEvent(span) {
	return {
		type: "transaction",
		timestamp: span.timestamp,
		start_timestamp: span.start_timestamp,
		transaction: span.description,
		contexts: { trace: {
			trace_id: span.trace_id,
			span_id: span.span_id,
			parent_span_id: span.parent_span_id,
			op: span.op,
			status: span.status,
			origin: span.origin,
			data: {
				...span.data,
				...span.profile_id && { ["sentry.profile_id"]: span.profile_id },
				...span.exclusive_time && { ["sentry.exclusive_time"]: span.exclusive_time }
			}
		} },
		measurements: span.measurements
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/warnAboutIgnoredTransactionOptions.js
function maybeWarnAboutIgnoredTransactionOptions(options) {
	if (options.traceLifecycle !== "stream" || !(options.beforeSendTransaction || options.ignoreTransactions?.length)) return;
	consoleSandbox(() => {
		console.warn("[Sentry] `beforeSendTransaction` and `ignoreTransactions` are ignored with `traceLifecycle: 'stream'` (enabled by default). Use `beforeSendSpan` and `ignoreSpans` instead, or set `traceLifecycle: 'static'`.");
	});
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/data-collection/resolveDataCollectionOptions.js
var DEFAULTS = {
	userInfo: true,
	cookies: true,
	httpHeaders: {
		request: true,
		response: true
	},
	httpBodies: [
		"incomingRequest",
		"outgoingRequest",
		"incomingResponse",
		"outgoingResponse"
	],
	urlQueryParams: true,
	graphQL: {
		document: true,
		variables: true
	},
	genAI: {
		inputs: true,
		outputs: true
	},
	databaseQueryData: true,
	stackFrameVariables: true,
	frameContextLines: 5
};
function resolveDataCollectionOptions(options) {
	const dc = options.dataCollection ?? {};
	return {
		userInfo: dc.userInfo ?? DEFAULTS.userInfo,
		cookies: dc.cookies ?? DEFAULTS.cookies,
		httpHeaders: {
			request: dc.httpHeaders?.request ?? DEFAULTS.httpHeaders.request,
			response: dc.httpHeaders?.response ?? DEFAULTS.httpHeaders.response
		},
		httpBodies: dc.httpBodies ?? DEFAULTS.httpBodies,
		urlQueryParams: dc.urlQueryParams ?? DEFAULTS.urlQueryParams,
		graphQL: {
			document: dc.graphQL?.document ?? DEFAULTS.graphQL.document,
			variables: dc.graphQL?.variables ?? DEFAULTS.graphQL.variables
		},
		genAI: {
			inputs: dc.genAI?.inputs ?? DEFAULTS.genAI.inputs,
			outputs: dc.genAI?.outputs ?? DEFAULTS.genAI.outputs
		},
		databaseQueryData: dc.databaseQueryData ?? DEFAULTS.databaseQueryData,
		stackFrameVariables: dc.stackFrameVariables ?? DEFAULTS.stackFrameVariables,
		frameContextLines: dc.frameContextLines ?? DEFAULTS.frameContextLines
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/client.js
var ALREADY_SEEN_ERROR = "Not capturing exception because it's already been captured.";
var MISSING_RELEASE_FOR_SESSION_ERROR = "Discarded session because of missing or non-string release";
var INTERNAL_ERROR_SYMBOL = /* @__PURE__ */ Symbol.for("SentryInternalError");
var DO_NOT_SEND_EVENT_SYMBOL = /* @__PURE__ */ Symbol.for("SentryDoNotSendEventError");
var DEFAULT_FLUSH_INTERVAL = 5e3;
function _makeInternalError(message) {
	return {
		message,
		[INTERNAL_ERROR_SYMBOL]: true
	};
}
function _makeDoNotSendEventError(message) {
	return {
		message,
		[DO_NOT_SEND_EVENT_SYMBOL]: true
	};
}
function _isInternalError(error) {
	return isObjectLike(error) && INTERNAL_ERROR_SYMBOL in error;
}
function _isDoNotSendEventError(error) {
	return isObjectLike(error) && DO_NOT_SEND_EVENT_SYMBOL in error;
}
function setupWeightBasedFlushing(client, afterCaptureHook, flushHook, estimateSizeFn, flushFn) {
	let weight = 0;
	let flushTimeout;
	let isTimerActive = false;
	client.on(flushHook, () => {
		weight = 0;
		clearTimeout(flushTimeout);
		isTimerActive = false;
	});
	client.on(afterCaptureHook, (item) => {
		weight += estimateSizeFn(item);
		if (weight >= 8e5) flushFn(client);
		else if (!isTimerActive) {
			const flushInterval = client.getOptions()._flushInterval ?? DEFAULT_FLUSH_INTERVAL;
			if (flushInterval > 0) {
				isTimerActive = true;
				flushTimeout = safeUnref(setTimeout(() => {
					flushFn(client);
				}, flushInterval));
			}
		}
	});
	client.on("flush", () => {
		flushFn(client);
	});
}
var Client = class {
	/**
	* Initializes this client instance.
	*
	* @param options Options for the client.
	*/
	constructor(options) {
		this._options = {
			attachStacktrace: true,
			...options,
			traceLifecycle: options.traceLifecycle === "static" ? "static" : "stream"
		};
		this._integrations = {};
		this._numProcessing = 0;
		this._outcomes = {};
		this._hooks = {};
		this._eventProcessors = [];
		this._promiseBuffer = makePromiseBuffer(options.transportOptions?.bufferSize ?? 64);
		this._dataCollection = resolveDataCollectionOptions(options);
		this._unhandledSessionStatus = "crashed";
		if (options.dsn) this._dsn = makeDsn(options.dsn);
		else DEBUG_BUILD && debug.warn("No DSN provided, client will not send events.");
		const { beforeSendSpan, traceLifecycle } = this._options;
		if (DEBUG_BUILD && beforeSendSpan && isStaticBeforeSendSpanCallback(beforeSendSpan) !== (traceLifecycle === "static")) consoleSandbox(() => {
			console.warn(`Ignoring \`beforeSendSpan\`: ${traceLifecycle === "static" ? "wrap it with" : "remove"} \`Sentry.withStaticSpan\` to use it with \`traceLifecycle: "${traceLifecycle}"\`.`);
		});
		if (this._dsn) {
			const url = getEnvelopeEndpointWithUrlEncodedAuth(this._dsn, options.tunnel, options._metadata ? options._metadata.sdk : void 0);
			this._transport = options.transport({
				tunnel: this._options.tunnel,
				recordDroppedEvent: this.recordDroppedEvent.bind(this),
				...options.transportOptions,
				url
			});
		}
		setupWeightBasedFlushing(this, "afterCaptureLog", "flushLogs", estimateLogSizeInBytes, _INTERNAL_flushLogsBuffer);
		setupWeightBasedFlushing(this, "afterCaptureMetric", "flushMetrics", estimateMetricSizeInBytes, _INTERNAL_flushMetricsBuffer);
	}
	/**
	* Captures an exception event and sends it to Sentry.
	*
	* Unlike `captureException` exported from every SDK, this method requires that you pass it the current scope.
	*/
	captureException(exception, hint, scope) {
		const eventId = uuid4();
		if (checkOrSetAlreadyCaught(exception)) {
			DEBUG_BUILD && debug.log(ALREADY_SEEN_ERROR);
			return eventId;
		}
		const hintWithEventId = {
			event_id: eventId,
			...hint
		};
		this._process(() => this.eventFromException(exception, hintWithEventId).then((event) => this._captureEvent(event, hintWithEventId, scope)).then((res) => res), "error");
		return hintWithEventId.event_id;
	}
	/**
	* Captures a message event and sends it to Sentry.
	*
	* Unlike `captureMessage` exported from every SDK, this method requires that you pass it the current scope.
	*/
	captureMessage(message, level, hint, currentScope) {
		const hintWithEventId = {
			event_id: uuid4(),
			...hint
		};
		const eventMessage = isParameterizedString(message) ? message : String(message);
		const isMessage = isPrimitive(message);
		const promisedEvent = isMessage ? this.eventFromMessage(eventMessage, level, hintWithEventId) : this.eventFromException(message, hintWithEventId);
		this._process(() => promisedEvent.then((event) => this._captureEvent(event, hintWithEventId, currentScope)), isMessage ? "unknown" : "error");
		return hintWithEventId.event_id;
	}
	/**
	* Captures a manually created event and sends it to Sentry.
	*
	* Unlike `captureEvent` exported from every SDK, this method requires that you pass it the current scope.
	*/
	captureEvent(event, hint, currentScope) {
		const eventId = uuid4();
		if (hint?.originalException && checkOrSetAlreadyCaught(hint.originalException)) {
			DEBUG_BUILD && debug.log(ALREADY_SEEN_ERROR);
			return eventId;
		}
		const hintWithEventId = {
			event_id: eventId,
			...hint
		};
		const sdkProcessingMetadata = event.sdkProcessingMetadata || {};
		const capturedSpanScope = sdkProcessingMetadata.capturedSpanScope;
		const capturedSpanIsolationScope = sdkProcessingMetadata.capturedSpanIsolationScope;
		const dataCategory = getDataCategoryByType(event.type);
		this._process(() => this._captureEvent(event, hintWithEventId, capturedSpanScope || currentScope, capturedSpanIsolationScope), dataCategory);
		return hintWithEventId.event_id;
	}
	/**
	* Captures a session.
	*/
	captureSession(session) {
		this.sendSession(session);
		updateSession(session, { init: false });
	}
	/**
	* Get the current Dsn.
	*/
	getDsn() {
		return this._dsn;
	}
	/**
	* Get the current options.
	*/
	getOptions() {
		return this._options;
	}
	/**
	* Get the resolved data collection configuration.
	*/
	getDataCollectionOptions() {
		return this._dataCollection;
	}
	/**
	* Get the SDK metadata.
	* @see SdkMetadata
	*/
	getSdkMetadata() {
		return this._options._metadata;
	}
	/**
	* Returns the transport that is used by the client.
	* Please note that the transport gets lazy initialized so it will only be there once the first event has been sent.
	*/
	getTransport() {
		return this._transport;
	}
	/**
	* Wait for all events to be sent or the timeout to expire, whichever comes first.
	*
	* @param timeout Maximum time in ms the client should wait for events to be flushed. Omitting this parameter will
	*   cause the client to wait until all events are sent before resolving the promise.
	* @returns A promise that will resolve with `true` if all events are sent before the timeout, or `false` if there are
	* still events in the queue when the timeout is reached.
	*/
	async flush(timeout) {
		const transport = this._transport;
		this.emit("flush");
		if (!transport) return true;
		const clientFinished = await this._isClientDoneProcessing(timeout);
		const transportFlushed = await transport.flush(timeout);
		return clientFinished && transportFlushed;
	}
	/**
	* Flush the event queue and set the client to `enabled = false`. See {@link Client.flush}.
	*
	* @param {number} timeout Maximum time in ms the client should wait before shutting down. Omitting this parameter will cause
	*   the client to wait until all events are sent before disabling itself.
	* @returns {Promise<boolean>} A promise which resolves to `true` if the flush completes successfully before the timeout, or `false` if
	* it doesn't.
	*/
	async close(timeout) {
		const result = await this.flush(timeout);
		this.getOptions().enabled = false;
		this.emit("close");
		return result;
	}
	/**
	* Get all installed event processors.
	*/
	getEventProcessors() {
		return this._eventProcessors;
	}
	/**
	* Adds an event processor that applies to any event processed by this client.
	*/
	addEventProcessor(eventProcessor) {
		this._eventProcessors.push(eventProcessor);
	}
	/**
	* Initialize this client.
	* Call this after the client was set on a scope.
	*/
	init() {
		if (this._isEnabled() || this._options.integrations.some(({ name }) => name.startsWith("Spotlight"))) {
			this._setupIntegrations();
			maybeWarnAboutIgnoredTransactionOptions(this._options);
		}
	}
	/**
	* Gets an installed integration by its name.
	*
	* @returns {Integration|undefined} The installed integration or `undefined` if no integration with that `name` was installed.
	*/
	getIntegrationByName(integrationName) {
		return this._integrations[integrationName];
	}
	/**
	* Returns the names of all installed integrations.
	*/
	getIntegrationNames() {
		return Object.keys(this._integrations);
	}
	/**
	* Add an integration to the client.
	* This can be used to e.g. lazy load integrations.
	* In most cases, this should not be necessary,
	* and you're better off just passing the integrations via `integrations: []` at initialization time.
	* However, if you find the need to conditionally load & add an integration, you can use `addIntegration` to do so.
	*/
	addIntegration(integration) {
		const isAlreadyInstalled = this._integrations[integration.name];
		if (!isAlreadyInstalled && integration.beforeSetup) integration.beforeSetup(this);
		setupIntegration(this, integration, this._integrations);
		if (!isAlreadyInstalled) afterSetupIntegrations(this, [integration]);
	}
	/**
	* Send a fully prepared event to Sentry.
	*/
	sendEvent(event, hint = {}) {
		this.emit("beforeSendEvent", event, hint);
		const genAiSpanItem = extractGenAiSpansFromEvent(event, this);
		let env = createEventEnvelope(event, this._dsn, this._options._metadata, this._options.tunnel);
		for (const attachment of hint.attachments || []) env = addItemToEnvelope(env, createAttachmentEnvelopeItem(attachment));
		if (genAiSpanItem) env = addItemToEnvelope(env, genAiSpanItem);
		this.sendEnvelope(env).then((sendResponse) => this.emit("afterSendEvent", event, sendResponse));
	}
	/**
	* Send a session or session aggregrates to Sentry.
	*/
	sendSession(session) {
		const { release: clientReleaseOption, environment: clientEnvironmentOption = DEFAULT_ENVIRONMENT } = this._options;
		if ("aggregates" in session) {
			const sessionAttrs = session.attrs || {};
			if (!sessionAttrs.release && !clientReleaseOption) {
				DEBUG_BUILD && debug.warn(MISSING_RELEASE_FOR_SESSION_ERROR);
				return;
			}
			sessionAttrs.release = sessionAttrs.release || clientReleaseOption;
			sessionAttrs.environment = sessionAttrs.environment || clientEnvironmentOption;
			session.attrs = sessionAttrs;
		} else {
			if (!session.release && !clientReleaseOption) {
				DEBUG_BUILD && debug.warn(MISSING_RELEASE_FOR_SESSION_ERROR);
				return;
			}
			session.release = session.release || clientReleaseOption;
			session.environment = session.environment || clientEnvironmentOption;
		}
		this.emit("beforeSendSession", session);
		const env = createSessionEnvelope(session, this._dsn, this._options._metadata, this._options.tunnel);
		this.sendEnvelope(env);
	}
	/**
	* Record on the client that an event got dropped (ie, an event that will not be sent to Sentry).
	*/
	recordDroppedEvent(reason, category, count = 1) {
		if (this._options.sendClientReports) {
			const key = `${reason}:${category}`;
			DEBUG_BUILD && debug.log(`Recording outcome: "${key}"${count > 1 ? ` (${count} times)` : ""}`);
			this._outcomes[key] = (this._outcomes[key] || 0) + count;
		}
	}
	/**
	* Register a hook on this client.
	*/
	on(hook, callback) {
		const hookCallbacks = this._hooks[hook] = this._hooks[hook] || /* @__PURE__ */ new Set();
		const uniqueCallback = (...args) => callback(...args);
		hookCallbacks.add(uniqueCallback);
		return () => {
			hookCallbacks.delete(uniqueCallback);
		};
	}
	/**
	* Emit a hook that was previously registered via `on()`.
	*/
	emit(hook, ...rest) {
		const callbacks = this._hooks[hook];
		if (callbacks) callbacks.forEach((callback) => callback(...rest));
	}
	/**
	* Send an envelope to Sentry.
	*/
	async sendEnvelope(envelope) {
		this.emit("beforeEnvelope", envelope);
		if (this._isEnabled() && this._transport) try {
			const result = await this._transport.send(envelope);
			this.emit("afterEnvelope", envelope);
			return result;
		} catch (reason) {
			DEBUG_BUILD && debug.error("Error while sending envelope:", reason);
			return {};
		}
		DEBUG_BUILD && debug.error("Transport disabled");
		return {};
	}
	/**
	* Register a cleanup function to be called when the client is disposed.
	* This is useful for integrations that need to clean up global state.
	*
	* NOTE: This is a no-op in the base `Client` class. Subclasses like `ServerRuntimeClient`
	* override this method to actually register and execute cleanup callbacks.
	*/
	registerCleanup(callback) {}
	/**
	* Disposes of the client and releases all resources.
	*
	* Subclasses should override this method to clean up their own resources, including invoking
	* any callbacks registered via {@link Client.registerCleanup}. The base implementation is a
	* no-op and does NOT execute registered cleanup callbacks.
	*
	* After calling dispose(), the client should not be used anymore.
	*/
	dispose() {}
	/** Setup integrations for this client. */
	_setupIntegrations() {
		const { integrations } = this._options;
		this._integrations = setupIntegrations(this, integrations);
		afterSetupIntegrations(this, integrations);
	}
	/** Updates existing session based on the provided event */
	_updateSessionFromEvent(session, event) {
		let unhandled = event.level === "fatal";
		let errored = false;
		const exceptions = event.exception?.values;
		if (exceptions) {
			errored = true;
			unhandled = false;
			for (const ex of exceptions) if (ex.mechanism?.handled === false) {
				unhandled = true;
				break;
			}
		}
		const sessionNonTerminal = session.status === "ok";
		if (sessionNonTerminal && session.errors === 0 || sessionNonTerminal && unhandled) {
			updateSession(session, {
				...unhandled && { status: this._unhandledSessionStatus },
				errors: session.errors || Number(errored || unhandled)
			});
			this.captureSession(session);
		}
	}
	/**
	* Determine if the client is finished processing. Returns a promise because it will wait `timeout` ms before saying
	* "no" (resolving to `false`) in order to give the client a chance to potentially finish first.
	*
	* @param timeout The time, in ms, after which to resolve to `false` if the client is still busy. Passing `0` (or not
	* passing anything) will make the promise wait as long as it takes for processing to finish before resolving to
	* `true`.
	* @returns A promise which will resolve to `true` if processing is already done or finishes before the timeout, and
	* `false` otherwise
	*/
	async _isClientDoneProcessing(timeout) {
		let ticked = 0;
		while (!timeout || ticked < timeout) {
			await new Promise((resolve) => setTimeout(resolve, 1));
			if (!this._numProcessing) return true;
			ticked++;
		}
		return false;
	}
	/** Determines whether this SDK is enabled and a transport is present. */
	_isEnabled() {
		return this.getOptions().enabled !== false && this._transport !== void 0;
	}
	/**
	* Adds common information to events.
	*
	* The information includes release and environment from `options`,
	* breadcrumbs and context (extra, tags and user) from the scope.
	*
	* Information that is already present in the event is never overwritten. For
	* nested objects, such as the context, keys are merged.
	*
	* @param event The original event.
	* @param hint May contain additional information about the original exception.
	* @param currentScope A scope containing event metadata.
	* @returns A new event with more information.
	*/
	_prepareEvent(event, hint, currentScope, isolationScope) {
		const options = this.getOptions();
		const integrations = this.getIntegrationNames();
		if (!hint.integrations && integrations.length) hint.integrations = integrations;
		this.emit("preprocessEvent", event, hint);
		if (!event.type) isolationScope.setLastEventId(event.event_id || hint.event_id);
		return prepareEvent(options, event, hint, currentScope, this, isolationScope).then((evt) => {
			if (evt === null) return evt;
			this.emit("postprocessEvent", evt, hint);
			evt.contexts = {
				trace: {
					...evt.contexts?.trace,
					...getTraceContextFromScope(currentScope)
				},
				...evt.contexts
			};
			evt.sdkProcessingMetadata = {
				dynamicSamplingContext: getDynamicSamplingContextFromScope(this, currentScope),
				...evt.sdkProcessingMetadata
			};
			return evt;
		});
	}
	/**
	* Processes the event and logs an error in case of rejection
	* @param event
	* @param hint
	* @param scope
	*/
	_captureEvent(event, hint = {}, currentScope = getCurrentScope(), isolationScope = getIsolationScope()) {
		if (DEBUG_BUILD && isErrorEvent(event)) debug.log(`Captured error event \`${getPossibleEventMessages(event)[0] || "<unknown>"}\``);
		return this._processEvent(event, hint, currentScope, isolationScope).then((finalEvent) => {
			return finalEvent.event_id;
		}, (reason) => {
			if (DEBUG_BUILD) {
				if (_isDoNotSendEventError(reason)) debug.log(reason.message);
				else if (_isInternalError(reason)) debug.warn(reason.message);
				else debug.warn(reason);
			}
		});
	}
	/**
	* Processes an event (either error or message) and sends it to Sentry.
	*
	* This also adds breadcrumbs and context information to the event. However,
	* platform specific meta data (such as the User's IP address) must be added
	* by the SDK implementor.
	*
	*
	* @param event The event to send to Sentry.
	* @param hint May contain additional information about the original exception.
	* @param currentScope A scope containing event metadata.
	* @returns A SyncPromise that resolves with the event or rejects in case event was/will not be send.
	*/
	_processEvent(event, hint, currentScope, isolationScope) {
		const options = this.getOptions();
		const { sampleRate } = options;
		const isTransaction = isTransactionEvent(event);
		const isError = isErrorEvent(event);
		const beforeSendLabel = `before send for type \`${event.type || "error"}\``;
		const parsedSampleRate = typeof sampleRate === "undefined" ? void 0 : parseSampleRate(sampleRate);
		const dataCategory = getDataCategoryByType(event.type);
		return this._prepareEvent(event, hint, currentScope, isolationScope).then((prepared) => {
			if (prepared === null) {
				this.recordDroppedEvent("event_processor", dataCategory);
				throw _makeDoNotSendEventError("An event processor returned `null`, will not send event.");
			}
			if (hint.data?.__sentry__ === true) return prepared;
			return _validateBeforeSendResult(processBeforeSend(this, options, prepared, hint), beforeSendLabel);
		}).then((processedEvent) => {
			if (processedEvent === null) {
				this.recordDroppedEvent("before_send", dataCategory);
				if (isTransaction) {
					const spanCount = 1 + (event.spans || []).length;
					this.recordDroppedEvent("before_send", "span", spanCount);
				}
				throw _makeDoNotSendEventError(`${beforeSendLabel} returned \`null\`, will not send event.`);
			}
			const session = currentScope.getSession() || isolationScope.getSession();
			if (isError && session) this._updateSessionFromEvent(session, processedEvent);
			if (isError && typeof parsedSampleRate === "number" && safeMathRandom() > parsedSampleRate) {
				this.recordDroppedEvent("sample_rate", "error");
				throw _makeDoNotSendEventError(`Discarding event because it's not included in the random sample (sampling rate = ${sampleRate})`);
			}
			if (isTransaction) {
				const droppedSpanCount = (processedEvent.sdkProcessingMetadata?.spanCountBeforeProcessing || 0) - (processedEvent.spans ? processedEvent.spans.length : 0);
				if (droppedSpanCount > 0) this.recordDroppedEvent("before_send", "span", droppedSpanCount);
			}
			const transactionInfo = processedEvent.transaction_info;
			if (isTransaction && transactionInfo && processedEvent.transaction !== event.transaction) {
				const source = "custom";
				processedEvent.transaction_info = {
					...transactionInfo,
					source
				};
			}
			this.sendEvent(processedEvent, hint);
			return processedEvent;
		}).then(null, (reason) => {
			if (_isDoNotSendEventError(reason) || _isInternalError(reason)) throw reason;
			this.captureException(reason, {
				mechanism: {
					handled: false,
					type: "internal"
				},
				data: { __sentry__: true },
				originalException: reason
			});
			throw _makeInternalError(`Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.
Reason: ${reason}`);
		});
	}
	/**
	* Occupies the client with processing and event
	*/
	_process(taskProducer, dataCategory) {
		this._numProcessing++;
		this._promiseBuffer.add(taskProducer).then((value) => {
			this._numProcessing--;
			return value;
		}, (reason) => {
			this._numProcessing--;
			if (reason === SENTRY_BUFFER_FULL_ERROR) this.recordDroppedEvent("queue_overflow", dataCategory);
			return reason;
		});
	}
	/**
	* Clears outcomes on this client and returns them.
	*/
	_clearOutcomes() {
		const outcomes = this._outcomes;
		this._outcomes = {};
		return Object.entries(outcomes).map(([key, quantity]) => {
			const [reason, category] = key.split(":");
			return {
				reason,
				category,
				quantity
			};
		});
	}
	/**
	* Sends client reports as an envelope.
	*/
	_flushOutcomes() {
		DEBUG_BUILD && debug.log("Flushing outcomes...");
		const outcomes = this._clearOutcomes();
		if (outcomes.length === 0) {
			DEBUG_BUILD && debug.log("No outcomes to send");
			return;
		}
		if (!this._dsn) {
			DEBUG_BUILD && debug.log("No dsn provided, will not send outcomes");
			return;
		}
		DEBUG_BUILD && debug.log("Sending outcomes:", outcomes);
		const envelope = createClientReportEnvelope(outcomes, this._options.tunnel && dsnToString(this._dsn));
		this.sendEnvelope(envelope);
	}
};
function getDataCategoryByType(type) {
	return type === "replay_event" ? "replay" : type || "error";
}
function _validateBeforeSendResult(beforeSendResult, beforeSendLabel) {
	const invalidValueError = `${beforeSendLabel} must return \`null\` or a valid event.`;
	if (isThenable(beforeSendResult)) return beforeSendResult.then((event) => {
		if (!isPlainObject(event) && event !== null) throw _makeInternalError(invalidValueError);
		return event;
	}, (e) => {
		throw _makeInternalError(`${beforeSendLabel} rejected with ${e}`);
	});
	else if (!isPlainObject(beforeSendResult) && beforeSendResult !== null) throw _makeInternalError(invalidValueError);
	return beforeSendResult;
}
function processBeforeSend(client, options, event, hint) {
	const { beforeSend, ignoreSpans, beforeSendTransaction } = options;
	const beforeSendSpan = isStaticBeforeSendSpanCallback(options.beforeSendSpan) && options.beforeSendSpan;
	let processedEvent = event;
	if (isErrorEvent(processedEvent) && beforeSend) return beforeSend(processedEvent, hint);
	if (isTransactionEvent(processedEvent)) {
		if (beforeSendSpan || ignoreSpans) {
			const rootSpanJson = convertTransactionEventToSpanJson(processedEvent);
			if (ignoreSpans?.length && shouldIgnoreSpan({
				description: rootSpanJson.description,
				op: rootSpanJson.op,
				attributes: rootSpanJson.data
			}, ignoreSpans)) return null;
			if (beforeSendSpan) processedEvent = merge(event, convertSpanJsonToTransactionEvent(applyBeforeSendSpanCallback(rootSpanJson, beforeSendSpan)));
			if (processedEvent.spans) {
				const processedSpans = [];
				const initialSpans = processedEvent.spans;
				for (const span of initialSpans) {
					if (ignoreSpans?.length && shouldIgnoreSpan({
						description: span.description,
						op: span.op,
						attributes: span.data
					}, ignoreSpans)) {
						reparentChildSpans(initialSpans, span);
						continue;
					}
					if (beforeSendSpan) processedSpans.push(applyBeforeSendSpanCallback(span, beforeSendSpan));
					else processedSpans.push(span);
				}
				const droppedSpans = processedEvent.spans.length - processedSpans.length;
				if (droppedSpans) client.recordDroppedEvent("before_send", "span", droppedSpans);
				processedEvent.spans = processedSpans;
			}
		}
		if (beforeSendTransaction) {
			if (processedEvent.spans) {
				const spanCountBefore = processedEvent.spans.length;
				processedEvent.sdkProcessingMetadata = {
					...event.sdkProcessingMetadata,
					spanCountBeforeProcessing: spanCountBefore
				};
			}
			return beforeSendTransaction(processedEvent, hint);
		}
	}
	return processedEvent;
}
function isErrorEvent(event) {
	return event.type === void 0;
}
function isTransactionEvent(event) {
	return event.type === "transaction";
}
function estimateMetricSizeInBytes(metric) {
	let weight = 0;
	if (metric.name) weight += metric.name.length * 2;
	weight += 8;
	return weight + estimateAttributesSizeInBytes(metric.attributes);
}
function estimateLogSizeInBytes(log) {
	let weight = 0;
	if (log.message) weight += log.message.length * 2;
	return weight + estimateAttributesSizeInBytes(log.attributes);
}
function estimateAttributesSizeInBytes(attributes) {
	if (!attributes) return 0;
	let weight = 0;
	Object.values(attributes).forEach((value) => {
		if (Array.isArray(value)) weight += value.length * estimatePrimitiveSizeInBytes(value[0]);
		else if (isPrimitive(value)) weight += estimatePrimitiveSizeInBytes(value);
		else weight += 100;
	});
	return weight;
}
function estimatePrimitiveSizeInBytes(value) {
	if (typeof value === "string") return value.length * 2;
	else if (typeof value === "number") return 8;
	else if (typeof value === "boolean") return 4;
	return 0;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/ai/providerSkip.js
var SKIPPED_AI_PROVIDERS = /* @__PURE__ */ new Set();
function _INTERNAL_skipAiProviderWrapping(modules) {
	modules.forEach((module) => {
		SKIPPED_AI_PROVIDERS.add(module);
		DEBUG_BUILD && debug.log(`AI provider "${module}" wrapping will be skipped`);
	});
}
function _INTERNAL_shouldSkipAiProviderWrapping(module) {
	return SKIPPED_AI_PROVIDERS.has(module);
}
function _INTERNAL_clearAiProviderSkips() {
	SKIPPED_AI_PROVIDERS.clear();
	DEBUG_BUILD && debug.log("Cleared AI provider skip registrations");
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/data-collection/filtering-snippets.js
var FILTERED_VALUE = "[Filtered]";
var SENSITIVE_KEY_SNIPPETS = [
	"auth",
	"token",
	"secret",
	"session",
	"password",
	"passwd",
	"pwd",
	"key",
	"jwt",
	"bearer",
	"sso",
	"saml",
	"csrf",
	"xsrf",
	"credentials",
	"sid",
	"identity",
	"set-cookie",
	"cookie"
];
var SENSITIVE_COOKIE_NAME_SNIPPETS = [
	".sid",
	"sessid",
	"remember",
	"oidc",
	"pkce",
	"nonce",
	"__secure-",
	"__host-",
	"awsalb",
	"awselb",
	"akamai",
	"__stripe",
	"cognito",
	"firebase",
	"supabase",
	"sb-",
	"mfa",
	"2fa"
];
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/data-collection/filterKeyValueData.js
function isSensitiveKey(lower, denySnippets) {
	return denySnippets.some((snippet) => lower.includes(snippet));
}
function shouldFilterDataKey(key, behavior, additionalDenyTerms) {
	if (behavior === false) return true;
	const lowerKey = key.toLowerCase();
	if (isSensitiveKey(lowerKey, additionalDenyTerms != null ? [...SENSITIVE_KEY_SNIPPETS, ...additionalDenyTerms] : SENSITIVE_KEY_SNIPPETS)) return true;
	if (behavior === true) return false;
	const matchesConfiguredTerm = ("deny" in behavior ? behavior.deny : behavior.allow).some((term) => lowerKey.includes(term.toLowerCase()));
	return "deny" in behavior ? matchesConfiguredTerm : !matchesConfiguredTerm;
}
function filterKeyValueData(data, behavior, additionalDenyTerms) {
	if (behavior === false) return {};
	const result = {};
	for (const key of Object.keys(data)) result[key] = shouldFilterDataKey(key, behavior, additionalDenyTerms) ? FILTERED_VALUE : data[key];
	return result;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/cookie.js
function parseCookie(str) {
	const obj = {};
	let index = 0;
	while (index < str.length) {
		const eqIdx = str.indexOf("=", index);
		if (eqIdx === -1) break;
		let endIdx = str.indexOf(";", index);
		if (endIdx === -1) endIdx = str.length;
		else if (endIdx < eqIdx) {
			index = str.lastIndexOf(";", eqIdx - 1) + 1;
			continue;
		}
		const key = str.slice(index, eqIdx).trim();
		if (void 0 === obj[key]) {
			let val = str.slice(eqIdx + 1, endIdx).trim();
			if (val.charCodeAt(0) === 34) val = val.slice(1, -1);
			try {
				obj[key] = val.indexOf("%") !== -1 ? decodeURIComponent(val) : val;
			} catch {
				obj[key] = val;
			}
		}
		index = endIdx + 1;
	}
	return obj;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/data-collection/filterQueryParams.js
function filterQueryParams(queryString, behavior) {
	if (!queryString || behavior === false) return;
	return queryString.split("&").map((pair) => {
		const separatorIndex = pair.indexOf("=");
		const encodedKey = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex);
		const key = new URLSearchParams(`${encodedKey}=`).keys().next().value;
		return key !== void 0 && shouldFilterDataKey(key, behavior) ? `${encodedKey}=${FILTERED_VALUE}` : pair;
	}).join("&");
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/data-collection/filterUrlQuery.js
function filterUrlQuery(url, behavior) {
	const fragmentStart = url.indexOf("#");
	const queryEnd = fragmentStart === -1 ? url.length : fragmentStart;
	const queryStart = url.indexOf("?");
	if (queryStart === -1 || queryStart > queryEnd) return url;
	const prefix = url.slice(0, queryStart);
	const query = url.slice(queryStart + 1, queryEnd);
	const suffix = url.slice(queryEnd);
	const filtered = filterQueryParams(query, behavior);
	return filtered ? `${prefix}?${filtered}${suffix}` : `${prefix}${suffix}`;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/data-collection/filterCollectedUrl.js
function urlQueryParamsBehavior(client) {
	return (client ?? getClient())?.getDataCollectionOptions().urlQueryParams ?? true;
}
function filterCollectedUrl(url, client) {
	return url === void 0 ? void 0 : filterUrlQuery(url, urlQueryParamsBehavior(client));
}
function filterCollectedUrlQuery(query, client) {
	return query ? filterQueryParams(query, urlQueryParamsBehavior(client)) : void 0;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/envToBool.js
var FALSY_ENV_VALUES = /* @__PURE__ */ new Set([
	"false",
	"f",
	"n",
	"no",
	"off",
	"0"
]);
var TRUTHY_ENV_VALUES = /* @__PURE__ */ new Set([
	"true",
	"t",
	"y",
	"yes",
	"on",
	"1"
]);
function envToBool(value, options) {
	const normalized = String(value).toLowerCase();
	if (FALSY_ENV_VALUES.has(normalized)) return false;
	if (TRUTHY_ENV_VALUES.has(normalized)) return true;
	return options?.strict ? null : Boolean(value);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/checkin.js
function createCheckInEnvelope(checkIn, dynamicSamplingContext, metadata, tunnel, dsn) {
	const headers = { sent_at: new Date(safeDateNow()).toISOString() };
	if (metadata?.sdk) headers.sdk = {
		name: metadata.sdk.name,
		version: metadata.sdk.version
	};
	if (!!tunnel && !!dsn) headers.dsn = dsnToString(dsn);
	if (dynamicSamplingContext) headers.trace = dynamicSamplingContext;
	return createEnvelope(headers, [createCheckInEnvelopeItem(checkIn)]);
}
function createCheckInEnvelopeItem(checkIn) {
	return [{ type: "check_in" }, checkIn];
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/url.js
var DEFAULT_BASE_URL = "thismessage:/";
function isURLObjectRelative(url) {
	return "isRelative" in url;
}
function parseStringToURLObject(url, urlBase) {
	const isRelative = url.indexOf("://") <= 0 && url.indexOf("//") !== 0;
	const base = urlBase ?? (isRelative ? DEFAULT_BASE_URL : void 0);
	try {
		if ("canParse" in URL && !URL.canParse(url, base)) return;
		const fullUrlObject = new URL(url, base);
		if (isRelative) return {
			isRelative,
			pathname: fullUrlObject.pathname,
			search: fullUrlObject.search,
			hash: fullUrlObject.hash
		};
		return fullUrlObject;
	} catch {}
}
function getSanitizedUrlStringFromUrlObject(url) {
	if (isURLObjectRelative(url)) return url.pathname;
	const newUrl = new URL(url);
	newUrl.search = "";
	newUrl.hash = "";
	if (["80", "443"].includes(newUrl.port)) newUrl.port = "";
	if (newUrl.password) newUrl.password = "%filtered%";
	if (newUrl.username) newUrl.username = "%filtered%";
	return newUrl.toString();
}
function getUrlQuery(query) {
	return query?.replace(/^\?/, "") || void 0;
}
function getUrlFragment(fragment) {
	return fragment?.replace(/^#/, "") || void 0;
}
function getHttpSpanNameFromUrlObject(urlObject, kind, request, routeName) {
	return `${request?.method?.toUpperCase() ?? "GET"} ${routeName ? routeName : urlObject ? kind === "client" ? getSanitizedUrlStringFromUrlObject(urlObject) : urlObject.pathname : "/"}`;
}
function getHttpSpanDetailsFromUrlObject(urlObject, kind, spanOrigin, request, routeName, client) {
	const attributes = { [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: spanOrigin };
	let nameSource = "url";
	if (routeName) {
		attributes[kind === "server" ? po : rm] = routeName;
		nameSource = "route";
	}
	if (request?.method) attributes[SEMANTIC_ATTRIBUTE_HTTP_REQUEST_METHOD] = request.method.toUpperCase();
	if (urlObject) {
		attributes[Ju] = filterCollectedUrl(isURLObjectRelative(urlObject) ? getSanitizedUrlStringFromUrlObject(urlObject) : urlObject.href, client);
		attributes[im] = filterCollectedUrlQuery(getUrlQuery(urlObject.search), client);
		attributes[Xu] = getUrlFragment(urlObject.hash);
		if (urlObject.pathname) {
			attributes[Zu] = urlObject.pathname;
			if (urlObject.pathname === "/") nameSource = "route";
		}
		if (!isURLObjectRelative(urlObject)) {
			if (urlObject.port) attributes[tm] = urlObject.port;
			if (urlObject.protocol) attributes[nm] = urlObject.protocol;
			if (urlObject.hostname) attributes[kind === "server" ? mu : Qu] = urlObject.hostname;
		}
	}
	if (kind === "server") attributes[jd] = nameSource;
	return [getHttpSpanNameFromUrlObject(urlObject, kind, request, routeName), attributes];
}
function parseUrl(url) {
	if (!url) return {};
	const match = url.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
	if (!match) return {};
	const query = match[6] || "";
	const fragment = match[8] || "";
	return {
		host: match[4],
		path: match[5],
		protocol: match[2],
		search: query,
		hash: fragment,
		relative: match[5] + query + fragment
	};
}
function stripUrlQueryAndFragment(urlPath) {
	return urlPath.split(/[?#]/, 1)[0];
}
function getSanitizedUrlString(url) {
	const { protocol, host, path } = url;
	const filteredHost = host?.replace(/^.*@/, "[filtered]:[filtered]@").replace(/(:80)$/, "").replace(/(:443)$/, "") || "";
	return `${protocol ? `${protocol}://` : ""}${filteredHost}${path}`;
}
function stripDataUrlContent(url, includeDataPrefix = true) {
	if (url.startsWith("data:")) {
		const match = url.match(/^data:([^;,]+)/);
		const mimeType = match ? match[1] : "text/plain";
		const isBase64 = url.includes(";base64,");
		const dataStart = url.indexOf(",");
		let dataPrefix = "";
		if (includeDataPrefix && dataStart !== -1) {
			const data = url.slice(dataStart + 1);
			dataPrefix = data.length > 10 ? `${data.slice(0, 10)}... [truncated]` : data;
		}
		return `data:${mimeType}${isBase64 ? ",base64" : ""}${dataPrefix ? `,${dataPrefix}` : ""}`;
	}
	return url;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/sdkMetadata.js
function applySdkMetadata(options, name, names = [name], source = "npm") {
	const sdk = (options._metadata = options._metadata || {}).sdk = options._metadata.sdk || {};
	if (!sdk.name) {
		sdk.name = `sentry.javascript.${name}`;
		sdk.packages = names.map((name2) => ({
			name: `${source}:@sentry/${name2}`,
			version: SDK_VERSION
		}));
		sdk.version = SDK_VERSION;
	}
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/traceData.js
function getTraceData(options = {}) {
	const client = options.client || getClient();
	if (!isEnabled() || !client) return {};
	const acs = getAsyncContextStrategy(getMainCarrier());
	if (acs.getTraceData) return acs.getTraceData(options);
	const scope = options.scope || getCurrentScope();
	const span = options.span || getActiveSpan();
	const isTwpPlaceholder = spanIsNonRecordingSpan(span) && !hasSpansEnabled(client.getOptions());
	if (!span && hasExternalPropagationContext()) return {};
	const sentryTrace = span && !isTwpPlaceholder ? spanToTraceHeader(span) : scopeToTraceHeader(scope);
	const baggage = dynamicSamplingContextToSentryBaggageHeader(span ? getDynamicSamplingContextFromSpan(span) : getDynamicSamplingContextFromScope(client, scope));
	if (!TRACEPARENT_REGEXP.test(sentryTrace)) {
		debug.warn("Invalid sentry-trace data. Cannot generate trace data");
		return {};
	}
	const traceData = {
		"sentry-trace": sentryTrace,
		baggage
	};
	if (options.propagateTraceparent) traceData.traceparent = span && !isTwpPlaceholder ? spanToTraceparentHeader(span) : scopeToTraceparentHeader(scope);
	return traceData;
}
function scopeToTraceHeader(scope) {
	const { traceId, sampled, propagationSpanId } = scope.getPropagationContext();
	return generateSentryTraceHeader(traceId, propagationSpanId, sampled);
}
function scopeToTraceparentHeader(scope) {
	const { traceId, sampled, propagationSpanId } = scope.getPropagationContext();
	return generateTraceparentHeader(traceId, propagationSpanId, sampled);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/tracePropagationTargets.js
var NOT_PROPAGATED_MESSAGE = "[Tracing] Not injecting trace data for url because it does not match tracePropagationTargets:";
var NORMALIZED_REGEXP_CACHE = /* @__PURE__ */ new WeakMap();
function normalizeRegExpTarget(pattern) {
	const flags = `${pattern.flags.replace(/[gy]/g, "")}${pattern.ignoreCase ? "" : "i"}`;
	if (flags === pattern.flags) return pattern;
	const cached = NORMALIZED_REGEXP_CACHE.get(pattern);
	if (cached) return cached;
	const normalizedPattern = new RegExp(pattern.source, flags);
	NORMALIZED_REGEXP_CACHE.set(pattern, normalizedPattern);
	return normalizedPattern;
}
function matchesTracePropagationTargets(value, tracePropagationTargets, requireExactStringMatch = false) {
	const lowerCaseValue = value.toLowerCase();
	for (const target of tracePropagationTargets) if (isString(target)) {
		const lowerCaseTarget = target.toLowerCase();
		if (requireExactStringMatch ? lowerCaseValue === lowerCaseTarget : lowerCaseValue.includes(lowerCaseTarget)) return true;
	} else if (isRegExp(target) && normalizeRegExpTarget(target).test(value)) return true;
	return false;
}
function shouldPropagateTraceForUrl(url, tracePropagationTargets, decisionMap) {
	if (typeof url !== "string" || !tracePropagationTargets) return true;
	const cachedDecision = decisionMap?.get(url);
	if (cachedDecision !== void 0) {
		DEBUG_BUILD && !cachedDecision && debug.log(NOT_PROPAGATED_MESSAGE, url);
		return cachedDecision;
	}
	const decision = matchesTracePropagationTargets(url, tracePropagationTargets);
	decisionMap?.set(url, decision);
	DEBUG_BUILD && !decision && debug.log(NOT_PROPAGATED_MESSAGE, url);
	return decision;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/array.js
function uniq(input) {
	return Array.from(new Set(input));
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/request.js
var MAX_BODY_BYTE_LENGTH = 1048576;
function getMaxBodyByteLength(maxRequestBodySize) {
	if (maxRequestBodySize === "small") return 1e3;
	if (maxRequestBodySize === "medium") return 1e4;
	return MAX_BODY_BYTE_LENGTH;
}
function headersToDict(reqHeaders) {
	const headers = /* @__PURE__ */ Object.create(null);
	try {
		Object.entries(reqHeaders).forEach(([key, value]) => {
			if (typeof value === "string") headers[key] = value;
			else if (typeof value === "number") headers[key] = String(value);
		});
	} catch {}
	return headers;
}
function httpRequestToRequestData(request) {
	const headers = request.headers || {};
	const host = (typeof headers["x-forwarded-host"] === "string" ? headers["x-forwarded-host"] : void 0) || (typeof headers.host === "string" ? headers.host : void 0);
	const protocol = (typeof headers["x-forwarded-proto"] === "string" ? headers["x-forwarded-proto"] : void 0) || request.protocol || (request.socket?.encrypted ? "https" : "http");
	const url = request.url || "";
	const absoluteUrl = getAbsoluteUrl({
		url,
		host,
		protocol
	});
	const data = request.body || void 0;
	const cookies = request.cookies;
	return {
		url: absoluteUrl,
		method: request.method,
		query_string: extractQueryParamsFromUrl(url),
		headers: headersToDict(headers),
		cookies,
		data
	};
}
function getAbsoluteUrl({ url, protocol, host }) {
	if (url?.startsWith("http")) return url;
	if (url && host) return `${protocol}://${host}${url}`;
}
function httpHeadersToSpanAttributes(headers, dataCollection, lifecycle = "request") {
	const headerBehavior = lifecycle === "request" ? dataCollection.httpHeaders.request : dataCollection.httpHeaders.response;
	const cookieBehavior = dataCollection.cookies;
	const prefix = `http.${lifecycle}.header.`;
	const spanAttributes = {};
	try {
		const regularHeaders = {};
		for (const [key, value] of Object.entries(headers)) {
			if (value == null) continue;
			const lowerKey = key.toLowerCase();
			if (lowerKey === "cookie" || lowerKey === "set-cookie") {
				if (cookieBehavior === false) continue;
				if (typeof value === "string" && value !== "") {
					const filtered = filterKeyValueData(parseCookieHeader(value, lowerKey === "set-cookie"), cookieBehavior, SENSITIVE_COOKIE_NAME_SNIPPETS);
					for (const [cookieKey, cookieValue] of Object.entries(filtered)) spanAttributes[`${prefix}${normalizeAttributeKey(lowerKey)}.${normalizeAttributeKey(cookieKey)}`] = cookieValue;
				} else spanAttributes[`${prefix}${normalizeAttributeKey(lowerKey)}`] = FILTERED_VALUE;
			} else {
				if (headerBehavior === false) continue;
				if (Array.isArray(value)) regularHeaders[lowerKey] = value.map((v) => v != null ? String(v) : v).join(";");
				else if (typeof value === "string") regularHeaders[lowerKey] = value;
			}
		}
		if (headerBehavior !== false) {
			const filtered = filterKeyValueData(regularHeaders, headerBehavior);
			for (const [headerKey, headerValue] of Object.entries(filtered)) spanAttributes[`${prefix}${normalizeAttributeKey(headerKey)}`] = headerValue;
		}
	} catch {}
	return spanAttributes;
}
function normalizeAttributeKey(key) {
	return key.replace(/-/g, "_");
}
function parseCookieHeader(value, isSetCookie) {
	const semicolonIndex = value.indexOf(";");
	const cookieString = isSetCookie && semicolonIndex !== -1 ? value.substring(0, semicolonIndex) : value;
	const cookies = isSetCookie ? [cookieString] : cookieString.split("; ");
	const result = {};
	for (const cookie of cookies) {
		const equalSignIndex = cookie.indexOf("=");
		const cookieKey = (equalSignIndex !== -1 ? cookie.substring(0, equalSignIndex) : cookie).toLowerCase();
		result[cookieKey] = equalSignIndex !== -1 ? cookie.substring(equalSignIndex + 1) : "";
	}
	return result;
}
function extractQueryParamsFromUrl(url) {
	if (!url) return;
	try {
		return getUrlQuery(new URL(url, "http://s.io").search);
	} catch {
		return;
	}
}
function getContentLengthFromHeaders(headers) {
	const contentLength = headers["content-length"];
	if (typeof contentLength !== "string") return;
	const length = parseInt(contentLength, 10);
	return length >= 0 ? length : void 0;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/spanKind.js
var SPAN_KIND_NUMBER_TO_NAME = {
	[0]: void 0,
	[1]: "server",
	[2]: "client",
	[3]: "producer",
	[4]: "consumer"
};
function spanKindToName(kind) {
	return SPAN_KIND_NUMBER_TO_NAME[kind];
}
//#endregion
//#region node_modules/@sentry/core/build/esm/breadcrumbs.js
var DEFAULT_BREADCRUMBS = 100;
function addBreadcrumb(breadcrumb, hint) {
	const client = getClient();
	const isolationScope = getIsolationScope();
	if (!client) return;
	const { beforeBreadcrumb = null, maxBreadcrumbs = DEFAULT_BREADCRUMBS } = client.getOptions();
	if (maxBreadcrumbs <= 0) return;
	const mergedBreadcrumb = {
		timestamp: dateTimestampInSeconds(),
		...breadcrumb
	};
	const finalBreadcrumb = beforeBreadcrumb ? consoleSandbox(() => beforeBreadcrumb(mergedBreadcrumb, hint)) : mergedBreadcrumb;
	if (finalBreadcrumb === null) return;
	if (client.emit) client.emit("beforeAddBreadcrumb", finalBreadcrumb, hint);
	isolationScope.addBreadcrumb(finalBreadcrumb, maxBreadcrumbs);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/functiontostring.js
var INTEGRATION_NAME$6 = "FunctionToString";
var SETUP_CLIENTS = /* @__PURE__ */ new WeakMap();
var _functionToStringIntegration = () => {
	return {
		name: INTEGRATION_NAME$6,
		setupOnce() {
			const originalFunctionToString = Function.prototype.toString;
			try {
				Function.prototype.toString = function(...args) {
					const originalFunction = getOriginalFunction(this);
					let unwrappedFunction;
					try {
						if (SETUP_CLIENTS.has(getClient()) && originalFunction !== void 0) unwrappedFunction = originalFunction;
					} catch {}
					return originalFunctionToString.apply(unwrappedFunction ?? this, args);
				};
			} catch {}
		},
		setup(client) {
			SETUP_CLIENTS.set(client, true);
		}
	};
};
var functionToStringIntegration = defineIntegration(_functionToStringIntegration);
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/eventFilters.js
var DEFAULT_IGNORE_ERRORS = [
	/^Script error\.?$/,
	/^Javascript error: Script error\.? on line 0$/,
	/^ResizeObserver loop completed with undelivered notifications.$/,
	/^Cannot redefine property: googletag$/,
	/^Can't find variable: gmo$/,
	/^undefined is not an object \(evaluating 'a\.[A-Z]'\)$/,
	/can't redefine non-configurable property "solana"/,
	/vv\(\)\.getRestrictions is not a function/,
	/Can't find variable: _AutofillCallbackHandler/,
	/Object Not Found Matching Id:\d+, MethodName:simulateEvent/,
	/Java exception was raised during method invocation$/,
	/Java object is gone$/
];
var INTEGRATION_NAME$5 = "EventFilters";
var eventFiltersIntegration = defineIntegration((options = {}) => {
	let mergedOptions;
	return {
		name: INTEGRATION_NAME$5,
		setup(client) {
			mergedOptions = _mergeOptions(options, client.getOptions());
		},
		processEvent(event, _hint, client) {
			if (!mergedOptions) mergedOptions = _mergeOptions(options, client.getOptions());
			return _shouldDropEvent(event, mergedOptions) ? null : event;
		}
	};
});
function _mergeOptions(internalOptions = {}, clientOptions = {}) {
	return {
		allowUrls: [...internalOptions.allowUrls || [], ...clientOptions.allowUrls || []],
		denyUrls: [...internalOptions.denyUrls || [], ...clientOptions.denyUrls || []],
		ignoreErrors: [
			...internalOptions.ignoreErrors || [],
			...clientOptions.ignoreErrors || [],
			...internalOptions.disableErrorDefaults ? [] : DEFAULT_IGNORE_ERRORS
		],
		ignoreTransactions: [...internalOptions.ignoreTransactions || [], ...clientOptions.ignoreTransactions || []]
	};
}
function _shouldDropEvent(event, options) {
	if (!event.type) {
		if (_isIgnoredError(event, options.ignoreErrors)) {
			DEBUG_BUILD && debug.warn(`Event dropped due to being matched by \`ignoreErrors\` option.
Event: ${getEventDescription(event)}`);
			return true;
		}
		if (_isUselessError(event)) {
			DEBUG_BUILD && debug.warn(`Event dropped due to not having an error message, error type or stacktrace.
Event: ${getEventDescription(event)}`);
			return true;
		}
		if (_isDeniedUrl(event, options.denyUrls)) {
			DEBUG_BUILD && debug.warn(`Event dropped due to being matched by \`denyUrls\` option.
Event: ${getEventDescription(event)}.
Url: ${_getEventFilterUrl(event)}`);
			return true;
		}
		if (!_isAllowedUrl(event, options.allowUrls)) {
			DEBUG_BUILD && debug.warn(`Event dropped due to not being matched by \`allowUrls\` option.
Event: ${getEventDescription(event)}.
Url: ${_getEventFilterUrl(event)}`);
			return true;
		}
	} else if (event.type === "transaction") {
		if (_isIgnoredTransaction(event, options.ignoreTransactions)) {
			DEBUG_BUILD && debug.warn(`Event dropped due to being matched by \`ignoreTransactions\` option.
Event: ${getEventDescription(event)}`);
			return true;
		}
	}
	return false;
}
function _isIgnoredError(event, ignoreErrors) {
	if (!ignoreErrors?.length) return false;
	return getPossibleEventMessages(event).some((message) => stringMatchesSomePattern(message, ignoreErrors));
}
function _isIgnoredTransaction(event, ignoreTransactions) {
	if (!ignoreTransactions?.length) return false;
	const name = event.transaction;
	return name ? stringMatchesSomePattern(name, ignoreTransactions) : false;
}
function _isDeniedUrl(event, denyUrls) {
	if (!denyUrls?.length) return false;
	const url = _getEventFilterUrl(event);
	return !url ? false : stringMatchesSomePattern(url, denyUrls);
}
function _isAllowedUrl(event, allowUrls) {
	if (!allowUrls?.length) return true;
	const url = _getEventFilterUrl(event);
	return !url ? true : stringMatchesSomePattern(url, allowUrls);
}
function _getLastValidUrl(frames = []) {
	for (let i = frames.length - 1; i >= 0; i--) {
		const frame = frames[i];
		if (frame && frame.filename !== "<anonymous>" && frame.filename !== "[native code]") return frame.filename || null;
	}
	return null;
}
function _getEventFilterUrl(event) {
	try {
		const frames = [...event.exception?.values ?? []].reverse().find((value) => value.mechanism?.parent_id === void 0 && value.stacktrace?.frames?.length)?.stacktrace?.frames;
		return frames ? _getLastValidUrl(frames) : null;
	} catch {
		DEBUG_BUILD && debug.error(`Cannot extract url for event ${getEventDescription(event)}`);
		return null;
	}
}
function _isUselessError(event) {
	if (!event.exception?.values?.length) return false;
	return !event.message && !event.exception.values.some((value) => value.stacktrace || value.type && value.type !== "Error" || value.value);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/aggregate-errors.js
function applyAggregateErrorsToEvent(exceptionFromErrorImplementation, parser, key, limit, event, hint) {
	if (!event.exception?.values || !hint || !isError(hint.originalException)) return;
	const originalException = event.exception.values.length > 0 ? event.exception.values[event.exception.values.length - 1] : void 0;
	if (originalException) event.exception.values = aggregateExceptionsFromError(exceptionFromErrorImplementation, parser, limit, hint.originalException, key, event.exception.values, originalException, 0);
}
function aggregateExceptionsFromError(exceptionFromErrorImplementation, parser, limit, error, key, prevExceptions, exception, exceptionId) {
	if (prevExceptions.length >= limit + 1) return prevExceptions;
	let newExceptions = [...prevExceptions];
	if (isError(error[key])) {
		applyExceptionGroupFieldsForParentException(exception, exceptionId, error);
		const newException = exceptionFromErrorImplementation(parser, error[key]);
		const newExceptionId = newExceptions.length;
		applyExceptionGroupFieldsForChildException(newException, key, newExceptionId, exceptionId);
		newExceptions = aggregateExceptionsFromError(exceptionFromErrorImplementation, parser, limit, error[key], key, [newException, ...newExceptions], newException, newExceptionId);
	}
	if (isExceptionGroup(error)) error.errors.forEach((childError, i) => {
		if (isError(childError)) {
			applyExceptionGroupFieldsForParentException(exception, exceptionId, error);
			const newException = exceptionFromErrorImplementation(parser, childError);
			const newExceptionId = newExceptions.length;
			applyExceptionGroupFieldsForChildException(newException, `errors[${i}]`, newExceptionId, exceptionId);
			newExceptions = aggregateExceptionsFromError(exceptionFromErrorImplementation, parser, limit, childError, key, [newException, ...newExceptions], newException, newExceptionId);
		}
	});
	return newExceptions;
}
function isExceptionGroup(error) {
	return Array.isArray(error.errors);
}
function applyExceptionGroupFieldsForParentException(exception, exceptionId, error) {
	exception.mechanism = {
		handled: true,
		type: "auto.core.linked_errors",
		...isExceptionGroup(error) && { is_exception_group: true },
		...exception.mechanism,
		exception_id: exceptionId
	};
}
function applyExceptionGroupFieldsForChildException(exception, source, exceptionId, parentId) {
	exception.mechanism = {
		handled: true,
		...exception.mechanism,
		type: "chained",
		source,
		exception_id: exceptionId,
		parent_id: parentId
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/eventbuilder.js
function parseStackFrames(stackParser, error) {
	return stackParser(error.stack || "", 1);
}
function hasSentryFetchUrlHost(error) {
	return isError(error) && "__sentry_fetch_url_host__" in error && typeof error.__sentry_fetch_url_host__ === "string";
}
function _enhanceErrorWithSentryInfo(error) {
	if (hasSentryFetchUrlHost(error)) return `${error.message} (${error.__sentry_fetch_url_host__})`;
	return error.message;
}
function exceptionFromError(stackParser, error) {
	const exception = {
		type: error.name || error.constructor.name,
		value: _enhanceErrorWithSentryInfo(error)
	};
	const frames = parseStackFrames(stackParser, error);
	if (frames.length) exception.stacktrace = { frames };
	return exception;
}
function getErrorPropertyFromObject(obj) {
	for (const prop in obj) if (Object.prototype.hasOwnProperty.call(obj, prop)) {
		const value = obj[prop];
		if (isError(value)) return value;
	}
}
function getMessageForObject(exception) {
	if ("name" in exception && typeof exception.name === "string") {
		let message = `'${exception.name}' captured as exception`;
		if ("message" in exception && typeof exception.message === "string") message += ` with message '${exception.message}'`;
		return message;
	} else if ("message" in exception && typeof exception.message === "string") return exception.message;
	const keys = extractExceptionKeysForMessage(exception);
	if (isErrorEvent$1(exception)) return `Event \`ErrorEvent\` captured as exception with message \`${exception.message}\``;
	const className = getObjectClassName(exception);
	return `${className && className !== "Object" ? `'${className}'` : "Object"} captured as exception with keys: ${keys}`;
}
function getObjectClassName(obj) {
	try {
		const prototype = Object.getPrototypeOf(obj);
		return prototype ? prototype.constructor.name : void 0;
	} catch {}
}
function getException(client, mechanism, exception, hint) {
	if (isError(exception)) return [exception, void 0];
	mechanism.synthetic = true;
	if (isPlainObject(exception)) {
		const normalizeDepth = client?.getOptions().normalizeDepth;
		const extras = { ["__serialized__"]: normalizeToSize(exception, normalizeDepth) };
		const errorFromProp = getErrorPropertyFromObject(exception);
		if (errorFromProp) return [errorFromProp, extras];
		const message = getMessageForObject(exception);
		const ex2 = hint?.syntheticException || new Error(message);
		ex2.message = message;
		return [ex2, extras];
	}
	const ex = hint?.syntheticException || new Error(exception);
	ex.message = `${exception}`;
	return [ex, void 0];
}
function eventFromUnknownInput(client, stackParser, exception, hint) {
	const mechanism = hint?.data && hint.data.mechanism || {
		handled: true,
		type: "generic"
	};
	const [ex, extras] = getException(client, mechanism, exception, hint);
	const event = { exception: { values: [exceptionFromError(stackParser, ex)] } };
	if (extras) event.extra = extras;
	addExceptionTypeValue(event, void 0, void 0);
	addExceptionMechanism(event, mechanism);
	return {
		...event,
		event_id: hint?.event_id
	};
}
function eventFromMessage(stackParser, message, level = "info", hint, attachStacktrace) {
	const event = {
		event_id: hint?.event_id,
		level
	};
	if (attachStacktrace && hint?.syntheticException) {
		const frames = parseStackFrames(stackParser, hint.syntheticException);
		if (frames.length) {
			event.exception = { values: [{
				value: message,
				stacktrace: { frames }
			}] };
			addExceptionMechanism(event, { synthetic: true });
		}
	}
	if (isParameterizedString(message)) {
		const { __sentry_template_string__, __sentry_template_values__ } = message;
		event.logentry = {
			message: __sentry_template_string__,
			params: __sentry_template_values__
		};
		return event;
	}
	event.message = message;
	return event;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/linkederrors.js
var DEFAULT_KEY = "cause";
var DEFAULT_LIMIT = 5;
var INTEGRATION_NAME$4 = "LinkedErrors";
var _linkedErrorsIntegration = (options = {}) => {
	const limit = options.limit || DEFAULT_LIMIT;
	const key = options.key || DEFAULT_KEY;
	return {
		name: INTEGRATION_NAME$4,
		preprocessEvent(event, hint, client) {
			applyAggregateErrorsToEvent(exceptionFromError, client.getOptions().stackParser, key, limit, event, hint);
		}
	};
};
var linkedErrorsIntegration = defineIntegration(_linkedErrorsIntegration);
//#endregion
//#region node_modules/@sentry/core/build/esm/vendor/getIpAddress.js
var ipHeaderNames = [
	"X-Client-IP",
	"X-Forwarded-For",
	"Fly-Client-IP",
	"CF-Connecting-IP",
	"Fastly-Client-Ip",
	"True-Client-Ip",
	"X-Real-IP",
	"X-Cluster-Client-IP",
	"X-Forwarded",
	"Forwarded-For",
	"Forwarded",
	"X-Vercel-Forwarded-For"
];
function getClientIPAddress(headers) {
	const lowerCaseHeaders = {};
	for (const key of Object.keys(headers)) lowerCaseHeaders[key.toLowerCase()] = headers[key];
	return ipHeaderNames.map((headerName) => {
		const rawValue = lowerCaseHeaders[headerName.toLowerCase()];
		const value = Array.isArray(rawValue) ? rawValue.join(";") : rawValue;
		if (headerName === "Forwarded") return parseForwardedHeader(value);
		return value?.split(",").map((v) => v.trim());
	}).reduce((acc, val) => {
		if (!val) return acc;
		return acc.concat(val);
	}, []).find((ip) => ip !== null && isIP(ip)) || null;
}
function parseForwardedHeader(value) {
	if (!value) return null;
	for (const part of value.split(";")) if (part.startsWith("for=")) return part.slice(4);
	return null;
}
function isIP(str) {
	return /(?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$)|(?:^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$)/.test(str);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/requestdata.js
var INTEGRATION_NAME$3 = "RequestData";
var _requestDataIntegration = (options = {}) => {
	function resolveRequestDataOptions(client) {
		const dataCollection = client.getDataCollectionOptions();
		const include = {
			cookies: options.include?.cookies ?? dataCollection.cookies !== false,
			data: options.include?.data ?? true,
			headers: options.include?.headers ?? dataCollection.httpHeaders.request !== false,
			ip: options.include?.ip ?? dataCollection.userInfo,
			query_string: options.include?.query_string ?? dataCollection.urlQueryParams !== false,
			url: options.include?.url ?? true
		};
		return {
			include,
			dataCollection: {
				...dataCollection,
				cookies: resolveFilteringBehavior(include.cookies, dataCollection.cookies),
				httpHeaders: {
					...dataCollection.httpHeaders,
					request: resolveFilteringBehavior(include.headers, dataCollection.httpHeaders.request)
				},
				urlQueryParams: resolveFilteringBehavior(include.query_string, dataCollection.urlQueryParams)
			}
		};
	}
	return {
		name: INTEGRATION_NAME$3,
		processEvent(event, _hint, client) {
			const { sdkProcessingMetadata = {} } = event;
			const { normalizedRequest, ipAddress } = sdkProcessingMetadata;
			if (!normalizedRequest) return event;
			const { include, dataCollection } = resolveRequestDataOptions(client);
			addNormalizedRequestDataToEvent(event, normalizedRequest, { ipAddress }, include, dataCollection);
			return event;
		},
		processSegmentSpan(span, client) {
			const { sdkProcessingMetadata = {} } = getIsolationScope().getScopeData();
			const { normalizedRequest, ipAddress } = sdkProcessingMetadata;
			if (!normalizedRequest) return;
			const { include, dataCollection } = resolveRequestDataOptions(client);
			addNormalizedRequestDataToSpan(span, normalizedRequest, ipAddress, include, dataCollection);
		}
	};
};
var requestDataIntegration = defineIntegration(_requestDataIntegration);
function addNormalizedRequestDataToEvent(event, req, additionalData, include, dataCollection) {
	const requestData = extractNormalizedRequestData(req, include);
	if (requestData.cookies) requestData.cookies = filterKeyValueData(requestData.cookies, dataCollection.cookies, SENSITIVE_COOKIE_NAME_SNIPPETS);
	if (requestData.headers) requestData.headers = filterKeyValueData(requestData.headers, dataCollection.httpHeaders.request);
	if (requestData.query_string) requestData.query_string = normalizeAndFilterQueryString(requestData.query_string, dataCollection.urlQueryParams);
	if (requestData.url) requestData.url = filterUrlQuery(requestData.url, dataCollection.urlQueryParams);
	event.request = {
		...event.request,
		...requestData
	};
	if (include.ip) {
		const ip = req.headers && getClientIPAddress(req.headers) || additionalData.ipAddress;
		if (ip) event.user = {
			...event.user,
			ip_address: ip
		};
	}
}
function addNormalizedRequestDataToSpan(span, normalizedRequest, ipAddress, include, dataCollection) {
	const requestData = extractNormalizedRequestData(normalizedRequest, include);
	const attributes = {};
	if (requestData.url) attributes[Ju] = filterUrlQuery(requestData.url, dataCollection.urlQueryParams);
	if (requestData.method) attributes["http.request.method"] = requestData.method;
	if (requestData.query_string) attributes[im] = normalizeAndFilterQueryString(requestData.query_string, dataCollection.urlQueryParams);
	safeSetSpanJSONAttributes(span, attributes);
	if (requestData.cookies && Object.keys(requestData.cookies).length > 0) safeSetSpanJSONAttributes(span, httpHeadersToSpanAttributes({ cookie: Object.entries(requestData.cookies).map(([name, value]) => `${name}=${value}`).join("; ") }, dataCollection, "request"));
	if (requestData.headers) safeSetSpanJSONAttributes(span, httpHeadersToSpanAttributes(requestData.headers, dataCollection, "request"));
	if (requestData.data != null) {
		const serialized = typeof requestData.data === "string" ? requestData.data : JSON.stringify(requestData.data);
		if (serialized) safeSetSpanJSONAttributes(span, { "http.request.body.data": serialized });
	}
	if (include.ip) {
		const ip = normalizedRequest.headers && getClientIPAddress(normalizedRequest.headers) || ipAddress || void 0;
		if (ip) safeSetSpanJSONAttributes(span, { [SEMANTIC_ATTRIBUTE_USER_IP_ADDRESS]: ip });
	}
}
function extractNormalizedRequestData(normalizedRequest, include) {
	const requestData = {};
	const headers = { ...normalizedRequest.headers };
	if (include.headers) {
		requestData.headers = headers;
		if (!include.cookies) delete headers.cookie;
		if (!include.ip) {
			const ipHeaderNamesLower = new Set(ipHeaderNames.map((name) => name.toLowerCase()));
			for (const key of Object.keys(headers)) if (ipHeaderNamesLower.has(key.toLowerCase())) delete headers[key];
		}
	}
	requestData.method = normalizedRequest.method;
	if (include.url) requestData.url = normalizedRequest.url;
	if (include.cookies) requestData.cookies = normalizedRequest.cookies || (headers?.cookie ? parseCookie(headers.cookie) : void 0) || {};
	if (include.query_string) requestData.query_string = normalizedRequest.query_string;
	if (include.data) requestData.data = normalizedRequest.data;
	return requestData;
}
function resolveFilteringBehavior(isIncluded, behavior) {
	return isIncluded && behavior === false ? true : behavior;
}
function normalizeAndFilterQueryString(queryString, behavior) {
	const normalized = normalizeQueryString(queryString);
	return normalized ? filterQueryParams(normalized, behavior) : void 0;
}
function normalizeQueryString(queryString) {
	if (typeof queryString === "string") return getUrlQuery(queryString);
	const pairs = Array.isArray(queryString) ? queryString : Object.entries(queryString);
	return new URLSearchParams(pairs).toString() || void 0;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/instrument/console.js
var _filter = /* @__PURE__ */ new Set([]);
function addConsoleInstrumentationHandler(handler) {
	const type = "console";
	const removeHandler = addHandler(type, handler);
	maybeInstrument(type, instrumentConsole);
	return removeHandler;
}
function addConsoleInstrumentationFilter(filter) {
	for (const f of filter) _filter.add(f);
	return () => {
		for (const f of filter) _filter.delete(f);
	};
}
var instrumentedLevels = /* @__PURE__ */ new Set();
function instrumentConsole() {
	if (!("console" in GLOBAL_OBJ)) return;
	CONSOLE_LEVELS.forEach(function(level) {
		if (instrumentedLevels.has(level) || !(level in GLOBAL_OBJ.console)) return;
		instrumentedLevels.add(level);
		fill(GLOBAL_OBJ.console, level, function(originalConsoleMethod) {
			originalConsoleMethods[level] = originalConsoleMethod;
			return function(...args) {
				const firstArg = args[0];
				const log = originalConsoleMethods[level];
				const isFiltered = _filter.size && typeof firstArg === "string" && stringMatchesSomePattern(firstArg, _filter);
				if (!isFiltered) triggerHandlers("console", {
					args,
					level
				});
				if (!isFiltered || DEBUG_BUILD && debug.isEnabled()) log?.apply(GLOBAL_OBJ.console, args);
			};
		});
	});
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/severity.js
function severityLevelFromString(level) {
	return level === "warn" ? "warning" : [
		"fatal",
		"error",
		"warning",
		"log",
		"info",
		"debug"
	].includes(level) ? level : "log";
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/path.js
var splitPathRe = /^(\S+:\\|\/?)([\s\S]*?)((?:\.{1,2}|[^/\\]+?|)(\.[^./\\]*|))(?:[/\\]*)$/;
function splitPath(filename) {
	const truncated = filename.length > 1024 ? `<truncated>${filename.slice(-1024)}` : filename;
	const parts = splitPathRe.exec(truncated);
	return parts ? parts.slice(1) : [];
}
function dirname(path) {
	const result = splitPath(path);
	const root = result[0] || "";
	let dir = result[1];
	if (!root && !dir) return ".";
	if (dir) dir = dir.slice(0, dir.length - 1);
	return root + dir;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/console.js
var INTEGRATION_NAME$2 = "Console";
var consoleIntegration = defineIntegration((options = {}) => {
	const levels = new Set(options.levels || CONSOLE_LEVELS);
	return {
		name: INTEGRATION_NAME$2,
		setup(client) {
			const unsubscribe = addConsoleInstrumentationHandler(({ args, level }) => {
				if (getClient() !== client || !levels.has(level)) return;
				addConsoleBreadcrumb(level, args);
			});
			client.registerCleanup(unsubscribe);
			if (options.filter) {
				const unsubscribe2 = addConsoleInstrumentationFilter(options.filter);
				client.registerCleanup(unsubscribe2);
			}
		}
	};
});
function addConsoleBreadcrumb(level, args) {
	const breadcrumb = {
		category: "console",
		data: {
			arguments: args,
			logger: "console"
		},
		level: severityLevelFromString(level),
		message: formatConsoleArgs(args)
	};
	if (level === "assert") {
		if (args[0] === false) {
			const assertionArgs = args.slice(1);
			breadcrumb.message = assertionArgs.length > 0 ? `Assertion failed: ${formatConsoleArgs(assertionArgs)}` : "Assertion failed";
			breadcrumb.data.arguments = assertionArgs;
		} else return;
	}
	addBreadcrumb(breadcrumb, {
		input: args,
		level
	});
}
function formatConsoleArgs(values) {
	return "util" in GLOBAL_OBJ && typeof GLOBAL_OBJ.util.format === "function" ? GLOBAL_OBJ.util.format(...values) : safeJoin(values, " ");
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/conversationId.js
var INTEGRATION_NAME$1 = "ConversationId";
var _conversationIdIntegration = () => {
	return {
		name: INTEGRATION_NAME$1,
		setup(client) {
			client.on("spanStart", (span) => {
				const scopeData = getCurrentScope().getScopeData();
				const isolationScopeData = getIsolationScope().getScopeData();
				const conversationId = scopeData.conversationId || isolationScopeData.conversationId;
				if (conversationId) {
					const { op, data: attributes, description: name } = spanToStaticSpanJSON(span);
					if (!op?.startsWith("gen_ai.") && !attributes["ai.operationId"] && !name?.startsWith("ai.")) return;
					span.setAttribute(GEN_AI_CONVERSATION_ID_ATTRIBUTE, conversationId);
				}
			});
		}
	};
};
var conversationIdIntegration = defineIntegration(_conversationIdIntegration);
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/breadcrumb-log-level.js
function getBreadcrumbLogLevelFromHttpStatusCode(statusCode) {
	if (statusCode === void 0) return;
	else if (statusCode >= 400 && statusCode < 500) return "warning";
	else if (statusCode >= 500) return "error";
	else return;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/lru.js
var LRUMap = class {
	constructor(_maxSize) {
		this._maxSize = _maxSize;
		this._cache = /* @__PURE__ */ new Map();
	}
	/** Get the current size of the cache */
	get size() {
		return this._cache.size;
	}
	/** Get an entry or undefined if it was not in the cache. Re-inserts to update the recently used order */
	get(key) {
		const value = this._cache.get(key);
		if (value === void 0) return;
		this._cache.delete(key);
		this._cache.set(key, value);
		return value;
	}
	/** Insert an entry and evict an older entry if we've reached maxSize */
	set(key, value) {
		if (this._cache.size >= this._maxSize) {
			const nextKey = this._cache.keys().next().value;
			this._cache.delete(nextKey);
		}
		this._cache.set(key, value);
	}
	/** Remove an entry and return the entry if it was in the cache */
	remove(key) {
		const value = this._cache.get(key);
		if (value) this._cache.delete(key);
		return value;
	}
	/** Clear all entries */
	clear() {
		this._cache.clear();
	}
	/** Get all the keys */
	keys() {
		return Array.from(this._cache.keys());
	}
	/** Get all the values */
	values() {
		const values = [];
		this._cache.forEach((value) => values.push(value));
		return values;
	}
};
//#endregion
//#region node_modules/@sentry/core/build/esm/transports/userAgent.js
function addUserAgentToTransportHeaders(options) {
	const sdkMetadata = options._metadata?.sdk;
	const sdkUserAgent = sdkMetadata?.name && sdkMetadata?.version ? `${sdkMetadata?.name}/${sdkMetadata?.version}` : void 0;
	options.transportOptions = {
		...options.transportOptions,
		headers: {
			...sdkUserAgent && { "user-agent": sdkUserAgent },
			...options.transportOptions?.headers
		}
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/server-runtime-client.js
var ServerRuntimeClient = class extends Client {
	/**
	* Creates a new Edge SDK instance.
	* @param options Configuration options for this SDK.
	*/
	constructor(options) {
		addUserAgentToTransportHeaders(options);
		if ((typeof __SENTRY_TRACING__ === "undefined" || __SENTRY_TRACING__) && options.traceLifecycle !== "static" && !options.integrations.some((i) => i.name === "SpanStreaming")) options.integrations.push(spanStreamingIntegration());
		super(options);
		this._disposeCallbacks = [];
		this._setUpMetricsProcessing();
	}
	/**
	* @inheritDoc
	*/
	eventFromException(exception, hint) {
		const event = eventFromUnknownInput(this, this._options.stackParser, exception, hint);
		event.level = "error";
		return resolvedSyncPromise(event);
	}
	/**
	* @inheritDoc
	*/
	eventFromMessage(message, level = "info", hint) {
		return resolvedSyncPromise(eventFromMessage(this._options.stackParser, message, level, hint, this._options.attachStacktrace));
	}
	/**
	* @inheritDoc
	*/
	captureException(exception, hint, scope) {
		setCurrentRequestSessionErroredOrCrashed(hint);
		return super.captureException(exception, hint, scope);
	}
	/**
	* @inheritDoc
	*/
	captureEvent(event, hint, scope) {
		if (!event.type && event.exception?.values && event.exception.values.length > 0) setCurrentRequestSessionErroredOrCrashed(hint);
		return super.captureEvent(event, hint, scope);
	}
	/**
	* Create a cron monitor check in and send it to Sentry.
	*
	* @param checkIn An object that describes a check in.
	* @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
	* to create a monitor automatically when sending a check in.
	*/
	captureCheckIn(checkIn, monitorConfig, scope) {
		const id = "checkInId" in checkIn && checkIn.checkInId ? checkIn.checkInId : uuid4();
		if (!this._isEnabled()) {
			DEBUG_BUILD && debug.warn("SDK not enabled, will not capture check-in.");
			return id;
		}
		const { release, environment, tunnel } = this.getOptions();
		const serializedCheckIn = {
			check_in_id: id,
			monitor_slug: checkIn.monitorSlug,
			status: checkIn.status,
			release,
			environment
		};
		if ("duration" in checkIn) serializedCheckIn.duration = checkIn.duration;
		if (monitorConfig) serializedCheckIn.monitor_config = {
			schedule: monitorConfig.schedule,
			checkin_margin: monitorConfig.checkinMargin,
			max_runtime: monitorConfig.maxRuntime,
			timezone: monitorConfig.timezone,
			failure_issue_threshold: monitorConfig.failureIssueThreshold,
			recovery_threshold: monitorConfig.recoveryThreshold
		};
		const [dynamicSamplingContext, traceContext] = _getTraceInfoFromScope(this, scope);
		if (traceContext) serializedCheckIn.contexts = { trace: traceContext };
		const envelope = createCheckInEnvelope(serializedCheckIn, dynamicSamplingContext, this.getSdkMetadata(), tunnel, this.getDsn());
		DEBUG_BUILD && debug.log("Sending checkin:", checkIn.monitorSlug, checkIn.status);
		this.sendEnvelope(envelope);
		return id;
	}
	/**
	* @inheritDoc
	*/
	registerCleanup(callback) {
		this._disposeCallbacks.push(callback);
	}
	/**
	* Disposes of the client and releases all resources.
	*
	* This method clears all internal state to allow the client to be garbage collected.
	* It clears hooks, event processors, integrations, transport, and other internal references.
	*
	* Call this method after flushing to allow the client to be garbage collected.
	* After calling dispose(), the client should not be used anymore.
	*
	* Subclasses should override this method to clean up their own resources and call `super.dispose()`.
	*/
	dispose() {
		DEBUG_BUILD && debug.log("Disposing client...");
		for (const callback of this._disposeCallbacks) try {
			callback();
		} catch {}
		this._disposeCallbacks.length = 0;
		for (const hookName of Object.keys(this._hooks)) this._hooks[hookName]?.clear();
		this._hooks = {};
		this._eventProcessors.length = 0;
		this._integrations = {};
		this._outcomes = {};
		this._transport = void 0;
		this._promiseBuffer = makePromiseBuffer(64);
	}
	/**
	* @inheritDoc
	*/
	_prepareEvent(event, hint, currentScope, isolationScope) {
		if (this._options.platform) event.platform = event.platform || this._options.platform;
		if (this._options.runtime) event.contexts = {
			...event.contexts,
			runtime: event.contexts?.runtime || this._options.runtime
		};
		if (this._options.serverName) event.server_name = event.server_name || this._options.serverName;
		return super._prepareEvent(event, hint, currentScope, isolationScope);
	}
	/**
	* Process a server-side metric before it is captured.
	*/
	_setUpMetricsProcessing() {
		this.on("processMetric", (metric) => {
			if (this._options.serverName) metric.attributes = {
				"server.address": this._options.serverName,
				...metric.attributes
			};
		});
	}
};
function setCurrentRequestSessionErroredOrCrashed(eventHint) {
	const requestSession = getIsolationScope().getScopeData().sdkProcessingMetadata.requestSession;
	if (requestSession) {
		const isHandledException = eventHint?.mechanism?.handled ?? true;
		if (isHandledException && requestSession.status !== "crashed") requestSession.status = "errored";
		else if (!isHandledException) requestSession.status = "crashed";
	}
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/node-stack-trace.js
function filenameIsInApp(filename, isNative = false) {
	return !(isNative || filename && !filename.startsWith("/") && !filename.match(/^[A-Z]:/) && !filename.startsWith(".") && !filename.match(/^[a-zA-Z]([a-zA-Z0-9.\-+])*:\/\//)) && filename !== void 0 && !filename.includes("node_modules/");
}
function node(getModule) {
	const FILENAME_MATCH = /^\s*[-]{4,}$/;
	const FULL_MATCH = /at (?:async )?(?:(.+?)\s+\()?(?:(.+):(\d+):(\d+)?|([^)]+))\)?/;
	const DATA_URI_MATCH = /at (?:async )?(.+?) \(data:(.*?),/;
	return (line) => {
		const dataUriMatch = line.match(DATA_URI_MATCH);
		if (dataUriMatch) return {
			filename: `<data:${dataUriMatch[2]}>`,
			function: dataUriMatch[1]
		};
		const lineMatch = line.match(FULL_MATCH);
		if (lineMatch) {
			let object;
			let method;
			let functionName;
			let typeName;
			let methodName;
			if (lineMatch[1]) {
				functionName = lineMatch[1];
				let methodStart = functionName.lastIndexOf(".");
				if (functionName[methodStart - 1] === ".") methodStart--;
				if (methodStart > 0) {
					object = functionName.slice(0, methodStart);
					method = functionName.slice(methodStart + 1);
					const objectEnd = object.indexOf(".Module");
					if (objectEnd > 0) {
						functionName = functionName.slice(objectEnd + 1);
						object = object.slice(0, objectEnd);
					}
				}
				typeName = void 0;
			}
			if (method) {
				typeName = object;
				methodName = method;
			}
			if (method === "<anonymous>") {
				methodName = void 0;
				functionName = void 0;
			}
			if (functionName === void 0) {
				methodName = methodName || "?";
				functionName = typeName ? `${typeName}.${methodName}` : methodName;
			}
			let filename = normalizeStackTracePath(lineMatch[2]);
			const isNative = lineMatch[5] === "native";
			if (!filename && lineMatch[5] && !isNative) filename = lineMatch[5];
			const maybeDecodedFilename = filename ? _safeDecodeURI(filename) : void 0;
			return {
				filename: maybeDecodedFilename ?? filename,
				module: maybeDecodedFilename && getModule?.(maybeDecodedFilename),
				function: functionName,
				lineno: _parseIntOrUndefined(lineMatch[3]),
				colno: _parseIntOrUndefined(lineMatch[4]),
				in_app: filenameIsInApp(filename || "", isNative)
			};
		}
		if (line.match(FILENAME_MATCH)) return { filename: line };
	};
}
function nodeStackLineParser(getModule) {
	return [90, node(getModule)];
}
function _parseIntOrUndefined(input) {
	return parseInt(input || "", 10) || void 0;
}
function _safeDecodeURI(filename) {
	try {
		return decodeURI(filename);
	} catch {
		return;
	}
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/vercelWaitUntil.js
function vercelWaitUntil(task) {
	if (typeof EdgeRuntime !== "string") return;
	const ctx = GLOBAL_OBJ[/* @__PURE__ */ Symbol.for("@vercel/request-context")]?.get?.();
	if (ctx?.waitUntil) ctx.waitUntil(task);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/flushIfServerless.js
async function flushWithTimeout(timeout) {
	try {
		debug.log("Flushing events...");
		await flush(timeout);
		debug.log("Done flushing events");
	} catch (e) {
		debug.log("Error while flushing events:\n", e);
	}
}
async function flushIfServerless(params = {}) {
	const { timeout = 2e3 } = params;
	if ("cloudflareWaitUntil" in params && typeof params?.cloudflareWaitUntil === "function") {
		params.cloudflareWaitUntil(flushWithTimeout(timeout));
		return;
	}
	if ("cloudflareCtx" in params && typeof params.cloudflareCtx?.waitUntil === "function") {
		params.cloudflareCtx.waitUntil(flushWithTimeout(timeout));
		return;
	}
	if (GLOBAL_OBJ[/* @__PURE__ */ Symbol.for("@vercel/request-context")]) {
		vercelWaitUntil(flushWithTimeout(timeout));
		return;
	}
	if (typeof process === "undefined") return;
	if (!!process.env.FUNCTIONS_WORKER_RUNTIME || !!process.env.LAMBDA_TASK_ROOT || !!process.env.K_SERVICE || !!process.env.CF_PAGES || !!process.env.VERCEL || !!process.env.NETLIFY) await flushWithTimeout(timeout);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/get-default-export.js
function getDefaultExport(moduleExport) {
	return !!moduleExport && typeof moduleExport === "object" && "default" in moduleExport && moduleExport.default || moduleExport;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/sql.js
var MAX_SUMMARY_LENGTH = 255;
var TABLE_NAME = /[^\s(,;)]+/.source;
var DDL_RE = new RegExp(`^\\s*(?<operation>(?:CREATE|DROP)\\s+(?:TABLE|INDEX)|ALTER\\s+TABLE)(?:\\s+IF\\s+(?:NOT\\s+)?EXISTS)?\\s+(?<table>${TABLE_NAME})`, "i");
var INSERT_RE = new RegExp(`^\\s*(?<operation>INSERT|REPLACE)(?:\\s+OR\\s+(?:ROLLBACK|ABORT|FAIL|IGNORE|REPLACE))?\\s+INTO\\s+(?<table>${TABLE_NAME})`, "i");
var UPDATE_RE = new RegExp(`^\\s*(?<operation>UPDATE)(?:\\s+OR\\s+(?:ROLLBACK|ABORT|FAIL|IGNORE|REPLACE))?\\s+(?<table>${TABLE_NAME})`, "i");
var DELETE_RE = new RegExp(`^\\s*(?<operation>DELETE)\\s+FROM\\s+(?<table>${TABLE_NAME})`, "i");
var SELECT_RE = /^\s*\(?\s*(?<operation>SELECT)\b/i;
var PRAGMA_RE = /^\s*(?<operation>PRAGMA)\s+(?<command>\S+)/i;
var TOKEN_RE = /\b(?:FROM|JOIN)\s+|\(\s*(SELECT)\b|\b(?:UNION|INTERSECT|EXCEPT|MINUS)\s+(?:ALL\s+)?(SELECT)\b/gi;
var QUOTED_OR_PLAIN_TABLE_RE = /^(?:"[^"]*"|'[^']*'|[^\s(,;)]+)/;
var COMMA_TABLE_RE = /^\s*,\s*((?:"[^"]*"|'[^']*'|[^\s(,;)]+))/;
var SUBQUERY_SELECT_RE = /^\(\s*(SELECT)\b/i;
function getSqlQuerySummary(query) {
	if (!query) return;
	const pragmaMatch = PRAGMA_RE.exec(query);
	if (pragmaMatch?.groups?.["operation"] && pragmaMatch.groups["command"]) {
		const operation = pragmaMatch.groups["operation"];
		const command = pragmaMatch.groups["command"];
		const parenIdx = command.indexOf("(");
		return truncate(`${operation} ${parenIdx >= 0 ? command.substring(0, parenIdx) : command}`);
	}
	const ddlMatch = DDL_RE.exec(query);
	if (ddlMatch?.groups?.["operation"] && ddlMatch.groups["table"]) return truncate(`${ddlMatch.groups["operation"]} ${ddlMatch.groups["table"]}`);
	const insertMatch = INSERT_RE.exec(query);
	if (insertMatch?.groups?.["operation"] && insertMatch.groups["table"]) {
		const parts = [insertMatch.groups["operation"], insertMatch.groups["table"]];
		const rest = query.slice(insertMatch[0].length);
		const subSelect = /\b(SELECT)\b/i.exec(rest);
		if (subSelect?.[1]) {
			parts.push(subSelect[1]);
			const selectTables = extractTableNames(rest.slice(subSelect.index));
			parts.push(...selectTables);
		}
		return truncate(parts.join(" "));
	}
	const updateMatch = UPDATE_RE.exec(query);
	if (updateMatch?.groups?.["operation"] && updateMatch.groups["table"]) return truncate(`${updateMatch.groups["operation"]} ${updateMatch.groups["table"]}`);
	const deleteMatch = DELETE_RE.exec(query);
	if (deleteMatch?.groups?.["operation"] && deleteMatch.groups["table"]) return truncate(`${deleteMatch.groups["operation"]} ${deleteMatch.groups["table"]}`);
	const selectMatch = SELECT_RE.exec(query);
	if (selectMatch?.groups?.["operation"]) {
		const tables = extractTableNames(query.slice(selectMatch[0].length));
		if (tables.length > 0) return truncate(`${selectMatch.groups["operation"]} ${tables.join(" ")}`);
		return selectMatch.groups["operation"];
	}
	return truncate(query.trim().split(/\s+/)[0] ?? query);
}
function extractTableNames(sql) {
	const tables = [];
	TOKEN_RE.lastIndex = 0;
	let match;
	while ((match = TOKEN_RE.exec(sql)) !== null) {
		if (match[1] || match[2]) {
			tables.push(match[1] || match[2]);
			continue;
		}
		const rest = sql.slice(match.index + match[0].length);
		const subqueryMatch = SUBQUERY_SELECT_RE.exec(rest);
		if (subqueryMatch?.[1]) {
			tables.push(subqueryMatch[1]);
			TOKEN_RE.lastIndex = match.index + match[0].length + subqueryMatch[0].length;
			continue;
		}
		const tableMatch = QUOTED_OR_PLAIN_TABLE_RE.exec(rest);
		if (!tableMatch) continue;
		tables.push(tableMatch[0]);
		let afterTable = rest.slice(tableMatch[0].length);
		let commaMatch;
		while ((commaMatch = COMMA_TABLE_RE.exec(afterTable)) !== null) {
			if (!commaMatch[1]) break;
			tables.push(commaMatch[1]);
			afterTable = afterTable.slice(commaMatch[0].length);
		}
	}
	return tables;
}
function truncate(summary) {
	if (summary.length <= MAX_SUMMARY_LENGTH) return summary;
	const truncated = summary.substring(0, MAX_SUMMARY_LENGTH);
	const lastSpace = truncated.lastIndexOf(" ");
	return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
}
var integerLiteralRE;
function findQuotedRunEnd(sql, start, delimiter, backslashEscapes) {
	for (let i = start + 1; i < sql.length; i++) {
		const char = sql[i];
		if (backslashEscapes && char === "\\") i++;
		else if (char === delimiter) {
			if (sql[i + 1] !== delimiter) return i + 1;
			i++;
		}
	}
	return sql.length;
}
function stripLiteralsAndComments(sql, dialect) {
	const isMysql = dialect === "mysql";
	let out = "";
	let i = 0;
	while (i < sql.length) {
		const char = sql[i];
		const next = sql[i + 1];
		if (char === "-" && next === "-" || isMysql && char === "#") {
			const lineEnd = sql.indexOf("\n", i);
			i = lineEnd === -1 ? sql.length : lineEnd;
			continue;
		}
		if (char === "/" && next === "*") {
			const commentEnd = sql.indexOf("*/", i + 2);
			i = commentEnd === -1 ? sql.length : commentEnd + 2;
			continue;
		}
		if (char === "`" || char === "\"" && !isMysql) {
			const runEnd = findQuotedRunEnd(sql, i, char, false);
			out += sql.slice(i, runEnd);
			i = runEnd;
			continue;
		}
		if (char === "'" || char === "\"" && isMysql) {
			const prefix = char === "'" ? getLiteralPrefix(out, isMysql) : void 0;
			out = prefix ? out.slice(0, -1) : out;
			i = findQuotedRunEnd(sql, i, char, isMysql || prefix === "E");
			out += "?";
			continue;
		}
		out += char;
		i++;
	}
	return out;
}
function getLiteralPrefix(out, isMysql) {
	if (/[\w$]/.test(out.slice(-2, -1))) return;
	const prefix = out.slice(-1).toUpperCase();
	if (prefix === "X" || prefix === "B") return prefix;
	return prefix === "E" && !isMysql ? "E" : void 0;
}
function sanitizeSqlQuery(sqlQuery, dialect = "standard") {
	if (!sqlQuery) return "Unknown SQL Query";
	if (!integerLiteralRE) integerLiteralRE = /* @__PURE__ */ new RegExp("(?<!\\$)-?\\b\\d+\\b", "g");
	return stripLiteralsAndComments(sqlQuery, dialect).replace(/;\s*$/, "").replace(/\s+/g, " ").trim().replace(/\b0x[0-9A-Fa-f]+/gi, "?").replace(/\b(?:TRUE|FALSE)\b/gi, "?").replace(/-?\b\d+\.?\d*[eE][+-]?\d+\b/g, "?").replace(/-?\b\d+\.\d+\b/g, "?").replace(/-?\.\d+\b/g, "?").replace(integerLiteralRE, "?").replace(/\bIN\b\s*\(\s*\?(?:\s*,\s*\?)*\s*\)/gi, "IN (?)").replace(/\bIN\b\s*\(\s*\$\d+(?:\s*,\s*\$\d+)*\s*\)/gi, "IN ($?)");
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/postgresjs.js
var SQL_OPERATION_REGEX = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i;
function _reconstructQuery(strings) {
	if (!strings?.length) return;
	if (strings.length === 1) return strings[0] || void 0;
	return strings.reduce((acc, str, i) => i === 0 ? str : `${acc}$${i}${str}`, "");
}
function _getConnectionAttributes(connectionContext) {
	const attributes = {};
	const portNumber = connectionContext.ATTR_SERVER_PORT ? parseInt(connectionContext.ATTR_SERVER_PORT, 10) : void 0;
	const dbNamespace = connectionContext.ATTR_DB_NAMESPACE;
	const serverAddress = connectionContext.ATTR_SERVER_ADDRESS;
	if (dbNamespace) attributes[Ji] = dbNamespace;
	if (serverAddress) attributes[mu] = serverAddress;
	if (portNumber !== void 0 && !isNaN(portNumber)) attributes[bu] = portNumber;
	return attributes;
}
function _getOperationName(sanitizedQuery, command) {
	if (command) return command;
	return (sanitizedQuery?.match(SQL_OPERATION_REGEX))?.[1]?.toUpperCase();
}
function _buildConnectionContext(options) {
	const host = options.host?.[0] || "localhost";
	const port = options.port?.[0] || 5432;
	return {
		ATTR_DB_NAMESPACE: typeof options.database === "string" && options.database !== "" ? options.database : void 0,
		ATTR_SERVER_ADDRESS: host,
		ATTR_SERVER_PORT: String(port)
	};
}
var HTTP_ON_CLIENT_REQUEST = "http.client.request.created";
var HTTP_ON_SERVER_REQUEST = "http.server.request.start";
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/http/get-request-url.js
function getRequestOptions(request) {
	const hostWithPort = request.host || "";
	const portInHost = /^(.*):(\d+)$/.exec(hostWithPort);
	const hostname = portInHost ? portInHost[1] : hostWithPort;
	const port = request.port ?? (portInHost ? Number(portInHost[2]) : void 0);
	return {
		method: request.method,
		port,
		protocol: request.protocol,
		host: request.host,
		hostname,
		path: request.path,
		headers: request.getHeaders()
	};
}
function getRequestUrl(requestOptions) {
	try {
		return String(getRequestUrlObject(requestOptions));
	} catch {
		return "";
	}
}
function getRequestUrlObject(requestOptions) {
	const protocol = requestOptions.protocol || "http:";
	const hostname = requestOptions.headers?.host && String(requestOptions.headers?.host) || requestOptions.hostname || requestOptions.host || "";
	const port = !requestOptions.port || requestOptions.port === 80 || requestOptions.port === 443 || /^(.*):(\d+)$/.test(hostname) ? "" : `:${requestOptions.port}`;
	const path = requestOptions.path ? requestOptions.path : "/";
	const base = `${protocol}//${hostname}${port}`;
	return new URL(path.startsWith("//") ? `${base}${path}` : path, base);
}
function getRequestUrlFromClientRequest(request) {
	return String(getRequestUrl(getRequestOptions(request)));
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/http/add-outgoing-request-breadcrumb.js
function addOutgoingRequestBreadcrumb(request, response) {
	const parsedUrl = parseUrl(getRequestUrlFromClientRequest(request));
	const statusCode = response?.statusCode;
	const level = getBreadcrumbLogLevelFromHttpStatusCode(statusCode);
	addBreadcrumb({
		category: "http",
		data: {
			status_code: statusCode,
			url: getSanitizedUrlString(parsedUrl),
			[js]: request.method || "GET",
			[im]: filterCollectedUrlQuery(getUrlQuery(parsedUrl.search)),
			[Xu]: getUrlFragment(parsedUrl.hash)
		},
		type: "http",
		level
	}, {
		event: "response",
		request,
		response
	});
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/http/get-outgoing-span-data.js
function getOutgoingRequestSpanData(request) {
	const url = getRequestUrlFromClientRequest(request);
	const urlObject = parseStringToURLObject(url);
	const [name, attributes] = getHttpSpanDetailsFromUrlObject(urlObject, "client", "auto.http.client", request);
	const userAgent = request.getHeader("user-agent");
	const client = getClient();
	const method = request.method?.toUpperCase();
	const domain = urlObject && !isURLObjectRelative(urlObject) ? urlObject.hostname : void 0;
	const streamedName = method ? domain ? `${method} ${domain}` : method : HTTP_SPAN_NAME_FALLBACK;
	return {
		name: !!client && hasSpanStreamingEnabled(client) ? streamedName : name,
		attributes: {
			[Ed]: Ze,
			[dd]: "client",
			[Ju]: filterCollectedUrl(url),
			[mu]: request.host,
			[bu]: typeof request.port === "number" && !isNaN(request.port) ? request.port : void 0,
			[sm]: userAgent || void 0,
			...attributes
		},
		onlyIfParent: true
	};
}
function setIncomingResponseSpanData(response, span) {
	const { statusCode, statusMessage, httpVersion, socket } = response;
	const transport = httpVersion?.toUpperCase() !== "QUIC" ? "tcp" : "udp";
	span.setAttributes({
		[oo]: statusCode,
		[lp]: "http",
		[pp]: httpVersion,
		[cp]: transport,
		"http.response.status_text": statusMessage?.toUpperCase(),
		[to]: getContentLengthFromHeaders(response.headers),
		...getSocketAttrs(socket)
	});
}
function getSocketAttrs(socket) {
	if (!socket) return {};
	const { localAddress, localPort, remoteAddress, remotePort } = socket;
	return {
		[np]: localAddress,
		[rp]: localPort,
		[sp]: remoteAddress,
		[op]: remotePort
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/http/inject-trace-propagation-headers.js
function injectTracePropagationHeaders(request, propagationDecisionMap) {
	const url = getRequestUrlFromClientRequest(request);
	const { tracePropagationTargets, propagateTraceparent } = getClient()?.getOptions() ?? {};
	if (!shouldPropagateTraceForUrl(url, tracePropagationTargets, propagationDecisionMap)) return;
	if (!!request.getHeader("sentry-trace")) return;
	const traceData = getTraceData({ propagateTraceparent });
	if (!traceData) return;
	const { "sentry-trace": sentryTrace, baggage, traceparent } = traceData;
	if (sentryTrace) try {
		request.setHeader("sentry-trace", sentryTrace);
		DEBUG_BUILD && debug.log("@sentry/instrumentation-http", "Added sentry-trace header");
	} catch (e) {
		DEBUG_BUILD && debug.error("@sentry/instrumentation-http", "Failed to set sentry-trace header:", isError(e) ? e.message : "Unknown error");
	}
	if (traceparent && !request.getHeader("traceparent")) try {
		request.setHeader("traceparent", traceparent);
		DEBUG_BUILD && debug.log("@sentry/instrumentation-http", "Added traceparent header");
	} catch (e) {
		DEBUG_BUILD && debug.error("@sentry/instrumentation-http", "Failed to set traceparent header:", isError(e) ? e.message : "Unknown error");
	}
	if (baggage) {
		const merged = mergeBaggageHeaders(request.getHeader("baggage"), baggage);
		if (merged) try {
			request.setHeader("baggage", merged);
			DEBUG_BUILD && debug.log("@sentry/instrumentation-http", "Added baggage header");
		} catch (e) {
			DEBUG_BUILD && debug.error("@sentry/instrumentation-http", "Failed to set baggage header:", isError(e) ? e.message : "Unknown error");
		}
	}
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/http/double-wrap-warning.js
var isOtelWrapped = (fn) => typeof fn.__unwrap === "function";
var warning = "Double-wrapped http.client detected. Either disable spans in Sentry.httpIntegration, or disable the OpenTelemetry HTTP instrumentation. See: https://docs.sentry.io/platforms/javascript/guides/express/opentelemetry/custom-setup/#custom-http-instrumentation";
var didDoubleWrapWarning = false;
var doubleWrapWarning = DEBUG_BUILD ? (http) => {
	if (!didDoubleWrapWarning) {
		if (isOtelWrapped(http.request) || isOtelWrapped(http.get)) {
			didDoubleWrapWarning = true;
			debug.warn(warning);
		}
	}
} : () => {};
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/http/client-subscriptions.js
function getHttpClientSubscriptions(options) {
	const propagationDecisionMap = new LRUMap(100);
	const getConfig = () => getClient()?.getOptions();
	const onHttpClientRequestCreated = (data) => {
		if (isTracingSuppressed()) return;
		const clientOptions = getConfig();
		const { errorMonitor = "error", spans: createSpans = clientOptions ? hasSpansEnabled(clientOptions) : true, tracePropagation = false, breadcrumbs = true, http, https, suppressOtelWarning = false } = options;
		const { request } = data;
		if (options.ignoreOutgoingRequests?.(getRequestUrlFromClientRequest(request), request)) return;
		let addedBreadcrumbs = false;
		function addBreadcrumbs(request2, response) {
			if (!addedBreadcrumbs) {
				addedBreadcrumbs = true;
				addOutgoingRequestBreadcrumb(request2, response);
			}
		}
		function breadcrumbsOnly(request2) {
			request2.on(errorMonitor, () => addBreadcrumbs(request2, void 0));
			request2.prependListener("response", (response) => {
				if (request2.listenerCount("response") <= 1) response.resume();
				response.on("end", () => addBreadcrumbs(request2, response));
				response.on(errorMonitor, () => addBreadcrumbs(request2, response));
			});
		}
		if (!createSpans) {
			if (breadcrumbs) breadcrumbsOnly(request);
			if (tracePropagation) injectTracePropagationHeaders(request, propagationDecisionMap);
			return;
		}
		if (!suppressOtelWarning) {
			if (http) doubleWrapWarning(http);
			if (https) doubleWrapWarning(https);
		}
		const span = startInactiveSpan(getOutgoingRequestSpanData(request));
		options.outgoingRequestHook?.(span, request);
		if (tracePropagation) {
			if (span.isRecording()) withActiveSpan(span, () => {
				injectTracePropagationHeaders(request, propagationDecisionMap);
			});
			else injectTracePropagationHeaders(request, propagationDecisionMap);
		}
		let spanEnded = false;
		function endSpan(status) {
			if (!spanEnded) {
				spanEnded = true;
				span.setStatus(status);
				span.end();
			}
		}
		const requestOnClose = () => endSpan({ code: 0 });
		request.on("close", requestOnClose);
		request.on(errorMonitor, (error) => {
			DEBUG_BUILD && debug.log("@sentry/instrumentation-http", "outgoingRequest on request error()", error);
			if (breadcrumbs) addBreadcrumbs(request, void 0);
			endSpan({ code: 2 });
		});
		request.prependListener("response", (response) => {
			request.removeListener("close", requestOnClose);
			if (request.listenerCount("response") <= 1) response.resume();
			setIncomingResponseSpanData(response, span);
			bindScopeToEmitter(response);
			options.outgoingResponseHook?.(span, response);
			let finished = false;
			function finishWithResponse(error) {
				if (!finished) {
					finished = true;
					if (error) DEBUG_BUILD && debug.log("@sentry/instrumentation-http", "outgoingRequest on response error()", error);
					if (breadcrumbs) addBreadcrumbs(request, response);
					const aborted = response.aborted && !response.complete;
					const status = error || typeof response.statusCode !== "number" || aborted ? { code: 2 } : getSpanStatusFromHttpCode(response.statusCode);
					options.applyCustomAttributesOnSpan?.(span, request, response);
					endSpan(status);
				}
			}
			response.on("end", () => finishWithResponse());
			response.on(errorMonitor, finishWithResponse);
		});
	};
	return { [HTTP_ON_CLIENT_REQUEST]: onHttpClientRequestCreated };
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/http/client-patch.js
var onHttpClientRequestCreated;
function patchClientRequest(httpModule, options) {
	const proto = httpModule.ClientRequest?.prototype;
	if (typeof proto?._storeHeader !== "function") return;
	onHttpClientRequestCreated = getHttpClientSubscriptions({
		...options,
		http: httpModule
	})[HTTP_ON_CLIENT_REQUEST];
	if (getOriginalFunction(proto._storeHeader)) return;
	const originalStoreHeader = proto._storeHeader;
	wrapMethod(proto, "_storeHeader", function patchedStoreHeader(...args) {
		try {
			onHttpClientRequestCreated({ request: this }, HTTP_ON_CLIENT_REQUEST);
		} catch {}
		return originalStoreHeader.apply(this, args);
	});
}
function patchModule(httpModuleExport, options = {}) {
	patchClientRequest(getDefaultExport(httpModuleExport), options);
	return httpModuleExport;
}
var patchHttpModuleClient = (httpModuleExport, options = {}) => patchModule(httpModuleExport, options);
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/http/patch-request-to-capture-body.js
function patchRequestToCaptureBody(req, isolationScope, maxIncomingRequestBodySize, integrationName) {
	let bodyByteLength = 0;
	const chunks = [];
	DEBUG_BUILD && debug.log(integrationName, "Patching request.on");
	const callbackMap = /* @__PURE__ */ new WeakMap();
	const maxBodySize = getMaxBodyByteLength(maxIncomingRequestBodySize);
	try {
		req.on = req.addListener = new Proxy(req.on, { apply: (target, thisArg, args) => {
			const [event, listener, ...restArgs] = args;
			if (event === "data") {
				DEBUG_BUILD && debug.log(integrationName, `Handling request.on("data") with maximum body size of ${maxBodySize}b`);
				const callback = new Proxy(listener, { apply: (target2, thisArg2, args2) => {
					try {
						const chunk = args2[0];
						const bufferifiedChunk = Buffer.from(chunk);
						if (bodyByteLength < maxBodySize) {
							chunks.push(bufferifiedChunk);
							bodyByteLength += bufferifiedChunk.byteLength;
						} else if (DEBUG_BUILD) debug.log(integrationName, `Dropping request body chunk because maximum body length of ${maxBodySize}b is exceeded.`);
					} catch {
						DEBUG_BUILD && debug.error(integrationName, "Encountered error while storing body chunk.");
					}
					return Reflect.apply(target2, thisArg2, args2);
				} });
				callbackMap.set(listener, callback);
				return Reflect.apply(target, thisArg, [
					event,
					callback,
					...restArgs
				]);
			}
			return Reflect.apply(target, thisArg, args);
		} });
		req.off = req.removeListener = new Proxy(req.off, { apply: (target, thisArg, args) => {
			const [, listener] = args;
			const callback = callbackMap.get(listener);
			if (callback) {
				callbackMap.delete(listener);
				const modifiedArgs = args.slice();
				modifiedArgs[1] = callback;
				return Reflect.apply(target, thisArg, modifiedArgs);
			}
			return Reflect.apply(target, thisArg, args);
		} });
		req.on("end", () => {
			try {
				const body = Buffer.concat(chunks).toString("utf-8");
				if (body) {
					const truncatedBody = Buffer.byteLength(body, "utf-8") > maxBodySize ? `${Buffer.from(body).subarray(0, maxBodySize - 3).toString("utf-8")}...` : body;
					isolationScope.setSDKProcessingMetadata({ normalizedRequest: { data: truncatedBody } });
				}
			} catch (error) {
				if (DEBUG_BUILD) debug.error(integrationName, "Error building captured request body", error);
			}
		});
	} catch (error) {
		if (DEBUG_BUILD) debug.error(integrationName, "Error patching request to capture body", error);
	}
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/http/record-request-session.js
var clientToRequestSessionAggregatesMap = /* @__PURE__ */ new WeakMap();
function recordRequestSession(client, { requestIsolationScope, response, sessionFlushingDelayMS }) {
	requestIsolationScope.setSDKProcessingMetadata({ requestSession: { status: "ok" } });
	response.once("close", () => {
		const requestSession = requestIsolationScope.getScopeData().sdkProcessingMetadata.requestSession;
		if (client && requestSession) {
			DEBUG_BUILD && debug.log(`Recorded request session with status: ${requestSession.status}`);
			const roundedDate = new Date(safeDateNow());
			roundedDate.setSeconds(0, 0);
			const dateBucketKey = roundedDate.toISOString();
			const existingClientAggregate = clientToRequestSessionAggregatesMap.get(client);
			const bucket = existingClientAggregate?.[dateBucketKey] || {
				exited: 0,
				crashed: 0,
				errored: 0
			};
			bucket[{
				ok: "exited",
				crashed: "crashed",
				errored: "errored"
			}[requestSession.status]]++;
			if (existingClientAggregate) existingClientAggregate[dateBucketKey] = bucket;
			else {
				DEBUG_BUILD && debug.log("Opened new request session aggregate.");
				const newClientAggregate = { [dateBucketKey]: bucket };
				clientToRequestSessionAggregatesMap.set(client, newClientAggregate);
				const flushPendingClientAggregates = () => {
					clearTimeout(timeout);
					unregisterClientFlushHook();
					clientToRequestSessionAggregatesMap.delete(client);
					const aggregatePayload = Object.entries(newClientAggregate).map(([timestamp, value]) => ({
						started: timestamp,
						exited: value.exited,
						errored: value.errored,
						crashed: value.crashed
					}));
					client.sendSession({ aggregates: aggregatePayload });
				};
				const unregisterClientFlushHook = client.on("flush", () => {
					DEBUG_BUILD && debug.log("Sending request session aggregate due to client flush");
					flushPendingClientAggregates();
				});
				const timeout = setTimeout(() => {
					DEBUG_BUILD && debug.log("Sending request session aggregate due to flushing schedule");
					flushPendingClientAggregates();
				}, sessionFlushingDelayMS);
				safeUnref(timeout);
			}
		}
	});
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/http/server-subscription.js
var INTEGRATION_NAME = "Http.Server";
var SPANS_INTEGRATION_NAME = "Http.SentryServerSpans";
var lastSentryEmitMap = /* @__PURE__ */ new WeakMap();
var kRequestMark = /* @__PURE__ */ Symbol.for("sentry_http_server_instrumented");
function markRequest(request) {
	return !request[kRequestMark] && (request[kRequestMark] = true);
}
function instrumentServer(options, server) {
	const currentEmit = server.emit;
	if (currentEmit === lastSentryEmitMap.get(server)) return;
	const newEmit = new Proxy(currentEmit, { apply(target, thisArg, args) {
		const [event, ...data] = args;
		if (event !== "request") return target.apply(thisArg, args);
		const client = getClient();
		const [request, response] = data;
		if (!client || !markRequest(request)) return target.apply(thisArg, args);
		DEBUG_BUILD && debug.log(INTEGRATION_NAME, "Handling incoming request");
		const isolationScope = getIsolationScope().clone();
		isolationScope.setClient(client);
		const ipAddress = request.socket?.remoteAddress;
		const url = request.url || "/";
		const normalizedRequest = httpRequestToRequestData(request);
		const { maxRequestBodySize: configuredBodySize, ignoreRequestBody, sessions = true, sessionFlushingDelayMS = 6e4 } = options;
		const effectiveBodySize = configuredBodySize ?? (client.getDataCollectionOptions().httpBodies.includes("incomingRequest") ? "medium" : "none");
		if (effectiveBodySize !== "none" && !ignoreRequestBody?.(url, request)) patchRequestToCaptureBody(request, isolationScope, effectiveBodySize, INTEGRATION_NAME);
		isolationScope.setSDKProcessingMetadata({
			normalizedRequest,
			ipAddress
		});
		const bestEffortTransactionName = `${(request.method || "GET").toUpperCase()} ${stripUrlQueryAndFragment(url)}`;
		isolationScope.setTransactionName(bestEffortTransactionName);
		if (sessions) recordRequestSession(client, {
			requestIsolationScope: isolationScope,
			response,
			sessionFlushingDelayMS: sessionFlushingDelayMS ?? 6e4
		});
		return withIsolationScope(isolationScope, () => {
			const sentryTrace = normalizedRequest.headers?.["sentry-trace"];
			const baggage = normalizedRequest.headers?.["baggage"];
			const sentryTraceValue = Array.isArray(sentryTrace) ? sentryTrace[0] : sentryTrace;
			return continueTrace({
				sentryTrace: sentryTraceValue,
				baggage: Array.isArray(baggage) ? baggage[0] : baggage
			}, () => {
				const propagationContext = getCurrentScope().getPropagationContext();
				propagationContext.propagationSpanId = generateSpanId();
				if (!sentryTraceValue) {
					propagationContext.traceId = generateTraceId();
					propagationContext.sampleRand = safeMathRandom();
				}
				response.once("close", () => {
					isolationScope.setContext("response", { status_code: response.statusCode });
				});
				const wrap = options.wrapServerEmitRequest;
				let emitResult = false;
				if (wrap) wrap(request, response, normalizedRequest, () => {
					emitResult = target.apply(thisArg, args);
				});
				else emitResult = target.apply(thisArg, args);
				return emitResult;
			});
		});
	} });
	lastSentryEmitMap.set(server, newEmit);
	server.emit = newEmit;
}
function getHttpServerSubscriptions(options) {
	const userWrap = options.wrapServerEmitRequest;
	const spanWrap = buildServerSpanWrap(options);
	const effectiveOptions = {
		...options,
		wrapServerEmitRequest(request, response, normalizedRequest, next) {
			const clientOptions = getClient()?.getOptions();
			if (options.spans ?? (clientOptions ? hasSpansEnabled(clientOptions) : false)) spanWrap(request, response, normalizedRequest, next);
			else if (userWrap) userWrap(request, response, normalizedRequest, next);
			else next();
		}
	};
	const onHttpServerRequest = (data) => {
		const { server } = data;
		instrumentServer(effectiveOptions, server);
	};
	return { [HTTP_ON_SERVER_REQUEST]: onHttpServerRequest };
}
function buildServerSpanWrap(options) {
	const { wrapServerEmitRequest: userWrap, ignoreIncomingRequests, ignoreStaticAssets = true, onSpanCreated, errorMonitor = "error", onSpanEnd } = options;
	return (request, response, normalizedRequest, next) => {
		if (typeof __SENTRY_TRACING__ !== "undefined" && !__SENTRY_TRACING__) return next();
		return userWrap ? userWrap(request, response, normalizedRequest, createSpan) : createSpan();
		function createSpan() {
			const client = getIsolationScope().getClient();
			if (!client) return next();
			const dataCollectionOptions = client.getDataCollectionOptions();
			if (shouldIgnoreSpansForIncomingRequest(request, {
				ignoreStaticAssets,
				ignoreIncomingRequests
			})) {
				DEBUG_BUILD && debug.log(SPANS_INTEGRATION_NAME, "Skipping span creation for incoming request", request.url);
				return next();
			}
			const fullUrl = normalizedRequest.url || request.url || "/";
			const urlObj = parseStringToURLObject(fullUrl);
			const httpTargetWithoutQueryFragment = urlObj ? urlObj.pathname : stripUrlQueryAndFragment(fullUrl);
			const method = (request.method || "GET").toUpperCase();
			const name = hasSpanStreamingEnabled(client) ? request.method?.toUpperCase() || "HTTP" : `${method} ${httpTargetWithoutQueryFragment}`;
			const headers = request.headers;
			const userAgent = headers["user-agent"];
			const ips = headers["x-forwarded-for"];
			const httpVersion = request.httpVersion;
			const hostname = headers.host?.replace(/^(.*)(:[0-9]{1,5})/, "$1") || "localhost";
			const scheme = fullUrl.startsWith("https") ? "https" : "http";
			const { socket } = request;
			const { localAddress, localPort, remoteAddress, remotePort } = socket ?? {};
			const collectClientAddress = client.getDataCollectionOptions().userInfo;
			const clientAddress = getForwardedClientAddress(ips) ?? remoteAddress;
			return startSpanManual({
				name,
				attributes: {
					[Ed]: eE,
					[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.server",
					[jd]: "url",
					[dd]: "server",
					[mu]: hostname,
					[bu]: localPort,
					[np]: localAddress,
					[rp]: localPort,
					[ai]: collectClientAddress ? clientAddress : void 0,
					[ni]: remotePort,
					[sp]: collectClientAddress ? remoteAddress : void 0,
					[op]: remotePort,
					[ld]: isKnownPrefetchRequest(request) || void 0,
					[Ju]: filterCollectedUrl(fullUrl, client),
					[Zu]: urlObj?.pathname ?? httpTargetWithoutQueryFragment,
					[im]: filterCollectedUrlQuery(getUrlQuery(urlObj?.search), client),
					[Xu]: getUrlFragment(urlObj?.hash),
					[js]: method,
					[lp]: "http",
					[pp]: httpVersion,
					[sm]: userAgent,
					[nm]: scheme,
					[cp]: httpVersion?.toUpperCase() === "QUIC" ? "udp" : "tcp",
					"http.request.body.size": getContentLengthFromHeaders(request.headers),
					...httpHeadersToSpanAttributes(normalizedRequest.headers || {}, dataCollectionOptions)
				}
			}, (span) => {
				onSpanCreated?.(span, request, response);
				let isEnded = false;
				function endSpan(status) {
					if (isEnded) return;
					isEnded = true;
					span.setAttributes({
						"http.response.status_text": response.statusMessage?.toUpperCase(),
						[oo]: response.statusCode,
						...httpHeadersToSpanAttributes(headersToDict(response.headers), dataCollectionOptions, "response")
					});
					span.setStatus(status);
					onSpanEnd?.(span, request, response);
					span.end();
				}
				response.once("close", () => {
					endSpan(getSpanStatusFromHttpCode(response.statusCode));
				});
				response.once(errorMonitor, () => {
					const httpStatus = getSpanStatusFromHttpCode(response.statusCode);
					endSpan(httpStatus.code === 2 ? httpStatus : { code: 2 });
				});
				next();
			});
		}
	};
}
function getForwardedClientAddress(forwardedFor) {
	return typeof forwardedFor === "string" ? forwardedFor.split(",")[0]?.trim() || void 0 : void 0;
}
function shouldIgnoreSpansForIncomingRequest(request, { ignoreStaticAssets, ignoreIncomingRequests }) {
	const urlPath = request.url;
	const method = request.method?.toUpperCase();
	if (method === "OPTIONS" || method === "HEAD" || !urlPath) return true;
	if (ignoreStaticAssets && method === "GET" && isStaticAssetRequest(urlPath)) return true;
	if (ignoreIncomingRequests?.(urlPath, request)) return true;
	return false;
}
function isStaticAssetRequest(urlPath) {
	const path = stripUrlQueryAndFragment(urlPath);
	if (path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|webp|avif)$/)) return true;
	if (path.match(/^\/(robots\.txt|sitemap\.xml|manifest\.json|browserconfig\.xml)$/)) return true;
	return false;
}
function isKnownPrefetchRequest(req) {
	return req.headers["next-router-prefetch"] === "1";
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integrations/http/server-transaction-event.js
var DEFAULT_IGNORE_STATUS_CODES = [
	[401, 404],
	[301, 303],
	[305, 399]
];
function shouldFilterStatusCode(statusCode, dropForStatusCodes) {
	return dropForStatusCodes.some((code) => {
		if (typeof code === "number") return code === statusCode;
		const [min, max] = code;
		return statusCode >= min && statusCode <= max;
	});
}
function processHttpServerTransactionEvent(event, ignoreStatusCodes, spanOrigin) {
	if (event.type !== "transaction") return event;
	if (spanOrigin !== void 0 && event.contexts?.trace?.origin !== spanOrigin) return event;
	const statusCode = event.contexts?.trace?.data?.[oo];
	if (typeof statusCode !== "number") return event;
	if (shouldFilterStatusCode(statusCode, ignoreStatusCodes)) {
		DEBUG_BUILD && debug.log("Dropping transaction due to status code", statusCode);
		return null;
	}
	event.contexts = {
		...event.contexts,
		response: {
			...event.contexts?.response,
			status_code: statusCode
		}
	};
	return event;
}
//#endregion
export { _INTERNAL_flushLogsBuffer as $, SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN as $t, getContentLengthFromHeaders as A, getMainCarrier as An, getActiveSpan as At, parseStringToURLObject as B, mergeBaggageHeaders as Bt, dirname as C, triggerHandlers as Cn, safeSetSpanJSONAttributes as Ct, functionToStringIntegration as D, consoleSandbox as Dn, getIntegrationsToSetup as Dt, eventFiltersIntegration as E, CONSOLE_LEVELS as En, defineIntegration as Et, applySdkMetadata as F, isContinuingTrace as Ft, filterCollectedUrl as G, makeWeakRef as Gt, stripDataUrlContent as H, markSpanAsTracerProviderSpan as Ht, getHttpSpanDetailsFromUrlObject as I, propagationContextFromHeaders as It, _INTERNAL_clearAiProviderSkips as J, SEMANTIC_ATTRIBUTE_CACHE_HIT as Jt, filterCollectedUrlQuery as K, getSpanStatusFromHttpCode as Kt, getSanitizedUrlString as L, shouldContinueTrace as Lt, uniq as M, GLOBAL_OBJ as Mn, spanToJSON as Mt, shouldPropagateTraceForUrl as N, spanToTraceContext as Nt, addBreadcrumb as O, debug as On, hasSpansEnabled as Ot, getTraceData as P, _setSpanForScope as Pt, _INTERNAL_captureLog as Q, SEMANTIC_ATTRIBUTE_SENTRY_OP as Qt, getUrlFragment as R, baggageHeaderToDynamicSamplingContext as Rt, consoleIntegration as S, maybeInstrument as Sn, hasSpanStreamingEnabled as St, linkedErrorsIntegration as T, stackParserFromStackParserOptions as Tn, SentryNonRecordingSpan as Tt, stripUrlQueryAndFragment as U, setCapturedScopesOnSpan as Ut, parseUrl as V, getCapturedScopesOnSpan as Vt, envToBool as W, derefWeakRef as Wt, _INTERNAL_skipAiProviderWrapping as X, SEMANTIC_ATTRIBUTE_CACHE_KEY as Xt, _INTERNAL_shouldSkipAiProviderWrapping as Y, SEMANTIC_ATTRIBUTE_CACHE_ITEM_SIZE as Yt, createTransport as Z, SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME as Zt, nodeStackLineParser as _, safeMathRandom as _n, startSpan as _t, getHttpClientSubscriptions as a, getAsyncContextStrategy as an, setTag as at, getBreadcrumbLogLevelFromHttpStatusCode as b, markFunctionWrapped as bn, withActiveSpan as bt, HTTP_ON_CLIENT_REQUEST as c, getDefaultIsolationScope as cn, REQUEST_HANDLER_SPAN_NAME_FALLBACK as ct, _getConnectionAttributes as d, parseSemver as dn, _INTERNAL_setDeferSegmentSpanCapture as dt, getClient as en, waitForTracingChannelBinding as et, _getOperationName as f, isMatchingPattern as fn, continueTrace as ft, flushIfServerless as g, truncate$1 as gn, startNewTrace as gt, sanitizeSqlQuery as h, stringify as hn, startInactiveSpan as ht, patchHttpModuleClient as i, withScope as in, flush as it, httpHeadersToSpanAttributes as j, SDK_VERSION as jn, getRootSpan as jt, spanKindToName as k, originalConsoleMethods as kn, addChildSpanToSpan as kt, HTTP_ON_SERVER_REQUEST as l, generateTraceId as ln, ROUTER_SPAN_NAME_FALLBACK as lt, getSqlQuerySummary as m, stringMatchesSomePattern as mn, spanIsIgnored as mt, processHttpServerTransactionEvent as n, getGlobalScope as nn, captureMessage as nt, getRequestOptions as o, setAsyncContextStrategy as on, startSession as ot, _reconstructQuery as p, snipLine as pn, isTracingSuppressed as pt, filterKeyValueData as q, setHttpStatus as qt, getHttpServerSubscriptions as r, getIsolationScope as rn, endSession as rt, getRequestUrlFromClientRequest as s, getDefaultCurrentScope as sn, HTTP_SPAN_NAME_FALLBACK as st, DEFAULT_IGNORE_STATUS_CODES as t, getCurrentScope as tn, captureException as tt, _buildConnectionContext as u, timestampInSeconds as un, bindScopeToEmitter as ut, ServerRuntimeClient as v, addNonEnumerableProperty as vn, startSpanManual as vt, requestDataIntegration as w, createStackParser as wn, getDynamicSamplingContextFromSpan as wt, conversationIdIntegration as x, isObjectLike as xn, serializeEnvelope as xt, LRUMap as y, fill as yn, suppressTracing as yt, getUrlQuery as z, dynamicSamplingContextToSentryBaggageHeader as zt };

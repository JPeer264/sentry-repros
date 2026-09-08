import { c as pr, o as L, u as yn } from "./seroval.mjs";
import { S as ye, _ as i, b as le, f as H, g as de, h as Q, m as O, p as M, v as j, x as oe, y as l } from "./seroval-plugins.mjs";
import { AsyncLocalStorage } from "node:async_hooks";
//#region node_modules/solid-js/dist/server.js
var ERROR = Symbol("error");
function castError(err) {
	if (err instanceof Error) return err;
	return new Error(typeof err === "string" ? err : "Unknown error", { cause: err });
}
function handleError(err, owner = Owner) {
	const fns = owner && owner.context && owner.context[ERROR];
	const error = castError(err);
	if (!fns) throw error;
	try {
		for (const f of fns) f(error);
	} catch (e) {
		handleError(e, owner && owner.owner || null);
	}
}
var UNOWNED = {
	context: null,
	owner: null,
	owned: null,
	cleanups: null
};
var Owner = null;
function createOwner() {
	const o = {
		owner: Owner,
		context: Owner ? Owner.context : null,
		owned: null,
		cleanups: null
	};
	if (Owner) {
		if (!Owner.owned) Owner.owned = [o];
		else Owner.owned.push(o);
	}
	return o;
}
function createRoot(fn, detachedOwner) {
	const owner = Owner, current = detachedOwner === void 0 ? owner : detachedOwner, root = fn.length === 0 ? UNOWNED : {
		context: current ? current.context : null,
		owner: current,
		owned: null,
		cleanups: null
	};
	Owner = root;
	let result;
	try {
		result = fn(fn.length === 0 ? () => {} : () => cleanNode(root));
	} catch (err) {
		handleError(err);
	} finally {
		Owner = owner;
	}
	return result;
}
function createSignal(value, options) {
	return [() => value, (v) => {
		return value = typeof v === "function" ? v(value) : v;
	}];
}
function createComputed(fn, value) {
	Owner = createOwner();
	try {
		fn(value);
	} catch (err) {
		handleError(err);
	} finally {
		Owner = Owner.owner;
	}
}
var createRenderEffect = createComputed;
function createEffect(fn, value) {}
function createMemo(fn, value) {
	Owner = createOwner();
	let v;
	try {
		v = fn(value);
	} catch (err) {
		handleError(err);
	} finally {
		Owner = Owner.owner;
	}
	return () => v;
}
function batch(fn) {
	return fn();
}
var untrack = batch;
function on(deps, fn, options = {}) {
	const isArray = Array.isArray(deps);
	const defer = options.defer;
	return () => {
		if (defer) return void 0;
		let value;
		if (isArray) {
			value = [];
			for (let i = 0; i < deps.length; i++) value.push(deps[i]());
		} else value = deps();
		return fn(value);
	};
}
function onCleanup(fn) {
	if (Owner) {
		if (!Owner.cleanups) Owner.cleanups = [fn];
		else Owner.cleanups.push(fn);
	}
	return fn;
}
function cleanNode(node) {
	if (node.owned) {
		for (let i = 0; i < node.owned.length; i++) cleanNode(node.owned[i]);
		node.owned = null;
	}
	if (node.cleanups) {
		for (let i = 0; i < node.cleanups.length; i++) node.cleanups[i]();
		node.cleanups = null;
	}
}
function catchError(fn, handler) {
	const owner = createOwner();
	owner.context = {
		...owner.context,
		[ERROR]: [handler]
	};
	Owner = owner;
	try {
		return fn();
	} catch (err) {
		handleError(err);
	} finally {
		Owner = Owner.owner;
	}
}
function createContext(defaultValue) {
	const id = Symbol("context");
	return {
		id,
		Provider: createProvider(id),
		defaultValue
	};
}
function useContext(context) {
	return Owner && Owner.context && Owner.context[context.id] !== void 0 ? Owner.context[context.id] : context.defaultValue;
}
function getOwner() {
	return Owner;
}
function children(fn) {
	const memo = createMemo(() => resolveChildren(fn()));
	memo.toArray = () => {
		const c = memo();
		return Array.isArray(c) ? c : c != null ? [c] : [];
	};
	return memo;
}
function runWithOwner(o, fn) {
	const prev = Owner;
	Owner = o;
	try {
		return fn();
	} catch (err) {
		handleError(err);
	} finally {
		Owner = prev;
	}
}
function resolveChildren(children) {
	if (typeof children === "function" && !children.length) return resolveChildren(children());
	if (Array.isArray(children)) {
		const results = [];
		for (let i = 0; i < children.length; i++) {
			const result = resolveChildren(children[i]);
			if (Array.isArray(result)) {
				if (result.length < 32768) results.push.apply(results, result);
				else for (let j = 0; j < result.length; j++) results.push(result[j]);
			} else results.push(result);
		}
		return results;
	}
	return children;
}
function createProvider(id) {
	return function provider(props) {
		return createMemo(() => {
			Owner.context = {
				...Owner.context,
				[id]: props.value
			};
			return children(() => props.children);
		});
	};
}
function escape$1(s, attr) {
	const t = typeof s;
	if (t !== "string") {
		if (t === "function") return escape$1(s());
		if (Array.isArray(s)) {
			for (let i = 0; i < s.length; i++) s[i] = escape$1(s[i]);
			return s;
		}
		return s;
	}
	const delim = "<";
	const escDelim = "&lt;";
	let iDelim = s.indexOf(delim);
	let iAmp = s.indexOf("&");
	if (iDelim < 0 && iAmp < 0) return s;
	let left = 0, out = "";
	while (iDelim >= 0 && iAmp >= 0) if (iDelim < iAmp) {
		if (left < iDelim) out += s.substring(left, iDelim);
		out += escDelim;
		left = iDelim + 1;
		iDelim = s.indexOf(delim, left);
	} else {
		if (left < iAmp) out += s.substring(left, iAmp);
		out += "&amp;";
		left = iAmp + 1;
		iAmp = s.indexOf("&", left);
	}
	if (iDelim >= 0) do {
		if (left < iDelim) out += s.substring(left, iDelim);
		out += escDelim;
		left = iDelim + 1;
		iDelim = s.indexOf(delim, left);
	} while (iDelim >= 0);
	else while (iAmp >= 0) {
		if (left < iAmp) out += s.substring(left, iAmp);
		out += "&amp;";
		left = iAmp + 1;
		iAmp = s.indexOf("&", left);
	}
	return left < s.length ? out + s.substring(left) : out;
}
function resolveSSRNode$1(node) {
	const t = typeof node;
	if (t === "string") return node;
	if (node == null || t === "boolean") return "";
	if (Array.isArray(node)) {
		let prev = {};
		let mapped = "";
		for (let i = 0, len = node.length; i < len; i++) {
			if (typeof prev !== "object" && typeof node[i] !== "object") mapped += `<!--!$-->`;
			mapped += resolveSSRNode$1(prev = node[i]);
		}
		return mapped;
	}
	if (t === "object") return node.t;
	if (t === "function") return resolveSSRNode$1(node());
	return String(node);
}
var sharedConfig = {
	context: void 0,
	getContextId() {
		if (!this.context) throw new Error(`getContextId cannot be used under non-hydrating context`);
		return getContextId(this.context.count);
	},
	getNextContextId() {
		if (!this.context) throw new Error(`getNextContextId cannot be used under non-hydrating context`);
		return getContextId(this.context.count++);
	}
};
function getContextId(count) {
	const num = String(count), len = num.length - 1;
	return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
}
function setHydrateContext(context) {
	sharedConfig.context = context;
}
function nextHydrateContext() {
	return sharedConfig.context ? {
		...sharedConfig.context,
		id: sharedConfig.getNextContextId(),
		count: 0
	} : void 0;
}
function createComponent(Comp, props) {
	if (sharedConfig.context && !sharedConfig.context.noHydrate) {
		const c = sharedConfig.context;
		setHydrateContext(nextHydrateContext());
		const r = Comp(props || {});
		setHydrateContext(c);
		return r;
	}
	return Comp(props || {});
}
function mergeProps(...sources) {
	const target = {};
	for (let i = 0; i < sources.length; i++) {
		let source = sources[i];
		if (typeof source === "function") source = source();
		if (source) {
			const descriptors = Object.getOwnPropertyDescriptors(source);
			for (const key in descriptors) {
				if (key === "__proto__" || key === "constructor" || Object.prototype.hasOwnProperty.call(target, key)) continue;
				Object.defineProperty(target, key, {
					enumerable: true,
					get() {
						for (let i = sources.length - 1; i >= 0; i--) {
							let v, s = sources[i];
							if (typeof s === "function") s = s();
							v = (s || {})[key];
							if (v !== void 0) return v;
						}
					}
				});
			}
		}
	}
	return target;
}
function Show(props) {
	let c;
	return props.when ? typeof (c = props.children) === "function" && c.length > 0 ? c(props.keyed ? props.when : () => props.when) : c : props.fallback || "";
}
function resetErrorBoundaries() {}
function ErrorBoundary(props) {
	let error, res, clean, sync = true;
	const ctx = sharedConfig.context;
	const id = sharedConfig.getContextId();
	function displayFallback() {
		cleanNode(clean);
		ctx.serialize(id, error);
		setHydrateContext({
			...ctx,
			count: 0
		});
		const f = props.fallback;
		return typeof f === "function" && f.length ? f(error, () => {}) : f;
	}
	createMemo(() => {
		clean = Owner;
		return catchError(() => res = props.children, (err) => {
			error = err;
			!sync && ctx.replace("e" + id, displayFallback);
			sync = true;
		});
	});
	if (error) return displayFallback();
	sync = false;
	return { t: `<!--!$e${id}-->${resolveSSRNode$1(escape$1(res))}<!--!$/e${id}-->` };
}
var SuspenseContext = createContext();
function lazy(fn) {
	let p;
	let load = (id) => {
		if (!p) {
			p = fn();
			p.then((mod) => p.resolved = mod.default);
			if (id) sharedConfig.context.lazy[id] = p;
		}
		return p;
	};
	const contexts = /* @__PURE__ */ new Set();
	const wrap = (props) => {
		const id = sharedConfig.context.id;
		let ref = sharedConfig.context.lazy[id];
		if (ref) p = ref;
		else load(id);
		if (p.resolved) return p.resolved(props);
		const ctx = useContext(SuspenseContext);
		const track = {
			_loading: true,
			error: void 0
		};
		if (ctx) {
			ctx.resources.set(id, track);
			contexts.add(ctx);
		}
		if (sharedConfig.context.async) sharedConfig.context.block(p.then(() => {
			track._loading = false;
			notifySuspense(contexts);
		}));
		return "";
	};
	wrap.preload = load;
	return wrap;
}
function suspenseComplete(c) {
	for (const r of c.resources.values()) if (r._loading) return false;
	return true;
}
function notifySuspense(contexts) {
	for (const c of contexts) {
		if (!suspenseComplete(c)) continue;
		c.completed();
		contexts.delete(c);
	}
}
function startTransition(fn) {
	fn();
}
function Suspense(props) {
	let done;
	const ctx = sharedConfig.context;
	const id = sharedConfig.getContextId();
	const o = createOwner();
	const value = ctx.suspense[id] || (ctx.suspense[id] = {
		resources: /* @__PURE__ */ new Map(),
		completed: () => {
			const res = runSuspense();
			if (suspenseComplete(value)) done(resolveSSRNode$1(escape$1(res)));
		}
	});
	function suspenseError(err) {
		if (!done || !done(void 0, err)) runWithOwner(o.owner, () => {
			throw err;
		});
	}
	function runSuspense() {
		setHydrateContext({
			...ctx,
			count: 0
		});
		cleanNode(o);
		return runWithOwner(o, () => createComponent(SuspenseContext.Provider, {
			value,
			get children() {
				return catchError(() => props.children, suspenseError);
			}
		}));
	}
	const res = runSuspense();
	if (suspenseComplete(value)) {
		delete ctx.suspense[id];
		return res;
	}
	done = ctx.async ? ctx.registerFragment(id) : void 0;
	return catchError(() => {
		if (ctx.async) {
			setHydrateContext({
				...ctx,
				count: 0,
				id: ctx.id + "0F",
				noHydrate: true
			});
			const res = { t: `<template id="pl-${id}"></template>${resolveSSRNode$1(escape$1(props.fallback))}<!--pl-${id}-->` };
			setHydrateContext(ctx);
			return res;
		}
		setHydrateContext({
			...ctx,
			count: 0,
			id: ctx.id + "0F"
		});
		ctx.serialize(id, "$$f");
		return props.fallback;
	}, suspenseError);
}
//#endregion
//#region node_modules/solid-js/web/dist/server.js
var booleans = [
	"allowfullscreen",
	"async",
	"alpha",
	"autofocus",
	"autoplay",
	"checked",
	"controls",
	"default",
	"disabled",
	"formnovalidate",
	"hidden",
	"indeterminate",
	"inert",
	"ismap",
	"loop",
	"multiple",
	"muted",
	"nomodule",
	"novalidate",
	"open",
	"playsinline",
	"readonly",
	"required",
	"reversed",
	"seamless",
	"selected",
	"adauctionheaders",
	"browsingtopics",
	"credentialless",
	"defaultchecked",
	"defaultmuted",
	"defaultselected",
	"defer",
	"disablepictureinpicture",
	"disableremoteplayback",
	"preservespitch",
	"shadowrootclonable",
	"shadowrootcustomelementregistry",
	"shadowrootdelegatesfocus",
	"shadowrootserializable",
	"sharedstoragewritable"
];
var BooleanAttributes = /*#__PURE__*/ new Set(booleans);
[...booleans];
var ChildProperties = /*#__PURE__*/ new Set([
	"innerHTML",
	"textContent",
	"innerText",
	"children"
]);
var Aliases = /*#__PURE__*/ Object.assign(Object.create(null), {
	className: "class",
	htmlFor: "for"
});
var ES2017FLAG = L.AggregateError | L.BigIntTypedArray;
var GLOBAL_IDENTIFIER = "_$HY.r";
function createSerializer({ onData, onDone, scopeId, onError, plugins: customPlugins }) {
	const defaultPlugins = [
		O,
		M,
		H,
		j,
		Q,
		i,
		l,
		oe,
		le,
		ye,
		de
	];
	const allPlugins = customPlugins ? [...customPlugins, ...defaultPlugins] : defaultPlugins;
	return new pr({
		scopeId,
		plugins: allPlugins,
		globalIdentifier: GLOBAL_IDENTIFIER,
		disabledFeatures: ES2017FLAG,
		onData,
		onDone,
		onError
	});
}
function getLocalHeaderScript(id) {
	return yn(id) + ";";
}
var VOID_ELEMENTS = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;
var REPLACE_SCRIPT = `function $df(e,n,o,t){if(n=document.getElementById(e),o=document.getElementById("pl-"+e)){for(;o&&8!==o.nodeType&&o.nodeValue!=="pl-"+e;)t=o.nextSibling,o.remove(),o=t;_$HY.done?o.remove():o.replaceWith(n.content)}n.remove(),_$HY.fe(e)}`;
function renderToString(code, options = {}) {
	const { renderId } = options;
	let scripts = "";
	const serializer = createSerializer({
		scopeId: renderId,
		plugins: options.plugins,
		onData(script) {
			if (!scripts) scripts = getLocalHeaderScript(renderId);
			scripts += script + ";";
		},
		onError: options.onError
	});
	sharedConfig.context = {
		id: renderId || "",
		count: 0,
		suspense: {},
		lazy: {},
		assets: [],
		nonce: options.nonce,
		serialize(id, p) {
			!sharedConfig.context.noHydrate && serializer.write(id, p);
		},
		roots: 0,
		nextRoot() {
			return this.renderId + "i-" + this.roots++;
		}
	};
	let html = createRoot((d) => {
		setTimeout(d);
		return resolveSSRNode(escape(code()));
	});
	sharedConfig.context.noHydrate = true;
	serializer.close();
	html = injectAssets(sharedConfig.context.assets, html);
	if (scripts.length) html = injectScripts(html, scripts, options.nonce);
	return html;
}
function renderToStream(code, options = {}) {
	let { nonce, onCompleteShell, onCompleteAll, renderId, noScripts } = options;
	let dispose;
	const blockingPromises = [];
	const pushTask = (task) => {
		if (noScripts) return;
		if (!tasks && !firstFlushed) tasks = getLocalHeaderScript(renderId);
		tasks += task + ";";
		if (!timer && firstFlushed) timer = setTimeout(writeTasks);
	};
	const onDone = () => {
		writeTasks();
		doShell();
		onCompleteAll && onCompleteAll({ write(v) {
			!completed && buffer.write(v);
		} });
		writable && writable.end();
		completed = true;
		if (firstFlushed) dispose();
	};
	const serializer = createSerializer({
		scopeId: options.renderId,
		plugins: options.plugins,
		onData: pushTask,
		onDone,
		onError: options.onError
	});
	const flushEnd = () => {
		if (!registry.size) queue(() => queue(() => serializer.flush()));
	};
	const registry = /* @__PURE__ */ new Map();
	const writeTasks = () => {
		if (tasks.length && !completed && firstFlushed) {
			buffer.write(`<script${nonce ? ` nonce="${nonce}"` : ""}>${tasks}<\/script>`);
			tasks = "";
		}
		timer && clearTimeout(timer);
		timer = null;
	};
	let context;
	let writable;
	let tmp = "";
	let tasks = "";
	let firstFlushed = false;
	let completed = false;
	let shellCompleted = false;
	let scriptFlushed = false;
	let timer = null;
	let buffer = { write(payload) {
		tmp += payload;
	} };
	sharedConfig.context = context = {
		id: renderId || "",
		count: 0,
		async: true,
		resources: {},
		lazy: {},
		suspense: {},
		assets: [],
		nonce,
		block(p) {
			if (!firstFlushed) blockingPromises.push(p);
		},
		replace(id, payloadFn) {
			if (firstFlushed) return;
			const placeholder = `<!--!$${id}-->`;
			const first = html.indexOf(placeholder);
			if (first === -1) return;
			const last = html.indexOf(`<!--!$/${id}-->`, first + placeholder.length);
			html = html.slice(0, first) + resolveSSRNode(escape(payloadFn())) + html.slice(last + placeholder.length + 1);
		},
		serialize(id, p, wait) {
			const serverOnly = sharedConfig.context.noHydrate;
			if (!firstFlushed && wait && typeof p === "object" && "then" in p) {
				blockingPromises.push(p);
				!serverOnly && p.then((d) => {
					serializer.write(id, d);
				}).catch((e) => {
					serializer.write(id, e);
				});
			} else if (!serverOnly) serializer.write(id, p);
		},
		roots: 0,
		nextRoot() {
			return this.renderId + "i-" + this.roots++;
		},
		registerFragment(key) {
			if (!registry.has(key)) {
				let resolve, reject;
				const p = new Promise((r, rej) => (resolve = r, reject = rej));
				registry.set(key, (err) => queue(() => queue(() => {
					err ? reject(err) : resolve(true);
					queue(flushEnd);
				})));
				serializer.write(key, p);
			}
			return (value, error) => {
				if (registry.has(key)) {
					const resolve = registry.get(key);
					registry.delete(key);
					if (waitForFragments(registry, key)) {
						resolve();
						return;
					}
					if (!completed) {
						if (!firstFlushed) {
							queue(() => html = replacePlaceholder(html, key, value !== void 0 ? value : ""));
							resolve(error);
						} else {
							buffer.write(`<template id="${key}">${value !== void 0 ? value : " "}</template>`);
							pushTask(`$df("${key}")${!scriptFlushed ? ";" + REPLACE_SCRIPT : ""}`);
							resolve(error);
							scriptFlushed = true;
						}
					}
				}
				return firstFlushed;
			};
		}
	};
	let html = createRoot((d) => {
		dispose = d;
		return resolveSSRNode(escape(code()));
	});
	function doShell() {
		if (shellCompleted) return;
		sharedConfig.context = context;
		context.noHydrate = true;
		html = injectAssets(context.assets, html);
		if (tasks.length) html = injectScripts(html, tasks, nonce);
		buffer.write(html);
		tasks = "";
		onCompleteShell && onCompleteShell({ write(v) {
			!completed && buffer.write(v);
		} });
		shellCompleted = true;
	}
	return {
		then(fn) {
			function complete() {
				dispose();
				fn(tmp);
			}
			if (onCompleteAll) {
				let ogComplete = onCompleteAll;
				onCompleteAll = (options) => {
					ogComplete(options);
					complete();
				};
			} else onCompleteAll = complete;
			queue(flushEnd);
		},
		pipe(w) {
			allSettled(blockingPromises).then(() => {
				setTimeout(() => {
					doShell();
					buffer = writable = w;
					buffer.write(tmp);
					firstFlushed = true;
					if (completed) {
						dispose();
						writable.end();
					} else flushEnd();
				});
			});
		},
		pipeTo(w) {
			return allSettled(blockingPromises).then(() => {
				let resolve;
				const p = new Promise((r) => resolve = r);
				setTimeout(() => {
					doShell();
					const encoder = new TextEncoder();
					const writer = w.getWriter();
					writable = { end() {
						writer.releaseLock();
						w.close().catch(() => {});
						resolve();
					} };
					buffer = { write(payload) {
						writer.write(encoder.encode(payload)).catch(() => {});
					} };
					buffer.write(tmp);
					firstFlushed = true;
					if (completed) {
						dispose();
						writable.end();
					} else flushEnd();
				});
				return p;
			});
		}
	};
}
function HydrationScript(props) {
	const { nonce } = sharedConfig.context;
	return ssr(generateHydrationScript({
		nonce,
		...props
	}));
}
function ssr(t, ...nodes) {
	if (nodes.length) {
		let result = "";
		for (let i = 0; i < nodes.length; i++) {
			result += t[i];
			const node = nodes[i];
			if (node !== void 0) result += resolveSSRNode(node);
		}
		t = result + t[nodes.length];
	}
	return { t };
}
function ssrClassList(value) {
	if (!value) return "";
	let classKeys = Object.keys(value), result = "";
	for (let i = 0, len = classKeys.length; i < len; i++) {
		const key = classKeys[i], classValue = !!value[key];
		if (!key || key === "undefined" || !classValue) continue;
		i && (result += " ");
		result += escape(key);
	}
	return result;
}
function ssrStyle(value) {
	if (!value) return "";
	if (typeof value === "string") return escape(value, true);
	let result = "";
	const k = Object.keys(value);
	for (let i = 0; i < k.length; i++) {
		const s = k[i];
		const v = value[s];
		if (v != void 0) {
			if (i) result += ";";
			const r = escape(v, true);
			if (r != void 0 && r !== "undefined") result += `${s}:${r}`;
		}
	}
	return result;
}
function ssrElement(tag, props, children, needsId) {
	if (props == null) props = {};
	else if (typeof props === "function") props = props();
	const skipChildren = VOID_ELEMENTS.test(tag);
	const keys = Object.keys(props);
	let result = `<${tag}${needsId ? ssrHydrationKey() : ""} `;
	let classResolved;
	for (let i = 0; i < keys.length; i++) {
		const prop = keys[i];
		if (ChildProperties.has(prop)) {
			if (children === void 0 && !skipChildren) children = tag === "script" || tag === "style" || prop === "innerHTML" ? props[prop] : escape(props[prop]);
			continue;
		}
		const value = props[prop];
		if (prop === "style") result += `style="${ssrStyle(value)}"`;
		else if (prop === "class" || prop === "className" || prop === "classList") {
			if (classResolved) continue;
			let n;
			result += `class="${escape(((n = props.class) ? n + " " : "") + ((n = props.className) ? n + " " : ""), true) + ssrClassList(props.classList)}"`;
			classResolved = true;
		} else if (BooleanAttributes.has(prop)) {
			if (value) result += prop;
			else continue;
		} else if (value == void 0 || prop === "ref" || prop.slice(0, 2) === "on" || prop.slice(0, 5) === "prop:") continue;
		else if (prop.slice(0, 5) === "bool:") {
			if (!value) continue;
			result += escape(prop.slice(5));
		} else if (prop.slice(0, 5) === "attr:") result += `${escape(prop.slice(5))}="${escape(value, true)}"`;
		else result += `${Aliases[prop] || escape(prop)}="${escape(value, true)}"`;
		if (i !== keys.length - 1) result += " ";
	}
	if (skipChildren) return { t: result + "/>" };
	if (typeof children === "function") children = children();
	return { t: result + `>${resolveSSRNode(children, true)}</${tag}>` };
}
function ssrAttribute(key, value, isBoolean) {
	return isBoolean ? value ? " " + key : "" : value != null ? ` ${key}="${value}"` : "";
}
function ssrHydrationKey() {
	const hk = getHydrationKey();
	return hk ? ` data-hk="${hk}"` : "";
}
function escape(s, attr) {
	const t = typeof s;
	if (t !== "string") {
		if (!attr && t === "function") return escape(s());
		if (!attr && Array.isArray(s)) {
			s = s.slice();
			for (let i = 0; i < s.length; i++) s[i] = escape(s[i]);
			return s;
		}
		if (attr && t === "boolean") return String(s);
		return s;
	}
	const delim = attr ? "\"" : "<";
	const escDelim = attr ? "&quot;" : "&lt;";
	let iDelim = s.indexOf(delim);
	let iAmp = s.indexOf("&");
	if (iDelim < 0 && iAmp < 0) return s;
	let left = 0, out = "";
	while (iDelim >= 0 && iAmp >= 0) if (iDelim < iAmp) {
		if (left < iDelim) out += s.substring(left, iDelim);
		out += escDelim;
		left = iDelim + 1;
		iDelim = s.indexOf(delim, left);
	} else {
		if (left < iAmp) out += s.substring(left, iAmp);
		out += "&amp;";
		left = iAmp + 1;
		iAmp = s.indexOf("&", left);
	}
	if (iDelim >= 0) do {
		if (left < iDelim) out += s.substring(left, iDelim);
		out += escDelim;
		left = iDelim + 1;
		iDelim = s.indexOf(delim, left);
	} while (iDelim >= 0);
	else while (iAmp >= 0) {
		if (left < iAmp) out += s.substring(left, iAmp);
		out += "&amp;";
		left = iAmp + 1;
		iAmp = s.indexOf("&", left);
	}
	return left < s.length ? out + s.substring(left) : out;
}
function resolveSSRNode(node, top) {
	const t = typeof node;
	if (t === "string") return node;
	if (node == null || t === "boolean") return "";
	if (Array.isArray(node)) {
		let prev = {};
		let mapped = "";
		for (let i = 0, len = node.length; i < len; i++) {
			if (!top && typeof prev !== "object" && typeof node[i] !== "object") mapped += `<!--!$-->`;
			mapped += resolveSSRNode(prev = node[i]);
		}
		return mapped;
	}
	if (t === "object") return node.t;
	if (t === "function") return resolveSSRNode(node());
	return String(node);
}
function getHydrationKey() {
	const hydrate = sharedConfig.context;
	return hydrate && !hydrate.noHydrate && sharedConfig.getNextContextId();
}
function useAssets(fn) {
	sharedConfig.context.assets.push(() => resolveSSRNode(escape(fn())));
}
function generateHydrationScript({ eventNames = ["click", "input"], nonce } = {}) {
	return `<script${nonce ? ` nonce="${nonce}"` : ""}>window._$HY||(e=>{let t=e=>e&&e.hasAttribute&&(e.hasAttribute("data-hk")?e:t(e.host&&e.host.nodeType?e.host:e.parentNode));["${eventNames.join("\", \"")}"].forEach((o=>document.addEventListener(o,(o=>{if(!e.events)return;let s=t(o.composedPath&&o.composedPath()[0]||o.target);s&&!e.completed.has(s)&&e.events.push([s,o])}))))})(_$HY={events:[],completed:new WeakSet,r:{},fe(){}});<\/script><!--xs-->`;
}
function Hydration(props) {
	if (!sharedConfig.context.noHydrate) return props.children;
	const context = sharedConfig.context;
	sharedConfig.context = {
		...context,
		count: 0,
		id: sharedConfig.getNextContextId(),
		noHydrate: false
	};
	const res = props.children;
	sharedConfig.context = context;
	return res;
}
function NoHydration(props) {
	if (sharedConfig.context) sharedConfig.context.noHydrate = true;
	return props.children;
}
function queue(fn) {
	return Promise.resolve().then(fn);
}
function allSettled(promises) {
	let length = promises.length;
	return Promise.allSettled(promises).then(() => {
		if (promises.length !== length) return allSettled(promises);
	});
}
function injectAssets(assets, html) {
	if (!assets || !assets.length) return html;
	let out = "";
	for (let i = 0, len = assets.length; i < len; i++) out += assets[i]();
	const index = html.indexOf("</head>");
	if (index === -1) return html;
	return html.slice(0, index) + out + html.slice(index);
}
function injectScripts(html, scripts, nonce) {
	const tag = `<script${nonce ? ` nonce="${nonce}"` : ""}>${scripts}<\/script>`;
	const index = html.indexOf("<!--xs-->");
	if (index > -1) return html.slice(0, index) + tag + html.slice(index);
	return html + tag;
}
function waitForFragments(registry, key) {
	for (const k of [...registry.keys()].reverse()) if (key.startsWith(k)) return true;
	return false;
}
function replacePlaceholder(html, key, value) {
	const marker = `<template id="pl-${key}">`;
	const close = `<!--pl-${key}-->`;
	const first = html.indexOf(marker);
	if (first === -1) return html;
	const last = html.indexOf(close, first + marker.length);
	return html.slice(0, first) + value + html.slice(last + close.length);
}
var RequestContext = Symbol();
function getRequestEvent() {
	return globalThis[RequestContext] ? globalThis[RequestContext].getStore() || sharedConfig.context && sharedConfig.context.event || console.log("RequestEvent is missing. This is most likely due to accessing `getRequestEvent` non-managed async scope in a partially polyfilled environment. Try moving it above all `await` calls.") : void 0;
}
function notSup() {
	throw new Error("Client-only API called on the server side. Run client-only code in onMount, or conditionally run client-only component with <Show>.");
}
//#endregion
//#region node_modules/solid-js/web/storage/dist/storage.js
function provideRequestEvent(init, cb) {
	return (globalThis[RequestContext] = globalThis[RequestContext] || new AsyncLocalStorage()).run(init, cb);
}
//#endregion
export { mergeProps as A, createEffect as C, createSignal as D, createRoot as E, sharedConfig as F, startTransition as I, untrack as L, onCleanup as M, resetErrorBoundaries as N, getOwner as O, runWithOwner as P, useContext as R, createContext as S, createRenderEffect as T, Suspense as _, escape as a, children as b, renderToStream as c, ssrAttribute as d, ssrElement as f, Show as g, ErrorBoundary as h, NoHydration as i, on as j, lazy as k, renderToString as l, useAssets as m, Hydration as n, getRequestEvent as o, ssrHydrationKey as p, HydrationScript as r, notSup as s, provideRequestEvent as t, ssr as u, batch as v, createMemo as w, createComponent as x, catchError as y };

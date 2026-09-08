import "node:http";
import { PassThrough, Readable } from "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
//#region node_modules/nitro/node_modules/srvx/dist/tracing.mjs
function tracingPlugin(opts = {}) {
	return (server) => {
		const { tracingChannel } = globalThis.process?.getBuiltinModule?.("node:diagnostics_channel") || {};
		if (!tracingChannel) return;
		if (opts.fetch !== false) {
			const fetchChannel = tracingChannel("srvx.request");
			const originalFetch = server.options.fetch;
			server.options.fetch = (request) => {
				return fetchChannel.tracePromise(async () => await originalFetch(request), {
					request,
					server
				});
			};
		}
		if (opts.middleware !== false) {
			const middlewareChannel = tracingChannel("srvx.middleware");
			const wrappedMiddleware = server.options.middleware.map((handler, index) => {
				const middleware = Object.freeze({
					index,
					handler
				});
				return (request, next) => {
					return middlewareChannel.tracePromise(async () => await handler(request, next), {
						request,
						server,
						middleware
					});
				};
			});
			server.options.middleware.splice(0, server.options.middleware.length, ...wrappedMiddleware);
		}
	};
}
//#endregion
//#region node_modules/srvx/dist/_chunks/_url.mjs
function lazyInherit(target, source, sourceKey) {
	for (const key of [...Object.getOwnPropertyNames(source), ...Object.getOwnPropertySymbols(source)]) {
		if (key === "constructor") continue;
		const targetDesc = Object.getOwnPropertyDescriptor(target, key);
		const desc = Object.getOwnPropertyDescriptor(source, key);
		let modified = false;
		if (desc.get) {
			modified = true;
			desc.get = targetDesc?.get || function() {
				return this[sourceKey][key];
			};
		}
		if (desc.set) {
			modified = true;
			desc.set = targetDesc?.set || function(value) {
				this[sourceKey][key] = value;
			};
		}
		if (!targetDesc?.value && typeof desc.value === "function") {
			modified = true;
			desc.value = function(...args) {
				return this[sourceKey][key](...args);
			};
		}
		if (modified) Object.defineProperty(target, key, desc);
	}
}
var _needsNormRE = /(?:(?:^|\/)(?:\.|\.\.|%2e|%2e\.|\.%2e|%2e%2e)(?:\/|$))|[\\^#"<>{}`\x00-\x20\x7f-\uffff]/i;
var _searchNeedsNormRE = /[#"'<>\x00-\x20\x7f-\uffff]/;
var FastURL = /* @__PURE__ */ (() => {
	const NativeURL = globalThis.URL;
	const NativeSearchParams = globalThis.URLSearchParams;
	const FastURLSearchParams = class URLSearchParams {
		#owner;
		#params;
		constructor(owner) {
			this.#owner = owner;
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeSearchParams;
		}
		_adopt(params) {
			this.#params = params;
		}
		get _params() {
			if (!this.#params) {
				const search = this.#owner.search;
				this.#params ??= new NativeSearchParams(search);
			}
			return this.#params;
		}
		#mutable() {
			this.#owner._url;
			return this.#params;
		}
		append(name, value) {
			this.#mutable().append(name, value);
		}
		set(name, value) {
			this.#mutable().set(name, value);
		}
		delete(name, value) {
			this.#mutable().delete(name, value);
		}
		sort() {
			this.#mutable().sort();
		}
	};
	lazyInherit(FastURLSearchParams.prototype, NativeSearchParams.prototype, "_params");
	Object.setPrototypeOf(FastURLSearchParams.prototype, NativeSearchParams.prototype);
	Object.setPrototypeOf(FastURLSearchParams, NativeSearchParams);
	const FastURL = class URL {
		#url;
		#href;
		#protocol;
		#host;
		#pathname;
		#search;
		#searchParams;
		#pos;
		constructor(url) {
			if (typeof url === "string") {
				const isOriginForm = url[0] === "/";
				if (isOriginForm && !_searchNeedsNormRE.test(url)) this.#href = `http://localhost${url}`;
				else this.#url = new NativeURL(isOriginForm ? `http://localhost${url}` : url);
			} else if (_needsNormRE.test(url.pathname) || url.search && _searchNeedsNormRE.test(url.search)) this.#url = new NativeURL(`${url.protocol || "http:"}//${url.host || "localhost"}${url.pathname}${url.search || ""}`);
			else {
				this.#protocol = url.protocol;
				this.#host = url.host;
				this.#pathname = url.pathname;
				this.#search = url.search;
			}
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeURL;
		}
		get _url() {
			if (this.#url) return this.#url;
			this.#url = new NativeURL(this.href);
			this.#href = void 0;
			this.#protocol = void 0;
			this.#host = void 0;
			this.#pathname = void 0;
			this.#search = void 0;
			this.#pos = void 0;
			this.#searchParams?._adopt(this.#url.searchParams);
			return this.#url;
		}
		get href() {
			if (this.#url) return this.#url.href;
			if (!this.#href) this.#href = `${this.#protocol || "http:"}//${this.#host || "localhost"}${this.#pathname || "/"}${this.#search || ""}`;
			return this.#href;
		}
		#getPos() {
			if (!this.#pos) {
				const url = this.href;
				const protoIndex = url.indexOf("://");
				const pathnameIndex = protoIndex === -1 ? -1 : url.indexOf("/", protoIndex + 4);
				const qIndex = pathnameIndex === -1 ? -1 : url.indexOf("?", pathnameIndex);
				this.#pos = [
					protoIndex,
					pathnameIndex,
					qIndex
				];
			}
			return this.#pos;
		}
		get pathname() {
			if (this.#url) return this.#url.pathname;
			if (this.#pathname === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.pathname;
				this.#pathname = this.href.slice(pathnameIndex, queryIndex === -1 ? void 0 : queryIndex);
			}
			return this.#pathname;
		}
		get search() {
			if (this.#url) return this.#url.search;
			if (this.#search === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.search;
				const url = this.href;
				this.#search = queryIndex === -1 || queryIndex === url.length - 1 ? "" : url.slice(queryIndex);
			}
			return this.#search;
		}
		get searchParams() {
			if (this.#searchParams) return this.#searchParams;
			if (this.#url) return this.#url.searchParams;
			return this.#searchParams = new FastURLSearchParams(this);
		}
		get protocol() {
			if (this.#url) return this.#url.protocol;
			if (this.#protocol === void 0) {
				const [protocolIndex] = this.#getPos();
				if (protocolIndex === -1) return this._url.protocol;
				const url = this.href;
				this.#protocol = url.slice(0, protocolIndex + 1);
			}
			return this.#protocol;
		}
		get hash() {
			if (this.#url) return this.#url.hash;
			return "";
		}
		toString() {
			return this.href;
		}
		toJSON() {
			return this.href;
		}
	};
	lazyInherit(FastURL.prototype, NativeURL.prototype, "_url");
	Object.setPrototypeOf(FastURL.prototype, NativeURL.prototype);
	Object.setPrototypeOf(FastURL, NativeURL);
	return FastURL;
})();
//#endregion
//#region node_modules/srvx/dist/adapters/node.mjs
var NodeResponse = /* @__PURE__ */ (() => {
	const NativeResponse = globalThis.Response;
	class NodeResponse {
		#body;
		#init;
		#headers;
		#response;
		constructor(body, init) {
			this.#body = body;
			this.#init = init;
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeResponse;
		}
		static json(data, init) {
			const body = JSON.stringify(data);
			if (body === void 0) throw new TypeError("Value is not JSON serializable");
			let headers = init?.headers;
			if (!headers) headers = { "content-type": "application/json" };
			else {
				const merged = new Headers(headers);
				if (!merged.has("content-type")) merged.set("content-type", "application/json");
				headers = merged;
			}
			return new NodeResponse(body, init ? {
				...init,
				headers
			} : { headers });
		}
		get status() {
			return this.#response?.status || this.#init?.status || 200;
		}
		get statusText() {
			return this.#response?.statusText || this.#init?.statusText || "";
		}
		get headers() {
			if (this.#response) return this.#response.headers;
			if (this.#headers) return this.#headers;
			return this.#headers = new Headers(this.#init?.headers);
		}
		get ok() {
			if (this.#response) return this.#response.ok;
			const status = this.status;
			return status >= 200 && status < 300;
		}
		get _response() {
			if (this.#response) return this.#response;
			let body = this.#body;
			if (body && typeof body.pipe === "function" && !(body instanceof Readable)) {
				const stream = new PassThrough();
				body.pipe(stream);
				const abort = body.abort;
				if (abort) stream.once("close", () => abort());
				body = stream;
			}
			this.#response = new NativeResponse(body, this.#headers ? {
				...this.#init,
				headers: this.#headers
			} : this.#init);
			this.#init = void 0;
			this.#headers = void 0;
			this.#body = void 0;
			return this.#response;
		}
		_toNodeResponse() {
			const status = this.status;
			const statusText = this.statusText;
			let body;
			let contentType;
			let contentLength;
			if (this.#response) body = this.#response.body;
			else if (this.#body != null) {
				if (this.#body instanceof ReadableStream) body = this.#body;
				else if (typeof this.#body === "string") {
					body = this.#body;
					contentType = "text/plain; charset=UTF-8";
					contentLength = Buffer.byteLength(this.#body);
				} else if (this.#body instanceof ArrayBuffer) {
					body = Buffer.from(this.#body);
					contentLength = this.#body.byteLength;
				} else if (this.#body instanceof Uint8Array) {
					body = this.#body;
					contentLength = this.#body.byteLength;
				} else if (this.#body instanceof DataView) {
					body = Buffer.from(this.#body.buffer, this.#body.byteOffset, this.#body.byteLength);
					contentLength = this.#body.byteLength;
				} else if (this.#body instanceof Blob) {
					body = this.#body.stream();
					contentType = this.#body.type;
					contentLength = this.#body.size;
				} else if (typeof this.#body.pipe === "function") body = this.#body;
				else body = this._response.body;
			}
			const headers = [];
			const initHeaders = this.#init?.headers;
			const headerEntries = this.#response?.headers || this.#headers || (initHeaders ? Array.isArray(initHeaders) ? initHeaders : initHeaders?.entries ? initHeaders.entries() : Object.entries(initHeaders) : void 0);
			let hasContentTypeHeader;
			let hasContentLength;
			if (headerEntries) for (const [key, value] of headerEntries) {
				const lowerKey = typeof key === "string" ? key.toLowerCase() : String(key);
				if (Array.isArray(value)) for (const v of value) headers.push(lowerKey, v);
				else headers.push(lowerKey, value);
				if (lowerKey === "content-type") hasContentTypeHeader = true;
				else if (lowerKey === "content-length") hasContentLength = true;
			}
			if (contentType && !hasContentTypeHeader) headers.push("content-type", contentType);
			if (contentLength != null && !hasContentLength) headers.push("content-length", String(contentLength));
			this.#init = void 0;
			this.#headers = void 0;
			this.#response = void 0;
			this.#body = void 0;
			return {
				status,
				statusText,
				headers,
				body
			};
		}
	}
	lazyInherit(NodeResponse.prototype, NativeResponse.prototype, "_response");
	Object.setPrototypeOf(NodeResponse, NativeResponse);
	Object.setPrototypeOf(NodeResponse.prototype, NativeResponse.prototype);
	return NodeResponse;
})();
//#endregion
export { FastURL as n, tracingPlugin as r, NodeResponse as t };

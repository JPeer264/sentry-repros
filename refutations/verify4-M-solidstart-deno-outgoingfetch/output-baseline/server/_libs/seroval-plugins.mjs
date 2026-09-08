import { l as re$1, n as createPlugin, r as createStream, s as ai } from "./seroval.mjs";
//#region node_modules/solid-js/node_modules/seroval-plugins/dist/esm/production/web.mjs
var u = (e) => {
	let r = new AbortController(), a = r.abort.bind(r);
	return e.then(a, a), r;
};
function D(e) {
	e(this.reason);
}
function F(e) {
	this.addEventListener("abort", D.bind(this, e), { once: !0 });
}
function g(e) {
	return new Promise(F.bind(e));
}
var n = {};
var A = ai({
	tag: "seroval-plugins/web/AbortControllerFactoryPlugin",
	test(e) {
		return e === n;
	},
	parse: {
		sync() {
			return n;
		},
		async async() {
			return await Promise.resolve(n);
		},
		stream() {
			return n;
		}
	},
	serialize() {
		return u.toString();
	},
	deserialize() {
		return u;
	}
});
var O = ai({
	tag: "seroval-plugins/web/AbortSignal",
	extends: [A],
	test(e) {
		return typeof AbortSignal == "undefined" ? !1 : e instanceof AbortSignal;
	},
	parse: {
		sync(e, r) {
			return e.aborted ? { reason: r.parse(e.reason) } : {};
		},
		async async(e, r) {
			if (e.aborted) return { reason: await r.parse(e.reason) };
			let a = await g(e);
			return { reason: await r.parse(a) };
		},
		stream(e, r) {
			if (e.aborted) return { reason: r.parse(e.reason) };
			let a = g(e);
			return {
				factory: r.parse(n),
				controller: r.parse(a)
			};
		}
	},
	serialize(e, r) {
		return e.reason ? "AbortSignal.abort(" + r.serialize(e.reason) + ")" : e.controller && e.factory ? "(" + r.serialize(e.factory) + ")(" + r.serialize(e.controller) + ").signal" : "(new AbortController).signal";
	},
	deserialize(e, r) {
		return e.reason ? AbortSignal.abort(r.deserialize(e.reason)) : e.controller ? u(r.deserialize(e.controller)).signal : new AbortController().signal;
	}
});
ai({
	tag: "seroval-plugins/web/Blob",
	test(e) {
		return typeof Blob == "undefined" ? !1 : e instanceof Blob;
	},
	parse: { async async(e, r) {
		return {
			type: await r.parse(e.type),
			buffer: await r.parse(await e.arrayBuffer())
		};
	} },
	serialize(e, r) {
		return "new Blob([" + r.serialize(e.buffer) + "],{type:" + r.serialize(e.type) + "})";
	},
	deserialize(e, r) {
		return new Blob([r.deserialize(e.buffer)], { type: r.deserialize(e.type) });
	}
});
function d(e) {
	return {
		detail: e.detail,
		bubbles: e.bubbles,
		cancelable: e.cancelable,
		composed: e.composed
	};
}
var M = ai({
	tag: "seroval-plugins/web/CustomEvent",
	test(e) {
		return typeof CustomEvent == "undefined" ? !1 : e instanceof CustomEvent;
	},
	parse: {
		sync(e, r) {
			return {
				type: r.parse(e.type),
				options: r.parse(d(e))
			};
		},
		async async(e, r) {
			return {
				type: await r.parse(e.type),
				options: await r.parse(d(e))
			};
		},
		stream(e, r) {
			return {
				type: r.parse(e.type),
				options: r.parse(d(e))
			};
		}
	},
	serialize(e, r) {
		return "new CustomEvent(" + r.serialize(e.type) + "," + r.serialize(e.options) + ")";
	},
	deserialize(e, r) {
		return new CustomEvent(r.deserialize(e.type), r.deserialize(e.options));
	}
});
var H = ai({
	tag: "seroval-plugins/web/DOMException",
	test(e) {
		return typeof DOMException == "undefined" ? !1 : e instanceof DOMException;
	},
	parse: {
		sync(e, r) {
			return {
				name: r.parse(e.name),
				message: r.parse(e.message)
			};
		},
		async async(e, r) {
			return {
				name: await r.parse(e.name),
				message: await r.parse(e.message)
			};
		},
		stream(e, r) {
			return {
				name: r.parse(e.name),
				message: r.parse(e.message)
			};
		}
	},
	serialize(e, r) {
		return "new DOMException(" + r.serialize(e.message) + "," + r.serialize(e.name) + ")";
	},
	deserialize(e, r) {
		return new DOMException(r.deserialize(e.message), r.deserialize(e.name));
	}
});
function f(e) {
	return {
		bubbles: e.bubbles,
		cancelable: e.cancelable,
		composed: e.composed
	};
}
var j = ai({
	tag: "seroval-plugins/web/Event",
	test(e) {
		return typeof Event == "undefined" ? !1 : e instanceof Event;
	},
	parse: {
		sync(e, r) {
			return {
				type: r.parse(e.type),
				options: r.parse(f(e))
			};
		},
		async async(e, r) {
			return {
				type: await r.parse(e.type),
				options: await r.parse(f(e))
			};
		},
		stream(e, r) {
			return {
				type: r.parse(e.type),
				options: r.parse(f(e))
			};
		}
	},
	serialize(e, r) {
		return "new Event(" + r.serialize(e.type) + "," + r.serialize(e.options) + ")";
	},
	deserialize(e, r) {
		return new Event(r.deserialize(e.type), r.deserialize(e.options));
	}
});
var m = ai({
	tag: "seroval-plugins/web/File",
	test(e) {
		return typeof File == "undefined" ? !1 : e instanceof File;
	},
	parse: { async async(e, r) {
		return {
			name: await r.parse(e.name),
			options: await r.parse({
				type: e.type,
				lastModified: e.lastModified
			}),
			buffer: await r.parse(await e.arrayBuffer())
		};
	} },
	serialize(e, r) {
		return "new File([" + r.serialize(e.buffer) + "]," + r.serialize(e.name) + "," + r.serialize(e.options) + ")";
	},
	deserialize(e, r) {
		return new File([r.deserialize(e.buffer)], r.deserialize(e.name), r.deserialize(e.options));
	}
});
function y(e) {
	let r = [];
	return e.forEach((a, t) => {
		r.push([t, a]);
	}), r;
}
var s = {};
var v = (e, r = new FormData(), a = 0, t = e.length, p) => {
	for (; a < t; a++) p = e[a], r.append(p[0], p[1]);
	return r;
};
var J = ai({
	tag: "seroval-plugins/web/FormDataFactory",
	test(e) {
		return e === s;
	},
	parse: {
		sync() {
			return s;
		},
		async async() {
			return await Promise.resolve(s);
		},
		stream() {
			return s;
		}
	},
	serialize() {
		return v.toString();
	},
	deserialize() {
		return s;
	}
});
var Q = ai({
	tag: "seroval-plugins/web/FormData",
	extends: [m, J],
	test(e) {
		return typeof FormData == "undefined" ? !1 : e instanceof FormData;
	},
	parse: {
		sync(e, r) {
			return {
				factory: r.parse(s),
				entries: r.parse(y(e))
			};
		},
		async async(e, r) {
			return {
				factory: await r.parse(s),
				entries: await r.parse(y(e))
			};
		},
		stream(e, r) {
			return {
				factory: r.parse(s),
				entries: r.parse(y(e))
			};
		}
	},
	serialize(e, r) {
		return "(" + r.serialize(e.factory) + ")(" + r.serialize(e.entries) + ")";
	},
	deserialize(e, r) {
		return v(r.deserialize(e.entries));
	}
});
function c(e) {
	let r = [];
	return e.forEach((a, t) => {
		r.push([t, a]);
	}), r;
}
var i = ai({
	tag: "seroval-plugins/web/Headers",
	test(e) {
		return typeof Headers == "undefined" ? !1 : e instanceof Headers;
	},
	parse: {
		sync(e, r) {
			return { value: r.parse(c(e)) };
		},
		async async(e, r) {
			return { value: await r.parse(c(e)) };
		},
		stream(e, r) {
			return { value: r.parse(c(e)) };
		}
	},
	serialize(e, r) {
		return "new Headers(" + r.serialize(e.value) + ")";
	},
	deserialize(e, r) {
		return new Headers(r.deserialize(e.value));
	}
});
ai({
	tag: "seroval-plugins/web/ImageData",
	test(e) {
		return typeof ImageData == "undefined" ? !1 : e instanceof ImageData;
	},
	parse: {
		sync(e, r) {
			return {
				data: r.parse(e.data),
				width: r.parse(e.width),
				height: r.parse(e.height),
				options: r.parse({ colorSpace: e.colorSpace })
			};
		},
		async async(e, r) {
			return {
				data: await r.parse(e.data),
				width: await r.parse(e.width),
				height: await r.parse(e.height),
				options: await r.parse({ colorSpace: e.colorSpace })
			};
		},
		stream(e, r) {
			return {
				data: r.parse(e.data),
				width: r.parse(e.width),
				height: r.parse(e.height),
				options: r.parse({ colorSpace: e.colorSpace })
			};
		}
	},
	serialize(e, r) {
		return "new ImageData(" + r.serialize(e.data) + "," + r.serialize(e.width) + "," + r.serialize(e.height) + "," + r.serialize(e.options) + ")";
	},
	deserialize(e, r) {
		return new ImageData(r.deserialize(e.data), r.deserialize(e.width), r.deserialize(e.height), r.deserialize(e.options));
	}
});
var o = {};
var P = (e) => new ReadableStream({ start: (r) => {
	e.on({
		next: (a) => {
			try {
				r.enqueue(a);
			} catch (t) {}
		},
		throw: (a) => {
			r.error(a);
		},
		return: () => {
			try {
				r.close();
			} catch (a) {}
		}
	});
} });
var ee = ai({
	tag: "seroval-plugins/web/ReadableStreamFactory",
	test(e) {
		return e === o;
	},
	parse: {
		sync() {
			return o;
		},
		async async() {
			return await Promise.resolve(o);
		},
		stream() {
			return o;
		}
	},
	serialize() {
		return P.toString();
	},
	deserialize() {
		return o;
	}
});
async function N(e, r) {
	try {
		let a = await r.read();
		a.done ? (e.return(a.value), r.releaseLock()) : (e.next(a.value), await N(e, r));
	} catch (a) {
		e.throw(a);
	}
}
function re(e) {
	e.cancel().catch(() => {}), e.releaseLock();
}
function w(e) {
	let r = re$1(), a = e.getReader(), t = re.bind(null, a);
	return N(r, a).catch(t), [r, t];
}
var l = ai({
	tag: "seroval/plugins/web/ReadableStream",
	extends: [ee],
	test(e) {
		return typeof ReadableStream == "undefined" ? !1 : e instanceof ReadableStream;
	},
	parse: {
		sync(e, r) {
			return {
				factory: r.parse(o),
				stream: r.parse(re$1())
			};
		},
		async async(e, r) {
			return {
				factory: await r.parse(o),
				stream: await r.parse(w(e)[0])
			};
		},
		stream(e, r) {
			let [a, t] = w(e);
			return r.addCleanup(t), {
				factory: r.parse(o),
				stream: r.parse(a)
			};
		}
	},
	serialize(e, r) {
		return "(" + r.serialize(e.factory) + ")(" + r.serialize(e.stream) + ")";
	},
	deserialize(e, r) {
		return P(r.deserialize(e.stream));
	}
});
function h(e, r) {
	return {
		body: r,
		cache: e.cache,
		credentials: e.credentials,
		headers: e.headers,
		integrity: e.integrity,
		keepalive: e.keepalive,
		method: e.method,
		mode: e.mode,
		redirect: e.redirect,
		referrer: e.referrer,
		referrerPolicy: e.referrerPolicy
	};
}
var oe = ai({
	tag: "seroval-plugins/web/Request",
	extends: [l, i],
	test(e) {
		return typeof Request == "undefined" ? !1 : e instanceof Request;
	},
	parse: {
		async async(e, r) {
			return {
				url: await r.parse(e.url),
				options: await r.parse(h(e, e.body && !e.bodyUsed ? await e.clone().arrayBuffer() : null))
			};
		},
		stream(e, r) {
			return {
				url: r.parse(e.url),
				options: r.parse(h(e, e.body && !e.bodyUsed ? e.clone().body : null))
			};
		}
	},
	serialize(e, r) {
		return "new Request(" + r.serialize(e.url) + "," + r.serialize(e.options) + ")";
	},
	deserialize(e, r) {
		return new Request(r.deserialize(e.url), r.deserialize(e.options));
	}
});
function E(e) {
	return {
		headers: e.headers,
		status: e.status,
		statusText: e.statusText
	};
}
var le = ai({
	tag: "seroval-plugins/web/Response",
	extends: [l, i],
	test(e) {
		return typeof Response == "undefined" ? !1 : e instanceof Response;
	},
	parse: {
		async async(e, r) {
			return {
				body: await r.parse(e.body && !e.bodyUsed ? await e.clone().arrayBuffer() : null),
				options: await r.parse(E(e))
			};
		},
		stream(e, r) {
			return {
				body: r.parse(e.body && !e.bodyUsed ? e.clone().body : null),
				options: r.parse(E(e))
			};
		}
	},
	serialize(e, r) {
		return "new Response(" + r.serialize(e.body) + "," + r.serialize(e.options) + ")";
	},
	deserialize(e, r) {
		return new Response(r.deserialize(e.body), r.deserialize(e.options));
	}
});
var de = ai({
	tag: "seroval-plugins/web/URL",
	test(e) {
		return typeof URL == "undefined" ? !1 : e instanceof URL;
	},
	parse: {
		sync(e, r) {
			return { value: r.parse(e.href) };
		},
		async async(e, r) {
			return { value: await r.parse(e.href) };
		},
		stream(e, r) {
			return { value: r.parse(e.href) };
		}
	},
	serialize(e, r) {
		return "new URL(" + r.serialize(e.value) + ")";
	},
	deserialize(e, r) {
		return new URL(r.deserialize(e.value));
	}
});
var ye = ai({
	tag: "seroval-plugins/web/URLSearchParams",
	test(e) {
		return typeof URLSearchParams == "undefined" ? !1 : e instanceof URLSearchParams;
	},
	parse: {
		sync(e, r) {
			return { value: r.parse(e.toString()) };
		},
		async async(e, r) {
			return { value: await r.parse(e.toString()) };
		},
		stream(e, r) {
			return { value: r.parse(e.toString()) };
		}
	},
	serialize(e, r) {
		return "new URLSearchParams(" + r.serialize(e.value) + ")";
	},
	deserialize(e, r) {
		return new URLSearchParams(r.deserialize(e.value));
	}
});
//#endregion
//#region node_modules/seroval-plugins/dist/web-43VA2W_p.js
var PROMISE_TO_ABORT_SIGNAL = (promise) => {
	const controller = new AbortController();
	const abort = controller.abort.bind(controller);
	promise.then(abort, abort);
	return controller;
};
function resolveAbortSignalResult(resolve) {
	resolve(this.reason);
}
function resolveAbortSignal(resolve) {
	this.addEventListener("abort", resolveAbortSignalResult.bind(this, resolve), { once: true });
}
function abortSignalToPromise(signal) {
	return new Promise(resolveAbortSignal.bind(signal));
}
var ABORT_CONTROLLER = {};
var AbortSignalPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/AbortSignal",
	extends: [/* @__PURE__ */ createPlugin({
		tag: "seroval-plugins/web/AbortControllerFactoryPlugin",
		test(value) {
			return value === ABORT_CONTROLLER;
		},
		parse: {
			sync() {
				return ABORT_CONTROLLER;
			},
			async async() {
				return await Promise.resolve(ABORT_CONTROLLER);
			},
			stream() {
				return ABORT_CONTROLLER;
			}
		},
		serialize() {
			return PROMISE_TO_ABORT_SIGNAL.toString();
		},
		deserialize() {
			return PROMISE_TO_ABORT_SIGNAL;
		}
	})],
	test(value) {
		if (typeof AbortSignal === "undefined") return false;
		return value instanceof AbortSignal;
	},
	parse: {
		sync(value, ctx) {
			if (value.aborted) return { reason: ctx.parse(value.reason) };
			return {};
		},
		async async(value, ctx) {
			if (value.aborted) return { reason: await ctx.parse(value.reason) };
			const result = await abortSignalToPromise(value);
			return { reason: await ctx.parse(result) };
		},
		stream(value, ctx) {
			if (value.aborted) return { reason: ctx.parse(value.reason) };
			const promise = abortSignalToPromise(value);
			return {
				factory: ctx.parse(ABORT_CONTROLLER),
				controller: ctx.parse(promise)
			};
		}
	},
	serialize(node, ctx) {
		if (node.reason) return "AbortSignal.abort(" + ctx.serialize(node.reason) + ")";
		if (node.controller && node.factory) return "(" + ctx.serialize(node.factory) + ")(" + ctx.serialize(node.controller) + ").signal";
		return "(new AbortController).signal";
	},
	deserialize(node, ctx) {
		if (node.reason) return AbortSignal.abort(ctx.deserialize(node.reason));
		if (node.controller) return PROMISE_TO_ABORT_SIGNAL(ctx.deserialize(node.controller)).signal;
		return new AbortController().signal;
	}
});
function createCustomEventOptions(current) {
	return {
		detail: current.detail,
		bubbles: current.bubbles,
		cancelable: current.cancelable,
		composed: current.composed
	};
}
var CustomEventPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/CustomEvent",
	test(value) {
		if (typeof CustomEvent === "undefined") return false;
		return value instanceof CustomEvent;
	},
	parse: {
		sync(value, ctx) {
			return {
				type: ctx.parse(value.type),
				options: ctx.parse(createCustomEventOptions(value))
			};
		},
		async async(value, ctx) {
			return {
				type: await ctx.parse(value.type),
				options: await ctx.parse(createCustomEventOptions(value))
			};
		},
		stream(value, ctx) {
			return {
				type: ctx.parse(value.type),
				options: ctx.parse(createCustomEventOptions(value))
			};
		}
	},
	serialize(node, ctx) {
		return "new CustomEvent(" + ctx.serialize(node.type) + "," + ctx.serialize(node.options) + ")";
	},
	deserialize(node, ctx) {
		return new CustomEvent(ctx.deserialize(node.type), ctx.deserialize(node.options));
	}
});
var DOMExceptionPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/DOMException",
	test(value) {
		if (typeof DOMException === "undefined") return false;
		return value instanceof DOMException;
	},
	parse: {
		sync(value, ctx) {
			return {
				name: ctx.parse(value.name),
				message: ctx.parse(value.message)
			};
		},
		async async(value, ctx) {
			return {
				name: await ctx.parse(value.name),
				message: await ctx.parse(value.message)
			};
		},
		stream(value, ctx) {
			return {
				name: ctx.parse(value.name),
				message: ctx.parse(value.message)
			};
		}
	},
	serialize(node, ctx) {
		return "new DOMException(" + ctx.serialize(node.message) + "," + ctx.serialize(node.name) + ")";
	},
	deserialize(node, ctx) {
		return new DOMException(ctx.deserialize(node.message), ctx.deserialize(node.name));
	}
});
function createEventOptions(current) {
	return {
		bubbles: current.bubbles,
		cancelable: current.cancelable,
		composed: current.composed
	};
}
var EventPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/Event",
	test(value) {
		if (typeof Event === "undefined") return false;
		return value instanceof Event;
	},
	parse: {
		sync(value, ctx) {
			return {
				type: ctx.parse(value.type),
				options: ctx.parse(createEventOptions(value))
			};
		},
		async async(value, ctx) {
			return {
				type: await ctx.parse(value.type),
				options: await ctx.parse(createEventOptions(value))
			};
		},
		stream(value, ctx) {
			return {
				type: ctx.parse(value.type),
				options: ctx.parse(createEventOptions(value))
			};
		}
	},
	serialize(node, ctx) {
		return "new Event(" + ctx.serialize(node.type) + "," + ctx.serialize(node.options) + ")";
	},
	deserialize(node, ctx) {
		return new Event(ctx.deserialize(node.type), ctx.deserialize(node.options));
	}
});
var FilePlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/File",
	test(value) {
		if (typeof File === "undefined") return false;
		return value instanceof File;
	},
	parse: { async async(value, ctx) {
		return {
			name: await ctx.parse(value.name),
			options: await ctx.parse({
				type: value.type,
				lastModified: value.lastModified
			}),
			buffer: await ctx.parse(await value.arrayBuffer())
		};
	} },
	serialize(node, ctx) {
		return "new File([" + ctx.serialize(node.buffer) + "]," + ctx.serialize(node.name) + "," + ctx.serialize(node.options) + ")";
	},
	deserialize(node, ctx) {
		return new File([ctx.deserialize(node.buffer)], ctx.deserialize(node.name), ctx.deserialize(node.options));
	}
});
function convertFormData(instance) {
	const items = [];
	instance.forEach((value, key) => {
		items.push([key, value]);
	});
	return items;
}
var FORM_DATA_FACTORY = {};
var FORM_DATA_FACTORY_CONSTRUCTOR = (e, f = new FormData(), i = 0, s = e.length, t) => {
	for (; i < s; i++) {
		t = e[i];
		f.append(t[0], t[1]);
	}
	return f;
};
var FormDataPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/FormData",
	extends: [FilePlugin, /* @__PURE__ */ createPlugin({
		tag: "seroval-plugins/web/FormDataFactory",
		test(value) {
			return value === FORM_DATA_FACTORY;
		},
		parse: {
			sync() {
				return FORM_DATA_FACTORY;
			},
			async async() {
				return await Promise.resolve(FORM_DATA_FACTORY);
			},
			stream() {
				return FORM_DATA_FACTORY;
			}
		},
		serialize() {
			return FORM_DATA_FACTORY_CONSTRUCTOR.toString();
		},
		deserialize() {
			return FORM_DATA_FACTORY;
		}
	})],
	test(value) {
		if (typeof FormData === "undefined") return false;
		return value instanceof FormData;
	},
	parse: {
		sync(value, ctx) {
			return {
				factory: ctx.parse(FORM_DATA_FACTORY),
				entries: ctx.parse(convertFormData(value))
			};
		},
		async async(value, ctx) {
			return {
				factory: await ctx.parse(FORM_DATA_FACTORY),
				entries: await ctx.parse(convertFormData(value))
			};
		},
		stream(value, ctx) {
			return {
				factory: ctx.parse(FORM_DATA_FACTORY),
				entries: ctx.parse(convertFormData(value))
			};
		}
	},
	serialize(node, ctx) {
		return "(" + ctx.serialize(node.factory) + ")(" + ctx.serialize(node.entries) + ")";
	},
	deserialize(node, ctx) {
		return FORM_DATA_FACTORY_CONSTRUCTOR(ctx.deserialize(node.entries));
	}
});
function convertHeaders(instance) {
	const items = [];
	instance.forEach((value, key) => {
		items.push([key, value]);
	});
	return items;
}
var HeadersPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/Headers",
	test(value) {
		if (typeof Headers === "undefined") return false;
		return value instanceof Headers;
	},
	parse: {
		sync(value, ctx) {
			return { value: ctx.parse(convertHeaders(value)) };
		},
		async async(value, ctx) {
			return { value: await ctx.parse(convertHeaders(value)) };
		},
		stream(value, ctx) {
			return { value: ctx.parse(convertHeaders(value)) };
		}
	},
	serialize(node, ctx) {
		return "new Headers(" + ctx.serialize(node.value) + ")";
	},
	deserialize(node, ctx) {
		return new Headers(ctx.deserialize(node.value));
	}
});
var READABLE_STREAM_FACTORY = {};
var READABLE_STREAM_FACTORY_CONSTRUCTOR = (stream) => new ReadableStream({ start(controller) {
	stream.on({
		next(value) {
			try {
				controller.enqueue(value);
			} catch (_error) {}
		},
		throw(value) {
			controller.error(value);
		},
		return() {
			try {
				controller.close();
			} catch (_error) {}
		}
	});
} });
var ReadableStreamFactoryPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/ReadableStreamFactory",
	test(value) {
		return value === READABLE_STREAM_FACTORY;
	},
	parse: {
		sync() {
			return READABLE_STREAM_FACTORY;
		},
		async async() {
			return await Promise.resolve(READABLE_STREAM_FACTORY);
		},
		stream() {
			return READABLE_STREAM_FACTORY;
		}
	},
	serialize() {
		return READABLE_STREAM_FACTORY_CONSTRUCTOR.toString();
	},
	deserialize() {
		return READABLE_STREAM_FACTORY;
	}
});
async function drainStream(stream, reader) {
	try {
		const result = await reader.read();
		if (result.done) {
			stream.return(result.value);
			reader.releaseLock();
		} else {
			stream.next(result.value);
			await drainStream(stream, reader);
		}
	} catch (error) {
		stream.throw(error);
	}
}
function cleanupStream(reader) {
	reader.cancel().catch(() => {});
	reader.releaseLock();
}
function toStream(value) {
	const stream = createStream();
	const reader = value.getReader();
	const cleanup = cleanupStream.bind(null, reader);
	drainStream(stream, reader).catch(cleanup);
	return [stream, cleanup];
}
var ReadableStreamPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval/plugins/web/ReadableStream",
	extends: [ReadableStreamFactoryPlugin],
	test(value) {
		if (typeof ReadableStream === "undefined") return false;
		return value instanceof ReadableStream;
	},
	parse: {
		sync(_value, ctx) {
			return {
				factory: ctx.parse(READABLE_STREAM_FACTORY),
				stream: ctx.parse(createStream())
			};
		},
		async async(value, ctx) {
			return {
				factory: await ctx.parse(READABLE_STREAM_FACTORY),
				stream: await ctx.parse(toStream(value)[0])
			};
		},
		stream(value, ctx) {
			const [stream, cleanup] = toStream(value);
			ctx.addCleanup(cleanup);
			return {
				factory: ctx.parse(READABLE_STREAM_FACTORY),
				stream: ctx.parse(stream)
			};
		}
	},
	serialize(node, ctx) {
		return "(" + ctx.serialize(node.factory) + ")(" + ctx.serialize(node.stream) + ")";
	},
	deserialize(node, ctx) {
		return READABLE_STREAM_FACTORY_CONSTRUCTOR(ctx.deserialize(node.stream));
	}
});
function createRequestOptions(current, body) {
	return {
		body,
		cache: current.cache,
		credentials: current.credentials,
		headers: current.headers,
		integrity: current.integrity,
		keepalive: current.keepalive,
		method: current.method,
		mode: current.mode,
		redirect: current.redirect,
		referrer: current.referrer,
		referrerPolicy: current.referrerPolicy
	};
}
var RequestPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/Request",
	extends: [ReadableStreamPlugin, HeadersPlugin],
	test(value) {
		if (typeof Request === "undefined") return false;
		return value instanceof Request;
	},
	parse: {
		async async(value, ctx) {
			return {
				url: await ctx.parse(value.url),
				options: await ctx.parse(createRequestOptions(value, value.body && !value.bodyUsed ? await value.clone().arrayBuffer() : null))
			};
		},
		stream(value, ctx) {
			return {
				url: ctx.parse(value.url),
				options: ctx.parse(createRequestOptions(value, value.body && !value.bodyUsed ? value.clone().body : null))
			};
		}
	},
	serialize(node, ctx) {
		return "new Request(" + ctx.serialize(node.url) + "," + ctx.serialize(node.options) + ")";
	},
	deserialize(node, ctx) {
		return new Request(ctx.deserialize(node.url), ctx.deserialize(node.options));
	}
});
function createResponseOptions(current) {
	return {
		headers: current.headers,
		status: current.status,
		statusText: current.statusText
	};
}
var ResponsePlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/Response",
	extends: [ReadableStreamPlugin, HeadersPlugin],
	test(value) {
		if (typeof Response === "undefined") return false;
		return value instanceof Response;
	},
	parse: {
		async async(value, ctx) {
			return {
				body: await ctx.parse(value.body && !value.bodyUsed ? await value.clone().arrayBuffer() : null),
				options: await ctx.parse(createResponseOptions(value))
			};
		},
		stream(value, ctx) {
			return {
				body: ctx.parse(value.body && !value.bodyUsed ? value.clone().body : null),
				options: ctx.parse(createResponseOptions(value))
			};
		}
	},
	serialize(node, ctx) {
		return "new Response(" + ctx.serialize(node.body) + "," + ctx.serialize(node.options) + ")";
	},
	deserialize(node, ctx) {
		return new Response(ctx.deserialize(node.body), ctx.deserialize(node.options));
	}
});
var URLPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/URL",
	test(value) {
		if (typeof URL === "undefined") return false;
		return value instanceof URL;
	},
	parse: {
		sync(value, ctx) {
			return { value: ctx.parse(value.href) };
		},
		async async(value, ctx) {
			return { value: await ctx.parse(value.href) };
		},
		stream(value, ctx) {
			return { value: ctx.parse(value.href) };
		}
	},
	serialize(node, ctx) {
		return "new URL(" + ctx.serialize(node.value) + ")";
	},
	deserialize(node, ctx) {
		return new URL(ctx.deserialize(node.value));
	}
});
var URLSearchParamsPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/URLSearchParams",
	test(value) {
		if (typeof URLSearchParams === "undefined") return false;
		return value instanceof URLSearchParams;
	},
	parse: {
		sync(value, ctx) {
			return { value: ctx.parse(value.toString()) };
		},
		async async(value, ctx) {
			return { value: await ctx.parse(value.toString()) };
		},
		stream(value, ctx) {
			return { value: ctx.parse(value.toString()) };
		}
	},
	serialize(node, ctx) {
		return "new URLSearchParams(" + ctx.serialize(node.value) + ")";
	},
	deserialize(node, ctx) {
		return new URLSearchParams(ctx.deserialize(node.value));
	}
});
//#endregion
export { ye as S, i as _, FormDataPlugin as a, le as b, RequestPlugin as c, URLSearchParamsPlugin as d, H as f, de as g, Q as h, EventPlugin as i, ResponsePlugin as l, O as m, CustomEventPlugin as n, HeadersPlugin as o, M as p, DOMExceptionPlugin as r, ReadableStreamPlugin as s, AbortSignalPlugin as t, URLPlugin as u, j as v, oe as x, l as y };

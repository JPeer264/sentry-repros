//#region node_modules/solid-js/node_modules/seroval/dist/esm/production/index.mjs
var L = ((i) => (i[i.AggregateError = 1] = "AggregateError", i[i.ArrowFunction = 2] = "ArrowFunction", i[i.ErrorPrototypeStack = 4] = "ErrorPrototypeStack", i[i.ObjectAssign = 8] = "ObjectAssign", i[i.BigIntTypedArray = 16] = "BigIntTypedArray", i[i.RegExp = 32] = "RegExp", i))(L || {});
var v = Symbol.asyncIterator;
var dr = Symbol.hasInstance;
var R = Symbol.isConcatSpreadable;
var C = Symbol.iterator;
var gr = Symbol.match;
var yr = Symbol.matchAll;
var Nr = Symbol.replace;
var br = Symbol.search;
var vr = Symbol.species;
var Cr = Symbol.split;
var Ar = Symbol.toPrimitive;
var P = Symbol.toStringTag;
var Er = Symbol.unscopables;
var nt = {
	0: "Symbol.asyncIterator",
	1: "Symbol.hasInstance",
	2: "Symbol.isConcatSpreadable",
	3: "Symbol.iterator",
	4: "Symbol.match",
	5: "Symbol.matchAll",
	6: "Symbol.replace",
	7: "Symbol.search",
	8: "Symbol.species",
	9: "Symbol.split",
	10: "Symbol.toPrimitive",
	11: "Symbol.toStringTag",
	12: "Symbol.unscopables"
};
var Ce = {
	[v]: 0,
	[dr]: 1,
	[R]: 2,
	[C]: 3,
	[gr]: 4,
	[yr]: 5,
	[Nr]: 6,
	[br]: 7,
	[vr]: 8,
	[Cr]: 9,
	[Ar]: 10,
	[P]: 11,
	[Er]: 12
};
var at = {
	2: "!0",
	3: "!1",
	1: "void 0",
	0: "null",
	4: "-0",
	5: "1/0",
	6: "-1/0",
	7: "0/0"
};
var o = void 0;
Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY;
var Ae = {
	0: "Error",
	1: "EvalError",
	2: "RangeError",
	3: "ReferenceError",
	4: "SyntaxError",
	5: "TypeError",
	6: "URIError"
};
function c(e, r, t, n, a, s, i, u, l, g, S, d) {
	return {
		t: e,
		i: r,
		s: t,
		c: n,
		m: a,
		p: s,
		e: i,
		a: u,
		f: l,
		b: g,
		o: S,
		l: d
	};
}
function B(e) {
	return c(2, o, e, o, o, o, o, o, o, o, o, o);
}
var J = B(2);
var Z = B(3);
var Ee = B(1);
var Ie = B(0);
var ut = B(4);
var lt = B(5);
var ct = B(6);
var ft = B(7);
function dn(e) {
	switch (e) {
		case "\"": return "\\\"";
		case "\\": return "\\\\";
		case `
`: return "\\n";
		case "\r": return "\\r";
		case "\b": return "\\b";
		case "	": return "\\t";
		case "\f": return "\\f";
		case "<": return "\\x3C";
		case "\u2028": return "\\u2028";
		case "\u2029": return "\\u2029";
		default: return o;
	}
}
function y(e) {
	let r = "", t = 0, n;
	for (let a = 0, s = e.length; a < s; a++) n = dn(e[a]), n && (r += e.slice(t, a) + n, t = a + 1);
	return t === 0 ? r = e : r += e.slice(t), r;
}
function gn(e) {
	switch (e) {
		case "\\\\": return "\\";
		case "\\\"": return "\"";
		case "\\n": return `
`;
		case "\\r": return "\r";
		case "\\b": return "\b";
		case "\\t": return "	";
		case "\\f": return "\f";
		case "\\x3C": return "<";
		case "\\u2028": return "\u2028";
		case "\\u2029": return "\u2029";
		default: return e;
	}
}
function h(e) {
	return e.replace(/(\\\\|\\"|\\n|\\r|\\b|\\t|\\f|\\u2028|\\u2029|\\x3C)/g, gn);
}
var U = "__SEROVAL_REFS__";
var le = "$R";
var Re = `self.${le}`;
function yn(e) {
	return e == null ? `${Re}=${Re}||[]` : `(${Re}=${Re}||{})["${y(e)}"]=[]`;
}
var Ir = /* @__PURE__ */ new Map();
var j = /* @__PURE__ */ new Map();
function Rr(e) {
	return Ir.has(e);
}
function St(e) {
	if (Rr(e)) return Ir.get(e);
	throw new Pe(e);
}
typeof globalThis != "undefined" ? Object.defineProperty(globalThis, U, {
	value: j,
	configurable: !0,
	writable: !1,
	enumerable: !1
}) : typeof window != "undefined" ? Object.defineProperty(window, U, {
	value: j,
	configurable: !0,
	writable: !1,
	enumerable: !1
}) : typeof self != "undefined" ? Object.defineProperty(self, U, {
	value: j,
	configurable: !0,
	writable: !1,
	enumerable: !1
}) : typeof global != "undefined" && Object.defineProperty(global, U, {
	value: j,
	configurable: !0,
	writable: !1,
	enumerable: !1
});
function Te(e) {
	return e instanceof EvalError ? 1 : e instanceof RangeError ? 2 : e instanceof ReferenceError ? 3 : e instanceof SyntaxError ? 4 : e instanceof TypeError ? 5 : e instanceof URIError ? 6 : 0;
}
function vn(e) {
	let r = Ae[Te(e)];
	return e.name !== r ? { name: e.name } : e.constructor.name !== r ? { name: e.constructor.name } : {};
}
function $(e, r) {
	let t = vn(e), n = Object.getOwnPropertyNames(e);
	for (let a = 0, s = n.length, i; a < s; a++) i = n[a], i !== "name" && i !== "message" && (i === "stack" ? r & 4 && (t = t || {}, t[i] = e[i]) : (t = t || {}, t[i] = e[i]));
	return t;
}
function Oe(e) {
	return Object.isFrozen(e) ? 3 : Object.isSealed(e) ? 2 : Object.isExtensible(e) ? 0 : 1;
}
function we(e) {
	switch (e) {
		case Number.POSITIVE_INFINITY: return lt;
		case Number.NEGATIVE_INFINITY: return ct;
	}
	return e !== e ? ft : Object.is(e, -0) ? ut : c(0, o, e, o, o, o, o, o, o, o, o, o);
}
function X(e) {
	return c(1, o, y(e), o, o, o, o, o, o, o, o, o);
}
function he(e) {
	return c(3, o, "" + e, o, o, o, o, o, o, o, o, o);
}
function dt(e) {
	return c(4, e, o, o, o, o, o, o, o, o, o, o);
}
function ze(e, r) {
	let t = r.valueOf();
	return c(5, e, t !== t ? "" : r.toISOString(), o, o, o, o, o, o, o, o, o);
}
function _e(e, r) {
	return c(6, e, o, y(r.source), r.flags, o, o, o, o, o, o, o);
}
function gt(e, r) {
	return c(17, e, Ce[r], o, o, o, o, o, o, o, o, o);
}
function yt(e, r) {
	return c(18, e, y(St(r)), o, o, o, o, o, o, o, o, o);
}
function ce(e, r, t) {
	return c(25, e, t, y(r), o, o, o, o, o, o, o, o);
}
function ke(e, r, t) {
	return c(9, e, o, o, o, o, o, t, o, o, Oe(r), o);
}
function De(e, r) {
	return c(21, e, o, o, o, o, o, o, r, o, o, o);
}
function Fe(e, r, t) {
	return c(15, e, o, r.constructor.name, o, o, o, o, t, r.byteOffset, o, r.length);
}
function Be(e, r, t) {
	return c(16, e, o, r.constructor.name, o, o, o, o, t, r.byteOffset, o, r.length);
}
function Ve(e, r, t) {
	return c(20, e, o, o, o, o, o, o, t, r.byteOffset, o, r.byteLength);
}
function Me(e, r, t) {
	return c(13, e, Te(r), o, y(r.message), t, o, o, o, o, o, o);
}
function Le(e, r, t) {
	return c(14, e, Te(r), o, y(r.message), t, o, o, o, o, o, o);
}
function Ue(e, r) {
	return c(7, e, o, o, o, o, o, r, o, o, o, o);
}
function je(e, r) {
	return c(28, o, o, o, o, o, o, [e, r], o, o, o, o);
}
function Ye(e, r) {
	return c(30, o, o, o, o, o, o, [e, r], o, o, o, o);
}
function qe(e, r, t) {
	return c(31, e, o, o, o, o, o, t, r, o, o, o);
}
function We(e, r) {
	return c(32, e, o, o, o, o, o, o, r, o, o, o);
}
function Ke(e, r) {
	return c(33, e, o, o, o, o, o, o, r, o, o, o);
}
function Ge(e, r) {
	return c(34, e, o, o, o, o, o, o, r, o, o, o);
}
function He(e, r, t, n) {
	return c(35, e, t, o, o, o, o, r, o, o, o, n);
}
var { toString: bs } = Object.prototype;
var Cn = {
	parsing: 1,
	serialization: 2,
	deserialization: 3
};
function An(e) {
	return `Seroval Error (step: ${Cn[e]})`;
}
var En = (e, r) => An(e);
var fe = class extends Error {
	constructor(t, n) {
		super(En(t, n));
		this.cause = n;
	}
};
var _ = class extends fe {
	constructor(r) {
		super("parsing", r);
	}
};
function k(e) {
	return `Seroval Error (specific: ${e})`;
}
var x = class extends Error {
	constructor(t) {
		super(k(1));
		this.value = t;
	}
};
var z = class extends Error {
	constructor(r) {
		super(k(2));
	}
};
var Q = class extends Error {
	constructor(r) {
		super(k(3));
	}
};
var Pe = class extends Error {
	constructor(t) {
		super(k(5));
		this.value = t;
	}
};
var M = class extends Error {
	constructor(r) {
		super(k(9));
	}
};
var Y = class {
	constructor(r, t) {
		this.value = r;
		this.replacement = t;
	}
};
var ee = () => {
	let e = {
		p: 0,
		s: 0,
		f: 0
	};
	return e.p = new Promise((r, t) => {
		e.s = r, e.f = t;
	}), e;
};
var In = (e, r) => {
	e.s(r), e.p.s = 1, e.p.v = r;
};
var Rn = (e, r) => {
	e.f(r), e.p.s = 2, e.p.v = r;
};
var bt = ee.toString();
var vt = In.toString();
var Ct = Rn.toString();
var xr = () => {
	let e = [], r = [], t = !0, n = !1, a = 0, s = (l, g, S) => {
		for (S = 0; S < a; S++) r[S] && r[S][g](l);
	}, i = (l, g, S, d) => {
		for (g = 0, S = e.length; g < S; g++) d = e[g], !t && g === S - 1 ? l[n ? "return" : "throw"](d) : l.next(d);
	}, u = (l, g) => (t && (g = a++, r[g] = l), i(l), () => {
		t && (r[g] = r[a], r[a--] = void 0);
	});
	return {
		__SEROVAL_STREAM__: !0,
		on: (l) => u(l),
		next: (l) => {
			t && (e.push(l), s(l, "next"));
		},
		throw: (l) => {
			t && (e.push(l), s(l, "throw"), t = !1, n = !1, r.length = 0);
		},
		return: (l) => {
			t && (e.push(l), s(l, "return"), t = !1, n = !0, r.length = 0);
		}
	};
};
var At = xr.toString();
var Tr = (e) => (r) => () => {
	let t = 0, n = {
		[e]: () => n,
		next: () => {
			if (t > r.d) return {
				done: !0,
				value: void 0
			};
			let a = t++, s = r.v[a];
			if (a === r.t) throw s;
			return {
				done: a === r.d,
				value: s
			};
		}
	};
	return n;
};
var Et = Tr.toString();
var Or = (e, r) => (t) => () => {
	let n = 0, a = -1, s = !1, i = [], u = [], l = (S = 0, d = u.length) => {
		for (; S < d; S++) u[S].s({
			done: !0,
			value: void 0
		});
	};
	t.on({
		next: (S) => {
			let d = u.shift();
			d && d.s({
				done: !1,
				value: S
			}), i.push(S);
		},
		throw: (S) => {
			let d = u.shift();
			d && d.f(S), l(), a = i.length, s = !0, i.push(S);
		},
		return: (S) => {
			let d = u.shift();
			d && d.s({
				done: !0,
				value: S
			}), l(), a = i.length, i.push(S);
		}
	});
	let g = {
		[e]: () => g,
		next: () => {
			if (a === -1) {
				let G = n++;
				if (G >= i.length) {
					let tt = r();
					return u.push(tt), tt.p;
				}
				return {
					done: !1,
					value: i[G]
				};
			}
			if (n > a) return {
				done: !0,
				value: void 0
			};
			let S = n++, d = i[S];
			if (S !== a) return {
				done: !1,
				value: d
			};
			if (s) throw d;
			return {
				done: !0,
				value: d
			};
		}
	};
	return g;
};
var It = Or.toString();
var wr = (e) => {
	let r = atob(e), t = r.length, n = new Uint8Array(t);
	for (let a = 0; a < t; a++) n[a] = r.charCodeAt(a);
	return n.buffer;
};
var Rt = wr.toString();
function $e(e) {
	return "__SEROVAL_SEQUENCE__" in e;
}
function hr(e, r, t) {
	return {
		__SEROVAL_SEQUENCE__: !0,
		v: e,
		t: r,
		d: t
	};
}
function Xe(e) {
	let r = [], t = -1, n = -1, a = e[C]();
	for (;;) try {
		let s = a.next();
		if (r.push(s.value), s.done) {
			n = r.length - 1;
			break;
		}
	} catch (s) {
		t = r.length, r.push(s);
	}
	return hr(r, t, n);
}
var xt = {};
var Tt = {};
var Ot = {
	0: {},
	1: {},
	2: {},
	3: {},
	4: {},
	5: {}
};
var wt = {
	0: "[]",
	1: bt,
	2: vt,
	3: Ct,
	4: At,
	5: Rt
};
function Qe(e) {
	return "__SEROVAL_STREAM__" in e;
}
function re() {
	return xr();
}
function er(e) {
	let r = re(), t = e[v]();
	async function n() {
		try {
			let a = await t.next();
			a.done ? r.return(a.value) : (r.next(a.value), await n());
		} catch (a) {
			r.throw(a);
		}
	}
	return n().catch(() => {}), r;
}
function me(e, r) {
	return {
		plugins: r.plugins,
		mode: e,
		marked: /* @__PURE__ */ new Set(),
		features: 63 ^ (r.disabledFeatures || 0),
		refs: r.refs || /* @__PURE__ */ new Map(),
		depthLimit: r.depthLimit || 1e3
	};
}
function pe(e, r) {
	e.marked.add(r);
}
function _r(e, r) {
	let t = e.refs.size;
	return e.refs.set(r, t), t;
}
function rr(e, r) {
	let t = e.refs.get(r);
	return t != null ? (pe(e, t), {
		type: 1,
		value: dt(t)
	}) : {
		type: 0,
		value: _r(e, r)
	};
}
function q(e, r) {
	let t = rr(e, r);
	return t.type === 1 ? t : Rr(r) ? {
		type: 2,
		value: yt(t.value, r)
	} : t;
}
function I(e, r) {
	let t = q(e, r);
	if (t.type !== 0) return t.value;
	if (r in Ce) return gt(t.value, r);
	throw new x(r);
}
function D(e, r) {
	let t = rr(e, Ot[r]);
	return t.type === 1 ? t.value : c(26, t.value, r, o, o, o, o, o, o, o, o, o);
}
function tr(e) {
	let r = rr(e, xt);
	return r.type === 1 ? r.value : c(27, r.value, o, o, o, o, o, o, I(e, C), o, o, o);
}
function nr(e) {
	let r = rr(e, Tt);
	return r.type === 1 ? r.value : c(29, r.value, o, o, o, o, o, [D(e, 1), I(e, v)], o, o, o, o);
}
function or(e, r, t, n) {
	return c(t ? 11 : 10, e, o, o, o, n, o, o, o, o, Oe(r), o);
}
function ar(e, r, t, n) {
	return c(8, r, o, o, o, o, {
		k: t,
		v: n
	}, o, D(e, 0), o, o, o);
}
function _t(e, r, t) {
	return c(22, r, t, o, o, o, o, o, D(e, 1), o, o, o);
}
function sr(e, r, t) {
	let n = new Uint8Array(t), a = "";
	for (let s = 0, i = n.length; s < i; s++) a += String.fromCharCode(n[s]);
	return c(19, r, y(btoa(a)), o, o, o, o, o, D(e, 5), o, o, o);
}
var oe = ((t) => (t[t.Vanilla = 1] = "Vanilla", t[t.Cross = 2] = "Cross", t))(oe || {});
function ai(e) {
	return e;
}
function Ft(e, r) {
	for (let t = 0, n = r.length; t < n; t++) {
		let a = r[t];
		e.has(a) || (e.add(a), a.extends && Ft(e, a.extends));
	}
}
function A(e) {
	if (e) {
		let r = /* @__PURE__ */ new Set();
		return Ft(r, e), [...r];
	}
}
function de(e) {
	switch (e) {
		case "constructor":
		case "__proto__":
		case "prototype":
		case "__defineGetter__":
		case "__defineSetter__":
		case "__lookupGetter__":
		case "__lookupSetter__": return !1;
		default: return !0;
	}
}
var Ro = () => T;
var Po = Ro.toString();
var Ht = /=>/.test(Po);
function ur(e, r) {
	return Ht ? (e.length === 1 ? e[0] : "(" + e.join(",") + ")") + "=>" + (r.startsWith("{") ? "(" + r + ")" : r) : "function(" + e.join(",") + "){return " + r + "}";
}
function Jt(e, r) {
	return Ht ? (e.length === 1 ? e[0] : "(" + e.join(",") + ")") + "=>{" + r + "}" : "function(" + e.join(",") + "){" + r + "}";
}
var Xt = "hjkmoquxzABCDEFGHIJKLNPQRTUVWXYZ$_";
var Zt = Xt.length;
var Qt = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_";
var $t = Qt.length;
function Mr(e) {
	let r = e % Zt, t = Xt[r];
	for (e = (e - r) / Zt; e > 0;) r = e % $t, t += Qt[r], e = (e - r) / $t;
	return t;
}
var xo = /^[$A-Z_][0-9A-Z_$]*$/i;
function Lr(e) {
	let r = e[0];
	return (r === "$" || r === "_" || r >= "A" && r <= "Z" || r >= "a" && r <= "z") && xo.test(e);
}
function Ne(e) {
	switch (e.t) {
		case 0: return e.s + "=" + e.v;
		case 2: return e.s + ".set(" + e.k + "," + e.v + ")";
		case 1: return e.s + ".add(" + e.v + ")";
		case 3: return e.s + ".delete(" + e.k + ")";
		case 4: return "Object.defineProperty(" + e.s + ",\"__proto__\",{value:" + e.k + ",configurable:!0,enumerable:!0,writable:!0})";
	}
}
function To(e) {
	let r = [], t = e[0];
	for (let n = 1, a = e.length, s, i = t; n < a; n++) s = e[n], s.t === 0 && s.v === i.v ? t = {
		t: 0,
		s: s.s,
		k: o,
		v: Ne(t)
	} : s.t === 2 && s.s === i.s ? t = {
		t: 2,
		s: Ne(t),
		k: s.k,
		v: s.v
	} : s.t === 1 && s.s === i.s ? t = {
		t: 1,
		s: Ne(t),
		k: o,
		v: s.v
	} : s.t === 3 && s.s === i.s ? t = {
		t: 3,
		s: Ne(t),
		k: s.k,
		v: o
	} : (r.push(t), t = s), i = s;
	return r.push(t), r;
}
function sn(e) {
	if (e.length) {
		let r = "", t = To(e);
		for (let n = 0, a = t.length; n < a; n++) r += Ne(t[n]) + ",";
		return r;
	}
	return o;
}
var Oo = "Object.create(null)";
var wo = "new Set";
var ho = "new Map";
var zo = "Promise.resolve";
var _o = "Promise.reject";
var ko = {
	3: "Object.freeze",
	2: "Object.seal",
	1: "Object.preventExtensions",
	0: o
};
function un(e, r) {
	return {
		mode: e,
		plugins: r.plugins,
		features: r.features,
		marked: new Set(r.markedRefs),
		stack: [],
		flags: [],
		assignments: []
	};
}
function cr(e) {
	return {
		mode: 2,
		base: un(2, e),
		state: e,
		child: o
	};
}
var Ur = class {
	constructor(r) {
		this._p = r;
	}
	serialize(r) {
		return f(this._p, r);
	}
};
function Fo(e, r) {
	let t = e.valid.get(r);
	t ?? (t = e.valid.size, e.valid.set(r, t));
	let n = e.vars[t];
	return n ?? (n = Mr(t), e.vars[t] = n), n;
}
function Bo(e) {
	return le + "[" + e + "]";
}
function m(e, r) {
	return e.mode === 1 ? Fo(e.state, r) : Bo(r);
}
function w(e, r) {
	e.marked.add(r);
}
function jr(e, r) {
	return e.marked.has(r);
}
function qr(e, r, t) {
	r !== 0 && (w(e.base, t), e.base.flags.push({
		type: r,
		value: m(e, t)
	}));
}
function Vo(e) {
	let r = "";
	for (let t = 0, n = e.flags, a = n.length; t < a; t++) {
		let s = n[t];
		r += ko[s.type] + "(" + s.value + "),";
	}
	return r;
}
function ln(e) {
	let r = sn(e.assignments), t = Vo(e);
	return r ? t ? r + t : r : t;
}
function Wr(e, r, t) {
	e.assignments.push({
		t: 0,
		s: r,
		k: o,
		v: t
	});
}
function Mo(e, r, t) {
	e.base.assignments.push({
		t: 1,
		s: m(e, r),
		k: o,
		v: t
	});
}
function ye(e, r, t, n) {
	e.base.assignments.push({
		t: 2,
		s: m(e, r),
		k: t,
		v: n
	});
}
function en(e, r, t) {
	e.base.assignments.push({
		t: 3,
		s: m(e, r),
		k: t,
		v: o
	});
}
function be(e, r, t, n) {
	Wr(e.base, m(e, r) + "[" + t + "]", n);
}
function Yr(e, r, t, n) {
	if (!de(t)) {
		e.base.assignments.push({
			t: 4,
			s: m(e, r),
			k: n,
			v: o
		});
		return;
	}
	Wr(e.base, m(e, r) + "." + t, n);
}
function Lo(e, r, t, n) {
	Wr(e.base, m(e, r) + ".v[" + t + "]", n);
}
function F(e, r) {
	return r.t === 4 && e.stack.includes(r.i);
}
function ae(e, r, t) {
	return e.mode === 1 && !jr(e.base, r) ? t : m(e, r) + "=" + t;
}
function Uo(e) {
	return U + ".get(\"" + e.s + "\")";
}
function rn(e, r, t, n) {
	return t ? F(e.base, t) ? (w(e.base, r), be(e, r, n, m(e, t.i)), "") : f(e, t) : "";
}
function jo(e, r) {
	let t = r.i, n = r.a, a = n.length;
	if (a > 0) {
		e.base.stack.push(t);
		let s = rn(e, t, n[0], 0), i = s === "";
		for (let u = 1, l; u < a; u++) l = rn(e, t, n[u], u), s += "," + l, i = l === "";
		return e.base.stack.pop(), qr(e, r.o, r.i), "[" + s + (i ? ",]" : "]");
	}
	return "[]";
}
function tn(e, r, t, n) {
	if (typeof t == "string") {
		let a = Number(t), s = a >= 0 && a.toString() === t || Lr(t);
		if (F(e.base, n)) {
			let i = m(e, n.i);
			return w(e.base, r.i), s && a !== a ? Yr(e, r.i, t, i) : be(e, r.i, s ? t : "\"" + t + "\"", i), "";
		}
		return de(t) ? (s ? t : "\"" + t + "\"") + ":" + f(e, n) : "[\"" + t + "\"]:" + f(e, n);
	}
	return "[" + f(e, t) + "]:" + f(e, n);
}
function cn(e, r, t) {
	let n = t.k, a = n.length;
	if (a > 0) {
		let s = t.v;
		e.base.stack.push(r.i);
		let i = tn(e, r, n[0], s[0]);
		for (let u = 1, l = i; u < a; u++) l = tn(e, r, n[u], s[u]), i += (l && i && ",") + l;
		return e.base.stack.pop(), "{" + i + "}";
	}
	return "{}";
}
function Yo(e, r) {
	return qr(e, r.o, r.i), cn(e, r, r.p);
}
function qo(e, r, t, n) {
	let a = cn(e, r, t);
	return a !== "{}" ? "Object.assign(" + n + "," + a + ")" : n;
}
function Wo(e, r, t, n, a) {
	let s = e.base, i = f(e, a), u = Number(n), l = u >= 0 && u.toString() === n || Lr(n);
	if (F(s, a)) l && u !== u ? Yr(e, r.i, n, i) : be(e, r.i, l ? n : "\"" + n + "\"", i);
	else {
		let g = s.assignments;
		s.assignments = t, l && u !== u ? Yr(e, r.i, n, i) : be(e, r.i, l ? n : "\"" + n + "\"", i), s.assignments = g;
	}
}
function Ko(e, r, t, n, a) {
	if (typeof n == "string") Wo(e, r, t, n, a);
	else {
		let s = e.base, i = s.stack;
		s.stack = [];
		let u = f(e, a);
		s.stack = i;
		let l = s.assignments;
		s.assignments = t, be(e, r.i, f(e, n), u), s.assignments = l;
	}
}
function Go(e, r, t) {
	let n = t.k, a = n.length;
	if (a > 0) {
		let s = [], i = t.v;
		e.base.stack.push(r.i);
		for (let u = 0; u < a; u++) Ko(e, r, s, n[u], i[u]);
		return e.base.stack.pop(), sn(s);
	}
	return o;
}
function Kr(e, r, t) {
	if (r.p) {
		let n = e.base;
		if (n.features & 8) t = qo(e, r, r.p, t);
		else {
			w(n, r.i);
			let a = Go(e, r, r.p);
			if (a) return "(" + ae(e, r.i, t) + "," + a + m(e, r.i) + ")";
		}
	}
	return t;
}
function Ho(e, r) {
	return qr(e, r.o, r.i), Kr(e, r, Oo);
}
function Jo(e) {
	return "new Date(\"" + e.s + "\")";
}
function Zo(e, r) {
	if (e.base.features & 32) return "/" + h(r.c) + "/" + r.m;
	throw new z(r);
}
function nn(e, r, t) {
	let n = e.base;
	return F(n, t) ? (w(n, r), Mo(e, r, m(e, t.i)), "") : f(e, t);
}
function $o(e, r) {
	let t = wo, n = r.a, a = n.length, s = r.i;
	if (a > 0) {
		e.base.stack.push(s);
		let i = nn(e, s, n[0]);
		for (let u = 1, l = i; u < a; u++) l = nn(e, s, n[u]), i += (l && i && ",") + l;
		e.base.stack.pop(), i && (t += "([" + i + "])");
	}
	return t;
}
function on(e, r, t, n, a) {
	let s = e.base;
	if (F(s, t)) {
		let i = m(e, t.i);
		if (w(s, r), F(s, n)) return ye(e, r, i, m(e, n.i)), "";
		if (n.t !== 4 && n.i != null && jr(s, n.i)) {
			let l = "(" + f(e, n) + ",[" + a + "," + a + "])";
			return ye(e, r, i, m(e, n.i)), en(e, r, a), l;
		}
		let u = s.stack;
		return s.stack = [], ye(e, r, i, f(e, n)), s.stack = u, "";
	}
	if (F(s, n)) {
		let i = m(e, n.i);
		if (w(s, r), t.t !== 4 && t.i != null && jr(s, t.i)) {
			let l = "(" + f(e, t) + ",[" + a + "," + a + "])";
			return ye(e, r, m(e, t.i), i), en(e, r, a), l;
		}
		let u = s.stack;
		return s.stack = [], ye(e, r, f(e, t), i), s.stack = u, "";
	}
	return "[" + f(e, t) + "," + f(e, n) + "]";
}
function Xo(e, r) {
	let t = ho, n = r.e.k, a = n.length, s = r.i, i = r.f, u = m(e, i.i), l = e.base;
	if (a > 0) {
		let g = r.e.v;
		l.stack.push(s);
		let S = on(e, s, n[0], g[0], u);
		for (let d = 1, G = S; d < a; d++) G = on(e, s, n[d], g[d], u), S += (G && S && ",") + G;
		l.stack.pop(), S && (t += "([" + S + "])");
	}
	return i.t === 26 && (w(l, i.i), t = "(" + f(e, i) + "," + t + ")"), t;
}
function Qo(e, r) {
	return W(e, r.f) + "(\"" + r.s + "\")";
}
function ea(e, r) {
	return "new " + r.c + "(" + f(e, r.f) + "," + r.b + "," + r.l + ")";
}
function ra(e, r) {
	return "new DataView(" + f(e, r.f) + "," + r.b + "," + r.l + ")";
}
function ta(e, r) {
	let t = r.i;
	e.base.stack.push(t);
	let n = Kr(e, r, "new AggregateError([],\"" + r.m + "\")");
	return e.base.stack.pop(), n;
}
function na(e, r) {
	return Kr(e, r, "new " + Ae[r.s] + "(\"" + r.m + "\")");
}
function oa(e, r) {
	let t, n = r.f, a = r.i, s = r.s ? zo : _o, i = e.base;
	if (F(i, n)) {
		let u = m(e, n.i);
		t = s + (r.s ? "().then(" + ur([], u) + ")" : "().catch(" + Jt([], "throw " + u) + ")");
	} else {
		i.stack.push(a);
		let u = f(e, n);
		i.stack.pop(), t = s + "(" + u + ")";
	}
	return t;
}
function aa(e, r) {
	return "Object(" + f(e, r.f) + ")";
}
function W(e, r) {
	let t = f(e, r);
	return r.t === 4 ? t : "(" + t + ")";
}
function sa(e, r) {
	if (e.mode === 1) throw new z(r);
	return "(" + ae(e, r.s, W(e, r.f) + "()") + ").p";
}
function ia(e, r) {
	if (e.mode === 1) throw new z(r);
	return W(e, r.a[0]) + "(" + m(e, r.i) + "," + f(e, r.a[1]) + ")";
}
function ua(e, r) {
	if (e.mode === 1) throw new z(r);
	return W(e, r.a[0]) + "(" + m(e, r.i) + "," + f(e, r.a[1]) + ")";
}
function la(e, r) {
	let t = e.base.plugins;
	if (t) for (let n = 0, a = t.length; n < a; n++) {
		let s = t[n];
		if (s.tag === r.c) return e.child ??= new Ur(e), s.serialize(r.s, e.child, { id: r.i });
	}
	throw new Q(r.c);
}
function ca(e, r) {
	let t = "", n = !1;
	return r.f.t !== 4 && (w(e.base, r.f.i), t = "(" + f(e, r.f) + ",", n = !0), t += ae(e, r.i, "(" + Et + ")(" + m(e, r.f.i) + ")"), n && (t += ")"), t;
}
function fa(e, r) {
	return W(e, r.a[0]) + "(" + f(e, r.a[1]) + ")";
}
function Sa(e, r) {
	let t = r.a[0], n = r.a[1], a = e.base, s = "";
	t.t !== 4 && (w(a, t.i), s += "(" + f(e, t)), n.t !== 4 && (w(a, n.i), s += (s ? "," : "(") + f(e, n)), s && (s += ",");
	let i = ae(e, r.i, "(" + It + ")(" + m(e, n.i) + "," + m(e, t.i) + ")");
	return s ? s + i + ")" : i;
}
function ma(e, r) {
	return W(e, r.a[0]) + "(" + f(e, r.a[1]) + ")";
}
function pa(e, r) {
	let t = ae(e, r.i, W(e, r.f) + "()"), n = r.a.length;
	if (n) {
		let a = f(e, r.a[0]);
		for (let s = 1; s < n; s++) a += "," + f(e, r.a[s]);
		return "(" + t + "," + a + "," + m(e, r.i) + ")";
	}
	return t;
}
function da(e, r) {
	return m(e, r.i) + ".next(" + f(e, r.f) + ")";
}
function ga(e, r) {
	return m(e, r.i) + ".throw(" + f(e, r.f) + ")";
}
function ya(e, r) {
	return m(e, r.i) + ".return(" + f(e, r.f) + ")";
}
function an(e, r, t, n) {
	let a = e.base;
	return F(a, n) ? (w(a, r), Lo(e, r, t, m(e, n.i)), "") : f(e, n);
}
function Na(e, r) {
	let t = r.a, n = t.length, a = r.i;
	if (n > 0) {
		e.base.stack.push(a);
		let s = an(e, a, 0, t[0]);
		for (let i = 1, u = s; i < n; i++) u = an(e, a, i, t[i]), s += (u && s && ",") + u;
		if (e.base.stack.pop(), s) return "{__SEROVAL_SEQUENCE__:!0,v:[" + s + "],t:" + r.s + ",d:" + r.l + "}";
	}
	return "{__SEROVAL_SEQUENCE__:!0,v:[],t:-1,d:0}";
}
function ba(e, r) {
	switch (r.t) {
		case 17: return nt[r.s];
		case 18: return Uo(r);
		case 9: return jo(e, r);
		case 10: return Yo(e, r);
		case 11: return Ho(e, r);
		case 5: return Jo(r);
		case 6: return Zo(e, r);
		case 7: return $o(e, r);
		case 8: return Xo(e, r);
		case 19: return Qo(e, r);
		case 16:
		case 15: return ea(e, r);
		case 20: return ra(e, r);
		case 14: return ta(e, r);
		case 13: return na(e, r);
		case 12: return oa(e, r);
		case 21: return aa(e, r);
		case 22: return sa(e, r);
		case 25: return la(e, r);
		case 26: return wt[r.s];
		case 35: return Na(e, r);
		default: throw new z(r);
	}
}
function f(e, r) {
	switch (r.t) {
		case 2: return at[r.s];
		case 0: return "" + r.s;
		case 1: return "\"" + r.s + "\"";
		case 3: return r.s + "n";
		case 4: return m(e, r.i);
		case 23: return ia(e, r);
		case 24: return ua(e, r);
		case 27: return ca(e, r);
		case 28: return fa(e, r);
		case 29: return Sa(e, r);
		case 30: return ma(e, r);
		case 31: return pa(e, r);
		case 32: return da(e, r);
		case 33: return ga(e, r);
		case 34: return ya(e, r);
		default: return ae(e, r.i, ba(e, r));
	}
}
function Sr(e, r) {
	let t = f(e, r), n = r.i;
	if (n == null) return t;
	let a = ln(e.base), s = m(e, n), i = e.state.scopeId, u = i == null ? "" : le, l = a ? "(" + t + "," + a + s + ")" : t;
	if (u === "") return r.t === 10 && !a ? "(" + l + ")" : l;
	let g = i == null ? "()" : "(" + le + "[\"" + y(i) + "\"])";
	return "(" + ur([u], l) + ")" + g;
}
var Hr = class {
	constructor(r, t) {
		this._p = r;
		this.depth = t;
	}
	parse(r) {
		return E(this._p, this.depth, r);
	}
};
var Jr = class {
	constructor(r, t) {
		this._p = r;
		this.depth = t;
	}
	parse(r) {
		return E(this._p, this.depth, r);
	}
	parseWithError(r) {
		return K(this._p, this.depth, r);
	}
	isAlive() {
		return this._p.state.alive;
	}
	pushPendingState() {
		et(this._p);
	}
	popPendingState() {
		ve(this._p);
	}
	onParse(r) {
		se(this._p, r);
	}
	onError(r) {
		Xr(this._p, r);
	}
	addCleanup(r) {
		this._p.state.cleanups.push(r);
	}
};
function va(e) {
	return {
		alive: !0,
		pending: 0,
		initial: !0,
		buffer: [],
		onParse: e.onParse,
		onError: e.onError,
		onDone: e.onDone,
		cleanups: []
	};
}
function Zr(e) {
	return {
		type: 2,
		base: me(2, e),
		state: va(e)
	};
}
function Ca(e, r, t) {
	let n = [];
	for (let a = 0, s = t.length; a < s; a++) a in t ? n[a] = E(e, r, t[a]) : n[a] = 0;
	return n;
}
function Aa(e, r, t, n) {
	return ke(t, n, Ca(e, r, n));
}
function $r(e, r, t) {
	let n = Object.entries(t), a = [], s = [];
	for (let i = 0, u = n.length; i < u; i++) a.push(y(n[i][0])), s.push(E(e, r, n[i][1]));
	return C in t && (a.push(I(e.base, C)), s.push(je(tr(e.base), E(e, r, Xe(t))))), v in t && (a.push(I(e.base, v)), s.push(Ye(nr(e.base), E(e, r, e.type === 1 ? re() : er(t))))), P in t && (a.push(I(e.base, P)), s.push(X(t[P]))), R in t && (a.push(I(e.base, R)), s.push(t[R] ? J : Z)), {
		k: a,
		v: s
	};
}
function Gr(e, r, t, n, a) {
	return or(t, n, a, $r(e, r, n));
}
function Ea(e, r, t, n) {
	return De(t, E(e, r, n.valueOf()));
}
function Ia(e, r, t, n) {
	return Fe(t, n, E(e, r, n.buffer));
}
function Ra(e, r, t, n) {
	return Be(t, n, E(e, r, n.buffer));
}
function Pa(e, r, t, n) {
	return Ve(t, n, E(e, r, n.buffer));
}
function fn(e, r, t, n) {
	let a = $(n, e.base.features);
	return Me(t, n, a ? $r(e, r, a) : o);
}
function xa(e, r, t, n) {
	let a = $(n, e.base.features);
	return Le(t, n, a ? $r(e, r, a) : o);
}
function Ta(e, r, t, n) {
	let a = [], s = [];
	for (let [i, u] of n.entries()) a.push(E(e, r, i)), s.push(E(e, r, u));
	return ar(e.base, t, a, s);
}
function Oa(e, r, t, n) {
	let a = [];
	for (let s of n.keys()) a.push(E(e, r, s));
	return Ue(t, a);
}
function wa(e, r, t, n) {
	let a = qe(t, D(e.base, 4), []);
	return e.type === 1 || (et(e), n.on({
		next: (s) => {
			if (e.state.alive) {
				let i = K(e, r, s);
				i && se(e, We(t, i));
			}
		},
		throw: (s) => {
			if (e.state.alive) {
				let i = K(e, r, s);
				i && se(e, Ke(t, i));
			}
			ve(e);
		},
		return: (s) => {
			if (e.state.alive) {
				let i = K(e, r, s);
				i && se(e, Ge(t, i));
			}
			ve(e);
		}
	})), a;
}
function ha(e, r, t) {
	if (this.state.alive) {
		let n = K(this, r, t);
		n && se(this, c(23, e, o, o, o, o, o, [D(this.base, 2), n], o, o, o, o)), ve(this);
	}
}
function za(e, r, t) {
	if (this.state.alive) {
		let n = K(this, r, t);
		n && se(this, c(24, e, o, o, o, o, o, [D(this.base, 3), n], o, o, o, o));
	}
	ve(this);
}
function _a(e, r, t, n) {
	let a = _r(e.base, {});
	return e.type === 2 && (et(e), n.then(ha.bind(e, a, r), za.bind(e, a, r))), _t(e.base, t, a);
}
function ka(e, r, t, n, a) {
	for (let s = 0, i = a.length; s < i; s++) {
		let u = a[s];
		if (u.parse.sync && u.test(n)) return ce(t, u.tag, u.parse.sync(n, new Hr(e, r), { id: t }));
	}
	return o;
}
function Da(e, r, t, n, a) {
	for (let s = 0, i = a.length; s < i; s++) {
		let u = a[s];
		if (u.parse.stream && u.test(n)) return ce(t, u.tag, u.parse.stream(n, new Jr(e, r), { id: t }));
	}
	return o;
}
function Sn(e, r, t, n) {
	let a = e.base.plugins;
	return a ? e.type === 1 ? ka(e, r, t, n, a) : Da(e, r, t, n, a) : o;
}
function Fa(e, r, t, n) {
	let a = [];
	for (let s = 0, i = n.v.length; s < i; s++) a[s] = E(e, r, n.v[s]);
	return He(t, a, n.t, n.d);
}
function Ba(e, r, t, n, a) {
	switch (a) {
		case Object: return Gr(e, r, t, n, !1);
		case o: return Gr(e, r, t, n, !0);
		case Date: return ze(t, n);
		case Error:
		case EvalError:
		case RangeError:
		case ReferenceError:
		case SyntaxError:
		case TypeError:
		case URIError: return fn(e, r, t, n);
		case Number:
		case Boolean:
		case String:
		case BigInt: return Ea(e, r, t, n);
		case ArrayBuffer: return sr(e.base, t, n);
		case Int8Array:
		case Int16Array:
		case Int32Array:
		case Uint8Array:
		case Uint16Array:
		case Uint32Array:
		case Uint8ClampedArray:
		case Float32Array:
		case Float64Array: return Ia(e, r, t, n);
		case DataView: return Pa(e, r, t, n);
		case Map: return Ta(e, r, t, n);
		case Set: return Oa(e, r, t, n);
	}
	if (a === Promise || n instanceof Promise) return _a(e, r, t, n);
	let s = e.base.features;
	if (s & 32 && a === RegExp) return _e(t, n);
	if (s & 16) switch (a) {
		case BigInt64Array:
		case BigUint64Array: return Ra(e, r, t, n);
	}
	if (s & 1 && typeof AggregateError != "undefined" && (a === AggregateError || n instanceof AggregateError)) return xa(e, r, t, n);
	if (n instanceof Error) return fn(e, r, t, n);
	if (C in n || v in n) return Gr(e, r, t, n, !!a);
	throw new x(n);
}
function Va(e, r, t, n) {
	if (Array.isArray(n)) return Aa(e, r, t, n);
	if (Qe(n)) return wa(e, r, t, n);
	if ($e(n)) return Fa(e, r, t, n);
	let a = n.constructor;
	if (a === Y) return E(e, r, n.replacement);
	return Sn(e, r, t, n) || Ba(e, r, t, n, a);
}
function Ma(e, r, t) {
	let n = q(e.base, t);
	if (n.type !== 0) return n.value;
	let a = Sn(e, r, n.value, t);
	if (a) return a;
	throw new x(t);
}
function E(e, r, t) {
	if (r >= e.base.depthLimit) throw new M(e.base.depthLimit);
	switch (typeof t) {
		case "boolean": return t ? J : Z;
		case "undefined": return Ee;
		case "string": return X(t);
		case "number": return we(t);
		case "bigint": return he(t);
		case "object":
			if (t) {
				let n = q(e.base, t);
				return n.type === 0 ? Va(e, r + 1, n.value, t) : n.value;
			}
			return Ie;
		case "symbol": return I(e.base, t);
		case "function": return Ma(e, r, t);
		default: throw new x(t);
	}
}
function se(e, r) {
	e.state.initial ? e.state.buffer.push(r) : Qr(e, r, !1);
}
function Xr(e, r) {
	if (e.state.onError) e.state.onError(r);
	else throw r instanceof _ ? r : new _(r);
}
function mn(e) {
	e.state.onDone && e.state.onDone();
	for (let r = 0, t = e.state.cleanups.length; r < t; r++) e.state.cleanups[r]();
}
function Qr(e, r, t) {
	try {
		e.state.onParse(r, t);
	} catch (n) {
		Xr(e, n);
	}
}
function et(e) {
	e.state.pending++;
}
function ve(e) {
	--e.state.pending <= 0 && mn(e);
}
function K(e, r, t) {
	try {
		return E(e, r, t);
	} catch (n) {
		return Xr(e, n), o;
	}
}
function rt(e, r) {
	let t = K(e, 0, r);
	t && (Qr(e, t, !0), e.state.initial = !1, La(e, e.state), e.state.pending <= 0 && mr(e));
}
function La(e, r) {
	for (let t = 0, n = r.buffer.length; t < n; t++) Qr(e, r.buffer[t], !1);
}
function mr(e) {
	e.state.alive && (mn(e), e.state.alive = !1);
}
function pn(e, r) {
	let t = A(r.plugins), n = Zr({
		plugins: t,
		refs: r.refs,
		disabledFeatures: r.disabledFeatures,
		onParse(a, s) {
			let i = cr({
				plugins: t,
				features: n.base.features,
				scopeId: r.scopeId,
				markedRefs: n.base.marked
			}), u;
			try {
				u = Sr(i, a);
			} catch (l) {
				r.onError && r.onError(l);
				return;
			}
			r.onSerialize(u, s);
		},
		onError: r.onError,
		onDone: r.onDone
	});
	return rt(n, e), mr.bind(null, n);
}
var pr = class {
	constructor(r) {
		this.options = r;
		this.alive = !0;
		this.flushed = !1;
		this.done = !1;
		this.pending = 0;
		this.cleanups = [];
		this.refs = /* @__PURE__ */ new Map();
		this.keys = /* @__PURE__ */ new Set();
		this.ids = 0;
		this.plugins = A(r.plugins);
	}
	write(r, t) {
		this.alive && !this.flushed && (this.pending++, this.keys.add(r), this.cleanups.push(pn(t, {
			plugins: this.plugins,
			scopeId: this.options.scopeId,
			refs: this.refs,
			disabledFeatures: this.options.disabledFeatures,
			onError: this.options.onError,
			onSerialize: (n, a) => {
				this.alive && this.options.onData(a ? this.options.globalIdentifier + "[\"" + y(r) + "\"]=" + n : n);
			},
			onDone: () => {
				this.alive && (this.pending--, this.pending <= 0 && this.flushed && !this.done && this.options.onDone && (this.options.onDone(), this.done = !0));
			}
		})));
	}
	getNextID() {
		for (; this.keys.has("" + this.ids);) this.ids++;
		return "" + this.ids;
	}
	push(r) {
		let t = this.getNextID();
		return this.write(t, r), t;
	}
	flush() {
		this.alive && (this.flushed = !0, this.pending <= 0 && !this.done && this.options.onDone && (this.options.onDone(), this.done = !0));
	}
	close() {
		if (this.alive) {
			for (let r = 0, t = this.cleanups.length; r < t; r++) this.cleanups[r]();
			!this.done && this.options.onDone && (this.options.onDone(), this.done = !0), this.alive = !1;
		}
	}
};
//#endregion
//#region node_modules/seroval/dist/index.js
/**
* References
* - https://compat-table.github.io/compat-table/es6/
* - MDN
*/
var Feature = /* @__PURE__ */ function(Feature) {
	Feature[Feature["AggregateError"] = 1] = "AggregateError";
	Feature[Feature["ArrowFunction"] = 2] = "ArrowFunction";
	Feature[Feature["ErrorPrototypeStack"] = 4] = "ErrorPrototypeStack";
	Feature[Feature["ObjectAssign"] = 8] = "ObjectAssign";
	Feature[Feature["BigIntTypedArray"] = 16] = "BigIntTypedArray";
	Feature[Feature["RegExp"] = 32] = "RegExp";
	Feature[Feature["Temporal"] = 64] = "Temporal";
	return Feature;
}({});
var SYM_ASYNC_ITERATOR = Symbol.asyncIterator;
var SYM_HAS_INSTANCE = Symbol.hasInstance;
var SYM_IS_CONCAT_SPREADABLE = Symbol.isConcatSpreadable;
var SYM_ITERATOR = Symbol.iterator;
var SYM_MATCH = Symbol.match;
var SYM_MATCH_ALL = Symbol.matchAll;
var SYM_REPLACE = Symbol.replace;
var SYM_SEARCH = Symbol.search;
var SYM_SPECIES = Symbol.species;
var SYM_SPLIT = Symbol.split;
var SYM_TO_PRIMITIVE = Symbol.toPrimitive;
var SYM_TO_STRING_TAG = Symbol.toStringTag;
var SYM_UNSCOPABLES = Symbol.unscopables;
var INV_SYMBOL_REF = {
	[SYM_ASYNC_ITERATOR]: 0,
	[SYM_HAS_INSTANCE]: 1,
	[SYM_IS_CONCAT_SPREADABLE]: 2,
	[SYM_ITERATOR]: 3,
	[SYM_MATCH]: 4,
	[SYM_MATCH_ALL]: 5,
	[SYM_REPLACE]: 6,
	[SYM_SEARCH]: 7,
	[SYM_SPECIES]: 8,
	[SYM_SPLIT]: 9,
	[SYM_TO_PRIMITIVE]: 10,
	[SYM_TO_STRING_TAG]: 11,
	[SYM_UNSCOPABLES]: 12
};
var SYMBOL_REF = {
	[0]: SYM_ASYNC_ITERATOR,
	[1]: SYM_HAS_INSTANCE,
	[2]: SYM_IS_CONCAT_SPREADABLE,
	[3]: SYM_ITERATOR,
	[4]: SYM_MATCH,
	[5]: SYM_MATCH_ALL,
	[6]: SYM_REPLACE,
	[7]: SYM_SEARCH,
	[8]: SYM_SPECIES,
	[9]: SYM_SPLIT,
	[10]: SYM_TO_PRIMITIVE,
	[11]: SYM_TO_STRING_TAG,
	[12]: SYM_UNSCOPABLES
};
var CONSTANT_VAL = {
	[2]: true,
	[3]: false,
	[1]: void 0,
	[0]: null,
	[4]: -0,
	[5]: Number.POSITIVE_INFINITY,
	[6]: Number.NEGATIVE_INFINITY,
	[7]: NaN
};
var ERROR_CONSTRUCTOR_STRING = {
	[0]: "Error",
	[1]: "EvalError",
	[2]: "RangeError",
	[3]: "ReferenceError",
	[4]: "SyntaxError",
	[5]: "TypeError",
	[6]: "URIError"
};
var ERROR_CONSTRUCTOR = {
	[0]: Error,
	[1]: EvalError,
	[2]: RangeError,
	[3]: ReferenceError,
	[4]: SyntaxError,
	[5]: TypeError,
	[6]: URIError
};
function createSerovalNode(t, i, s, c, m, p, e, a, f, b, o, l) {
	return {
		t,
		i,
		s,
		c,
		m,
		p,
		e,
		a,
		f,
		b,
		o,
		l
	};
}
function createConstantNode(value) {
	return createSerovalNode(2, void 0, value, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
var TRUE_NODE = /* @__PURE__ */ createConstantNode(2);
var FALSE_NODE = /* @__PURE__ */ createConstantNode(3);
var UNDEFINED_NODE = /* @__PURE__ */ createConstantNode(1);
var NULL_NODE = /* @__PURE__ */ createConstantNode(0);
var NEG_ZERO_NODE = /* @__PURE__ */ createConstantNode(4);
var INFINITY_NODE = /* @__PURE__ */ createConstantNode(5);
var NEG_INFINITY_NODE = /* @__PURE__ */ createConstantNode(6);
var NAN_NODE = /* @__PURE__ */ createConstantNode(7);
function serializeChar(str) {
	switch (str) {
		case "\"": return "\\\"";
		case "\\": return "\\\\";
		case "\n": return "\\n";
		case "\r": return "\\r";
		case "\b": return "\\b";
		case "	": return "\\t";
		case "\f": return "\\f";
		case "<": return "\\x3C";
		case "\u2028": return "\\u2028";
		case "\u2029": return "\\u2029";
		default: return;
	}
}
function serializeString(str) {
	let result = "";
	let lastPos = 0;
	let replacement;
	for (let i = 0, len = str.length; i < len; i++) {
		replacement = serializeChar(str[i]);
		if (replacement) {
			result += str.slice(lastPos, i) + replacement;
			lastPos = i + 1;
		}
	}
	if (lastPos === 0) result = str;
	else result += str.slice(lastPos);
	return result;
}
function deserializeReplacer(str) {
	switch (str) {
		case "\\\\": return "\\";
		case "\\\"": return "\"";
		case "\\n": return "\n";
		case "\\r": return "\r";
		case "\\b": return "\b";
		case "\\t": return "	";
		case "\\f": return "\f";
		case "\\x3C": return "<";
		case "\\u2028": return "\u2028";
		case "\\u2029": return "\u2029";
		default: return str;
	}
}
function deserializeString(str) {
	return str.replace(/(\\\\|\\"|\\n|\\r|\\b|\\t|\\f|\\u2028|\\u2029|\\x3C)/g, deserializeReplacer);
}
var { toString: objectToString } = Object.prototype;
var STEP_ERROR_CODES = {
	parsing: 1,
	serialization: 2,
	deserialization: 3
};
function getErrorMessageProd(type) {
	return `Seroval Error (step: ${STEP_ERROR_CODES[type]})`;
}
var getErrorMessage = (type, cause) => getErrorMessageProd(type);
var SerovalError = class extends Error {
	constructor(type, cause) {
		super(getErrorMessage(type, cause));
		this.cause = cause;
	}
};
var SerovalParserError = class extends SerovalError {
	constructor(cause) {
		super("parsing", cause);
	}
};
var SerovalDeserializationError = class extends SerovalError {
	constructor(cause) {
		super("deserialization", cause);
	}
};
function getSpecificErrorMessage(code) {
	return `Seroval Error (specific: ${code})`;
}
var SerovalUnsupportedTypeError = class extends Error {
	constructor(value) {
		super(getSpecificErrorMessage(1));
		this.value = value;
	}
};
var SerovalUnsupportedNodeError = class extends Error {
	constructor(node) {
		super(getSpecificErrorMessage(2));
	}
};
var SerovalMissingPluginError = class extends Error {
	constructor(tag) {
		super(getSpecificErrorMessage(3));
	}
};
var SerovalMissingInstanceError = class extends Error {
	constructor(tag) {
		super(getSpecificErrorMessage(4));
	}
};
var SerovalMissingReferenceError = class extends Error {
	constructor(value) {
		super(getSpecificErrorMessage(5));
		this.value = value;
	}
};
var SerovalMissingReferenceForIdError = class extends Error {
	constructor(id) {
		super(getSpecificErrorMessage(6));
	}
};
var SerovalUnknownTypedArrayError = class extends Error {
	constructor(name) {
		super(getSpecificErrorMessage(7));
	}
};
var SerovalMalformedNodeError = class extends Error {
	constructor(node) {
		super(getSpecificErrorMessage(8));
	}
};
var SerovalDepthLimitError = class extends Error {
	constructor(limit) {
		super(getSpecificErrorMessage(9));
	}
};
var REFERENCES_KEY = "__SEROVAL_REFS__";
var REFERENCE = /* @__PURE__ */ new Map();
var INV_REFERENCE = /* @__PURE__ */ new Map();
function hasReferenceID(value) {
	return REFERENCE.has(value);
}
function hasReference(id) {
	return INV_REFERENCE.has(id);
}
function getReferenceID(value) {
	if (hasReferenceID(value)) return REFERENCE.get(value);
	throw new SerovalMissingReferenceError(value);
}
function getReference(id) {
	if (hasReference(id)) return INV_REFERENCE.get(id);
	throw new SerovalMissingReferenceForIdError(id);
}
if (typeof globalThis !== "undefined") Object.defineProperty(globalThis, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
else if (typeof window !== "undefined") Object.defineProperty(window, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
else if (typeof self !== "undefined") Object.defineProperty(self, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
else if (typeof global !== "undefined") Object.defineProperty(global, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
function getErrorConstructor(error) {
	if (error instanceof EvalError) return 1;
	if (error instanceof RangeError) return 2;
	if (error instanceof ReferenceError) return 3;
	if (error instanceof SyntaxError) return 4;
	if (error instanceof TypeError) return 5;
	if (error instanceof URIError) return 6;
	return 0;
}
function getInitialErrorOptions(error) {
	const construct = ERROR_CONSTRUCTOR_STRING[getErrorConstructor(error)];
	if (error.name !== construct) return { name: error.name };
	if (error.constructor.name !== construct) return { name: error.constructor.name };
	return {};
}
function getErrorOptions(error, features) {
	let options = getInitialErrorOptions(error);
	const names = Object.getOwnPropertyNames(error);
	for (let i = 0, len = names.length, name; i < len; i++) {
		name = names[i];
		if (name !== "name" && name !== "message") {
			if (name === "stack") {
				if (features & 4) {
					options = options || {};
					options[name] = error[name];
				}
			} else {
				options = options || {};
				options[name] = error[name];
			}
		}
	}
	return options;
}
function getObjectFlag(obj) {
	if (Object.isFrozen(obj)) return 3;
	if (Object.isSealed(obj)) return 2;
	if (Object.isExtensible(obj)) return 0;
	return 1;
}
function createNumberNode(value) {
	switch (value) {
		case Number.POSITIVE_INFINITY: return INFINITY_NODE;
		case Number.NEGATIVE_INFINITY: return NEG_INFINITY_NODE;
	}
	if (value !== value) return NAN_NODE;
	if (Object.is(value, -0)) return NEG_ZERO_NODE;
	return createSerovalNode(0, void 0, value, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createStringNode(value) {
	return createSerovalNode(1, void 0, serializeString(value), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createBigIntNode(current) {
	return createSerovalNode(3, void 0, "" + current, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createIndexedValueNode(id) {
	return createSerovalNode(4, id, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createDateNode(id, current) {
	const timestamp = current.valueOf();
	return createSerovalNode(5, id, timestamp !== timestamp ? "" : current.toISOString(), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createTemporalNode(id, type, current) {
	return createSerovalNode(36, id, current.toString(), type, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createRegExpNode(id, current) {
	return createSerovalNode(6, id, void 0, serializeString(current.source), current.flags, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createWKSymbolNode(id, current) {
	return createSerovalNode(17, id, INV_SYMBOL_REF[current], void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createReferenceNode(id, ref) {
	return createSerovalNode(18, id, serializeString(getReferenceID(ref)), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createPluginNode(id, tag, value) {
	return createSerovalNode(25, id, value, serializeString(tag), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createArrayNode(id, current, parsedItems) {
	return createSerovalNode(9, id, void 0, void 0, void 0, void 0, void 0, parsedItems, void 0, void 0, getObjectFlag(current), void 0);
}
function createBoxedNode(id, boxed) {
	return createSerovalNode(21, id, void 0, void 0, void 0, void 0, void 0, void 0, boxed, void 0, void 0, void 0);
}
var MAX_TYPED_ARRAY_LENGTH = 1e6;
function createTypedArrayNode(id, current, buffer) {
	if (current.length > MAX_TYPED_ARRAY_LENGTH) throw new SerovalUnsupportedTypeError(current);
	return createSerovalNode(15, id, void 0, current.constructor.name, void 0, void 0, void 0, void 0, buffer, current.byteOffset, void 0, current.length);
}
function createBigIntTypedArrayNode(id, current, buffer) {
	if (current.length > MAX_TYPED_ARRAY_LENGTH) throw new SerovalUnsupportedTypeError(current);
	return createSerovalNode(16, id, void 0, current.constructor.name, void 0, void 0, void 0, void 0, buffer, current.byteOffset, void 0, current.length);
}
function createDataViewNode(id, current, buffer) {
	if (current.byteLength > MAX_TYPED_ARRAY_LENGTH) throw new SerovalUnsupportedTypeError(current);
	return createSerovalNode(20, id, void 0, void 0, void 0, void 0, void 0, void 0, buffer, current.byteOffset, void 0, current.byteLength);
}
function createErrorNode(id, current, options) {
	return createSerovalNode(13, id, getErrorConstructor(current), void 0, serializeString(current.message), options, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createAggregateErrorNode(id, current, options) {
	return createSerovalNode(14, id, getErrorConstructor(current), void 0, serializeString(current.message), options, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createSetNode(id, items) {
	return createSerovalNode(7, id, void 0, void 0, void 0, void 0, void 0, items, void 0, void 0, void 0, void 0);
}
function createIteratorFactoryInstanceNode(factory, items) {
	return createSerovalNode(28, void 0, void 0, void 0, void 0, void 0, void 0, [factory, items], void 0, void 0, void 0, void 0);
}
function createAsyncIteratorFactoryInstanceNode(factory, items) {
	return createSerovalNode(30, void 0, void 0, void 0, void 0, void 0, void 0, [factory, items], void 0, void 0, void 0, void 0);
}
function createStreamConstructorNode(id, factory, sequence) {
	return createSerovalNode(31, id, void 0, void 0, void 0, void 0, void 0, sequence, factory, void 0, void 0, void 0);
}
function createStreamNextNode(id, parsed) {
	return createSerovalNode(32, id, void 0, void 0, void 0, void 0, void 0, void 0, parsed, void 0, void 0, void 0);
}
function createStreamThrowNode(id, parsed) {
	return createSerovalNode(33, id, void 0, void 0, void 0, void 0, void 0, void 0, parsed, void 0, void 0, void 0);
}
function createStreamReturnNode(id, parsed) {
	return createSerovalNode(34, id, void 0, void 0, void 0, void 0, void 0, void 0, parsed, void 0, void 0, void 0);
}
function createSequenceNode(id, sequence, throwAt, doneAt) {
	return createSerovalNode(35, id, throwAt, void 0, void 0, void 0, void 0, sequence, void 0, void 0, void 0, doneAt);
}
/**
* An opaque reference allows hiding values from the serializer.
*/
var OpaqueReference = class {
	constructor(value, replacement) {
		this.value = value;
		this.replacement = replacement;
	}
};
var PROMISE_CONSTRUCTOR = () => {
	const resolver = {
		p: 0,
		s: 0,
		f: 0
	};
	resolver.p = new Promise((resolve, reject) => {
		resolver.s = resolve;
		resolver.f = reject;
	});
	return resolver;
};
var STREAM_CONSTRUCTOR = () => {
	const buffer = [];
	const listeners = [];
	let alive = true;
	let success = false;
	let count = 0;
	const internal = {
		flush(value, mode, x) {
			for (x = 0; x < count; x++) if (listeners[x]) listeners[x][mode](value);
		},
		up(listener, x, z, current) {
			for (x = 0, z = buffer.length; x < z; x++) {
				current = buffer[x];
				if (!alive && x === z - 1) listener[success ? "return" : "throw"](current);
				else listener.next(current);
			}
		},
		on(listener, temp) {
			if (alive) {
				temp = count++;
				listeners[temp] = listener;
			}
			internal.up(listener);
			return () => {
				if (alive) {
					listeners[temp] = listeners[count];
					listeners[count--] = void 0;
				}
			};
		}
	};
	return {
		__SEROVAL_STREAM__: true,
		on(listener) {
			return internal.on(listener);
		},
		next(value) {
			if (alive) {
				buffer.push(value);
				internal.flush(value, "next");
			}
		},
		throw(value) {
			if (alive) {
				buffer.push(value);
				internal.flush(value, "throw");
				alive = false;
				success = false;
				listeners.length = 0;
			}
		},
		return(value) {
			if (alive) {
				buffer.push(value);
				internal.flush(value, "return");
				alive = false;
				success = true;
				listeners.length = 0;
			}
		}
	};
};
var ITERATOR_CONSTRUCTOR = (symbol) => (sequence) => () => {
	let index = 0;
	const instance = {
		[symbol]() {
			return instance;
		},
		next() {
			if (index > sequence.d) return {
				done: true,
				value: void 0
			};
			const currentIndex = index++;
			const data = sequence.v[currentIndex];
			if (currentIndex === sequence.t) throw data;
			return {
				done: currentIndex === sequence.d,
				value: data
			};
		}
	};
	return instance;
};
var ASYNC_ITERATOR_CONSTRUCTOR = (symbol, createPromise) => (stream) => () => {
	let count = 0;
	let doneAt = -1;
	let isThrow = false;
	const buffer = [];
	const pending = [];
	const internal = { finalize(i = 0, len = pending.length) {
		for (; i < len; i++) pending[i].s({
			done: true,
			value: void 0
		});
	} };
	stream.on({
		next(value) {
			const temp = pending.shift();
			if (temp) temp.s({
				done: false,
				value
			});
			buffer.push(value);
		},
		throw(value) {
			const temp = pending.shift();
			if (temp) temp.f(value);
			internal.finalize();
			doneAt = buffer.length;
			isThrow = true;
			buffer.push(value);
		},
		return(value) {
			const temp = pending.shift();
			if (temp) temp.s({
				done: true,
				value
			});
			internal.finalize();
			doneAt = buffer.length;
			buffer.push(value);
		}
	});
	const instance = {
		[symbol]() {
			return instance;
		},
		next() {
			if (doneAt === -1) {
				const index = count++;
				if (index >= buffer.length) {
					const temp = createPromise();
					pending.push(temp);
					return temp.p;
				}
				return {
					done: false,
					value: buffer[index]
				};
			}
			if (count > doneAt) return {
				done: true,
				value: void 0
			};
			const index = count++;
			const value = buffer[index];
			if (index !== doneAt) return {
				done: false,
				value
			};
			if (isThrow) throw value;
			return {
				done: true,
				value
			};
		}
	};
	return instance;
};
var ARRAY_BUFFER_CONSTRUCTOR = (b64) => {
	const decoded = atob(b64);
	const length = decoded.length;
	const arr = new Uint8Array(length);
	for (let i = 0; i < length; i++) arr[i] = decoded.charCodeAt(i);
	return arr.buffer;
};
function isSequence(value) {
	return "__SEROVAL_SEQUENCE__" in value;
}
function createSequence(values, throwAt, doneAt) {
	return {
		__SEROVAL_SEQUENCE__: true,
		v: values,
		t: throwAt,
		d: doneAt
	};
}
function createSequenceFromIterable(source) {
	const values = [];
	let throwsAt = -1;
	let doneAt = -1;
	const iterator = source[SYM_ITERATOR]();
	while (true) try {
		const value = iterator.next();
		values.push(value.value);
		if (value.done) {
			doneAt = values.length - 1;
			break;
		}
	} catch (error) {
		throwsAt = values.length;
		values.push(error);
	}
	return createSequence(values, throwsAt, doneAt);
}
var createIterator = ITERATOR_CONSTRUCTOR(SYM_ITERATOR);
function sequenceToIterator(sequence) {
	return createIterator(sequence);
}
var ITERATOR = {};
var ASYNC_ITERATOR = {};
/**
* Placeholder references
*/
var SPECIAL_REFS = {
	[0]: {},
	[1]: {},
	[2]: {},
	[3]: {},
	[4]: {},
	[5]: {}
};
function isStream(value) {
	return "__SEROVAL_STREAM__" in value;
}
function createStream() {
	return STREAM_CONSTRUCTOR();
}
function createStreamFromAsyncIterable(iterable) {
	const stream = createStream();
	const iterator = iterable[SYM_ASYNC_ITERATOR]();
	async function push() {
		try {
			const value = await iterator.next();
			if (value.done) stream.return(value.value);
			else {
				stream.next(value.value);
				await push();
			}
		} catch (error) {
			stream.throw(error);
		}
	}
	push().catch(() => {});
	return stream;
}
var createAsyncIterable = ASYNC_ITERATOR_CONSTRUCTOR(SYM_ASYNC_ITERATOR, PROMISE_CONSTRUCTOR);
function streamToAsyncIterable(stream) {
	return createAsyncIterable(stream);
}
function createBaseParserContext(mode, options) {
	return {
		plugins: options.plugins,
		mode,
		marked: /* @__PURE__ */ new Set(),
		features: 127 ^ (options.disabledFeatures || 0),
		refs: options.refs || /* @__PURE__ */ new Map(),
		depthLimit: options.depthLimit || 1e3
	};
}
/**
* Ensures that the value (based on an identifier) has been visited by the parser.
* @param ctx
* @param id
*/
function markParserRef(ctx, id) {
	ctx.marked.add(id);
}
/**
* Creates an identifier for a value
* @param ctx
* @param current
*/
function createIndexForValue(ctx, current) {
	const id = ctx.refs.size;
	ctx.refs.set(current, id);
	return id;
}
function getNodeForIndexedValue(ctx, current) {
	const registeredId = ctx.refs.get(current);
	if (registeredId != null) {
		markParserRef(ctx, registeredId);
		return {
			type: 1,
			value: createIndexedValueNode(registeredId)
		};
	}
	return {
		type: 0,
		value: createIndexForValue(ctx, current)
	};
}
function getReferenceNode(ctx, current) {
	const indexed = getNodeForIndexedValue(ctx, current);
	if (indexed.type === 1) return indexed;
	if (hasReferenceID(current)) return {
		type: 2,
		value: createReferenceNode(indexed.value, current)
	};
	return indexed;
}
/**
* Parsing methods
*/
function parseWellKnownSymbol(ctx, current) {
	const ref = getReferenceNode(ctx, current);
	if (ref.type !== 0) return ref.value;
	if (current in INV_SYMBOL_REF) return createWKSymbolNode(ref.value, current);
	throw new SerovalUnsupportedTypeError(current);
}
function parseSpecialReference(ctx, ref) {
	const result = getNodeForIndexedValue(ctx, SPECIAL_REFS[ref]);
	if (result.type === 1) return result.value;
	return createSerovalNode(26, result.value, ref, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function parseIteratorFactory(ctx) {
	const result = getNodeForIndexedValue(ctx, ITERATOR);
	if (result.type === 1) return result.value;
	return createSerovalNode(27, result.value, void 0, void 0, void 0, void 0, void 0, void 0, parseWellKnownSymbol(ctx, SYM_ITERATOR), void 0, void 0, void 0);
}
function parseAsyncIteratorFactory(ctx) {
	const result = getNodeForIndexedValue(ctx, ASYNC_ITERATOR);
	if (result.type === 1) return result.value;
	return createSerovalNode(29, result.value, void 0, void 0, void 0, void 0, void 0, [parseSpecialReference(ctx, 1), parseWellKnownSymbol(ctx, SYM_ASYNC_ITERATOR)], void 0, void 0, void 0, void 0);
}
function createObjectNode(id, current, empty, record) {
	return createSerovalNode(empty ? 11 : 10, id, void 0, void 0, void 0, record, void 0, void 0, void 0, void 0, getObjectFlag(current), void 0);
}
function createMapNode(ctx, id, k, v) {
	return createSerovalNode(8, id, void 0, void 0, void 0, void 0, {
		k,
		v
	}, void 0, parseSpecialReference(ctx, 0), void 0, void 0, void 0);
}
function createPromiseConstructorNode(ctx, id, resolver) {
	return createSerovalNode(22, id, resolver, void 0, void 0, void 0, void 0, void 0, parseSpecialReference(ctx, 1), void 0, void 0, void 0);
}
function createArrayBufferNode(ctx, id, current) {
	const bytes = new Uint8Array(current);
	let result = "";
	for (let i = 0, len = bytes.length; i < len; i++) result += String.fromCharCode(bytes[i]);
	return createSerovalNode(19, id, serializeString(btoa(result)), void 0, void 0, void 0, void 0, void 0, parseSpecialReference(ctx, 5), void 0, void 0, void 0);
}
function createPlugin(plugin) {
	return plugin;
}
function dedupePlugins(deduped, plugins) {
	for (let i = 0, len = plugins.length; i < len; i++) {
		const current = plugins[i];
		if (!deduped.has(current)) {
			deduped.add(current);
			if (current.extends) dedupePlugins(deduped, current.extends);
		}
	}
}
function resolvePlugins(plugins) {
	if (plugins) {
		const deduped = /* @__PURE__ */ new Set();
		dedupePlugins(deduped, plugins);
		return [...deduped];
	}
}
function getTypedArrayConstructor(name) {
	switch (name) {
		case "Int8Array": return Int8Array;
		case "Int16Array": return Int16Array;
		case "Int32Array": return Int32Array;
		case "Uint8Array": return Uint8Array;
		case "Uint16Array": return Uint16Array;
		case "Uint32Array": return Uint32Array;
		case "Uint8ClampedArray": return Uint8ClampedArray;
		case "Float32Array": return Float32Array;
		case "Float64Array": return Float64Array;
		case "BigInt64Array": return BigInt64Array;
		case "BigUint64Array": return BigUint64Array;
		default: throw new SerovalUnknownTypedArrayError(name);
	}
}
function isValidKey(key) {
	switch (key) {
		case "constructor":
		case "__proto__":
		case "prototype":
		case "__defineGetter__":
		case "__defineSetter__":
		case "__lookupGetter__":
		case "__lookupSetter__": return false;
		default: return true;
	}
}
function isValidSymbol(symbol) {
	switch (symbol) {
		case SYM_ASYNC_ITERATOR:
		case SYM_IS_CONCAT_SPREADABLE:
		case SYM_TO_STRING_TAG:
		case SYM_ITERATOR: return true;
		default: return false;
	}
}
var MAX_BASE64_LENGTH = 1e6;
var MAX_BIGINT_LENGTH = 1e4;
var MAX_REGEXP_SOURCE_LENGTH = 2e4;
function applyObjectFlag(obj, flag) {
	switch (flag) {
		case 3: return Object.freeze(obj);
		case 1: return Object.preventExtensions(obj);
		case 2: return Object.seal(obj);
		default: return obj;
	}
}
var DEFAULT_DEPTH_LIMIT = 1e3;
function createBaseDeserializerContext(mode, options) {
	var _options$features;
	const refs = options.refs || /* @__PURE__ */ new Map();
	if (!("types" in refs)) Object.assign(refs, { types: /* @__PURE__ */ new Map() });
	return {
		mode,
		plugins: options.plugins,
		refs,
		features: (_options$features = options.features) !== null && _options$features !== void 0 ? _options$features : 127 ^ (options.disabledFeatures || 0),
		depthLimit: options.depthLimit || DEFAULT_DEPTH_LIMIT
	};
}
function createCrossDeserializerContext(options) {
	return {
		mode: 2,
		base: createBaseDeserializerContext(2, options),
		child: void 0
	};
}
var DeserializePluginContext = class {
	constructor(_p, depth) {
		this._p = _p;
		this.depth = depth;
	}
	deserialize(node) {
		return deserialize$1(this._p, this.depth, node);
	}
};
function guardIndexedValue(ctx, id) {
	if (id < 0 || !Number.isFinite(id) || !Number.isInteger(id)) throw new SerovalMalformedNodeError({
		t: 4,
		i: id
	});
	if (ctx.refs.has(id)) throw new Error("Conflicted ref id: " + id);
}
function isThennable(value) {
	return !!value && typeof value === "object" && "then" in value && typeof value.then === "function";
}
function assignIndexedValueVanilla(ctx, id, value) {
	guardIndexedValue(ctx.base, id);
	if (ctx.state.marked.has(id)) ctx.base.refs.set(id, value);
	return value;
}
function assignIndexedValueCross(ctx, id, value) {
	guardIndexedValue(ctx.base, id);
	ctx.base.refs.set(id, value);
	return value;
}
function assignIndexedValue$1(ctx, id, value) {
	return ctx.mode === 1 ? assignIndexedValueVanilla(ctx, id, value) : assignIndexedValueCross(ctx, id, value);
}
function deserializeKnownValue(node, record, key) {
	if (Object.hasOwn(record, key)) return record[key];
	throw new SerovalMalformedNodeError(node);
}
function deserializeReference(ctx, node) {
	return assignIndexedValue$1(ctx, node.i, getReference(deserializeString(node.s)));
}
function deserializeArray(ctx, depth, node) {
	const items = node.a;
	const len = items.length;
	const result = assignIndexedValue$1(ctx, node.i, new Array(len));
	for (let i = 0, item; i < len; i++) {
		item = items[i];
		if (item) result[i] = deserialize$1(ctx, depth, item);
	}
	applyObjectFlag(result, node.o);
	return result;
}
function assignStringProperty(object, key, value) {
	if (isValidKey(key)) object[key] = value;
	else Object.defineProperty(object, key, {
		value,
		configurable: true,
		enumerable: true,
		writable: true
	});
}
function assignProperty(ctx, depth, object, key, value) {
	if (typeof key === "string") assignStringProperty(object, deserializeString(key), deserialize$1(ctx, depth, value));
	else {
		const actual = deserialize$1(ctx, depth, key);
		switch (typeof actual) {
			case "string":
				assignStringProperty(object, actual, deserialize$1(ctx, depth, value));
				break;
			case "symbol":
				if (isValidSymbol(actual)) object[actual] = deserialize$1(ctx, depth, value);
				break;
			default: throw new SerovalMalformedNodeError(key);
		}
	}
}
function assignNodeType(ctx, id, type) {
	ctx.base.refs.types.set(id, type);
}
function validateNodeType(ctx, node, id, type) {
	if (ctx.base.refs.types.get(id) !== type) throw new SerovalMalformedNodeError(node);
}
function deserializeProperties(ctx, depth, node, result) {
	const keys = node.k;
	if (keys.length > 0) for (let i = 0, vals = node.v, len = keys.length; i < len; i++) assignProperty(ctx, depth, result, keys[i], vals[i]);
	return result;
}
function deserializeObject(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, node.t === 10 ? {} : Object.create(null));
	deserializeProperties(ctx, depth, node.p, result);
	applyObjectFlag(result, node.o);
	return result;
}
function deserializeDate(ctx, node) {
	return assignIndexedValue$1(ctx, node.i, new Date(node.s));
}
function deserializeTemporal(ctx, node) {
	if (!(ctx.base.features & 64)) throw new SerovalUnsupportedNodeError(node);
	let value;
	switch (node.c) {
		case 0:
			value = Temporal.Instant.from(node.s);
			break;
		case 1:
			value = Temporal.Duration.from(node.s);
			break;
		case 2:
			value = Temporal.PlainDate.from(node.s);
			break;
		case 3:
			value = Temporal.PlainDateTime.from(node.s);
			break;
		case 4:
			value = Temporal.PlainMonthDay.from(node.s);
			break;
		case 5:
			value = Temporal.PlainTime.from(node.s);
			break;
		case 6:
			value = Temporal.PlainYearMonth.from(node.s);
			break;
		case 7:
			value = Temporal.ZonedDateTime.from(node.s);
			break;
		default: throw new SerovalMalformedNodeError(node);
	}
	return assignIndexedValue$1(ctx, node.i, value);
}
function deserializeRegExp(ctx, node) {
	if (ctx.base.features & 32) {
		const source = deserializeString(node.c);
		if (source.length > MAX_REGEXP_SOURCE_LENGTH) throw new SerovalMalformedNodeError(node);
		return assignIndexedValue$1(ctx, node.i, new RegExp(source, node.m));
	}
	throw new SerovalUnsupportedNodeError(node);
}
function deserializeSet(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, /* @__PURE__ */ new Set());
	for (let i = 0, items = node.a, len = items.length; i < len; i++) result.add(deserialize$1(ctx, depth, items[i]));
	return result;
}
function deserializeMap(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, /* @__PURE__ */ new Map());
	for (let i = 0, keys = node.e.k, vals = node.e.v, len = keys.length; i < len; i++) result.set(deserialize$1(ctx, depth, keys[i]), deserialize$1(ctx, depth, vals[i]));
	return result;
}
function deserializeArrayBuffer(ctx, node) {
	if (node.s.length > MAX_BASE64_LENGTH) throw new SerovalMalformedNodeError(node);
	return assignIndexedValue$1(ctx, node.i, ARRAY_BUFFER_CONSTRUCTOR(deserializeString(node.s)));
}
function deserializeTypedArray(ctx, depth, node) {
	var _node$b;
	const construct = getTypedArrayConstructor(node.c);
	const source = deserialize$1(ctx, depth, node.f);
	if (!(source instanceof ArrayBuffer)) throw new SerovalMalformedNodeError(node);
	const offset = (_node$b = node.b) !== null && _node$b !== void 0 ? _node$b : 0;
	if (offset < 0 || offset > source.byteLength || node.l > MAX_BASE64_LENGTH) throw new SerovalMalformedNodeError(node);
	return assignIndexedValue$1(ctx, node.i, new construct(source, offset, node.l));
}
function deserializeDataView(ctx, depth, node) {
	var _node$b2;
	const source = deserialize$1(ctx, depth, node.f);
	if (!(source instanceof ArrayBuffer)) throw new SerovalMalformedNodeError(node);
	const offset = (_node$b2 = node.b) !== null && _node$b2 !== void 0 ? _node$b2 : 0;
	if (offset < 0 || offset > source.byteLength || node.l > MAX_BASE64_LENGTH) throw new SerovalMalformedNodeError(node);
	return assignIndexedValue$1(ctx, node.i, new DataView(source, offset, node.l));
}
function deserializeDictionary(ctx, depth, node, result) {
	if (node.p) {
		const fields = deserializeProperties(ctx, depth, node.p, {});
		Object.defineProperties(result, Object.getOwnPropertyDescriptors(fields));
	}
	return result;
}
function deserializeAggregateError(ctx, depth, node) {
	return deserializeDictionary(ctx, depth, node, assignIndexedValue$1(ctx, node.i, new AggregateError([], deserializeString(node.m))));
}
function deserializeError(ctx, depth, node) {
	const construct = deserializeKnownValue(node, ERROR_CONSTRUCTOR, node.s);
	return deserializeDictionary(ctx, depth, node, assignIndexedValue$1(ctx, node.i, new construct(deserializeString(node.m))));
}
function deserializePromise(ctx, depth, node) {
	const deferred = PROMISE_CONSTRUCTOR();
	const result = assignIndexedValue$1(ctx, node.i, deferred.p);
	const deserialized = deserialize$1(ctx, depth, node.f);
	if (isThennable(deserialized)) throw new SerovalMalformedNodeError(node.f);
	if (node.s) deferred.s(deserialized);
	else deferred.f(deserialized);
	return result;
}
function deserializeBoxed(ctx, depth, node) {
	return assignIndexedValue$1(ctx, node.i, Object(deserialize$1(ctx, depth, node.f)));
}
function deserializePlugin(ctx, depth, node) {
	const currentPlugins = ctx.base.plugins;
	if (currentPlugins) {
		const tag = deserializeString(node.c);
		for (let i = 0, len = currentPlugins.length; i < len; i++) {
			const plugin = currentPlugins[i];
			if (plugin.tag === tag) return assignIndexedValue$1(ctx, node.i, plugin.deserialize(node.s, new DeserializePluginContext(ctx, depth), { id: node.i }));
		}
	}
	throw new SerovalMissingPluginError(node.c);
}
function deserializePromiseConstructor(ctx, node) {
	const value = assignIndexedValue$1(ctx, node.i, assignIndexedValue$1(ctx, node.s, PROMISE_CONSTRUCTOR()).p);
	assignNodeType(ctx, node.s, 22);
	return value;
}
function deserializePromiseFulfill(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 22);
		const deserialized = deserialize$1(ctx, depth, node.a[1]);
		if (isThennable(deserialized)) throw new SerovalMalformedNodeError(node.a[1]);
		if (node.t === 23) deferred.s(deserialized);
		else deferred.f(deserialized);
		return;
	}
	throw new SerovalMissingInstanceError("Promise");
}
function deserializeIteratorFactoryInstance(ctx, depth, node) {
	deserialize$1(ctx, depth, node.a[0]);
	const source = deserialize$1(ctx, depth, node.a[1]);
	if (!source || typeof source !== "object" || !isSequence(source)) throw new SerovalMalformedNodeError(node.a[1]);
	return sequenceToIterator(source);
}
function deserializeAsyncIteratorFactoryInstance(ctx, depth, node) {
	deserialize$1(ctx, depth, node.a[0]);
	const source = deserialize$1(ctx, depth, node.a[1]);
	if (!source || typeof source !== "object" || !isStream(source)) throw new SerovalMalformedNodeError(node.a[1]);
	return streamToAsyncIterable(source);
}
function deserializeStreamConstructor(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, createStream());
	assignNodeType(ctx, node.i, 31);
	const items = node.a;
	const len = items.length;
	if (len) for (let i = 0; i < len; i++) deserialize$1(ctx, depth, items[i]);
	return result;
}
function deserializeStreamNext(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 31);
		deferred.next(deserialize$1(ctx, depth, node.f));
		return;
	}
	throw new SerovalMissingInstanceError("Stream");
}
function deserializeStreamThrow(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 31);
		deferred.throw(deserialize$1(ctx, depth, node.f));
		return;
	}
	throw new SerovalMissingInstanceError("Stream");
}
function deserializeStreamReturn(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 31);
		deferred.return(deserialize$1(ctx, depth, node.f));
		return;
	}
	throw new SerovalMissingInstanceError("Stream");
}
function deserializeIteratorFactory(ctx, depth, node) {
	deserialize$1(ctx, depth, node.f);
}
function deserializeAsyncIteratorFactory(ctx, depth, node) {
	deserialize$1(ctx, depth, node.a[1]);
}
function deserializeSequence(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, createSequence([], node.s, node.l));
	for (let i = 0, len = node.a.length; i < len; i++) result.v[i] = deserialize$1(ctx, depth, node.a[i]);
	return result;
}
function deserialize$1(ctx, depth, node) {
	if (depth > ctx.base.depthLimit) throw new SerovalDepthLimitError(ctx.base.depthLimit);
	depth += 1;
	switch (node.t) {
		case 2: return deserializeKnownValue(node, CONSTANT_VAL, node.s);
		case 0: return Number(node.s);
		case 1: return deserializeString(String(node.s));
		case 3:
			if (String(node.s).length > MAX_BIGINT_LENGTH) throw new SerovalMalformedNodeError(node);
			return BigInt(node.s);
		case 4: return ctx.base.refs.get(node.i);
		case 18: return deserializeReference(ctx, node);
		case 9: return deserializeArray(ctx, depth, node);
		case 10:
		case 11: return deserializeObject(ctx, depth, node);
		case 5: return deserializeDate(ctx, node);
		case 6: return deserializeRegExp(ctx, node);
		case 7: return deserializeSet(ctx, depth, node);
		case 8: return deserializeMap(ctx, depth, node);
		case 19: return deserializeArrayBuffer(ctx, node);
		case 16:
		case 15: return deserializeTypedArray(ctx, depth, node);
		case 20: return deserializeDataView(ctx, depth, node);
		case 14: return deserializeAggregateError(ctx, depth, node);
		case 13: return deserializeError(ctx, depth, node);
		case 12: return deserializePromise(ctx, depth, node);
		case 17: return deserializeKnownValue(node, SYMBOL_REF, node.s);
		case 21: return deserializeBoxed(ctx, depth, node);
		case 25: return deserializePlugin(ctx, depth, node);
		case 22: return deserializePromiseConstructor(ctx, node);
		case 23:
		case 24: return deserializePromiseFulfill(ctx, depth, node);
		case 28: return deserializeIteratorFactoryInstance(ctx, depth, node);
		case 30: return deserializeAsyncIteratorFactoryInstance(ctx, depth, node);
		case 31: return deserializeStreamConstructor(ctx, depth, node);
		case 32: return deserializeStreamNext(ctx, depth, node);
		case 33: return deserializeStreamThrow(ctx, depth, node);
		case 34: return deserializeStreamReturn(ctx, depth, node);
		case 27: return deserializeIteratorFactory(ctx, depth, node);
		case 29: return deserializeAsyncIteratorFactory(ctx, depth, node);
		case 35: return deserializeSequence(ctx, depth, node);
		case 36: return deserializeTemporal(ctx, node);
		default: throw new SerovalUnsupportedNodeError(node);
	}
}
function deserializeTop(ctx, node) {
	try {
		return deserialize$1(ctx, 0, node);
	} catch (error) {
		throw new SerovalDeserializationError(error);
	}
}
var SyncParsePluginContext = class {
	constructor(_p, depth) {
		this._p = _p;
		this.depth = depth;
	}
	parse(current) {
		return parseSOS(this._p, this.depth, current);
	}
};
var StreamParsePluginContext = class {
	constructor(_p, depth) {
		this._p = _p;
		this.depth = depth;
	}
	parse(current) {
		return parseSOS(this._p, this.depth, current);
	}
	parseWithError(current) {
		return parseWithError(this._p, this.depth, current);
	}
	isAlive() {
		return this._p.state.alive;
	}
	pushPendingState() {
		pushPendingState(this._p);
	}
	popPendingState() {
		popPendingState(this._p);
	}
	onParse(node) {
		onParse(this._p, node);
	}
	onError(error) {
		onError(this._p, error);
	}
	addCleanup(callback) {
		this._p.state.cleanups.push(callback);
	}
};
function createStreamParserState(options) {
	return {
		alive: true,
		pending: 0,
		initial: true,
		buffer: [],
		onParse: options.onParse,
		onError: options.onError,
		onDone: options.onDone,
		cleanups: []
	};
}
function createStreamParserContext(options) {
	return {
		type: 2,
		base: createBaseParserContext(2, options),
		state: createStreamParserState(options)
	};
}
function parseItems(ctx, depth, current) {
	const nodes = [];
	for (let i = 0, len = current.length; i < len; i++) if (i in current) nodes[i] = parseSOS(ctx, depth, current[i]);
	else nodes[i] = 0;
	return nodes;
}
function parseArray(ctx, depth, id, current) {
	return createArrayNode(id, current, parseItems(ctx, depth, current));
}
function parseProperties(ctx, depth, properties) {
	const entries = Object.entries(properties);
	const keyNodes = [];
	const valueNodes = [];
	for (let i = 0, len = entries.length; i < len; i++) {
		keyNodes.push(serializeString(entries[i][0]));
		valueNodes.push(parseSOS(ctx, depth, entries[i][1]));
	}
	if (SYM_ITERATOR in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_ITERATOR));
		valueNodes.push(createIteratorFactoryInstanceNode(parseIteratorFactory(ctx.base), parseSOS(ctx, depth, createSequenceFromIterable(properties))));
	}
	if (SYM_ASYNC_ITERATOR in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_ASYNC_ITERATOR));
		valueNodes.push(createAsyncIteratorFactoryInstanceNode(parseAsyncIteratorFactory(ctx.base), parseSOS(ctx, depth, ctx.type === 1 ? createStream() : createStreamFromAsyncIterable(properties))));
	}
	if (SYM_TO_STRING_TAG in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_TO_STRING_TAG));
		valueNodes.push(createStringNode(properties[SYM_TO_STRING_TAG]));
	}
	if (SYM_IS_CONCAT_SPREADABLE in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_IS_CONCAT_SPREADABLE));
		valueNodes.push(properties[SYM_IS_CONCAT_SPREADABLE] ? TRUE_NODE : FALSE_NODE);
	}
	return {
		k: keyNodes,
		v: valueNodes
	};
}
function parsePlainObject(ctx, depth, id, current, empty) {
	return createObjectNode(id, current, empty, parseProperties(ctx, depth, current));
}
function parseBoxed(ctx, depth, id, current) {
	return createBoxedNode(id, parseSOS(ctx, depth, current.valueOf()));
}
function parseTypedArray(ctx, depth, id, current) {
	return createTypedArrayNode(id, current, parseSOS(ctx, depth, current.buffer));
}
function parseBigIntTypedArray(ctx, depth, id, current) {
	return createBigIntTypedArrayNode(id, current, parseSOS(ctx, depth, current.buffer));
}
function parseDataView(ctx, depth, id, current) {
	return createDataViewNode(id, current, parseSOS(ctx, depth, current.buffer));
}
function parseError(ctx, depth, id, current) {
	const options = getErrorOptions(current, ctx.base.features);
	return createErrorNode(id, current, options ? parseProperties(ctx, depth, options) : void 0);
}
function parseAggregateError(ctx, depth, id, current) {
	const options = getErrorOptions(current, ctx.base.features);
	return createAggregateErrorNode(id, current, options ? parseProperties(ctx, depth, options) : void 0);
}
function parseMap(ctx, depth, id, current) {
	const keyNodes = [];
	const valueNodes = [];
	for (const [key, value] of current.entries()) {
		keyNodes.push(parseSOS(ctx, depth, key));
		valueNodes.push(parseSOS(ctx, depth, value));
	}
	return createMapNode(ctx.base, id, keyNodes, valueNodes);
}
function parseSet(ctx, depth, id, current) {
	const items = [];
	for (const item of current.keys()) items.push(parseSOS(ctx, depth, item));
	return createSetNode(id, items);
}
function parseStream(ctx, depth, id, current) {
	const result = createStreamConstructorNode(id, parseSpecialReference(ctx.base, 4), []);
	if (ctx.type === 1) return result;
	pushPendingState(ctx);
	current.on({
		next: (value) => {
			if (ctx.state.alive) {
				const parsed = parseWithError(ctx, depth, value);
				if (parsed) onParse(ctx, createStreamNextNode(id, parsed));
			}
		},
		throw: (value) => {
			if (ctx.state.alive) {
				const parsed = parseWithError(ctx, depth, value);
				if (parsed) onParse(ctx, createStreamThrowNode(id, parsed));
			}
			popPendingState(ctx);
		},
		return: (value) => {
			if (ctx.state.alive) {
				const parsed = parseWithError(ctx, depth, value);
				if (parsed) onParse(ctx, createStreamReturnNode(id, parsed));
			}
			popPendingState(ctx);
		}
	});
	return result;
}
function handlePromiseSuccess(id, depth, data) {
	if (this.state.alive) {
		const parsed = parseWithError(this, depth, data);
		if (parsed) onParse(this, createSerovalNode(23, id, void 0, void 0, void 0, void 0, void 0, [parseSpecialReference(this.base, 2), parsed], void 0, void 0, void 0, void 0));
		popPendingState(this);
	}
}
function handlePromiseFailure(id, depth, data) {
	if (this.state.alive) {
		const parsed = parseWithError(this, depth, data);
		if (parsed) onParse(this, createSerovalNode(24, id, void 0, void 0, void 0, void 0, void 0, [parseSpecialReference(this.base, 3), parsed], void 0, void 0, void 0, void 0));
	}
	popPendingState(this);
}
function parsePromise(ctx, depth, id, current) {
	const resolver = createIndexForValue(ctx.base, {});
	if (ctx.type === 2) {
		pushPendingState(ctx);
		current.then(handlePromiseSuccess.bind(ctx, resolver, depth), handlePromiseFailure.bind(ctx, resolver, depth));
	}
	return createPromiseConstructorNode(ctx.base, id, resolver);
}
function parsePluginSync(ctx, depth, id, current, currentPlugins) {
	for (let i = 0, len = currentPlugins.length; i < len; i++) {
		const plugin = currentPlugins[i];
		if (plugin.parse.sync && plugin.test(current)) return createPluginNode(id, plugin.tag, plugin.parse.sync(current, new SyncParsePluginContext(ctx, depth), { id }));
	}
}
function parsePluginStream(ctx, depth, id, current, currentPlugins) {
	for (let i = 0, len = currentPlugins.length; i < len; i++) {
		const plugin = currentPlugins[i];
		if (plugin.parse.stream && plugin.test(current)) return createPluginNode(id, plugin.tag, plugin.parse.stream(current, new StreamParsePluginContext(ctx, depth), { id }));
	}
}
function parsePlugin(ctx, depth, id, current) {
	const currentPlugins = ctx.base.plugins;
	if (currentPlugins) return ctx.type === 1 ? parsePluginSync(ctx, depth, id, current, currentPlugins) : parsePluginStream(ctx, depth, id, current, currentPlugins);
}
function parseSequence(ctx, depth, id, current) {
	const nodes = [];
	for (let i = 0, len = current.v.length; i < len; i++) nodes[i] = parseSOS(ctx, depth, current.v[i]);
	return createSequenceNode(id, nodes, current.t, current.d);
}
function parseObjectPhase2(ctx, depth, id, current, currentClass) {
	switch (currentClass) {
		case Object: return parsePlainObject(ctx, depth, id, current, false);
		case void 0: return parsePlainObject(ctx, depth, id, current, true);
		case Date: return createDateNode(id, current);
		case Error:
		case EvalError:
		case RangeError:
		case ReferenceError:
		case SyntaxError:
		case TypeError:
		case URIError: return parseError(ctx, depth, id, current);
		case Number:
		case Boolean:
		case String:
		case BigInt: return parseBoxed(ctx, depth, id, current);
		case ArrayBuffer: return createArrayBufferNode(ctx.base, id, current);
		case Int8Array:
		case Int16Array:
		case Int32Array:
		case Uint8Array:
		case Uint16Array:
		case Uint32Array:
		case Uint8ClampedArray:
		case Float32Array:
		case Float64Array: return parseTypedArray(ctx, depth, id, current);
		case DataView: return parseDataView(ctx, depth, id, current);
		case Map: return parseMap(ctx, depth, id, current);
		case Set: return parseSet(ctx, depth, id, current);
	}
	if (currentClass === Promise || current instanceof Promise) return parsePromise(ctx, depth, id, current);
	const currentFeatures = ctx.base.features;
	if (currentFeatures & 32 && currentClass === RegExp) return createRegExpNode(id, current);
	if (currentFeatures & 16) switch (currentClass) {
		case BigInt64Array:
		case BigUint64Array: return parseBigIntTypedArray(ctx, depth, id, current);
	}
	if (currentFeatures & 1 && typeof AggregateError !== "undefined" && (currentClass === AggregateError || current instanceof AggregateError)) return parseAggregateError(ctx, depth, id, current);
	if (currentFeatures & 64 && typeof Temporal !== "undefined") switch (currentClass) {
		case Temporal.Instant: return createTemporalNode(id, 0, current);
		case Temporal.Duration: return createTemporalNode(id, 1, current);
		case Temporal.PlainDate: return createTemporalNode(id, 2, current);
		case Temporal.PlainDateTime: return createTemporalNode(id, 3, current);
		case Temporal.PlainMonthDay: return createTemporalNode(id, 4, current);
		case Temporal.PlainTime: return createTemporalNode(id, 5, current);
		case Temporal.PlainYearMonth: return createTemporalNode(id, 6, current);
		case Temporal.ZonedDateTime: return createTemporalNode(id, 7, current);
	}
	if (current instanceof Error) return parseError(ctx, depth, id, current);
	if (SYM_ITERATOR in current || SYM_ASYNC_ITERATOR in current) return parsePlainObject(ctx, depth, id, current, !!currentClass);
	throw new SerovalUnsupportedTypeError(current);
}
function parseObject(ctx, depth, id, current) {
	if (Array.isArray(current)) return parseArray(ctx, depth, id, current);
	if (isStream(current)) return parseStream(ctx, depth, id, current);
	if (isSequence(current)) return parseSequence(ctx, depth, id, current);
	let currentClass = current.constructor;
	if (currentClass !== void 0 && typeof currentClass !== "function") {
		const proto = Object.getPrototypeOf(current);
		currentClass = proto === null ? void 0 : proto.constructor;
	}
	if (currentClass === OpaqueReference) return parseSOS(ctx, depth, current.replacement);
	const parsed = parsePlugin(ctx, depth, id, current);
	if (parsed) return parsed;
	return parseObjectPhase2(ctx, depth, id, current, currentClass);
}
function parseFunction(ctx, depth, current) {
	const ref = getReferenceNode(ctx.base, current);
	if (ref.type !== 0) return ref.value;
	const plugin = parsePlugin(ctx, depth, ref.value, current);
	if (plugin) return plugin;
	throw new SerovalUnsupportedTypeError(current);
}
function parseSOS(ctx, depth, current) {
	if (depth >= ctx.base.depthLimit) throw new SerovalDepthLimitError(ctx.base.depthLimit);
	switch (typeof current) {
		case "boolean": return current ? TRUE_NODE : FALSE_NODE;
		case "undefined": return UNDEFINED_NODE;
		case "string": return createStringNode(current);
		case "number": return createNumberNode(current);
		case "bigint": return createBigIntNode(current);
		case "object":
			if (current) {
				const ref = getReferenceNode(ctx.base, current);
				return ref.type === 0 ? parseObject(ctx, depth + 1, ref.value, current) : ref.value;
			}
			return NULL_NODE;
		case "symbol": return parseWellKnownSymbol(ctx.base, current);
		case "function": return parseFunction(ctx, depth, current);
		default: throw new SerovalUnsupportedTypeError(current);
	}
}
function onParse(ctx, node) {
	if (ctx.state.initial) ctx.state.buffer.push(node);
	else onParseInternal(ctx, node, false);
}
function onError(ctx, error) {
	if (ctx.state.onError) ctx.state.onError(error);
	else throw error instanceof SerovalParserError ? error : new SerovalParserError(error);
}
function onDone(ctx) {
	if (ctx.state.onDone) ctx.state.onDone();
	for (let i = 0, len = ctx.state.cleanups.length; i < len; i++) ctx.state.cleanups[i]();
}
function onParseInternal(ctx, node, initial) {
	try {
		ctx.state.onParse(node, initial);
	} catch (error) {
		onError(ctx, error);
	}
}
function pushPendingState(ctx) {
	ctx.state.pending++;
}
function popPendingState(ctx) {
	if (--ctx.state.pending <= 0) onDone(ctx);
}
function parseWithError(ctx, depth, current) {
	try {
		return parseSOS(ctx, depth, current);
	} catch (err) {
		onError(ctx, err);
		return;
	}
}
function startStreamParse(ctx, current) {
	const parsed = parseWithError(ctx, 0, current);
	if (parsed) {
		onParseInternal(ctx, parsed, true);
		ctx.state.initial = false;
		flushStreamParse(ctx, ctx.state);
		if (ctx.state.pending <= 0) destroyStreamParse(ctx);
	}
}
function flushStreamParse(ctx, state) {
	for (let i = 0, len = state.buffer.length; i < len; i++) onParseInternal(ctx, state.buffer[i], false);
}
function destroyStreamParse(ctx) {
	if (ctx.state.alive) {
		onDone(ctx);
		ctx.state.alive = false;
	}
}
function toCrossJSONStream(source, options) {
	const ctx = createStreamParserContext({
		plugins: resolvePlugins(options.plugins),
		refs: options.refs,
		disabledFeatures: options.disabledFeatures,
		depthLimit: options.depthLimit,
		onParse: options.onParse,
		onError: options.onError,
		onDone: options.onDone
	});
	startStreamParse(ctx, source);
	return destroyStreamParse.bind(null, ctx);
}
function fromCrossJSON(source, options) {
	return deserializeTop(createCrossDeserializerContext({
		plugins: resolvePlugins(options.plugins),
		refs: options.refs,
		features: options.features,
		disabledFeatures: options.disabledFeatures,
		depthLimit: options.depthLimit
	}), source);
}
//#endregion
export { toCrossJSONStream as a, pr as c, fromCrossJSON as i, re as l, createPlugin as n, L as o, createStream as r, ai as s, Feature as t, yn as u };

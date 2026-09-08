//#region node_modules/radix3/dist/index.mjs
var NODE_TYPES = {
	NORMAL: 0,
	WILDCARD: 1,
	PLACEHOLDER: 2
};
function createRouter(options = {}) {
	const ctx = {
		options,
		rootNode: createRadixNode(),
		staticRoutesMap: {}
	};
	const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
	if (options.routes) for (const path in options.routes) insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
	return {
		ctx,
		lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
		insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
		remove: (path) => remove(ctx, normalizeTrailingSlash(path))
	};
}
function lookup(ctx, path) {
	const staticPathNode = ctx.staticRoutesMap[path];
	if (staticPathNode) return staticPathNode.data;
	const sections = path.split("/");
	const params = {};
	let paramsFound = false;
	let wildcardNode = null;
	let node = ctx.rootNode;
	let wildCardParam = null;
	for (let i = 0; i < sections.length; i++) {
		const section = sections[i];
		if (node.wildcardChildNode !== null) {
			wildcardNode = node.wildcardChildNode;
			wildCardParam = sections.slice(i).join("/");
		}
		const nextNode = node.children.get(section);
		if (nextNode === void 0) {
			if (node && node.placeholderChildren.length > 1) {
				const remaining = sections.length - i;
				node = node.placeholderChildren.find((c) => c.maxDepth === remaining) || null;
			} else node = node.placeholderChildren[0] || null;
			if (!node) break;
			if (node.paramName) params[node.paramName] = section;
			paramsFound = true;
		} else node = nextNode;
	}
	if ((node === null || node.data === null) && wildcardNode !== null) {
		node = wildcardNode;
		params[node.paramName || "_"] = wildCardParam;
		paramsFound = true;
	}
	if (!node) return null;
	if (paramsFound) return {
		...node.data,
		params: paramsFound ? params : void 0
	};
	return node.data;
}
function insert(ctx, path, data) {
	let isStaticRoute = true;
	const sections = path.split("/");
	let node = ctx.rootNode;
	let _unnamedPlaceholderCtr = 0;
	const matchedNodes = [node];
	for (const section of sections) {
		let childNode;
		if (childNode = node.children.get(section)) node = childNode;
		else {
			const type = getNodeType(section);
			childNode = createRadixNode({
				type,
				parent: node
			});
			node.children.set(section, childNode);
			if (type === NODE_TYPES.PLACEHOLDER) {
				childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
				node.placeholderChildren.push(childNode);
				isStaticRoute = false;
			} else if (type === NODE_TYPES.WILDCARD) {
				node.wildcardChildNode = childNode;
				childNode.paramName = section.slice(3) || "_";
				isStaticRoute = false;
			}
			matchedNodes.push(childNode);
			node = childNode;
		}
	}
	for (const [depth, node2] of matchedNodes.entries()) node2.maxDepth = Math.max(matchedNodes.length - depth, node2.maxDepth || 0);
	node.data = data;
	if (isStaticRoute === true) ctx.staticRoutesMap[path] = node;
	return node;
}
function remove(ctx, path) {
	let success = false;
	const sections = path.split("/");
	let node = ctx.rootNode;
	for (const section of sections) {
		node = node.children.get(section);
		if (!node) return success;
	}
	if (node.data) {
		const lastSection = sections.at(-1) || "";
		node.data = null;
		if (Object.keys(node.children).length === 0 && node.parent) {
			node.parent.children.delete(lastSection);
			node.parent.wildcardChildNode = null;
			node.parent.placeholderChildren = [];
		}
		success = true;
	}
	return success;
}
function createRadixNode(options = {}) {
	return {
		type: options.type || NODE_TYPES.NORMAL,
		maxDepth: 0,
		parent: options.parent || null,
		children: /* @__PURE__ */ new Map(),
		data: options.data || null,
		paramName: options.paramName || null,
		wildcardChildNode: null,
		placeholderChildren: []
	};
}
function getNodeType(str) {
	if (str.startsWith("**")) return NODE_TYPES.WILDCARD;
	if (str[0] === ":" || str === "*") return NODE_TYPES.PLACEHOLDER;
	return NODE_TYPES.NORMAL;
}
//#endregion
export { createRouter as t };

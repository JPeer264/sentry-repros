import { S as createContext } from "./solid-js.mjs";
createContext();
[
	"a[href]",
	"area[href]",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"button:not([disabled])",
	"summary",
	"iframe",
	"audio[controls]",
	"video[controls]",
	"[tabindex]:not([tabindex=\"-1\"])",
	"[contenteditable=\"\"]",
	"[contenteditable=\"true\"]"
].join(", ");
var Pe = "tc";
`${Pe}`;
`${Pe}`;
`${Pe}`;
`${Pe}`;
function m(e) {
	return { [`${Pe}-${e}`]: "" };
}
`${Pe}`;
createContext();
m("accordion");
m("accordion-button");
m("accordion-header");
m("accordion-item");
m("accordion-panel");
createContext();
m("button");
createContext();
m("alert");
createContext();
createContext();
m("alert-dialog");
m("alert-dialog-description");
m("alert-dialog-overlay");
m("alert-dialog-panel");
m("alert-dialog-title");
createContext();
createContext();
m("checkbox");
m("checkbox-description");
m("checkbox-indicator");
m("checkbox-label");
createContext();
createContext();
createContext();
m("combobox");
m("combobox-input");
m("combobox-options");
m("combobox-option");
m("combobox-label");
m("command");
m("command-input");
m("command-options");
m("command-option");
m("command-label");
createContext();
createContext();
createContext();
m("command-bar");
m("command-bar-description");
m("command-bar-overlay");
m("command-bar-panel");
m("command-bar-title");
createContext();
m("context-menu");
m("context-menu-boundary");
m("context-menu-overlay");
m("context-menu-panel");
createContext();
m("dialog");
m("dialog-description");
m("dialog-overlay");
m("dialog-panel");
m("dialog-title");
createContext();
m("disclosure");
m("disclosure-button");
m("disclosure-panel");
createContext();
m("feed");
m("feed-article");
m("feed-article-description");
m("feed-article-label");
m("feed-content");
m("feed-label");
createContext();
createContext();
createContext();
m("listbox");
m("listbox-button");
m("listbox-label");
m("listbox-options");
m("listbox-option");
createContext();
createContext();
m("menu");
m("menu-item");
createContext();
m("popover");
m("popover-button");
m("popover-overlay");
m("popover-panel");
createContext();
createContext();
m("radio-group");
m("radio-group-description");
m("radio-group-label");
m("radio-group-option");
createContext();
m("select");
m("select-option");
createContext();
createContext();
m("tab-group");
m("tab-list");
m("tab");
m("tab-panel");
m("toast");
m("toaster");
createContext();
var Fe = class Fe {
	constructor() {
		this.queue = [];
		this.listeners = /* @__PURE__ */ new Set();
		this.toastID = 0;
		this.id = Fe.toasterID, Fe.toasterID += 1;
	}
	subscribe(t) {
		return this.listeners.add(t), () => {
			this.listeners.delete(t);
		};
	}
	notify() {
		let t = [...this.queue];
		for (let o of this.listeners.keys()) o(t);
	}
	create(t) {
		let o = `toast-${this.id}-${this.toastID}`;
		return this.toastID += 1, this.queue.push({
			id: o,
			data: t
		}), this.notify(), o;
	}
	remove(t) {
		this.queue = this.queue.filter((o) => o.id !== t), this.notify();
	}
	clear() {
		this.queue = [], this.notify();
	}
	getQueue() {
		return this.queue;
	}
};
Fe.toasterID = 0;
createContext();
m("toggle");
m("toolbar");
createContext();
createContext({});
createContext();
//#endregion
export {};

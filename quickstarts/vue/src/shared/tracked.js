// Child components for the component-tracking runs: two names from the docs' list, one not.
export const RwvHeader = { name: "RwvHeader", template: `<header id="rwv-header">header</header>` };
export const Pagination = { name: "Pagination", props: ["page"], template: `<div id="pagination">page {{ page }}</div>` };
export const Untracked = { name: "Untracked", template: `<div id="untracked">untracked</div>` };

export const TrackedApp = {
  name: "App",
  components: { RwvHeader, Pagination, Untracked },
  data() {
    return { page: 1, showHeader: true };
  },
  mounted() {
    document.body.setAttribute("data-wired", "1");
  },
  template: `<div>
    <RwvHeader v-if="showHeader" />
    <Pagination :page="page" />
    <Untracked />
    <button id="btn-update" @click="page++">update</button>
    <button id="btn-unmount" @click="showHeader = false">unmount</button>
    <span id="page">{{ page }}</span>
  </div>`,
};

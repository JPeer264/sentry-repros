export default {
  async fetch() {
    const out = {};
    out.hasGlobalProcess = typeof globalThis.process;
    try { const m = await import('node:process'); out.nodeProcess = typeof m.default; } catch (e) { out.nodeProcess = 'ERR: ' + e.message; }
    try { const m = await import('node:net'); out.nodeNet = typeof m.Socket; } catch (e) { out.nodeNet = 'ERR: ' + e.message; }
    return new Response(JSON.stringify(out, null, 1));
  },
};

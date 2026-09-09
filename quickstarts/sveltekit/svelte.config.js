import adapter from "@sveltejs/adapter-node";

// getting-started-complete/javascript.sveltekit.mdx:201-218 (the "SvelteKit 2" tab) verbatim,
// plus the adapter every real project sets (the snippet has no `adapter` key).
const config = {
  kit: {
    adapter: adapter(),
    experimental: {
      instrumentation: {
        server: true,
      },
      tracing: {
        server: true,
      },
    },
  },
};

export default config;

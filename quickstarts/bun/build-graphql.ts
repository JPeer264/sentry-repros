import { sentryBunPlugin } from "@sentry/bun/plugin";

const entry = process.env.GRAPHQL_ENTRY ?? "./app-graphql.ts";
const outdir = process.env.GRAPHQL_OUTDIR ?? "./dist-graphql";

await Bun.build({
  entrypoints: [entry],
  outdir,
  target: "bun",
  external: ["@sentry/*"],
  sourcemap: "external",
  plugins: [sentryBunPlugin()],
});

// docs: platform-includes/getting-started-complete/javascript.remix.mdx:230-240, the "Are you using Express?"
// expandable: the instrumentation file is imported first, then a plain Express server from the Remix 2
// template serves the Vite build.
// import the Sentry instrumentation file before anything else.
import "./instrument.server.mjs";
// alternatively `require('./instrument.server.cjs')`

import { createRequestHandler } from "@remix-run/express";
import express from "express";

const build = await import("./build/server/index.js");

const app = express();

app.use("/assets", express.static("build/client/assets", { immutable: true, maxAge: "1y" }));
app.use(express.static("build/client", { maxAge: "1h" }));
app.all("*", createRequestHandler({ build }));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`[express] http://localhost:${port}`));

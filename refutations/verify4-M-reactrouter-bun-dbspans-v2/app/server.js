import "./instrument.server.mjs";
import * as Sentry from "@sentry/react-router";
import compression from "compression";
import express from "express";
import morgan from "morgan";

const BUILD_PATH = "./build/server/index.js";
const PORT = Number.parseInt(process.env.PORT || "3000");

const app = express();

app.use(compression());
app.disable("x-powered-by");

console.log("Starting production server");
app.use("/assets", express.static("build/client/assets", { immutable: true, maxAge: "1y" }));
app.use(morgan("tiny"));
app.get("/plain", (req, res) => {
  Sentry.captureException(new Error("plain express boom"));
  res.end("plain");
});
app.use(express.static("build/client", { maxAge: "1h" }));
app.use(await import(BUILD_PATH).then((mod) => mod.app));

Sentry.setupExpressErrorHandler(app);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

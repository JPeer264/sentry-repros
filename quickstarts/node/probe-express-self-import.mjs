import "./instrument.mjs";

import express from "express";
import * as Sentry from "@sentry/node";

const app = express();
app.get("/users/:id", (req, res) => res.end("user\n"));
app.get("/sentinel", (req, res) => {
  Sentry.captureMessage("sentinel");
  res.end("sentinel\n");
});
app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));

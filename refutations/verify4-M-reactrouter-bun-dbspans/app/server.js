import "./instrument.server.mjs";
import * as Sentry from "@sentry/react-router";
import compression from "compression";
import express from "express";
import morgan from "morgan";

const BUILD_PATH = "./build/server/index.js";
const PORT = Number.parseInt(process.env.PORT || "3000");
const ROOT_SPAN = process.env.ROOT_SPAN_MIDDLEWARE === "1";

const app = express();

app.use(compression());
app.disable("x-powered-by");

console.log("Starting production server");
app.use("/assets", express.static("build/client/assets", { immutable: true, maxAge: "1y" }));
app.use(morgan("tiny"));
app.use(express.static("build/client", { maxAge: "1h" }));

if (ROOT_SPAN) {
  app.use((req, res, next) => {
    Sentry.withIsolationScope(() => {
      Sentry.continueTrace(
        { sentryTrace: req.headers["sentry-trace"], baggage: req.headers.baggage },
        () => {
          const span = Sentry.startInactiveSpan({
            name: `${req.method} ${req.path}`,
            op: "http.server",
            forceTransaction: true,
            attributes: { "sentry.source": "url" },
          });
          res.on("finish", () => {
            span.setAttribute("http.response.status_code", res.statusCode);
            span.end();
          });
          Sentry.withActiveSpan(span, () => next());
        },
      );
    });
  });
}

app.use(await import(BUILD_PATH).then(mod => mod.app));

Sentry.setupExpressErrorHandler(app);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

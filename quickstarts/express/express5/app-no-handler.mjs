// Same as ../app-no-handler.mjs on express 5.
import express from "express";
import { registerRoutes } from "../routes.mjs";

const app = express();
registerRoutes(app);
app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));

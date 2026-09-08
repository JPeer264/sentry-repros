import "@sentry/deno/import";
import { createRequire } from "node:module";
import { initSentry, openaiOptions, serve } from "./app.ts";

initSentry();

const require = createRequire(import.meta.url);
const openaiMod = require("openai");
const OpenAI = openaiMod.OpenAI ?? openaiMod.default ?? openaiMod;
const client = new OpenAI(openaiOptions());

serve(client as never);

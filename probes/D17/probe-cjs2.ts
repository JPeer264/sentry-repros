import "@sentry/deno/import";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mod = require("openai");
const OpenAI = mod.OpenAI ?? mod.default ?? mod;
const create = OpenAI.Chat.Completions.prototype.create;
console.log("CJS create source:", create.toString().slice(0, 160).replace(/\n/g, " "));

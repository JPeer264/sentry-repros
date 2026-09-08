import "@sentry/deno/import";
import OpenAI from "openai";

const create = (OpenAI as never as { Chat: { Completions: { prototype: { create: () => unknown } } } }).Chat
  .Completions.prototype.create;
console.log("ESM create source:", create.toString().slice(0, 160).replace(/\n/g, " "));

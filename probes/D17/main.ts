import "@sentry/deno/import";
import OpenAI from "openai";
import { initSentry, openaiOptions, serve } from "./app.ts";

initSentry();

const client = new OpenAI(openaiOptions());

serve(client as never);

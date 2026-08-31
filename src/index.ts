import * as Sentry from "@sentry/cloudflare/nodejs_compat";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const streaming = url.pathname === "/stream";
    const openai = createOpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });

    try {
      const text = await Sentry.startSpan(
        { name: streaming ? "ai-sdk-v7.stream" : "ai-sdk-v7.generate", op: "repro" },
        async () => {
          const options = {
            model: openai("openai/gpt-4o-mini"),
            prompt: "Reply with exactly: Cloudflare Worker",
            telemetry: {
              isEnabled: true,
              functionId: streaming ? "repro.stream" : "repro.generate",
              recordInputs: true,
              recordOutputs: true,
            },
          };

          if (!streaming) {
            const result = await generateText(options);
            return result.text;
          }

          const result = streamText(options);
          let output = "";
          for await (const chunk of result.textStream) output += chunk;
          return output;
        },
      );

      await Sentry.flush(10_000);
      return Response.json({ streaming, text });
    } catch (error) {
      Sentry.captureException(error);
      await Sentry.flush(10_000);
      return Response.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      );
    }
  },
};

export default Sentry.withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
    streamGenAiSpans: true,
    integrations: [Sentry.vercelAIIntegration()],
  }),
  worker,
);
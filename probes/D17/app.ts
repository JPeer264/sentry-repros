import * as Sentry from "@sentry/deno";

export function initSentry() {
  Sentry.init({
    dsn: "https://public@example.invalid/1",
    tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT") ?? "9999"}/`,
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
    debug: Deno.env.get("SENTRY_DEBUG") === "1",
  });
}

type ChatClient = { chat: { completions: { create: (body: unknown) => Promise<unknown> } } };

export function serve(client: ChatClient) {
  const port = Number(Deno.env.get("APP_PORT") ?? "52850");
  Deno.serve({ port, onListen: () => console.log(`app listening ${port}`) }, async (req) => {
    const path = new URL(req.url).pathname;
    if (path === "/ai") {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Say hi" }],
      });
      return Response.json(completion);
    }
    if (path === "/sentinel") {
      Sentry.captureException(new Error("sentinel"));
      await Sentry.flush(2000);
      return new Response("sentinel\n");
    }
    return new Response("ok\n");
  });
}

export function openaiOptions() {
  return {
    apiKey: "test-key",
    baseURL: `http://127.0.0.1:${Deno.env.get("MOCK_PORT") ?? "9998"}/v1`,
  };
}

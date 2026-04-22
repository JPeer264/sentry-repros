interface Env {}

function createLongRunningStream(durationMs: number, intervalMs: number = 35000): ReadableStream {
  let elapsed = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      controller.enqueue(encoder.encode(`data: [upstream] Stream started, will run for ${durationMs / 1000}s\n\n`));

      intervalId = setInterval(() => {
        elapsed += intervalMs;

        if (elapsed >= durationMs) {
          controller.enqueue(encoder.encode(`data: [upstream] Stream complete after ${elapsed / 1000}s\n\n`));
          controller.close();
          if (intervalId) clearInterval(intervalId);
        } else {
          controller.enqueue(encoder.encode(`data: [upstream] Heartbeat at ${elapsed / 1000}s\n\n`));
        }
      }, intervalMs);
    },
    cancel() {
      console.log('[slow-upstream] stream cancelled by consumer');
      if (intervalId) clearInterval(intervalId);
    },
  });
}

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const durationSec = parseInt(url.searchParams.get('duration') || '45', 10);
    const durationMs = durationSec * 1000;

    console.log(`[slow-upstream] starting SSE stream for ${durationSec}s`);

    return new Response(createLongRunningStream(durationMs), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  },
};

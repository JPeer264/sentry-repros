import './instrument';
import * as Sentry from '@sentry/bun';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

Bun.serve({
  port: Number(process.env.PORT),
  routes: {
    '/stream': () => {
      const body = new ReadableStream({
        async start(controller) {
          for (let i = 1; i <= 3; i++) {
            await sleep(300);
            controller.enqueue(new TextEncoder().encode(`stream chunk ${i}\n`));
            console.log(`stream: enqueued chunk ${i} at ${Date.now()}`);
          }
          controller.close();
          console.log(`stream: closed at ${Date.now()}`);
        },
      });
      console.log(`stream: handler returned Response at ${Date.now()}`);
      return new Response(body, { headers: { 'content-type': 'text/plain' } });
    },

    '/stream-cancel': () => {
      const body = new ReadableStream({
        async start(controller) {
          for (let i = 1; i <= 3; i++) {
            await sleep(300);
            try {
              controller.enqueue(new TextEncoder().encode(`stream-cancel chunk ${i}\n`));
              console.log(`stream-cancel: enqueued chunk ${i} at ${Date.now()}`);
            } catch (e) {
              console.log(`stream-cancel: enqueue failed at chunk ${i}: ${e}`);
              return;
            }
          }
          controller.close();
          console.log(`stream-cancel: closed at ${Date.now()}`);
        },
        cancel(reason) {
          console.log(`stream-cancel: stream cancelled: ${reason}`);
        },
      });
      console.log(`stream-cancel: handler returned Response at ${Date.now()}`);
      return new Response(body, { headers: { 'content-type': 'text/plain' } });
    },

    '/sentinel': async () => {
      Sentry.captureMessage('sentinel');
      await Sentry.flush(2000);
      return new Response('ok');
    },
  },
  fetch() {
    return new Response('not found', { status: 404 });
  },
});

console.log(`app listening on ${process.env.PORT}`);

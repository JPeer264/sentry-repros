import * as Sentry from '@sentry/node';
import express from 'express';

const app = express();

Sentry.setupExpressErrorHandler(app);

const withServerTrace = async ({ name, op = 'service', attributes }, fn) => {
  return Sentry.startSpan({ name, op, attributes }, async (span) => {
    try {
      return await fn(span);
    } catch (err) {
      span.setStatus({ code: 2, message: 'internal_error' });
      Sentry.captureException(err);
      throw err;
    }
  });
};

// Simulate the production pattern:
// Long-running parent span (like 15s webhook handler) with many quick child spans
// Child spans complete BEFORE parent, causing buffering
app.get('/', async (req, res) => {
  await withServerTrace({ name: 'long-running-handler', op: 'http.handler' }, async () => {
    // Create many child spans that complete quickly
    for (let i = 0; i < 20; i++) {
      await withServerTrace({ name: `quick-child-${i}`, op: 'task' }, async () => {
        // Child completes fast
        await new Promise((resolve) => setTimeout(resolve, 1));

        // Even more nested spans
        for (let j = 0; j < 3; j++) {
          await withServerTrace({ name: `nested-${i}-${j}`, op: 'db.query' }, async () => {
            await new Promise((resolve) => setTimeout(resolve, 1));
          });
        }
      });
    }

    // Parent span stays open longer (simulating long-running work)
    // During this time, all child spans are buffered waiting for parent
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  res.json({ ok: true });
});

// Simulate fire-and-forget pattern: start spans but don't await completion
app.get('/fire-forget', async (req, res) => {
  await withServerTrace({ name: 'fire-forget-handler', op: 'http.handler' }, async () => {
    // Start work but respond immediately
    for (let i = 0; i < 10; i++) {
      // Don't await - these spans may be orphaned
      withServerTrace({ name: `background-task-${i}`, op: 'task' }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));
      });
    }
  });

  // Respond before background tasks complete
  res.json({ ok: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`);
});

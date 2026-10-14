import * as Sentry from '@sentry/node';

const { app } = await import('./build/app.js');

const server = app.listen(3000, async () => {
  console.log('Server listening on http://localhost:3000');
  const res = await fetch('http://localhost:3000/');
  console.log('GET / ->', res.status);
  await Sentry.flush(2000);
  server.close();
});

// @refresh reload
import * as Sentry from '@sentry/solidstart';
import { StartServer, createHandler } from '@solidjs/start/server';

const handler = createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));

if (process.env.PROBE_ONERROR) {
  // eslint-disable-next-line
  (handler as any).config.onError = (error: Error) => {
    console.log('[probe] h3 onError fired', error?.message);
    Sentry.captureException(error, { mechanism: { handled: false, type: 'solidstart.h3.onError' } });
  };
}

export default handler;

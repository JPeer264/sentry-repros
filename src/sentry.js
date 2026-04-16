import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
  integrations: [
    Sentry.feedbackIntegration({
      autoInject: true,
      showBranding: false,
      enableScreenshot: true,
    }),
  ],
});

console.log('Sentry initialized in iframe');

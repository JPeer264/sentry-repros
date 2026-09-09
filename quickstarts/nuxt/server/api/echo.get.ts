export default defineEventHandler((event) => ({
  "sentry-trace": getHeader(event, "sentry-trace") ?? null,
  baggage: getHeader(event, "baggage") ?? null,
}));

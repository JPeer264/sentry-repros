import * as otel from "@sentry/opentelemetry";

console.log("@sentry/opentelemetry exports:", Object.keys(otel).sort().join(", "));
console.log("SentrySampler:", (otel as Record<string, unknown>).SentrySampler);
console.log("SentrySpanProcessor:", (otel as Record<string, unknown>).SentrySpanProcessor);
console.log("wrapSamplingDecision:", (otel as Record<string, unknown>).wrapSamplingDecision);

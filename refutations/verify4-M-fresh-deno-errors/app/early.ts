import { trace } from "npm:@opentelemetry/api@^1.9.0";

export const earlyTracer = trace.getTracer("early", "1.0.0");

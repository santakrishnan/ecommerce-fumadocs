import { registerOTel } from "@vercel/otel";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Auto-instruments the Next.js request lifecycle and outbound fetch calls via
// the standard OTEL_EXPORTER_OTLP_* env vars — no custom spans.
export function register() {
  if (IS_PRODUCTION) {
    registerOTel({ serviceName: process.env.OTEL_SERVICE_NAME ?? "ecommerce-web" });
  }
}

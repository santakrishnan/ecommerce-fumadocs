import "server-only";
import { serverEnvSchema } from "./env-schema";

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`);
  throw new Error(
    `Invalid server environment variables:\n${lines.join("\n")}\n\nFix the above in .env.local (local) or the Vercel dashboard (production).`
  );
}

const { shape } = serverEnvSchema;

/**
 * Typed, validated server-only environment variables.
 *
 * Import this instead of reading `process.env` directly in server code
 * (Server Components, Server Actions, Route Handlers, BFF services).
 * `import "server-only"` at the top of this module guarantees a build error
 * if it is ever imported from a Client Component.
 *
 * The Proxy reads from live `process.env` on each access and re-applies the
 * per-field Zod schema (including any coercion, e.g. `z.coerce.number()`),
 * so `vi.stubEnv()` in tests is reflected without needing `vi.resetModules()`,
 * while the runtime type contract (`number` stays `number`) is preserved.
 * If a stubbed value fails the field schema the initial validated value is
 * returned as a safe fallback.
 *
 * @example
 * import { env } from "@config/env";
 * const url = env.API_UPSTREAM_URL;   // string | undefined
 * const ms  = env.UPSTREAM_TIMEOUT_MS; // number
 */
export const env = new Proxy(parsed.data, {
  get(target, prop: string) {
    if (!(prop in shape)) {
      return (target as Record<string, unknown>)[prop];
    }
    const raw = (process.env as Record<string, unknown>)[prop];
    const result = shape[prop as keyof typeof shape].safeParse(raw);
    return result.success ? result.data : (target as Record<string, unknown>)[prop];
  },
}) as typeof parsed.data;

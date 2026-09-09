// Client-safe channel contract (no `server-only`), importable from client
// components. Server code uses the top-level `bff` barrel.
export type { EdiPasswordlessChannel, OtpChannel } from "./channels";

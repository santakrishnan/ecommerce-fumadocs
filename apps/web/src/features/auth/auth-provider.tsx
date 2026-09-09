"use client";

import { createContext, use, useState } from "react";
import { AuthOverlay } from "./components/auth-overlay";

export interface AuthGateRequest {
  description: string;
  /** Runs after successful verification, to resume the action the user intended. */
  onVerified?: () => void;
  title: string;
}

interface AuthContextValue {
  requestAuth: (request: AuthGateRequest) => void;
}

const AuthContext = createContext<AuthContextValue>({
  requestAuth: () => {
    // replaced once a provider mounts
  },
});

/**
 * Holds the pending OTP request and exposes `requestAuth` (via `useAuth`)
 * for flows to open the overlay. The overlay is always mounted and driven by
 * `open`, so it fades in and out; it resets its flow once it finishes closing.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<AuthGateRequest | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <AuthContext
      value={{
        requestAuth: (next) => {
          setRequest(next);
          setOpen(true);
        },
      }}
    >
      {children}
      <AuthOverlay
        onClose={() => setRequest(null)}
        open={open}
        request={request}
        setOpen={setOpen}
      />
    </AuthContext>
  );
}

export function useAuthContext() {
  return use(AuthContext);
}

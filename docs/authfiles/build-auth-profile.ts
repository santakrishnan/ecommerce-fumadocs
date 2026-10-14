import "server-only";

import { AuthTier } from "@features/auth/constants";
import type { AuthPasskey, Tier } from "@features/profile/bff";
import type { AuthProfile } from "../contracts/auth-profile";

/** Build the auth profile at a given tier from the supplied passkeys. */
export function buildAuthProfile(
  passkeys: AuthPasskey[],
  deviceSessionTier: Tier = AuthTier.T1
): AuthProfile {
  return {
    deviceSessionTier,
    customerTier: deviceSessionTier,
    metadata: {
      auth: {
        hasPasskey: passkeys.length > 0,
        passkeys,
      },
    },
  };
}

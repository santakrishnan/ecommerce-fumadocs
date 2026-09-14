export { AuthProvider } from "./auth-provider";
export { GuardedLink } from "./components/guarded-link";
export type { PasskeyPanelProps } from "./components/passkey-panel";
export { PasskeyPanel } from "./components/passkey-panel";
export { StoredPasskeyCard } from "./components/stored-passkey-card";
export type {
  AcrLevel,
  AuthEvidence,
  AuthRequirement,
  OtpFlow,
  OtpFlowStep,
} from "./hooks/use-auth";
export { useAuth, useOtpFlow } from "./hooks/use-auth";
export type {
  PasskeyCredentialSummary,
  PasskeyLoginResult,
  PasskeyRegisterInput,
  PasskeyRegisterResult,
  PasskeyType,
  PasskeyUser,
} from "./passkey";
export {
  describePasskeyError,
  getPasskeyApiBase,
  PASSKEY_ENDPOINTS,
  PasskeyApiError,
  passkeysSupported,
  registerPasskey,
  signInWithPasskey,
} from "./passkey";

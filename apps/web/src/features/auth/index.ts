export { AuthProvider } from "./auth-provider";
export { GuardedLink } from "./components/guarded-link";
export type { PasskeyPanelProps } from "./components/passkey-panel";
export { PasskeyPanel } from "./components/passkey-panel";
export { PasskeyPolicyControls } from "./components/passkey-policy-controls";
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
  PasskeyAttachment,
  PasskeyCredentialSummary,
  PasskeyHint,
  PasskeyLoginResult,
  PasskeyRegisterInput,
  PasskeyRegisterResult,
  PasskeyRegistrationPolicy,
  PasskeyRequirement,
  PasskeyType,
  PasskeyUser,
} from "./passkey";
export {
  DEFAULT_REGISTRATION_POLICY,
  describePasskeyError,
  getPasskeyApiBase,
  PASSKEY_ENDPOINTS,
  PasskeyApiError,
  passkeysSupported,
  registerPasskey,
  signInWithPasskey,
} from "./passkey";

export type { RegisterPasskeyHooks } from "./client";
export {
  describePasskeyError,
  getPasskeyApiBase,
  getPasskeySession,
  PasskeyApiError,
  passkeysSupported,
  registerPasskey,
  resetPasskeyDemo,
  signInWithPasskey,
} from "./client";
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
  PublicKeyCredentialCreationOptionsJSON,
} from "./contract";
export { DEFAULT_REGISTRATION_POLICY, PASSKEY_ENDPOINTS } from "./contract";

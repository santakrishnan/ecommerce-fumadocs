export type { RegisterPasskeyHooks } from "./client";
export {
  describePasskeyError,
  getPasskeyApiBase,
  getPasskeySession,
  listPasskeys,
  PasskeyApiError,
  passkeysSupported,
  registerPasskey,
  renamePasskey,
  resetPasskeyDemo,
  revokePasskey,
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
  PasskeyRevokeResult,
  PasskeySession,
  PasskeyType,
  PasskeyUser,
  PublicKeyCredentialCreationOptionsJSON,
} from "./contract";
export { DEFAULT_REGISTRATION_POLICY, PASSKEY_ENDPOINTS } from "./contract";
export type { ImmediateOutcome, PasskeyCapabilities } from "./nudge";
export {
  armPasskeyAutofill,
  cancelPasskeyAutofill,
  getPasskeyCapabilities,
  readPasskeyHint,
  signInWithPasskeyImmediate,
} from "./nudge";

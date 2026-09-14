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
  PasskeyCredentialSummary,
  PasskeyLoginResult,
  PasskeyRegisterInput,
  PasskeyRegisterResult,
  PasskeyType,
  PasskeyUser,
} from "./contract";
export { PASSKEY_ENDPOINTS } from "./contract";

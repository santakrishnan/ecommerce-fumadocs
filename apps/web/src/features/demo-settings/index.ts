/**
 * Public surface of the demo-settings feature module.
 *
 * Demo-only configuration UI (the `/demo-settings` route). Exposes the search
 * agent backend picker, the profile tier picker, and the visitor identity reset card.
 */

export { generateVisitorIdentity } from "./actions/reset-visitor-identity";
export { resetAgentBackend, setAgentBackend } from "./actions/set-agent-backend";
export {
  resetAppointmentVariant,
  setAppointmentVariant,
} from "./actions/set-appointment-variant";
export { resetProfileTier, setProfileTier } from "./actions/set-profile-tier";
export { resetVercelToolbar, setVercelToolbar } from "./actions/set-vercel-toolbar";
export type { SetVisitorIdentityResult } from "./actions/set-visitor-identity";
export { setVisitorIdentity } from "./actions/set-visitor-identity";
export { DemoSettingsForm } from "./components/demo-settings-form";
export { DemoSettingsLoader } from "./components/demo-settings-loader";
export { DemoSettingsNav } from "./components/demo-settings-nav";
export { VisitorIdentityCard } from "./components/visitor-identity-card";
export { VisitorIdentityCardLoader } from "./components/visitor-identity-card-loader";
export type { VisitorIdentityInput } from "./lib/visitor-identity-schema";
export { visitorIdentitySchema } from "./lib/visitor-identity-schema";

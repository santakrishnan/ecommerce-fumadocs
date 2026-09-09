/**
 * Public surface of the legal feature module.
 *
 * Only re-export what other features and the route layer should consume.
 */

export type { LegalPageProps } from "./components/legal-page";
export { LegalPage } from "./components/legal-page";
export type { LegalSection, PrivacyNoticeData } from "./data/privacy-notice";
export { PRIVACY_NOTICE } from "./data/privacy-notice";

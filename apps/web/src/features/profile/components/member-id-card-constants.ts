/**
 * Constants for the Member ID Card component.
 *
 * All display strings and asset paths are centralised here so the
 * component stays data-driven and easy to update.
 */
import cardBgImage from "@public/member-id-card/member-id-card-background.png";

/**
 * Background image for the Member ID card.
 * Static import gives compile-time path validation.
 * `.src` satisfies the `CardBackgroundImage` component's `src: string` prop.
 */
export const CARD_BG_IMAGE = cardBgImage.src;

/** Alt text for the card background image. */
export const CARD_BG_ALT = "Toyota vehicle fleet";

/** Label shown for linked members (T2/T3 visual state). */
export const MEMBER_NAME_LABEL = "Jason K.";

/** Year the member joined. */
export const MEMBER_YEAR = "2025";

/** Text prefix before the member-since year. */
export const MEMBER_SINCE_TEXT = "Member since";

/** CTA button label for the mobile wallet action. */
export const WALLET_CTA_LABEL = "Add to your Apple Wallet";

/** Fallback member ID used in dev/demo when no real identity is available. */
export const MOCK_MEMBER_ID = "mock-member-id";

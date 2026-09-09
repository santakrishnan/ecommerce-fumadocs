import type { ProfileTier } from "@config/profile-tier";
import { CardBackgroundImage } from "@shared/components/card";
import { Button, Card } from "@ucmp/ui";
import { IconArrowRight, IconToyotaIdWordmark, IconToyotaLogo } from "@ucmp/ui/icons";
import {
  CARD_BG_ALT,
  CARD_BG_IMAGE,
  MEMBER_NAME_LABEL,
  MEMBER_SINCE_TEXT,
  MEMBER_YEAR,
  WALLET_CTA_LABEL,
} from "./member-id-card-constants";
import { MemberQRCode } from "./member-qr-code";

export interface MemberIdCardContentProps {
  /** Alt text for the background image. */
  backgroundAlt?: string;
  /** Background image source URL. */
  backgroundImage?: string;
  /** Whether the visitor is linked (has customerId). Drives T2/T3 visual state. */
  isLinked: boolean;
  /** Member ID used for QR code generation (customerId or visitorId). */
  memberId?: string;
  /** Label shown for linked members (T2/T3). */
  memberLabel?: string;
  /** Whether to show the mobile wallet CTA. */
  showWalletCta?: boolean;
  /** Profile tier variant: T0/T1 (anonymous), T2/T3 (linked). */
  tier: ProfileTier;
  /** CTA button label for mobile wallet action. */
  walletCtaLabel?: string;
  /** Year the member first visited, derived from firstSeenAt. */
  year: string;
}

/**
 * Member ID Card content — full-bleed background image with Toyota iD
 * wordmark top-left, "Member since [year]" bottom-left, and QR code
 * bottom-right (when a memberId is available).
 *
 * Visual states:
 * - T1 (anonymous, no customerId): wordmark + member since only
 * - T2/T3 (linked, customerId present): wordmark + member label + member since + QR code
 *   T3 is visually identical to T2 (isLinked = true for both).
 *
 * Layout:
 * - Desktop, Tablet & Mobile: card with QR code (when linked)
 * - Mobile: card + wallet CTA below
 */
export function MemberIdCardContent({
  tier: _tier,
  year = MEMBER_YEAR,
  isLinked,
  memberId,
  backgroundImage = CARD_BG_IMAGE,
  backgroundAlt = CARD_BG_ALT,
  memberLabel = MEMBER_NAME_LABEL,
  walletCtaLabel = WALLET_CTA_LABEL,
  showWalletCta = true,
}: MemberIdCardContentProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Card with full-bleed background image */}
      <Card className="relative aspect-[3/2] shadow-none ring-0" data-surface="dark">
        <CardBackgroundImage alt={backgroundAlt} priority src={backgroundImage} />

        {/* Top-left: Toyota iD wordmark */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <IconToyotaLogo className="size-5 text-text-primary" />
          <IconToyotaIdWordmark className="size-5 text-text-primary" />
        </div>

        {/* Bottom-left: Member name + Member since year */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col">
          {isLinked && <span className="h3 text-text-primary">{memberLabel}</span>}
          <p className="body-sm text-text-secondary">
            {MEMBER_SINCE_TEXT} {year}
          </p>
        </div>

        {/* Bottom-right: QR code (members T1+ with an ID) */}
        {memberId && (
          <MemberQRCode
            className="absolute right-4 bottom-4 z-10 text-text-primary"
            memberId={memberId}
          />
        )}
      </Card>

      {/* Mobile only (lg:hidden) — wallet CTA */}
      {showWalletCta && (
        <Button
          aria-label={walletCtaLabel}
          className="lg:hidden"
          trailingIcon={IconArrowRight}
          variant="text"
        >
          {walletCtaLabel}
        </Button>
      )}
    </div>
  );
}

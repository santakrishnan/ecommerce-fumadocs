"use client";

import { clientEnv } from "@config/client-env";
import { QRCodeSVG } from "qrcode.react";

const SITE_URL = clientEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export interface MemberQRCodeProps {
  /** Additional class names applied to the root SVG element. */
  className?: string;
  /** The member ID used to encode the profile URL in the QR code. */
  memberId: string;
  /** QR code size in pixels. Defaults to 60. */
  size?: number;
}

/**
 * QR code linking to the member's profile card.
 *
 * Encodes `${NEXT_PUBLIC_SITE_URL}/profile/${memberId}` as a scannable QR code.
 * Rendered with a transparent background and white foreground to sit on the
 * dark member ID card surface.
 *
 * TODO: The dynamic route `/profile/{memberId}` does not exist yet. Currently
 * we encode `/profile` (without the ID) so scanners land on the existing
 * profile page. Update to `/profile/${memberId}` once the public member card
 * route is implemented.
 *
 * @example
 * ```tsx
 * <MemberQRCode memberId="customer-321" size={96} />
 * ```
 */
export function MemberQRCode({ memberId: _memberId, className, size = 60 }: MemberQRCodeProps) {
  // TODO: Switch to `${SITE_URL}/profile/${_memberId}` once the dynamic route exists.
  const profileUrl = `${SITE_URL}/profile`;

  return (
    <QRCodeSVG
      aria-label="QR code linking to member profile"
      bgColor="transparent"
      className={className}
      fgColor="currentColor"
      level="M"
      role="img"
      size={size}
      value={profileUrl}
    />
  );
}

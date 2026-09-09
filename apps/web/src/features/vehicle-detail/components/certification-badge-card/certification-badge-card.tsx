import { WarrantyInfoModal } from "@features/vehicle-detail";
import { buildVdpCertification } from "@features/vehicle-detail/bff";
import certificationGold from "@public/images/certification/certification-gold.svg";
import certificationSilver from "@public/images/certification/certification-silver.svg";
import toyotaSymbolGold from "@public/images/certification/toyotasymbolgold.svg";
import toyotaSymbolSilver from "@public/images/certification/toyotasymbolsilver.svg";
import { Card, CardContent, CardFooter } from "@ucmp/ui";
import Image from "next/image";
import { cn } from "utils";

export interface CertificationBadgeCardProps {
  /** Vehicle model name to display in the headline */
  model: string;
  /** Certification tier: "gold", "silver", or false (card is omitted) */
  tier: "gold" | "silver" | false;
}

const TIER_CONFIG = {
  gold: {
    ring: certificationGold,
    symbol: toyotaSymbolGold,
    ringAlt: "Gold certification ring",
    symbolAlt: "Toyota emblem",
    titleColor: "text-gold",
  },
  silver: {
    ring: certificationSilver,
    symbol: toyotaSymbolSilver,
    ringAlt: "Silver certification ring",
    symbolAlt: "Toyota emblem",
    titleColor: "text-silver",
  },
} as const;

/**
 * Certification Badge Card — displays Gold or Silver Toyota certification status.
 *
 * A Server Component rendered in the VDP detail cards grid as a half-width card.
 * When `tier` is `false`, returns `null` so the grid row collapses cleanly.
 *
 * Uses `data-surface="dark"` so semantic text tokens resolve to their
 * dark-surface values (white text on black background).
 *
 * @see Figma — Gold Certified (node 4331-115308)
 * @see Figma — Silver Certified (node 4331-115320)
 */
export function CertificationBadgeCard({ tier, model }: CertificationBadgeCardProps) {
  if (!tier) {
    return null;
  }

  const certification = buildVdpCertification({
    make: "Toyota",
    model,
    tier,
  });
  const config = TIER_CONFIG[tier];

  return (
    <Card
      aria-label={`Toyota ${tier.charAt(0).toUpperCase()}${tier.slice(1)} Certified badge`}
      className="bg-surface-dark shadow-none ring-0"
      data-surface="dark"
    >
      {/* Emblem — certification ring with Toyota symbol centered */}
      <CardContent className="flex flex-1 items-center justify-center px-6 pt-8 pb-6 lg:px-8 lg:pt-8 lg:pb-0">
        <div className="relative size-35 lg:size-45">
          <Image
            alt={config.ringAlt}
            className="object-contain"
            fill
            sizes="(min-width: 1024px) 11.25rem, 8.75rem"
            src={config.ring}
          />
          <Image
            alt={config.symbolAlt}
            className="absolute inset-0 m-auto size-17 lg:size-21"
            src={config.symbol}
          />
        </div>
      </CardContent>

      {/* Bottom content row — text + expand button */}
      <CardFooter className="flex flex-col items-start gap-4 px-6 pb-8 lg:items-end lg:px-8 lg:pb-8">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <h2 className={cn("h2", config.titleColor)}>{certification.headline}</h2>
          <div className="flex items-end justify-between gap-4">
            <p className="body-sm max-w-58 text-text-secondary lg:max-w-75">
              {certification.description}
            </p>
            <div className="shrink-0">
              <WarrantyInfoModal warranty={certification.modal} />
            </div>
          </div>
        </div>

        {/* Expand button (interaction is out of scope) */}
      </CardFooter>
    </Card>
  );
}

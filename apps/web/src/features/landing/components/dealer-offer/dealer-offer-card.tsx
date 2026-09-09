import { ROUTES } from "@config/routes";
import { CardBadge } from "@shared/components/card";
import { Card, CardContent, CardFooter } from "@ucmp/ui";
import { IconBolt, IconLocation } from "@ucmp/ui/icons";
import Image from "next/image";
import Link from "next/link";
import { cn } from "utils";
import type { DealerOfferData } from "../../types";

interface DealerOfferCardProps {
  className?: string;
  data: DealerOfferData;
  /** Show the card badge (top-left pill). Default: true. */
  showBadge?: boolean;
  /** When true, renders without the Link overlay — for read-only/display contexts. */
  static?: boolean;
}

/**
 * Dealer Offer Card
 */
export function DealerOfferCard({
  data,
  className,
  showBadge = true,
  static: isStatic,
}: DealerOfferCardProps) {
  // textTheme "light" means light text on dark background → surface is "dark"
  // textTheme "dark" means dark text on light background → surface is "light"
  const surface = (data.textTheme ?? "light") === "dark" ? "light" : "dark";

  return (
    <Card
      className={cn(
        "relative h-90 w-67.5 shrink-0 bg-transparent shadow-none ring-0",
        "md:h-89.25 md:w-67",
        "lg:h-111.25 lg:w-83.5",
        className
      )}
      data-slot="dealer-offer-card"
      data-surface={surface}
    >
      {isStatic ? (
        <div aria-hidden="true" className="absolute inset-0 z-20" />
      ) : (
        <Link
          aria-label={`${data.name}: ${data.offerHeadline}`}
          className="absolute inset-0 z-20"
          href={`${ROUTES.DEALERS}/${data.id}`}
        >
          <span className="sr-only">{`${data.name}: ${data.offerHeadline}`}</span>
        </Link>
      )}

      {/* Background image */}
      <CardContent className="absolute inset-0 p-0">
        <Image
          alt={data.imageAlt}
          className="object-cover"
          fill
          sizes="(max-width: 640px) 270px, (max-width: 1024px) 268px, 334px"
          src={data.imageSrc}
        />
      </CardContent>

      {/* Badge — shown when showBadge is true and data is present */}
      {showBadge && data.badge && (
        <CardBadge
          className={cn(
            "absolute top-4 left-4 z-10",
            data.badge.variant === "red" && "bg-brand text-text-inverse"
          )}
          startIconName={data.badge.iconName}
          variant="default"
        >
          {data.badge.label}
        </CardBadge>
      )}

      {/* Content overlay */}
      <CardFooter className="absolute right-0 bottom-0 left-0 z-10 flex-col items-start gap-4 px-6 py-8 text-left lg:px-8 lg:py-10">
        <div className="flex flex-col gap-2">
          <p className="body-lg text-text-primary">{data.name}</p>
          <h3 className="h3 text-text-primary">{data.offerHeadline}</h3>
        </div>

        {data.personalization && data.icon ? (
          <div className="body-sm flex items-center gap-1 text-text-primary">
            {data.icon.type === "ai" ? (
              <IconBolt aria-hidden="true" className="size-3.5 shrink-0" />
            ) : (
              <IconLocation aria-hidden="true" className="size-3.5 shrink-0" />
            )}
            <span>{data.personalization}</span>
          </div>
        ) : null}
      </CardFooter>
    </Card>
  );
}

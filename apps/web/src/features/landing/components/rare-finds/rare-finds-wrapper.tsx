import { locationCookieNames } from "@config/cookies";
import { APP_LOCATION_DEFAULTS } from "@config/location-defaults";
import { RARE_FINDS_COPY } from "@features/landing/data/rare-finds-copy";
import { parseGeoCookie } from "@features/location/lib/location-cookies";
import type { Surface } from "@shared/components/card";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { IconBinocular } from "@ucmp/ui/icons";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { getRareFinds } from "~/features/landing/services/get-rare-finds";
import { RareFindsSection } from "./rare-finds-section";
import { RareFindsSkeleton } from "./rare-finds-skeleton";

interface RareFindsProps {
  className?: string;
  showSaveIcon?: boolean;
  /** Surface context for card text color. @default "light" */
  surface?: Surface;
}

/**
 * Rare Finds wrapper — async Server Component.
 *
 * Reads location cookies (ZIP + geo) and visitor identity OUTSIDE any
 * `"use cache"` scope, then passes them to the cached service.
 */
export async function RareFindsWrapper({
  className,
  showSaveIcon = false,
  surface,
}: RareFindsProps) {
  const cookieStore = await cookies();
  const cookieZip = cookieStore.get(locationCookieNames.ZIP)?.value;
  const zipCode = cookieZip ?? APP_LOCATION_DEFAULTS.zip;

  const geo = parseGeoCookie(cookieStore.get(locationCookieNames.GEO)?.value);
  const identity = await readVisitorIdentity();

  const rareFindsPromise = getRareFinds({
    zipCode,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
    visitorId: identity.visitorId ?? null,
    sessionId: identity.sessionId ?? null,
  });

  return (
    <Suspense
      fallback={
        <RareFindsSkeleton
          className={className}
          icon={<IconBinocular className="size-4" />}
          sectionLabel="Rare finds loading"
          subtitle={RARE_FINDS_COPY.subtitle}
          title={RARE_FINDS_COPY.title}
        />
      }
    >
      <RareFindsSection
        className={className}
        rareFindsPromise={rareFindsPromise}
        showSaveIcon={showSaveIcon}
        surface={surface}
      />
    </Suspense>
  );
}

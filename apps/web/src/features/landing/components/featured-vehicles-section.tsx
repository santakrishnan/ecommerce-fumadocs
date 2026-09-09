import { locationCookieNames } from "@config/cookies";
import { APP_LOCATION_DEFAULTS } from "@config/location-defaults";
import { parseGeoCookie } from "@features/location/lib/location-cookies";
import { InventoryCardCarousel } from "@shared/components/inventory-card";
import { SectionHeader } from "@shared/components/section-header";
import { devConsole } from "@shared/lib/dev-console";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { cookies } from "next/headers";
import { getFeaturedVehicles } from "../services/inventory-vehicles-service";

const FEATURED_COPY = {
  title: "NEW TODAY",
  subtitle: "Here are the latest listings I've found in the last 24 hours",
} as const;

/**
 * Featured Vehicles section (small cards) — async Server Component.
 *
 * Reads location cookies (ZIP + geo) and visitor identity OUTSIDE any
 * `"use cache"` scope, then passes them as plain arguments to the cached
 * service. Returns `null` when no vehicles are found or on upstream failure
 * — the section is completely hidden from the DOM.
 *
 * Figma specs: px-5 (20px mobile) / lg:px-10 (40px desktop),
 * cards 178×237 mobile / 220×293 desktop, gap-2 (8px), 6 cards.
 */
export async function FeaturedVehiclesSection({
  className,
  headingId = "featured-vehicles-heading",
  title = FEATURED_COPY.title,
  subtitle = FEATURED_COPY.subtitle,
}: {
  className?: string;
  headingId?: string;
  subtitle?: string;
  title?: string;
} = {}) {
  const cookieStore = await cookies();
  const cookieZip = cookieStore.get(locationCookieNames.ZIP)?.value;
  const zipCode = cookieZip ?? APP_LOCATION_DEFAULTS.zip;

  const geo = parseGeoCookie(cookieStore.get(locationCookieNames.GEO)?.value);
  const identity = await readVisitorIdentity();

  let vehicles: Awaited<ReturnType<typeof getFeaturedVehicles>> = [];

  try {
    vehicles = await getFeaturedVehicles({
      zipCode,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      visitorId: identity.visitorId ?? null,
      sessionId: identity.sessionId ?? null,
    });
  } catch (error) {
    devConsole.warn("[FeaturedVehiclesSection] Failed to load vehicles", error);
    return null;
  }

  if (vehicles.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <section aria-labelledby={headingId} className="w-full">
        <div>
          <SectionHeader id={headingId} subtitle={subtitle} title={title} />

          <div className="mt-4">
            <InventoryCardCarousel
              activitySource="LandingPage"
              colSpan={{ sm: 2, md: 2, lg: 2 }}
              showSaveIcon
              size="small"
              variant="gradient"
              vehicles={vehicles}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

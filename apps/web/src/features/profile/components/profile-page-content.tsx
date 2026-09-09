import { VDP_BOOKING_COOKIE } from "@config/vdp-booking-state";
import { PersonalizedSearchSkeleton } from "@features/landing";
import { getProfileTier } from "@features/profile/bff";
import { WatchlistSavedSearchesSection } from "@features/profile/watchlist/components/watchlist-saved-searches-section";
import { AskQuestionPrompt } from "@shared/components/ask-question-prompt";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { getTradeInVehicles } from "../bff/use-cases/get-trade-in-vehicles";
import { AppointmentSection } from "./appointment-section";
import { AppointmentSkeleton } from "./appointment-skeleton";
import { ProfileWatchlistContent } from "./profile-watchlist-content";
import { TradeInInvitationCard } from "./trade-in-invitation-card";
import { TradeInSection } from "./trade-in-section";
import { WatchlistSkeleton } from "./watchlist-skeleton";

/**
 * Carousel sections break out of the grid padding so the scroll track
 * reaches viewport edges, while the first card aligns to the content grid.
 * Profile page omits xl:pr-10 since the subgrid content rail has no right margin to reclaim.
 */
const CAROUSEL_BLEED =
  "-mx-5 pl-5 lg:-mx-10 lg:pl-10 xl:pr-10 lg:max-xl:[&_[data-slot=carousel-next]]:right-10 overflow-x-clip";

/**
 * Async server leaf for /profile composition.
 *
 * Resolves trade-in state in the shell so layout is deterministic (no CLS).
 *
 * Slot order:
 * - Vehicles saved: (Appointment) → Trade-in card → Watchlist → Saved Searches
 * - No vehicles:    (Appointment) → Watchlist → Trade-in invitation → Saved Searches
 * - t2/t3: Appointment slot prepended
 */
export async function ProfilePageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tier = await getProfileTier();
  const cookieStore = await cookies();
  const hasBooking = Boolean(cookieStore.get(VDP_BOOKING_COOKIE)?.value);
  const showAppointmentSlot = tier === "t2" || tier === "t3" || (tier === "t1" && hasBooking);

  // Resolve trade-in state in the shell — determines layout position
  const tradeInResult = await getTradeInVehicles();
  const vehicles = tradeInResult.success ? tradeInResult.data : [];

  return (
    <>
      {showAppointmentSlot ? (
        <Suspense fallback={<AppointmentSkeleton />}>
          <AppointmentSection />
        </Suspense>
      ) : null}

      {/* Trade-in above watchlist — only when vehicles exist */}
      {vehicles.length > 0 && <TradeInSection vehicles={vehicles} />}

      <Suspense fallback={<WatchlistSkeleton />}>
        <ProfileWatchlistContent searchParams={searchParams} />
      </Suspense>

      <AskQuestionPrompt
        className="col-span-full"
        heading="Questions about your watchlist? Just ask."
        headingLevel="h2"
        questions={[
          "Which one is the best value?",
          "How comfortable is third row seating?",
          "Which one is best in snowy conditions?",
          "Do any of these have Android Auto?",
        ]}
        variant="light-horizontal"
      />

      {/* Trade-in invitation below watchlist — only when empty */}
      {vehicles.length === 0 && (
        <section aria-label="Trade-in value" className="col-span-full">
          <TradeInInvitationCard />
        </section>
      )}

      <Suspense
        fallback={<PersonalizedSearchSkeleton className={`col-span-full ${CAROUSEL_BLEED}`} />}
      >
        <WatchlistSavedSearchesSection className={`col-span-full ${CAROUSEL_BLEED}`} />
      </Suspense>
    </>
  );
}

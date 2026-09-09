import { SectionHeader } from "~/shared/components/section-header";
import type { TradeInVehicle } from "../bff/contracts/trade-in-response";
import { TradeInAddVehicleShell } from "./trade-in-add-vehicle-shell";
import { TradeInModalShell } from "./trade-in-modal-shell";
import { TradeInVehicleCard } from "./trade-in-vehicle-card";

const SECTION_TITLE_SINGLE = "Your vehicle's value";
const SECTION_TITLE_MULTIPLE = (count: number) => `Trade-ins (${count})`;

interface TradeInSectionProps {
  vehicles: TradeInVehicle[];
}

/**
 * Trade-In Section — Server Component.
 *
 * Receives already-resolved vehicles from the page shell. Renders the
 * vehicle card with section header.
 *
 * - 1 vehicle: section header + "Add a vehicle →" CTA + vehicle card
 * - 2+ vehicles: section header + "View all →" (opens modal) + first vehicle card
 *
 * Placed above watchlist in the profile page slot order.
 */
export function TradeInSection({ vehicles }: TradeInSectionProps) {
  if (vehicles.length >= 2) {
    return (
      <section aria-label="Trade-in value" className="col-span-full">
        <div className="flex items-center justify-between">
          <SectionHeader subtitle="" title={SECTION_TITLE_MULTIPLE(vehicles.length)} />
          <TradeInModalShell vehicles={vehicles} />
        </div>

        {vehicles[0] && <TradeInVehicleCard className="mt-4" vehicle={vehicles[0]} />}
      </section>
    );
  }

  return (
    <section aria-label="Trade-in value" className="col-span-full">
      <div className="flex items-center justify-between">
        <SectionHeader subtitle="" title={SECTION_TITLE_SINGLE} />
        <TradeInAddVehicleShell />
      </div>

      {vehicles[0] && <TradeInVehicleCard className="mt-4" vehicle={vehicles[0]} />}
    </section>
  );
}

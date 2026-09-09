import { Button, Card, CardContent } from "@ucmp/ui";
import Image from "next/image";
import { cn, formatPrice } from "utils";
import type { TradeInVehicle } from "../bff/contracts/trade-in-response";
import { TradeInOverflowMenu } from "./trade-in-overflow-menu";

const DISCLAIMER_TEXT =
  "*Estimated value, subject to the condition you tell us and in-person inspection.";

interface TradeInVehicleCardAction {
  label: string;
  onAction: () => void;
}

interface TradeInVehicleCardProps {
  action?: TradeInVehicleCardAction;
  className?: string;
  showOverflowMenu?: boolean;
  vehicle: TradeInVehicle;
}

/**
 * Trade-In Vehicle Card — Server Component (filled state).
 *
 * Mobile: vertical stacked layout with small thumbnail + details
 * Desktop/Tablet: horizontal layout with large image left, details right
 */
export function TradeInVehicleCard({
  action,
  className,
  showOverflowMenu = true,
  vehicle,
}: TradeInVehicleCardProps) {
  const imageAlt = `${vehicle.year} ${vehicle.title}`;
  const formattedValue = `${formatPrice(vehicle.estimatedValue)}*`;
  const plateLabel = `${vehicle.licensePlate} · ${vehicle.state}`;

  return (
    <Card
      className={cn("w-full border-0 px-6 py-8 shadow-none ring-0 lg:px-8 lg:py-10", className)}
    >
      <CardContent className="p-0">
        {/* ─── Mobile layout ─── */}
        <div className="flex flex-col md:hidden">
          {/* Top row: thumbnail + info + overflow menu */}
          <div className="flex items-start gap-3">
            {/* Small image container: 56×56 */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
              <div className="relative h-5.75 w-11.5 shrink-0">
                <Image
                  alt={imageAlt}
                  className="object-contain"
                  fill
                  sizes="46px"
                  src={vehicle.imageUrl}
                />
              </div>
            </div>

            {/* Vehicle info */}
            <div className="flex-1">
              <p className="body-sm text-text-primary">{vehicle.year}</p>
              <h3 className="vehicle-title-md text-text-primary">{vehicle.title}</h3>
              <p className="body-sm text-text-primary">{plateLabel}</p>
            </div>

            {/* Overflow menu */}
            {showOverflowMenu && <TradeInOverflowMenu />}
          </div>

          {/* Estimated value */}
          <div className="mt-6">
            <p className="body-sm text-text-primary">Estimated trade-in value</p>
            <p className="number-xl mt-2 text-text-primary">{formattedValue}</p>
          </div>

          {/* Disclaimer */}
          <p className="disclaimer mt-4 w-64 text-text-secondary">{DISCLAIMER_TEXT}</p>

          {/* Action button — mobile */}
          {action && (
            <Button className="mt-8 w-full" onClick={action.onAction} size="lg">
              {action.label}
            </Button>
          )}
        </div>

        {/* ─── Desktop/Tablet layout ─── */}
        <div className="hidden md:flex md:flex-row md:gap-10">
          {/* Vehicle image — left side */}
          <div className="relative aspect-4/3 w-full max-w-sm overflow-hidden rounded-xl bg-surface-secondary">
            <Image
              alt={imageAlt}
              className="object-contain"
              fill
              sizes="388px"
              src={vehicle.imageUrl}
            />
          </div>

          {/* Vehicle details — right side */}
          <div className="relative flex flex-1 flex-col py-2">
            {/* Overflow menu — top-right */}
            {showOverflowMenu && (
              <div className="absolute top-0 right-0">
                <TradeInOverflowMenu />
              </div>
            )}

            <p className="body-sm text-text-secondary">{vehicle.year}</p>
            <h3 className="subhead-lg mt-1 text-text-primary">{vehicle.title}</h3>
            <p className="body-sm mt-1 text-text-secondary">{plateLabel}</p>

            {/* Estimated value */}
            <div className="mt-8">
              <p className="body-sm text-text-secondary">Estimated value</p>
              <p className="number-xl text-text-primary lg:mt-2">{formattedValue}</p>
            </div>

            {/* Disclaimer */}
            <p className="disclaimer mt-4 w-63.5 text-text-secondary">{DISCLAIMER_TEXT}</p>

            {/* Action button — desktop */}
            {action && (
              <Button className="mt-8 w-full" onClick={action.onAction} size="lg">
                {action.label}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Button, Card, CardContent } from "@ucmp/ui";
import { IconArrowRight } from "@ucmp/ui/icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "utils";

export interface VehicleSpecs {
  /** City MPG */
  cityMpg?: number;
  /** Drivetrain type (e.g. "AWD", "FWD", "RWD") */
  drivetrain?: string;
  /** Engine description (e.g. "I-4 cyl") */
  engine?: string;
  /** Fuel type (e.g. "Hybrid", "Gas", "Electric") */
  fuelType?: string;
  /** Horsepower */
  horsepower?: number;
  /** Highway MPG */
  hwyMpg?: number;
  /** Number of seats */
  seating?: number;
  /** Transmission type (e.g. "Automatic", "Manual") */
  transmissionType?: string;
}

export interface VehicleSpecsCardProps {
  /** Additional CSS classes */
  className?: string;
  /** Vehicle specification data */
  specs: VehicleSpecs;
  /** Optional action element to replace the default "View All Specs" link */
  viewAllSpecsAction?: ReactNode;
}

/** Fallback for missing/null spec values */
const EMPTY_VALUE = "—";

/**
 * Individual spec item — bold value + muted label below.
 */
function SpecItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="body-xxl text-text-primary">{value}</p>
      <p className="body-md text-text-primary">{label}</p>
    </div>
  );
}

export function VehicleSpecsCard({ specs, className, viewAllSpecsAction }: VehicleSpecsCardProps) {
  const specItems = [
    { value: specs.drivetrain ?? EMPTY_VALUE, label: "Drivetrain" },
    {
      value:
        specs.cityMpg != null && specs.hwyMpg != null
          ? `${specs.cityMpg} / ${specs.hwyMpg}`
          : EMPTY_VALUE,
      label: "City / Hwy MPG",
    },
    {
      value: specs.seating == null ? EMPTY_VALUE : `${specs.seating} seats`,
      label: "Seating",
    },
    { value: specs.transmissionType ?? EMPTY_VALUE, label: "Transmission" },
    { value: specs.engine ?? EMPTY_VALUE, label: "Engine" },
    {
      value: specs.horsepower == null ? EMPTY_VALUE : String(specs.horsepower),
      label: "Horsepower",
    },
    { value: specs.fuelType ?? EMPTY_VALUE, label: "Fuel Type" },
  ];

  return (
    <Card
      className={cn(
        "gap-0 rounded-xl border-0 bg-opacity-black-26 p-0 shadow-none ring-0 lg:min-h-117.5",
        className
      )}
      data-surface="dark"
    >
      <CardContent className="flex flex-1 flex-col gap-10 px-6 pt-10 pb-16 lg:gap-16 lg:px-8">
        {/* Section Heading */}
        <h2 className="body-md text-text-primary">Vehicle Details</h2>

        {/* Spec Grid: 4-col on desktop, 2-col on tablet/mobile */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-16 lg:grid-cols-4">
          {specItems.map((item) => (
            <SpecItem key={item.label} label={item.label} value={item.value} />
          ))}

          {/* "View All Specs →" button occupies the last cell */}
          <div className="flex items-end">
            {viewAllSpecsAction ?? (
              <Button
                className="h-auto min-h-0 p-0"
                nativeButton={false}
                render={<Link href="#" />}
                size="sm"
                trailingIcon={IconArrowRight}
                variant="text"
              >
                View All Specs
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

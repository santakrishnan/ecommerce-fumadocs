import { CardCarousel } from "@shared/components/card";
import { cn } from "utils";
import { type InventoryCardSize, SIZE_TOKEN } from "./inventory-card-content";
import { INVENTORY_CARD_HOVER_SCALE } from "./inventory-card-size";
import { LinkInventoryCard, type Vehicle } from "./link-inventory-card";

export interface InventoryResultsGridProps {
  /** Accessible carousel name. */
  "aria-label"?: string;
  /** Card size token passed to each inventory card. @default "large" */
  size?: InventoryCardSize;
  variant: "14-cards-small" | "6-cards-mix" | "6-cards-small";
  vehicles: Vehicle[];
}

type SmallColumn = [Vehicle, Vehicle];

type InventoryColumn =
  | { type: "large"; vehicle: Vehicle }
  | { type: "small-pair"; vehicles: SmallColumn };

const CARD_HOVER_CLASSES = cn(
  "transition-[transform,scale,box-shadow] duration-200 ease-out",
  "hover:z-10 hover:scale-[var(--carousel-hover-scale-ratio,1)] hover:shadow-hover",
  "has-[a:focus-visible]:z-10 has-[a:focus-visible]:scale-[var(--carousel-hover-scale-ratio,1)] has-[a:focus-visible]:shadow-hover",
  "motion-reduce:scale-100 motion-reduce:transition-none"
);

function renderInventoryColumn(column: InventoryColumn, _index: number, size: InventoryCardSize) {
  // `showBadge` is always on: this grid only renders in conversational search
  // turns, and a badge only paints when the vehicle carries `badge` data.
  if (column.type === "large") {
    return (
      <div className="contents">
        <LinkInventoryCard
          aspectRatio="448/597"
          showBadge
          size={size}
          variant="gradient"
          vehicle={column.vehicle}
          wrapperClassName={CARD_HOVER_CLASSES}
        />
      </div>
    );
  }

  const halfSize: InventoryCardSize = size === "search-fill" ? "search-fill-stacked" : size;

  return (
    <div className="contents">
      <div className="flex flex-col gap-2">
        {column.vehicles.map((vehicle) => (
          <LinkInventoryCard
            aspectRatio="220/293"
            key={vehicle.id}
            showBadge
            size={halfSize}
            variant="gradient"
            vehicle={vehicle}
            wrapperClassName={CARD_HOVER_CLASSES}
          />
        ))}
      </div>
    </div>
  );
}

function getSmallColumns(vehicles: Vehicle[]) {
  return Array.from(
    { length: Math.floor(vehicles.length / 2) },
    (_, index): InventoryColumn => ({
      type: "small-pair",
      vehicles: vehicles.slice(index * 2, index * 2 + 2) as SmallColumn,
    })
  );
}

function getMixColumns(vehicles: Vehicle[]) {
  if (vehicles.length <= 3) {
    return vehicles.map((vehicle) => ({ type: "large" as const, vehicle }));
  }

  const first = vehicles.at(0);
  const last = vehicles.at(-1);

  if (!first) {
    return [] as InventoryColumn[];
  }

  if (!last) {
    return [] as InventoryColumn[];
  }

  const middlePairs = getSmallColumns(vehicles.slice(1, -1));

  return [
    { type: "large" as const, vehicle: first },
    ...middlePairs,
    { type: "large" as const, vehicle: last },
  ];
}

/**
 * Shared inventory results surface for conversational search layout variants.
 * - "14-cards-small" / "6-cards-small": pairs vehicles into stacked small-card columns.
 * - "6-cards-mix": large cards for first/last, stacked small-card pairs in the middle.
 */
export function InventoryResultsGrid({
  vehicles,
  variant,
  size = "large",
  "aria-label": ariaLabel,
}: InventoryResultsGridProps) {
  const getItemKey = (item: InventoryColumn) => {
    if (item.type === "large") {
      return `${item.type}-${item.vehicle.id}`;
    }

    return `${item.type}-${item.vehicles.map((vehicle) => vehicle.id).join("-")}`;
  };
  const isMixVariant = variant === "6-cards-mix";
  const items = isMixVariant ? getMixColumns(vehicles) : getSmallColumns(vehicles);

  return (
    <CardCarousel
      aria-label={ariaLabel ?? "Inventory results"}
      getItemKey={getItemKey}
      hoverScaleRatio={INVENTORY_CARD_HOVER_SCALE[SIZE_TOKEN[size]]}
      itemClassName="basis-auto"
      items={items}
      renderItem={(column, index) => renderInventoryColumn(column, index, size)}
    />
  );
}

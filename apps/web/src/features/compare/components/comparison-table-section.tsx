import type { ComponentProps } from "react";
import { cn, slugify } from "utils";
import { toColumnHeaderId } from "../lib/compare-header-id";
import type { ComparisonAttribute, ComparisonVehicle } from "../types";

type ComparisonTableDensity = "comfortable" | "compact";

const VALUE_TYPOGRAPHY: Record<ComparisonTableDensity, string> = {
  comfortable: "h3",
  compact: "subhead-sm",
};

interface ComparisonTableSectionSlotClasses {
  cell?: string;
  heading?: string;
  label?: string;
  row?: string;
  table?: string;
  value?: string;
}

interface ComparisonTableSectionProps extends Omit<ComponentProps<"section">, "title"> {
  attributes: ComparisonAttribute[];
  classNames?: ComparisonTableSectionSlotClasses;
  density?: ComparisonTableDensity;
  /**
   * When set, columns at or beyond this index are hidden below the `lg`
   * breakpoint and revealed at `lg` and up. Leave unset to always show every
   * column.
   */
  mobileColumnLimit?: number;
  /**
   * Index of the column that was just swapped. Cells in this column get an
   * entrance animation. Set to -1 or omit for no animation.
   */
  swapColumn?: number;
  /** Whether the swap is in fade-out phase (true) or fade-in phase (false). */
  swapOut?: boolean;
  title: string;
  vehicles: ComparisonVehicle[];
}

function ComparisonTableSection({
  attributes,
  className,
  classNames,
  density = "comfortable",
  mobileColumnLimit,
  swapColumn = -1,
  swapOut = false,
  title,
  vehicles,
  ...props
}: ComparisonTableSectionProps) {
  const headingId = `comparison-table-section-${slugify(title)}`;

  const isColumnHiddenOnMobile = (index: number) =>
    mobileColumnLimit != null && index >= mobileColumnLimit;

  return (
    <section
      className={cn("mt-12 flex scroll-mt-40 flex-col bg-surface-secondary", className)}
      data-slot="comparison-table-section"
      {...props}
    >
      <h2
        className={cn(
          "carousel-headline border-divider border-b pb-4 text-text-primary uppercase",
          classNames?.heading
        )}
        data-slot="comparison-table-section-heading"
        id={headingId}
      >
        {title}
      </h2>

      <table
        aria-labelledby={headingId}
        className={cn(
          "w-full table-fixed border-collapse",
          "lg:-mx-2 lg:w-[calc(100%+var(--spacing-2)*2)] lg:border-separate lg:border-spacing-x-2 lg:border-spacing-y-0",
          classNames?.table
        )}
        data-slot="comparison-table-section-table"
      >
        <thead className="sr-only">
          <tr>
            {vehicles.map((vehicle, index) => (
              <th
                className={cn(isColumnHiddenOnMobile(index) && "hidden lg:table-cell")}
                id={toColumnHeaderId({
                  tableId: headingId,
                  columnIndex: index,
                  vin: vehicles[index]?.id ?? "",
                })}
                key={`col-${String(index)}-${vehicle.id}`}
                scope="col"
              >
                {vehicle.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attributes.map((attribute, rowIndex) => (
            <tr
              className={cn("align-top", classNames?.row)}
              data-slot="comparison-table-section-row"
              key={attribute.id}
            >
              {attribute.cells.map((cell, index) => (
                <td
                  className={cn(
                    "rounded-sm py-6 lg:py-8",
                    isColumnHiddenOnMobile(index) && "hidden lg:table-cell",
                    index === swapColumn && swapOut && "animate-compare-cell-out",
                    index === swapColumn && !swapOut && "animate-compare-cell-in",
                    classNames?.cell
                  )}
                  data-slot="comparison-table-section-cell"
                  headers={toColumnHeaderId({
                    tableId: headingId,
                    columnIndex: index,
                    vin: vehicles[index]?.id ?? "",
                  })}
                  key={`${attribute.id}-col-${String(index)}-${vehicles[index]?.id ?? ""}`}
                  style={
                    index === swapColumn && !swapOut
                      ? ({
                          "--compare-row-delay": `${String(rowIndex * 50)}ms`,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  <span
                    className={cn("body-sm mb-2 block text-text-secondary", classNames?.label)}
                    data-slot="comparison-table-section-label"
                  >
                    {cell.label}
                  </span>
                  <span
                    className={cn(
                      VALUE_TYPOGRAPHY[density],
                      "wrap-break-word block max-w-[95%]",
                      classNames?.value
                    )}
                    data-slot="comparison-table-section-value"
                  >
                    {cell.value}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export {
  type ComparisonTableDensity,
  ComparisonTableSection,
  type ComparisonTableSectionProps,
  type ComparisonTableSectionSlotClasses,
};

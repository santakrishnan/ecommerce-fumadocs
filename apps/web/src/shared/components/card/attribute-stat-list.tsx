import { Separator } from "@ucmp/ui";
import { type CSSProperties, Fragment } from "react";
import { cn } from "utils";

interface SpecAttribute {
  key?: string;
  label: string;
  max?: string | number | null;
  min?: string | number | null;
  options?: { value?: string | number | null }[];
  value?: string | number | null;
}

type AttributeStatSize = "single" | "default" | "compact";

type AttributeLayout = "grouped" | "list";

const COLOR_LABEL = /colou?r/i;

const STAT_VALUE_FONT_SIZE: Record<AttributeStatSize, { base: string; range: string }> = {
  single: { base: "number-xl", range: "number-lg" },
  default: { base: "number-xl", range: "number-lg" },
  compact: { base: "subhead-lg", range: "subhead-lg" },
};

function swatchStyle(name: string): CSSProperties {
  return {
    backgroundColor: name.trim().toLowerCase(),
    backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.20), transparent)",
  };
}

function toNames(values: (string | number | null | undefined)[]): string[] {
  return values.map((value) => (value == null ? "" : String(value).trim())).filter(Boolean);
}

function colorNames(attr: SpecAttribute): string[] {
  if (attr.options?.length) {
    return toNames(attr.options.map((option) => option.value));
  }
  return attr.value == null ? [] : toNames(String(attr.value).split(","));
}

function isRangeValue(attr: SpecAttribute): boolean {
  return attr.value == null && (attr.min != null || attr.max != null);
}

function textValue(attr: SpecAttribute): string {
  if (attr.value != null) {
    return String(attr.value);
  }
  if (attr.min != null || attr.max != null) {
    return `${attr.min ?? ""} – ${attr.max ?? ""}`;
  }
  if (attr.options?.length) {
    return colorNames(attr).join(", ");
  }
  return "";
}

function isRenderableColor(name: string): boolean {
  const lower = name.toLowerCase();
  return lower !== "other" && !lower.startsWith("off");
}

function ColorSwatches({ compact, names }: { compact: boolean; names: string[] }) {
  return (
    <div className={cn("flex flex-wrap gap-2", compact ? "mt-1" : "mt-2")}>
      {names.filter(isRenderableColor).map((color) => (
        <span
          aria-label={color}
          className={cn(
            "group relative rounded-full shadow-none hover:ring-1 hover:ring-background hover:ring-offset-2 hover:ring-offset-foreground/80",
            compact ? "size-4" : "size-6"
          )}
          key={color}
          role="img"
          style={swatchStyle(color)}
        >
          {/* Hover tooltip pill */}
          <span className="body-sm pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 items-center whitespace-nowrap rounded-xl border border-white/60 bg-neutral-300 px-3 py-2 text-(--color-text-primary-light) shadow-[0_2px_8px_rgba(0,0,0,0.15)] backdrop-blur-md group-hover:inline-flex">
            {color}
          </span>
        </span>
      ))}
    </div>
  );
}

function AttributeStat({ attr, size }: { attr: SpecAttribute; size: AttributeStatSize }) {
  const sizes = STAT_VALUE_FONT_SIZE[size];
  const isLarge = size === "single" || size === "default";

  if (COLOR_LABEL.test(attr.label)) {
    return (
      <div className={cn("flex flex-col gap-2 text-text-primary", isLarge && "gap-4")}>
        <span className="body-sm whitespace-nowrap">{attr.label}</span>
        <ColorSwatches compact={size === "compact"} names={colorNames(attr)} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col text-text-primary", isLarge && "gap-4")}>
      <span className="body-sm whitespace-nowrap">{attr.label}</span>
      <div className={cn("flex items-baseline gap-1", size === "compact" && "mt-1")}>
        <span
          className={cn("wrap-break-word min-w-0", isRangeValue(attr) ? sizes.range : sizes.base)}
        >
          {textValue(attr)}
        </span>
      </div>
    </div>
  );
}

function DividedStats({ attributes }: { attributes: SpecAttribute[] }) {
  return (
    <div className="flex flex-col gap-4">
      {attributes.map((attr, index) => (
        <Fragment key={attr.key ?? attr.label}>
          {index > 0 && <Separator />}
          <AttributeStat attr={attr} size="compact" />
        </Fragment>
      ))}
    </div>
  );
}

function SingleStat({ attr }: { attr: SpecAttribute }) {
  return (
    <div className="mb-6 flex flex-col gap-6">
      <AttributeStat attr={attr} size="single" />
    </div>
  );
}

/**
 * Renders attribute rows as stacked stats — label on top, value beneath, with
 * color specs shown as swatches.
 *
 * - `layout="grouped"` (default): count-based layout — 1 large hero stat, 2
 *   side-by-side columns, or a divided list for 3+.
 * - `layout="list"`: a consistent divided list regardless of count (1 still
 *   renders as a hero stat).
 */
function AttributeStatList({
  attributes,
  layout = "grouped",
}: {
  attributes: SpecAttribute[];
  layout?: AttributeLayout;
}) {
  if (attributes.length === 0) {
    return null;
  }

  if (attributes.length === 1) {
    const [attr] = attributes;
    if (!attr) {
      return null;
    }
    return <SingleStat attr={attr} />;
  }

  if (layout === "grouped" && attributes.length === 2) {
    return (
      <div className="flex flex-row gap-1">
        {attributes.map((attr) => (
          <div className="basis-1/2" key={attr.key ?? attr.label}>
            <AttributeStat attr={attr} size="default" />
          </div>
        ))}
      </div>
    );
  }

  return <DividedStats attributes={attributes} />;
}

export { AttributeStatList, type SpecAttribute };

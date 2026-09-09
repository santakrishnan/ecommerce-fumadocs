import { DEFAULT_ZIP_CODE } from "@features/location";
import { ButtonCard, CARD_SIZE, StaticCard } from "@shared/components/card";
import { ButtonComparisonCard, ComparisonCardContent } from "@shared/components/comparison-card";
import { DealerOfferCard } from "@shared/components/dealer-offer";
import {
  ButtonEditorialCard,
  LinkEditorialCard,
  StaticEditorialCard,
} from "@shared/components/editorial-card";
import {
  InventoryCardContent,
  LinkInventoryCardClient,
  SIZE_TOKEN,
} from "@shared/components/inventory-card";
import { ButtonModelCard, ModelCardContent } from "@shared/components/model-card";
import { ButtonSpecCard, SpecCardContent } from "@shared/components/spec-card";
import { ButtonTrimCard, TrimCardContent } from "@shared/components/trim-card";
import type { IconProps } from "@ucmp/ui/icons";
import { IconBinocular, IconBolt, IconLocation } from "@ucmp/ui/icons";
import type { SubmitTurnOptions } from "../hooks/use-agent-search-turns";
import type { SearchResultItem } from "../types/search-results";
import type { NextSearchPlan } from "./agent-search-turns-collection";

type IconName = "bolt" | "binocular" | "location";

const ICON_MAP: Record<IconName, React.ComponentType<IconProps>> = {
  binocular: IconBinocular,
  bolt: IconBolt,
  location: IconLocation,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a click handler from a nextSearchPlan.
 *
 * Returns undefined when no plan is present — callers can use this to decide
 * whether to render an interactive card vs. a link/static display.
 */
/**
 * Derives the turn source for a card click.
 *
 * When a `sourceHint` is provided (base-mapped cards), trust it directly.
 * Otherwise (legacy V2 raw shapes), fall back to "card" — all clicks are
 * treated as cards.
 */
function deriveClickSource(sourceHint: "pill" | "card" | undefined): "pill" | "card" {
  return sourceHint ?? "card";
}

/** The card's display title — used as the intent eyebrow for the turn it submits. */
function getItemLabel(item: SearchResultItem): string | undefined {
  switch (item.type) {
    case "editorial":
      return item.data.headline;
    case "model":
    case "comparison":
    case "trim":
    case "spec":
      return item.data.title;
    case "pill":
    case "nudge":
      return item.data.title;
    default:
      return;
  }
}

function buildPlanClickHandler(
  plan: NextSearchPlan | undefined,
  submitTurn: (options: SubmitTurnOptions) => void,
  label?: string,
  sourceHint?: "pill" | "card"
): (() => void) | undefined {
  if (!plan) {
    return;
  }
  return () =>
    submitTurn({
      autoSubmitted: true,
      // Plans normally carry their own location; zip-only default covers the rest.
      location: plan.location ?? { zipCode: DEFAULT_ZIP_CODE },
      plan,
      label,
      source: deriveClickSource(sourceHint),
    });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates a card renderer bound to submitTurn.
 *
 * When `readOnly` is true, cards render as non-interactive static displays
 * (no href, no onClick, no SaveButton). Used in the VDP overlay.
 *
 * Returns a function compatible with CardCarousel's `renderItem` prop.
 */
export function createResultCardRenderer(
  submitTurn: (options: SubmitTurnOptions) => void,
  options?: { readOnly?: boolean }
) {
  const readOnly = options?.readOnly ?? false;

  return function renderResultCard(item: SearchResultItem): React.ReactNode {
    if (readOnly) {
      return renderReadOnlyCard(item);
    }

    const onClick = buildPlanClickHandler(
      item.nextSearchPlan,
      submitTurn,
      getItemLabel(item),
      item.sourceHint
    );

    switch (item.type) {
      case "model":
        return (
          <ButtonModelCard
            {...item.data}
            buttonProps={{ "aria-label": `Select ${item.data.title}`, onClick }}
            size="search-fill"
          />
        );

      case "comparison":
        return (
          <ButtonComparisonCard
            {...item.data}
            attributeLayout="list"
            buttonProps={{ "aria-label": `Select ${item.data.title}`, onClick }}
            size="search-fill"
          />
        );

      case "trim": {
        const vehicle = item.data;
        return (
          <ButtonTrimCard
            availableCount={vehicle.availableCount}
            buttonProps={{ "aria-label": `Select ${vehicle.title}`, onClick }}
            description={vehicle.description}
            image={{ alt: `${vehicle.year ?? ""} ${vehicle.title}`.trim(), src: vehicle.imageUrl }}
            size="search-fill"
            specs={vehicle.specs}
            title={vehicle.title}
            year={vehicle.year}
          />
        );
      }

      case "editorial": {
        const { iconName, ...rest } = item.data;
        const icon = iconName ? ICON_MAP[iconName as IconName] : undefined;

        // With a plan → button card (submits plan). Without → link card (navigates).
        if (onClick) {
          return (
            <ButtonEditorialCard
              {...rest}
              buttonProps={{ "aria-label": `Select ${item.data.headline}`, onClick }}
              icon={icon}
              size="large-fill"
            />
          );
        }
        return <LinkEditorialCard {...rest} icon={icon} size="large-fill" />;
      }

      case "inventory":
        return (
          <LinkInventoryCardClient
            activitySource="ConversationalSearch"
            aspectRatio="448/597"
            showBadge
            showSaveButton
            size="search-fill"
            variant="gradient"
            vehicle={item.data}
          />
        );

      case "spec":
        return (
          <ButtonSpecCard
            {...item.data}
            attributeLayout="list"
            buttonProps={{ "aria-label": `Select ${item.data.title}`, onClick }}
            size="search-fill"
          />
        );

      case "nudge":
        return (
          <ButtonSpecCard
            attributeLayout="list"
            buttonProps={{ "aria-label": `Select ${item.data.title}`, onClick }}
            subtitle={item.data.subtitle}
            title={item.data.title}
          />
        );

      case "dealer-offer":
        return <DealerOfferCard className={CARD_SIZE["search-fill"]} data={item.data} />;

      case "pill":
        return (
          <ButtonCard
            buttonProps={{
              "aria-label": `Select ${item.data.title}`,
              onClick,
            }}
            className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-text-primary ring-0"
            data-surface="dark"
          >
            <span className="font-medium text-sm">{item.data.title}</span>
          </ButtonCard>
        );

      default:
        return null;
    }
  };
}

// ─── Read-only card rendering (VDP overlay) ──────────────────────────────────

function renderReadOnlyCard(item: SearchResultItem): React.ReactNode {
  switch (item.type) {
    case "model":
      return (
        <StaticCard
          className="shrink-0 justify-between gap-0 rounded-2xl bg-white/20 px-6 py-8 text-text-primary shadow-lg ring-0 xl:px-10"
          data-surface="dark"
          wrapperClassName={CARD_SIZE.search}
        >
          <ModelCardContent {...item.data} />
        </StaticCard>
      );

    case "comparison":
      return (
        <StaticCard
          className="shrink-0 justify-center gap-8 rounded-2xl border border-white bg-white/20 p-8 text-text-primary shadow-lg ring-0 xl:px-10"
          data-surface="dark"
          wrapperClassName={CARD_SIZE.search}
        >
          <ComparisonCardContent {...item.data} />
        </StaticCard>
      );

    case "trim": {
      const vehicle = item.data;
      return (
        <StaticCard
          className="shrink-0 justify-between gap-0 rounded-2xl bg-white/20 px-6 py-8 text-text-primary shadow-lg ring-0 xl:px-10"
          data-surface="dark"
          wrapperClassName={CARD_SIZE.search}
        >
          <TrimCardContent
            availableCount={vehicle.availableCount}
            description={vehicle.description}
            image={{
              src: vehicle.imageUrl,
              alt: `${vehicle.year ?? ""} ${vehicle.title}`.trim(),
            }}
            specs={vehicle.specs}
            title={vehicle.title}
            year={vehicle.year}
          />
        </StaticCard>
      );
    }

    case "editorial": {
      const { iconName, ...rest } = item.data;
      const icon = iconName ? ICON_MAP[iconName as IconName] : undefined;
      return <StaticEditorialCard {...rest} icon={icon} size="large" />;
    }

    case "inventory": {
      const vehicle = item.data;
      const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`;
      return (
        <StaticCard
          className="relative gap-0 overflow-clip border-0 bg-surface-primary p-0 shadow-none ring-0"
          data-surface={vehicle.surface ?? "light"}
          wrapperClassName={`shrink-0 ${CARD_SIZE[SIZE_TOKEN.large]}`}
        >
          <InventoryCardContent
            aiDescription={vehicle.aiDescription}
            badge={vehicle.badge}
            imageAlt={vehicleLabel}
            imageSrc={vehicle.imageUrl}
            mileage={vehicle.mileage}
            model={vehicle.model}
            originalPrice={vehicle.originalPrice}
            price={vehicle.price}
            showBadge
            size="large"
            trim={vehicle.trim}
            year={vehicle.year}
          />
        </StaticCard>
      );
    }

    case "dealer-offer":
      return <DealerOfferCard data={item.data} static />;

    case "spec":
      return (
        <StaticCard
          className="shrink-0 justify-between gap-0 rounded-2xl bg-white/20 px-6 py-8 text-text-primary shadow-lg ring-0 xl:px-10"
          data-surface="dark"
          wrapperClassName={CARD_SIZE.search}
        >
          <SpecCardContent {...item.data} />
        </StaticCard>
      );

    case "nudge":
      return (
        <StaticCard
          className="shrink-0 justify-between gap-0 rounded-2xl bg-white/20 px-6 py-8 text-text-primary shadow-lg ring-0 xl:px-10"
          data-surface="dark"
          wrapperClassName={CARD_SIZE.search}
        >
          <SpecCardContent subtitle={item.data.subtitle} title={item.data.title} />
        </StaticCard>
      );

    case "pill":
      return (
        <StaticCard
          className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-text-primary ring-0"
          data-surface="dark"
        >
          <span className="font-medium text-sm">{item.data.title}</span>
        </StaticCard>
      );

    default:
      return null;
  }
}

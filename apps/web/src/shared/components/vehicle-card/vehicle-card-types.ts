import type { ReactNode } from "react";

/** Props for the presentational {@link VehicleCard}. */
export interface VehicleCardProps {
  /** Additional class names for the root element. */
  className?: string;
  imageAlt: string;
  imageSrc: string;
  /**
   * Toggles the "Selected" visual state.
   * @defaultValue false
   */
  isSelected?: boolean;
  mileage: number;
  /** Mark the image as LCP-priority (for next/image). */
  priority?: boolean;
  title: string;
  /** Slot for trailing content (e.g. caret icon). */
  trailing?: ReactNode;
  /** Card layout variant. @default "compact" */
  variant?: "compact" | "full";
  year: number;
}

/** Props for the interactive (client) variant with toggle behavior. */
export interface VehicleCardInteractiveProps extends VehicleCardProps {
  /** Accessible label for the toggle button. */
  ariaLabel: string;
  /** Callback fired when the card selection is toggled. */
  onSelectToggle: () => void;
}

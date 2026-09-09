// ─── Vehicle Subset for StatusCard ──────────────────────────────────

/** Vehicle data used by StatusCard to build the headline and search seed. */
export interface StatusCardVehicle {
  /** Body style (e.g. "SUV") — used in similar-search seed. */
  bodyStyle?: string;
  make: string;
  model: string;
  trim?: string;
  year: number;
}

/** Dealer data rendered in the "Sold on …" line. */
export interface StatusCardDealer {
  name: string;
}

interface StatusCardBase {
  /** Vehicle data for headline copy + search seed. */
  vehicle: StatusCardVehicle;
}

interface StatusCardSoldProps extends StatusCardBase {
  /** Dealer that sold the vehicle. */
  dealer: StatusCardDealer;
  /**
   * Date the vehicle was sold.
   * Accepts ISO string or Date — formatted via `formatDate`.
   */
  soldDate: Date | string;
  variant?: "sold";
}

interface StatusCardNotFoundProps extends StatusCardBase {
  dealer?: never;
  soldDate?: never;
  variant: "not-found";
}

export type StatusCardProps = StatusCardSoldProps | StatusCardNotFoundProps;

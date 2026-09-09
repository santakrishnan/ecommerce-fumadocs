import { financingRatesFixture } from "../__fixtures__/financing-rates.fixture";

/**
 * Service interface and V1 fixture implementation for credit score tiers.
 *
 * The FinancingRateService is a swappable data boundary — V1 uses a fixture;
 * future versions can fetch from a CMS or rates API without changing the component.
 */

/** A single credit score tier with its associated APR and display label. */
export interface CreditScoreTier {
  /** Annual percentage rate as a decimal, e.g. 0.059 for 5.9% */
  apr: number;
  /** Display label shown on the tile, e.g. "Excellent" */
  label: string;
  /** Human-readable score range, e.g. "750+" or "700–749" */
  scoreRange: string;
}

/**
 * Swappable data boundary for credit score tiers and APR rates.
 * V1: fixture-backed mock. Future: CMS or rates API fetch.
 */
export interface FinancingRateService {
  /** Returns the current set of credit score tiers and their APRs. */
  getCreditScoreTiers(): Promise<CreditScoreTier[]>;
}

/**
 * V1 implementation backed by an editable fixture file.
 * Business teams update the fixture; the service interface remains stable.
 */
export class FixtureFinancingRateService implements FinancingRateService {
  async getCreditScoreTiers(): Promise<CreditScoreTier[]> {
    return financingRatesFixture;
  }
}

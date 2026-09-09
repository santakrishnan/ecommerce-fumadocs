import type { ProfileAppointment } from "../bff/contracts/profile-appointment-response.schema";
import { formatExpiresIn } from "./appointment-card-helpers";

interface OfferLockupProps {
  appointment: ProfileAppointment;
  showOfferPrefix?: boolean;
}

/**
 * Offer lockup — displays monthly payment, loan details, trade-in, co-borrower.
 * Used in both "offer with appointment" and "offer only" card variants.
 *
 * Width constrained to 280px (w-70) per Figma.
 * Gap-5 (20px) between sections, gap-1 (4px) within.
 */
export function OfferLockup({ appointment, showOfferPrefix = false }: OfferLockupProps) {
  const expiryText = appointment.expiresAt ? formatExpiresIn(appointment.expiresAt) : null;

  return (
    <div className="flex w-70 flex-col gap-5">
      {/* Expiry + monthly payment */}
      <div className="flex flex-col gap-1">
        {expiryText && (
          <p className="body-sm text-text-primary">
            {showOfferPrefix ? `Your offer:  ${expiryText}` : expiryText}
          </p>
        )}
        {appointment.monthlyPayment != null && (
          <div className="flex items-baseline gap-0.5 whitespace-nowrap">
            <span className="number-lg text-text-primary">
              ${appointment.monthlyPayment.toLocaleString()}
            </span>
            <span className="h3 text-text-primary">/ mo</span>
          </div>
        )}
      </div>

      {/* Loan details — 12px regular, secondary color, gap-1 */}
      <div className="body-sm flex flex-col gap-1 text-text-secondary">
        {(appointment.apr != null ||
          appointment.loanTermMonths != null ||
          appointment.downPayment != null) && (
          <p>
            {[
              appointment.apr == null ? null : `${appointment.apr}% APR`,
              appointment.loanTermMonths == null
                ? null
                : `for ${appointment.loanTermMonths} months`,
              appointment.downPayment == null
                ? null
                : `$${appointment.downPayment.toLocaleString()} down payment`,
            ]
              .filter(Boolean)
              .join("  •  ")}
          </p>
        )}
        {appointment.tradeInValue != null && (
          <p>${appointment.tradeInValue.toLocaleString()} estimated trade-in value</p>
        )}
        {appointment.coBorrowerName && <p>Co-borrower: {appointment.coBorrowerName}</p>}
      </div>
    </div>
  );
}

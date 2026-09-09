import type {
  ProfileAppointment,
  ProfileAppointmentUpstreamResponse,
} from "../contracts/profile-appointment-response.schema";

/**
 * Maps upstream appointment data to the BFF response shape.
 *
 * Performs explicit field-by-field mapping from the loose upstream contract
 * to the strict client-facing shape. Coerces `type` to the known union and
 * maps vehicle fields individually.
 */
export function mapProfileAppointmentUpstreamToResponse(
  upstream: ProfileAppointmentUpstreamResponse
): ProfileAppointment[] {
  return upstream.map((item) => ({
    id: item.id,
    type: item.type as ProfileAppointment["type"],
    label: item.label,
    vehicles: item.vehicles.map((v) => ({
      title: v.title,
      year: v.year,
      mileage: v.mileage,
      vin: v.vin,
      make: v.make,
      model: v.model,
      ...(v.trim != null && { trim: v.trim }),
      ...(v.imageUrl != null && { imageUrl: v.imageUrl }),
    })),
    dealershipName: item.dealershipName,
    dealershipAddress: item.dealershipAddress,
    ...(item.scheduledAt != null && { scheduledAt: item.scheduledAt }),
    ...(item.expiresAt != null && { expiresAt: item.expiresAt }),
    ...(item.monthlyPayment != null && { monthlyPayment: item.monthlyPayment }),
    ...(item.apr != null && { apr: item.apr }),
    ...(item.loanTermMonths != null && { loanTermMonths: item.loanTermMonths }),
    ...(item.downPayment != null && { downPayment: item.downPayment }),
    ...(item.tradeInValue != null && { tradeInValue: item.tradeInValue }),
    ...(item.coBorrowerName != null && { coBorrowerName: item.coBorrowerName }),
    ...(item.soldMessage != null && { soldMessage: item.soldMessage }),
  }));
}

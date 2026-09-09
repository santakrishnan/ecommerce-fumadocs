// Preset options driven by vehicle price — percentages match the Figma design.
export interface DownPaymentPreset {
  amount: number;
  percentage: number;
}

export interface DownPaymentContext {
  presets: DownPaymentPreset[];
  vehiclePrice: number;
}

export const DOWN_PAYMENT_CONTEXT_FIXTURE: DownPaymentContext = {
  vehiclePrice: 30_775,
  presets: [
    { amount: 3100, percentage: 10 },
    { amount: 5200, percentage: 17 },
    { amount: 6150, percentage: 20 },
  ],
};

import type {
  VdpCertification,
  VdpCertificationModalRow,
  VdpCertificationModalValue,
} from "./contracts/vdp-response.schema";

type CertificationTier = VdpCertification["tier"];

interface CertificationContentConfig {
  cardDescription: (make: string, inspectionPoints: number) => string;
  inspectionPoints: number;
  modalDescription: (make: string, model: string) => string;
  modalRows: Array<{
    label: string;
    value: string | true;
  }>;
}

export interface BuildVdpCertificationInput {
  badgeUrl?: string;
  make: string;
  model: string;
  tier: CertificationTier;
}

const GOLD_INSPECTION_POINTS = 160;
const SILVER_INSPECTION_POINTS = 136;

const CERTIFICATION_CONTENT: Record<CertificationTier, CertificationContentConfig> = {
  gold: {
    inspectionPoints: GOLD_INSPECTION_POINTS,
    cardDescription: (make, inspectionPoints) =>
      `Based on our thorough ${inspectionPoints}-point inspection, this vehicle meets ${make}'s highest standard, backed by full warranty coverage.`,
    modalDescription: (make, model) =>
      `Each ${make} Gold Certified Vehicle passes a rigorous ${GOLD_INSPECTION_POINTS}-point inspection and is reconditioned to ${make}'s exacting standards by ${make} dealer-trained technicians, backed by an extensive used car warranty. This ${model} comes with the below warranty plans.`,
    modalRows: [
      {
        label: "Vehicle Eligibility",
        value: "Up to 6 years old and 85,000 miles or less on the odometer",
      },
      { label: "Limited Comprehensive Warranty", value: "12-month/12,000-miles" },
      { label: "Limited Powertrain Warranty", value: "7-year/100,000-miles" },
      { label: "24-Hour Roadside Assistance", value: "7-year/100,000-miles" },
      {
        label: "Extended Warranty Coverage transferable at no cost for added resale value",
        value: true,
      },
      { label: "Quality Assurance Inspection", value: true },
      { label: "Free Carfax Report Vehicle History Report", value: true },
      {
        label: "Warranty honored at over 1,400 Toyota dealers in the continental U.S. and Canada",
        value: true,
      },
      { label: "Trade-ins accepted", value: true },
      { label: "Standard New Car Financing Rates Available in Select Regions", value: true },
      { label: "Trouble-free Paperwork (Including DMV)", value: true },
    ],
  },
  silver: {
    inspectionPoints: SILVER_INSPECTION_POINTS,
    cardDescription: (make, inspectionPoints) =>
      `Based on our thorough ${inspectionPoints}-point inspection, this vehicle meets ${make}'s certified quality standard, backed by warranty coverage.`,
    modalDescription: (make, model) =>
      `Each ${make} Silver Certified Vehicle earns its status through a rigorous inspection, reconditioned to ${make}'s exacting standards by ${make} dealer-trained technicians and backed by an extensive used car warranty. This ${model} comes with the below warranty plans.`,
    modalRows: [
      {
        label: "Vehicle Eligibility",
        value:
          "Up to 10 model years old and between 60,000 and 125,000 miles on the odometer; outside of Gold eligibility parameters",
      },
      { label: "Limited Powertrain Warranty", value: "12-month/12,000-miles" },
      { label: "24-Hour Roadside Assistance", value: "12-month/12,000-miles" },
      {
        label: "Extended Warranty Coverage transferable at no cost for added resale value",
        value: true,
      },
      { label: "Quality Assurance Inspection", value: true },
      { label: "Free Carfax Report Vehicle History Report", value: true },
      {
        label: "Warranty honored at over 1,400 Toyota dealers in the continental U.S. and Canada",
        value: true,
      },
      { label: "Trade-ins accepted", value: true },
      { label: "Trouble-free Paperwork (Including DMV)", value: true },
    ],
  },
};

function capitalizeCertificationTier(tier: CertificationTier): string {
  return `${tier.charAt(0).toUpperCase()}${tier.slice(1)}`;
}

function toModalValue(value: string | true): VdpCertificationModalValue {
  if (value === true) {
    return { type: "check" };
  }

  return { type: "text", text: value };
}

function toModalRows(rows: CertificationContentConfig["modalRows"]): VdpCertificationModalRow[] {
  return rows.map((row) => ({
    label: row.label,
    value: toModalValue(row.value),
  }));
}

export function buildVdpCertification({
  badgeUrl,
  make,
  model,
  tier,
}: BuildVdpCertificationInput): VdpCertification {
  const config = CERTIFICATION_CONTENT[tier];
  const certificationTitle = `${make} ${capitalizeCertificationTier(tier)} Certified`;

  return {
    badgeUrl: badgeUrl ?? `/images/certification/certification-${tier}.svg`,
    description: config.cardDescription(make, config.inspectionPoints),
    headline: `This ${model} is ${certificationTitle}`,
    modal: {
      description: config.modalDescription(make, model),
      rows: toModalRows(config.modalRows),
      title: `${certificationTitle} Warranty and Coverage`,
    },
    inspectionPoints: config.inspectionPoints,
    tier,
  };
}

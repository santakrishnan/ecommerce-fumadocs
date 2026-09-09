interface VehicleImageColor {
  code: string;
  hex?: string;
  image: string;
  title: string;
}

interface VehicleImageGrade {
  angle: string;
  colors: VehicleImageColor[];
  defaultColorCode: string;
  gradeName: string;
  gradeSlug: string;
  image: string;
}

interface VehicleImageEntry {
  grades: VehicleImageGrade[];
  make: string;
  model: string;
  series: string;
  year: number;
}

interface ResolveVehicleImageInput {
  /** Body type hint for intelligent fallback selection (e.g. "truck", "suv", "sedan"). */
  bodyType?: string;
  color?: string;
  make?: string;
  model?: string;
  trim?: string;
  year?: number;
}

export type { ResolveVehicleImageInput, VehicleImageColor, VehicleImageEntry, VehicleImageGrade };

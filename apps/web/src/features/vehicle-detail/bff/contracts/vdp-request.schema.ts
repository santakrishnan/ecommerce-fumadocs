import { VIN_PATTERN } from "utils/validators";
import { z } from "zod";

/**
 * VIN validation schema — ISO 3779 format.
 * 17 alphanumeric characters excluding I, O, Q.
 */
export const vdpVinSchema = z.string().length(17).regex(VIN_PATTERN, "Invalid VIN format");

export type VdpVin = z.infer<typeof vdpVinSchema>;

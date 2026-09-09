import type {
  DeviceSummary,
  ResolvedVisitor as SdkResolvedVisitor,
} from "@ucmp/sdk-visitor-profile-api";

export type ResolvedVisitor = SdkResolvedVisitor & DeviceSummary;

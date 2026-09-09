/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { DealerDealSkeleton } from "../components/dealer-deal/dealer-deal-skeleton";

describe("DealerDealSkeleton", () => {
  it("reserves space with the dealer deal responsive image ratios", () => {
    const { container } = render(<DealerDealSkeleton />);

    const status = screen.getByRole("status", { name: "Loading featured dealer deal" });
    const imageSkeleton = container.querySelector("[class*='aspect-']");

    expect(status).toBeInTheDocument();
    expect(imageSkeleton).toHaveClass(
      "aspect-[4/3.5]",
      "md:aspect-video",
      "lg:aspect-[5/2]",
      "xl:aspect-[16/5]"
    );
  });
});

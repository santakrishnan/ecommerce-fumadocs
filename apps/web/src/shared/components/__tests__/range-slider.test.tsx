import { describe, expect, it, render, screen } from "@ucmp/vitest-config/test-utils";
import type { ComponentProps } from "react";
import { RangeSlider } from "../range-slider";

const formatPrice = (v: number) => `$${v.toLocaleString()}`;
type RangeSliderTestProps = ComponentProps<typeof RangeSlider>;

async function renderRangeSlider(props: RangeSliderTestProps) {
  render(<RangeSlider {...props} />);
  return screen.findByRole("slider", { hidden: true });
}

describe("RangeSlider", () => {
  it("renders the slider primitive", async () => {
    const slider = await renderRangeSlider({
      formatValue: formatPrice,
      max: 5000,
      min: 0,
      step: 100,
      value: [2000],
    });

    expect(slider).toBeInTheDocument();
  });

  it("displays formatted min and max labels", async () => {
    await renderRangeSlider({ formatValue: formatPrice, max: 5000, min: 0, value: [1000] });

    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("$5,000")).toBeInTheDocument();
  });

  it("uses the custom formatValue function for labels", async () => {
    const formatPercent = (v: number) => `${v}%`;
    await renderRangeSlider({ formatValue: formatPercent, max: 100, min: 0, value: [50] });

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("passes min, max, and value to the underlying slider", async () => {
    const slider = await renderRangeSlider({
      formatValue: formatPrice,
      max: 5000,
      min: 0,
      step: 100,
      value: [2000],
    });

    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "5000");
    expect(slider).toHaveValue("2000");
  });
});

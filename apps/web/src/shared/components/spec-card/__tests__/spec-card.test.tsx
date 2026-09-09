/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { LinkSpecCard, type LinkSpecCardProps } from "../link-spec-card";
import type { SpecAttribute } from "../spec-card-content";

vi.mock("next/image", () => ({
  // biome-ignore lint/performance/noImgElement: Test mock requires native img element
  // biome-ignore lint/correctness/useImageSize: Test mock doesn't need explicit dimensions
  // biome-ignore lint/a11y/useAltText: Props are spread from the component under test
  default: (props: React.ComponentProps<"img">) => <img {...props} />,
}));

const BASE_PROPS: LinkSpecCardProps = {
  linkProps: { href: "/segment/suv" },
  title: "SUVs",
  specs: [{ key: "capacity", label: "Capacity", value: "5 Passengers" }],
};

function specRows(container: HTMLElement) {
  return container.querySelectorAll("[data-slot='separator']");
}

describe("SpecCard — attribute rows", () => {
  it("renders a single spec without an alternate layout", () => {
    const { container } = render(<LinkSpecCard {...BASE_PROPS} />);
    expect(screen.getByText("Capacity")).toBeInTheDocument();
    expect(screen.getByText("5 Passengers")).toBeInTheDocument();
    expect(specRows(container)).toHaveLength(0);
  });

  it("renders one divider between each spec regardless of count", () => {
    const specs: SpecAttribute[] = [
      { key: "a", label: "Range", value: "615 mi" },
      { key: "b", label: "MPG", value: "35" },
      { key: "c", label: "Seats", value: "7" },
    ];
    const { container } = render(<LinkSpecCard {...BASE_PROPS} specs={specs} />);
    expect(specRows(container)).toHaveLength(2);
    expect(screen.getByText("Range")).toBeInTheDocument();
    expect(screen.getByText("Seats")).toBeInTheDocument();
  });

  it("renders every spec with no hardcoded cap", () => {
    const specs: SpecAttribute[] = Array.from({ length: 10 }, (_, index) => ({
      key: `spec-${index}`,
      label: `Attribute ${index}`,
      value: String(index),
    }));
    render(<LinkSpecCard {...BASE_PROPS} specs={specs} />);
    expect(screen.getByText("Attribute 0")).toBeInTheDocument();
    expect(screen.getByText("Attribute 9")).toBeInTheDocument();
  });

  it("caps rows when specCount is provided", () => {
    const specs: SpecAttribute[] = [
      { key: "a", label: "Range", value: "615 mi" },
      { key: "b", label: "MPG", value: "35" },
      { key: "c", label: "Seats", value: "7" },
    ];
    render(<LinkSpecCard {...BASE_PROPS} specCount={2} specs={specs} />);
    expect(screen.getByText("Range")).toBeInTheDocument();
    expect(screen.getByText("MPG")).toBeInTheDocument();
    expect(screen.queryByText("Seats")).not.toBeInTheDocument();
  });

  it("renders color specs as swatches", () => {
    const specs: SpecAttribute[] = [
      { key: "colors", label: "Colors", options: [{ value: "red" }, { value: "blue" }] },
    ];
    render(<LinkSpecCard {...BASE_PROPS} specs={specs} />);
    expect(screen.getByRole("img", { name: "red" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "blue" })).toBeInTheDocument();
  });
});

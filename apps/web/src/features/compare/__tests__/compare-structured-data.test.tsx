import { render } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { CompareStructuredData } from "../components/compare-structured-data";

describe("CompareStructuredData with no vehicles", () => {
  it("renders no structured-data script", () => {
    const { container } = render(<CompareStructuredData vehicles={[]} />);

    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});

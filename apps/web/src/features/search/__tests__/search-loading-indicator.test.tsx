/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import {
  searchLoadingIndicatorBeatsFixture,
  searchLoadingIndicatorThinkingStatusFixture,
} from "../__fixtures__/search-loading-indicator.fixture";
import { SearchLoadingIndicator } from "../components/search-loading-indicator";

describe("SearchLoadingIndicator", () => {
  it("uses typography variants and a dark surface for its status and progress beats", () => {
    const { container } = render(
      <SearchLoadingIndicator
        beats={searchLoadingIndicatorBeatsFixture}
        thinkingStatus={searchLoadingIndicatorThinkingStatusFixture}
      />
    );

    expect(container.firstElementChild).toHaveAttribute("data-surface", "dark");
    expect(screen.getByText(searchLoadingIndicatorThinkingStatusFixture)).toHaveClass(
      "subhead-sm",
      "text-text-primary/70"
    );

    for (const beat of searchLoadingIndicatorBeatsFixture) {
      expect(screen.getByText(beat.message)).toHaveClass("body-md", "text-text-primary/70");
    }
  });
});

/// <reference types="@testing-library/jest-dom/vitest" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@features/search", () => ({
  SearchConversationalController: () => null,
  SearchHeader: () => null,
  SearchProviders: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@ucmp/ui/icons", () => ({
  IconMic: ({ className }: ComponentProps<"span">) => <span className={className} />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("../context/category-search-context", () => ({
  useCategorySearch: () => null,
}));

vi.mock("../hooks/use-typewriter-placeholder", () => ({
  useTypewriterPlaceholder: () => ({
    displayText: "Search vehicles",
    phraseIndex: 0,
  }),
}));

import { SearchOverlay } from "../components/search-prompt/search-overlay";

describe("SearchOverlay", () => {
  it("uses body-md typography on the closed facade", () => {
    render(<SearchOverlay />);

    const facade = screen.getByRole("button", { name: "Open search" });
    expect(facade).toHaveClass("body-md", "text-text-primary", "text-left");
    expect(facade).not.toHaveClass("text-sm", "leading-relaxed", "tracking-tighter");
  });
});

/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "../item";

describe("Item", () => {
  describe("data-slot", () => {
    it('renders with slot state "item"', () => {
      const { container } = render(<Item>Content</Item>);
      // useRender applies the state.slot; the default tag is a div containing the content
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("surface-aware background", () => {
    it("uses surface-light/surface-dark variant prefixes for the background", () => {
      const { container } = render(<Item>Content</Item>);
      const item = container.firstChild as HTMLElement;
      expect(item.className).toContain("bg-white");
      expect(item.className).toContain("surface-dark:bg-white/20");
      expect(item.className).toContain("surface-dark:glass");
    });
  });

  describe("surface prop", () => {
    it("stamps data-surface when surface is provided", () => {
      const { container } = render(<Item surface="light">Content</Item>);
      const item = container.firstChild as HTMLElement;
      expect(item).toHaveAttribute("data-surface", "light");
    });

    it("stamps data-surface='dark' when surface is dark", () => {
      const { container } = render(<Item surface="dark">Content</Item>);
      const item = container.firstChild as HTMLElement;
      expect(item).toHaveAttribute("data-surface", "dark");
    });

    it("does not set data-surface when surface is omitted (inherits from ancestor)", () => {
      const { container } = render(<Item>Content</Item>);
      const item = container.firstChild as HTMLElement;
      expect(item).not.toHaveAttribute("data-surface");
    });
  });

  describe("surface-aware text tokens", () => {
    it("ItemTitle uses the surface-aware text-text-primary token", () => {
      const { container } = render(<ItemTitle>Title</ItemTitle>);
      const title = container.firstChild as HTMLElement;
      expect(title.className).toContain("text-text-primary");
    });

    it("ItemDescription uses the surface-aware text-text-secondary token", () => {
      const { container } = render(<ItemDescription>Description</ItemDescription>);
      const description = container.firstChild as HTMLElement;
      expect(description.className).toContain("text-text-secondary");
    });

    it("ItemActions uses the surface-aware text-text-primary token", () => {
      const { container } = render(<ItemActions>Actions</ItemActions>);
      const actions = container.firstChild as HTMLElement;
      expect(actions.className).toContain("text-text-primary");
    });
  });

  describe("composition", () => {
    it("renders title and description inside content", () => {
      render(
        <Item>
          <ItemContent>
            <ItemTitle>Financing</ItemTitle>
            <ItemDescription>Pay over time.</ItemDescription>
          </ItemContent>
        </Item>
      );
      expect(screen.getByText("Financing")).toBeInTheDocument();
      expect(screen.getByText("Pay over time.")).toBeInTheDocument();
    });

    it("renders as a polymorphic element via the render prop", () => {
      render(<Item render={<button type="button" />}>Clickable</Item>);
      expect(screen.getByRole("button", { name: "Clickable" })).toBeInTheDocument();
    });
  });

  describe("ItemGroup", () => {
    it('renders with role="list"', () => {
      render(
        <ItemGroup>
          <Item>One</Item>
          <Item>Two</Item>
        </ItemGroup>
      );
      expect(screen.getByRole("list")).toBeInTheDocument();
    });
  });
});

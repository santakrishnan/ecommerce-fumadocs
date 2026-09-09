/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import type { ItemElement } from "../option-item";
import { OptionItemGroup } from "../option-item-group";

const ITEMS: ItemElement[] = [
  {
    type: "item",
    id: "finance",
    title: "Finance",
    description: "Apply for financing and get monthly payment options",
  },
  {
    type: "item",
    id: "cash",
    title: "Pay in full",
    description: "Purchase the vehicle with a one-time payment",
  },
];

describe("OptionItemGroup", () => {
  it("renders all items in the group", () => {
    render(<OptionItemGroup items={ITEMS} />);
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Pay in full")).toBeInTheDocument();
  });

  it("renders each item as a button", () => {
    render(<OptionItemGroup items={ITEMS} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });

  it("renders the group with role list", () => {
    render(<OptionItemGroup items={ITEMS} />);
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("renders descriptions for each item", () => {
    render(<OptionItemGroup items={ITEMS} />);
    expect(
      screen.getByText("Apply for financing and get monthly payment options")
    ).toBeInTheDocument();
    expect(screen.getByText("Purchase the vehicle with a one-time payment")).toBeInTheDocument();
  });
});

/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { conversationalThreadFixture } from "../__fixtures__/conversational-thread.fixture";
import { ConversationalThread } from "../components/conversational-thread";

describe("ConversationalThread", () => {
  it('sets data-surface="dark" at the component boundary', () => {
    render(<ConversationalThread {...conversationalThreadFixture} />);

    expect(screen.getByTestId("conversational-thread")).toHaveAttribute("data-surface", "dark");
  });

  it("uses typography variants for its query and response paragraphs", () => {
    render(<ConversationalThread {...conversationalThreadFixture} />);

    const query = screen.getByText(conversationalThreadFixture.query);
    expect(query).toHaveClass("subhead-sm", "text-text-tertiary");
    expect(query).not.toHaveClass("font-semibold", "font-toyota", "text-sm", "leading-body");

    for (const paragraph of conversationalThreadFixture.responseParagraphs) {
      const responseParagraph = screen.getByText(paragraph);
      expect(responseParagraph).toHaveClass("body-xl", "text-text-primary");
      expect(responseParagraph).not.toHaveClass(
        "font-normal",
        "font-toyota",
        "text-2xl",
        "leading-body",
        "tracking-tighter"
      );
    }
  });
});

/// <reference types="@testing-library/jest-dom/vitest" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { ConversationalLayout } from "../components/conversational-layout";

describe("ConversationalLayout", () => {
  it("renders all three slots", () => {
    render(
      <ConversationalLayout
        panel={<aside data-testid="panel">Panel content</aside>}
        promptBar={<div data-testid="prompt-bar">Prompt</div>}
        thread={<div data-testid="thread">Thread content</div>}
      />
    );

    expect(screen.getByTestId("thread")).toBeInTheDocument();
    expect(screen.getByTestId("panel")).toBeInTheDocument();
    expect(screen.getByTestId("prompt-bar")).toBeInTheDocument();
  });

  it("renders no secondary column when panel is omitted", () => {
    render(
      <ConversationalLayout
        promptBar={<div data-testid="prompt-bar">Prompt</div>}
        thread={<div data-testid="thread">Thread content</div>}
      />
    );

    expect(screen.getByTestId("thread")).toBeInTheDocument();
    expect(screen.getByTestId("prompt-bar")).toBeInTheDocument();
    expect(screen.queryByTestId("panel-column")).not.toBeInTheDocument();
  });

  it("renders no secondary column when panel is null", () => {
    render(
      <ConversationalLayout
        panel={null}
        promptBar={<div data-testid="prompt-bar">Prompt</div>}
        thread={<div data-testid="thread">Thread content</div>}
      />
    );

    expect(screen.getByTestId("thread")).toBeInTheDocument();
    expect(screen.getByTestId("prompt-bar")).toBeInTheDocument();
    // No panel wrapper rendered
    expect(screen.queryByTestId("panel-column")).not.toBeInTheDocument();
  });

  it("renders no secondary column when panel is false", () => {
    render(
      <ConversationalLayout
        panel={false}
        promptBar={<div data-testid="prompt-bar">Prompt</div>}
        thread={<div data-testid="thread">Thread content</div>}
      />
    );

    expect(screen.getByTestId("thread")).toBeInTheDocument();
    expect(screen.queryByTestId("panel-column")).not.toBeInTheDocument();
  });

  it("thread spans full width when panel is null", () => {
    render(
      <ConversationalLayout
        panel={null}
        promptBar={<div>Prompt</div>}
        thread={<div data-testid="thread">Thread</div>}
      />
    );

    // Thread is a direct child of the outer layout — no flex wrapper splitting it
    const thread = screen.getByTestId("thread");
    const parent = thread.parentElement;
    expect(parent?.className).toContain("h-dvh");
  });

  it("promptBar is outside the scroll container", () => {
    render(
      <ConversationalLayout
        panel={null}
        promptBar={<div data-testid="prompt-bar">Prompt</div>}
        thread={<div data-testid="thread">Thread</div>}
      />
    );

    const promptBar = screen.getByTestId("prompt-bar");
    const thread = screen.getByTestId("thread");

    // Both should be siblings under the same parent (the outer layout div)
    expect(promptBar.parentElement).toBe(thread.parentElement);
  });
});

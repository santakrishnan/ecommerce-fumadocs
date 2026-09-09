import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../landing-body", () => ({
  LandingBody: () => <div data-testid="landing-body" />,
}));
vi.mock("../welcome-body", () => ({
  WelcomeBody: () => <div data-testid="welcome-body" />,
}));

const resolveHomeExperience = vi.fn();
vi.mock("../../../services/resolve-home-experience", () => ({
  resolveHomeExperience: (override?: string) => resolveHomeExperience(override),
}));

import { HomeBody } from "../home-body";

/** Render the async server component by awaiting its returned element. */
async function renderHomeBody(exp?: string) {
  resolveHomeExperience.mockClear();
  render(await HomeBody({ searchParams: Promise.resolve({ exp }) }));
}

describe("HomeBody", () => {
  it("renders the landing body for first-visit", async () => {
    resolveHomeExperience.mockResolvedValue("first-visit");
    await renderHomeBody();
    expect(screen.getByTestId("landing-body")).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-body")).not.toBeInTheDocument();
  });

  it("renders the welcome body for recent-return", async () => {
    resolveHomeExperience.mockResolvedValue("recent-return");
    await renderHomeBody();
    expect(screen.getByTestId("welcome-body")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-body")).not.toBeInTheDocument();
  });

  it("degrades a slipped-through lapsed-return to the welcome body (no redirect)", async () => {
    resolveHomeExperience.mockResolvedValue("lapsed-return");
    await renderHomeBody();
    expect(screen.getByTestId("welcome-body")).toBeInTheDocument();
  });

  it("forwards the ?exp= override to the resolver", async () => {
    resolveHomeExperience.mockResolvedValue("first-visit");
    await renderHomeBody("recent-return");
    expect(resolveHomeExperience).toHaveBeenCalledWith("recent-return");
  });
});

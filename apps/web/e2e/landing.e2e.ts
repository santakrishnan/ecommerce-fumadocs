import { expect, test } from "@playwright/test";

/**
 * Smoke test for the landing page.
 *
 * Confirms the app boots and the home route renders successfully against
 * mock data (SEARCH_AGENT_BACKEND=static_mock, USE_*_MOCKS=true), so it
 * never depends on a live backend. This is the baseline check for the
 * Playwright setup — follow-up tickets will extend coverage to the search,
 * VDP, and profile flows (see PEDX01-3000 Playwright ticket).
 */
test.describe("landing page", () => {
  test("loads the home page with the search entry point", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Search for a car your way");

    // Landing page search facade — confirms the page rendered past the
    // static shell into the client-hydrated search prompt.
    const openSearchButton = page.getByRole("button", { name: "Open search" });
    await expect(openSearchButton).toBeVisible();
  });
});

import type { AgentSearchTurn } from "../lib/agent-search-turns-collection";
import type { SearchResultItem } from "../types/search-results";

// ─── AgentSearchTurn Fixtures ─────────────────────────────────────────────────

const MOCK_SEARCH_ID = "00000000-0000-0000-0000-000000000001";

/** A turn that is pending (just submitted, no response yet). */
export const turnPending: AgentSearchTurn = {
  id: "00000000-0000-0000-0000-000000000010",
  searchId: MOCK_SEARCH_ID,
  role: "user",
  query: "Best SUV for families",
  status: "pending",
  submittedAt: 1_700_000_000_000,
};

/** A turn that is streaming (loading indicator should show). */
export const turnStreaming: AgentSearchTurn = {
  ...turnPending,
  id: "00000000-0000-0000-0000-000000000011",
  status: "streaming",
  beats: [{ beat: "inventory", message: "Checking nearby inventory…", status: "active" }],
};

/** A completed turn with OptionCards (renders as model cards). */
export const turnCompleteWithOptionCards: AgentSearchTurn = {
  id: "00000000-0000-0000-0000-000000000012",
  searchId: MOCK_SEARCH_ID,
  role: "user",
  query: "Which has the most cargo space?",
  status: "complete",
  submittedAt: 1_700_000_001_000,
  searchMode: "Exploration",
  response: {
    responseMode: "OptionCards",
    summary: "The Highlander Hybrid is the clear winner for cargo space.",
    totalCount: 2,
    optionLevel: "Model",
    nextSearchPlan: { searchId: MOCK_SEARCH_ID, filters: [] },
    results: [
      {
        id: "opt-highlander",
        title: "Highlander Hybrid",
        subtitle: "Best for cargo",
        availableCount: 12,
        nextSearchPlan: { searchId: MOCK_SEARCH_ID, filters: [] },
      },
      {
        id: "opt-sequoia",
        title: "Sequoia",
        subtitle: "Maximum space",
        availableCount: 5,
        nextSearchPlan: { searchId: MOCK_SEARCH_ID, filters: [] },
      },
    ],
  },
};

/** A completed turn with no cards (conversational-only response). */
export const turnCompleteWithTextOnly: AgentSearchTurn = {
  id: "00000000-0000-0000-0000-000000000014",
  searchId: MOCK_SEARCH_ID,
  role: "user",
  query: "Toyota sucks",
  status: "complete",
  submittedAt: 1_700_000_003_000,
  searchMode: "Exploration",
  response: {
    responseMode: "OptionCards",
    summary: "I'm sorry to hear that. Do you want to tell me where we've fallen short in the past?",
    totalCount: 0,
    optionLevel: "Fallback",
    results: [],
    nextSearchPlan: { searchId: MOCK_SEARCH_ID, filters: [] },
  },
};

/** An errored turn with retained internal diagnostics that must not be rendered. */
export const turnError: AgentSearchTurn = {
  id: "00000000-0000-0000-0000-000000000017",
  searchId: MOCK_SEARCH_ID,
  role: "user",
  query: "Find an electric SUV",
  status: "error",
  submittedAt: 1_700_000_005_000,
  errorCode: "SearchToolTimeout",
  errorMessage: "The search tool timed out.",
};

/** A completed turn with InventoryCards. */
export const turnCompleteWithInventoryCards: AgentSearchTurn = {
  id: "00000000-0000-0000-0000-000000000013",
  searchId: MOCK_SEARCH_ID,
  role: "user",
  query: "Show me trucks",
  status: "complete",
  submittedAt: 1_700_000_002_000,
  searchMode: "Inventory",
  response: {
    responseMode: "InventoryCards",
    summary: "Here are some truck options for you.",
    totalCount: 2,
    nextSearchPlan: { searchId: MOCK_SEARCH_ID, filters: [] },
    results: [
      {
        vin: "1HGCM82633A00401A",
        vehicleInfo: {
          year: 2024,
          make: "Toyota",
          model: "Tacoma",
          trim: "TRD Pro",
          mileage: 3200,
        },
        dealerInfo: { dealerCode: "d1", dealerName: "Mock Dealer", zipCode: "90210" },
        pricing: { listPrice: 52_300 },
        status: { vehicleStatus: "Available" },
      },
      {
        vin: "1HGCM82633A00402B",
        vehicleInfo: {
          year: 2024,
          make: "Toyota",
          model: "Tundra",
          trim: "Limited",
          mileage: 8400,
        },
        dealerInfo: { dealerCode: "d1", dealerName: "Mock Dealer", zipCode: "90210" },
        pricing: { listPrice: 58_900 },
        status: { vehicleStatus: "Available" },
      },
    ],
  },
};

/** 8-card inventory fixture for grid layout testing (14-cards-small variant). */
export const turnCompleteWith8InventoryCards: AgentSearchTurn = {
  id: "00000000-0000-0000-0000-000000000016",
  searchId: MOCK_SEARCH_ID,
  role: "user",
  query: "show inventory",
  status: "complete",
  submittedAt: 1_700_000_003_000,
  searchMode: "Inventory",
  response: {
    responseMode: "InventoryCards",
    summary: "Here are 8 Highlander Hybrid inventory options.",
    totalCount: 8,
    nextSearchPlan: { searchId: MOCK_SEARCH_ID, filters: [] },
    results: Array.from({ length: 8 }, (_, i) => ({
      vin: `1HGCM82633A004${String(i).padStart(2, "0")}`,
      vehicleInfo: {
        year: 2024,
        make: "Toyota",
        model: "Highlander",
        trim: `Hybrid ${["XLE", "Limited", "LE", "Platinum", "XLE AWD", "Bronze Edition", "Nightshade", "Limited AWD"][i]}`,
        mileage: 2000 + i * 1000,
      },
      dealerInfo: { dealerCode: "d1", dealerName: "Mock Dealer", zipCode: "90210" },
      pricing: { sellingPrice: 39_000 + i * 2000 },
      status: { vehicleStatus: "Available" },
    })),
  },
};

/** 6-card inventory fixture for grid layout testing (14-cards-small variant). */
export const turnCompleteWith6InventoryCards: AgentSearchTurn = {
  id: "00000000-0000-0000-0000-000000000015",
  searchId: MOCK_SEARCH_ID,
  role: "user",
  query: "highlander inventory",
  status: "complete",
  submittedAt: 1_700_000_004_000,
  searchMode: "Inventory",
  response: {
    responseMode: "InventoryCards",
    summary: "Here are 6 Highlander Hybrid inventory options.",
    totalCount: 6,
    nextSearchPlan: { searchId: MOCK_SEARCH_ID, filters: [] },
    results: Array.from({ length: 6 }, (_, i) => ({
      vin: `2HGCM82633A004${String(i).padStart(2, "0")}`,
      vehicleInfo: {
        year: 2024,
        make: "Toyota",
        model: "Highlander",
        trim: `Hybrid ${["XLE", "Limited", "LE", "Platinum", "XLE AWD", "Bronze Edition"][i]}`,
        mileage: 3000 + i * 1500,
      },
      dealerInfo: { dealerCode: "d1", dealerName: "Mock Dealer", zipCode: "90210" },
      pricing: { sellingPrice: 40_000 + i * 2500 },
      status: { vehicleStatus: "Available" },
    })),
  },
};

// ─── SearchResultItem fixtures (kept for other test files that import them) ───

export const placeholderString = "Search vehicles...";
export const placeholderArray = ["What are you looking for?", "Try SUVs, hybrids, or trucks"];

// Legacy hook-state fixtures still imported by other tests
export const hookStateIdle = {
  actions: undefined,
  intentEyebrow: undefined,
  isLoading: false,
  responseText: undefined,
  results: [] as SearchResultItem[],
  seeAllResultsHref: undefined,
  streamKeywords: [] as string[],
};
export const hookStateLoading = {
  ...hookStateIdle,
  intentEyebrow: "Best SUV for families",
  isLoading: true,
  streamKeywords: ["SUVs", "Family", "Safety"],
};
export const hookStateWithModelCards = {
  ...hookStateIdle,
  intentEyebrow: "Which has the most cargo space?",
  isLoading: false,
  responseText: "The Highlander Hybrid is the clear winner for cargo space.",
  actions: [{ label: "Browse Highlander Hybrids", href: "/search/highlander-hybrid" }],
  results: [] as SearchResultItem[],
};
export const hookStateWithInventoryCards = {
  ...hookStateIdle,
  intentEyebrow: "Show me trucks",
  isLoading: false,
  responseText: "Here are some truck options for you.",
  results: [] as SearchResultItem[],
};

import { IMAGE_BASE_URL } from "@config/images";
import type { InventoryCard } from "@ucmp/sdk-search-api";
import type {
  SearchSuggestionsResponse,
  SearchSuggestionsUpstreamResponse,
} from "~/features/search/bff/contracts";

// Local mock event type — these fixtures use the BFF output shape (flat
// response.responseMode / response.results) rather than the SDK wire format
// (response.cards). The SDK AgentSearchEvent type no longer matches this shape
// after v0.5, so we declare a permissive local type for fixture authoring.
type MockAgentEvent =
  | { type: "Status"; searchId: string; stage: string; beat?: string; message?: string }
  | { type: "ToolCall"; toolCallId: string; toolName: string; beat?: string; message?: string }
  | {
      type: "ToolResult";
      status: string;
      toolCallId: string;
      beat?: string;
      message?: string;
      totalCount?: number;
    }
  | { type: "Delta"; text: string }
  | {
      type: "Complete";
      payload: { response: Record<string, unknown>; searchId: string; searchMode: string };
    }
  | { type: "Error"; error: { code: string; message: string } };

const SEARCH_ID = "e23a7b10-44cc-4f12-b890-1a2b3c4d5e6f";

export const AGENT_INVENTORY_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "ToolCall", toolName: "search", toolCallId: "tc-001" },
  { type: "ToolResult", toolCallId: "tc-001", status: "Ok" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "I found 4 RAV4 Hybrids near you." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary:
          "I found 4 RAV4 Hybrids near you. Here are the best matches based on price and proximity.",
        totalCount: 4,
        results: [
          {
            vin: "2T1BURHE8JC039175",
            vehicleId: 82_860_001,
            stockNumber: "STK-78432",
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "RAV4 Hybrid",
              trim: "XSE",
              bodyStyle: "SUV",
              fuelType: "Hybrid",
              isNew: true,
              isActive: true,
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 43_700, listPrice: 42_500 },
            status: { mileage: 12, daysInStock: 7, vehicleStatus: "In Stock", isCertified: false },
            media: {
              photos: [
                {
                  url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-01.png`,
                  displayOrder: 1,
                },
              ],
              videos: [],
            },
            relevanceScore: 0.95,
          },
          {
            vin: "2T3P1RFV5NW123456",
            vehicleId: 82_860_002,
            stockNumber: "STK-78433",
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "RAV4 Hybrid",
              trim: "Limited",
              bodyStyle: "SUV",
              fuelType: "Hybrid",
              isNew: true,
              isActive: true,
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 46_400, listPrice: 45_800 },
            status: { mileage: 5, daysInStock: 3, vehicleStatus: "In Stock", isCertified: false },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-02.png`, displayOrder: 1 },
              ],
              videos: [],
            },
            relevanceScore: 0.91,
          },
          {
            vin: "2T3W1RFV8NW654321",
            vehicleId: 82_860_003,
            stockNumber: "STK-78434",
            vehicleInfo: {
              year: 2023,
              make: "Toyota",
              model: "RAV4 Hybrid",
              trim: "SE",
              bodyStyle: "SUV",
              fuelType: "Hybrid",
              isNew: false,
              isActive: true,
            },
            dealerInfo: { dealerCode: "5015", dealerName: "Peninsula Toyota", zipCode: "94401" },
            pricing: { msrp: 38_900, listPrice: 36_200 },
            status: {
              mileage: 14_200,
              daysInStock: 21,
              vehicleStatus: "In Stock",
              isCertified: true,
            },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-03.png`, displayOrder: 1 },
              ],
              videos: [],
            },
            relevanceScore: 0.87,
          },
          {
            vin: "2T3A1RFV0NW789012",
            vehicleId: 82_860_004,
            stockNumber: "STK-78435",
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "RAV4 Hybrid",
              trim: "XLE",
              bodyStyle: "SUV",
              fuelType: "Hybrid",
              isNew: true,
              isActive: true,
            },
            dealerInfo: { dealerCode: "5018", dealerName: "Marin Toyota", zipCode: "94901" },
            pricing: { msrp: 40_600, listPrice: 39_900 },
            status: { mileage: 8, daysInStock: 12, vehicleStatus: "In Stock", isCertified: false },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-04.png`, displayOrder: 1 },
              ],
              videos: [],
            },
            relevanceScore: 0.84,
          },
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [
            { key: "make", values: ["Toyota"] },
            { key: "model", values: ["RAV4 Hybrid"] },
          ],
          location: { zipCode: "94105", latitude: 37.7749, longitude: -122.4194 },
        },
      },
    },
  },
];

export const AGENT_OPTION_CATEGORY_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are the main vehicle categories near you." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary: "Here are the main vehicle categories near you.",
        totalCount: 3,
        optionLevel: "Category",
        results: [
          {
            id: "cat-suv",
            title: "SUVs",
            subtitle: "Versatile, spacious, great for families and adventure.",
            availableCount: 312,
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "bodyStyle", values: ["SUV"] }],
            },
          },
          {
            id: "cat-sedan",
            title: "Sedans",
            subtitle: "Fuel-efficient, comfortable everyday commuters.",
            availableCount: 187,
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "bodyStyle", values: ["Sedan"] }],
            },
          },
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [
            { key: "price", max: 40_000 },
            { key: "year", min: 2021 },
          ],
        },
      },
    },
  },
];

export const AGENT_OPTION_SEGMENT_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are some popular SUV options." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary: "Here are some popular SUV options.",
        totalCount: 2,
        optionLevel: "Segment",
        results: [
          {
            id: "opt-compact-suv",
            title: "Compact SUV",
            subtitle: "Great fuel economy, easy to park.",
            availableCount: 86,
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "bodyStyle", values: ["Compact SUV"] }],
            },
          },
          {
            id: "opt-midsize-suv",
            title: "Midsize SUV",
            subtitle: "More cargo space, comfortable for families.",
            availableCount: 109,
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "bodyStyle", values: ["Midsize SUV"] }],
            },
          },
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [
            { key: "bodyStyle", values: ["SUV"] },
            { key: "price", max: 40_000 },
            { key: "year", min: 2021 },
          ],
        },
      },
    },
  },
];

export const AGENT_OPTION_MODEL_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are the top models we'd recommend for your family." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary:
          "For a family living in Brooklyn, the best vehicles usually balance good fuel economy in stop-and-go traffic, compact size for easy parking, and enough space for kids, and let's not forget safety features. Here are the top three models we'd recommend that match your needs.",
        totalCount: 3,
        optionLevel: "Model",
        results: [
          {
            id: "opt-rav4-hybrid",
            title: "RAV4 Hybrid",
            image: `${IMAGE_BASE_URL}/images/model/rav4_hybrid.png`,
            availableCount: 124,
            subtitle:
              "Best on gas for city driving and the easiest to whip into a tight spot if you ever do have to street park.",
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "fuelEfficiency", label: "Fuel efficiency", value: "40 MPG city" },
              { key: "capacity", label: "Capacity", value: "5 passengers" },
              { key: "averagePrice", label: "Average price", value: "$28k avg" },
              {
                key: "colors",
                label: "Colors",
                options: [
                  {
                    value: "Gray",
                    label: "Gray",
                    metadata: {
                      hex: "#808080",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2392.svg`,
                    },
                  },
                  {
                    value: "Red",
                    label: "Red",
                    metadata: {
                      hex: "#FF0000",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2395.svg`,
                    },
                  },
                  {
                    value: "White",
                    label: "White",
                    metadata: {
                      hex: "#FFFFFF",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2393.svg`,
                    },
                  },
                  {
                    value: "Blue",
                    label: "Blue",
                    metadata: {
                      hex: "#0000FF",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2394.svg`,
                    },
                  },
                ],
              },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["RAV4 Hybrid"] },
              ],
            },
          },
          {
            id: "opt-highlander-hybrid",
            title: "Highlander Hybrid",
            image: `${IMAGE_BASE_URL}/images/model/highlander_hybrid.png`,
            availableCount: 124,
            subtitle: "Great for small families that need a little more space.",
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "fuelEfficiency", label: "Fuel efficiency", value: "40 MPG city" },
              { key: "capacity", label: "Capacity", value: "7-8 passengers" },
              { key: "averagePrice", label: "Average price", value: "$28k avg" },
              {
                key: "colors",
                label: "Colors",
                options: [
                  {
                    value: "Gray",
                    label: "Gray",
                    metadata: {
                      hex: "#808080",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2392.svg`,
                    },
                  },
                  {
                    value: "Red",
                    label: "Red",
                    metadata: {
                      hex: "#FF0000",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2395.svg`,
                    },
                  },
                  {
                    value: "White",
                    label: "White",
                    metadata: {
                      hex: "#FFFFFF",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2393.svg`,
                    },
                  },
                  {
                    value: "Blue",
                    label: "Blue",
                    metadata: {
                      hex: "#0000FF",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2394.svg`,
                    },
                  },
                ],
              },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["Highlander Hybrid"] },
              ],
            },
          },
          {
            id: "opt-bz",
            title: "bZ",
            image: `${IMAGE_BASE_URL}/images/model/bz.png`,
            availableCount: 124,
            subtitle:
              "A cost saving, fully electric option — a great option for stop-and-go driving around the city.",
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "efficiency", label: "Efficiency", value: "131 MPGe city" },
              { key: "capacity", label: "Capacity", value: "5 passengers" },
              { key: "averagePrice", label: "Average price", value: "$28k avg" },
              {
                key: "colors",
                label: "Colors",
                options: [
                  {
                    value: "Gray",
                    label: "Gray",
                    metadata: {
                      hex: "#808080",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2392.svg`,
                    },
                  },
                  {
                    value: "Red",
                    label: "Red",
                    metadata: {
                      hex: "#FF0000",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2395.svg`,
                    },
                  },
                  {
                    value: "White",
                    label: "White",
                    metadata: {
                      hex: "#FFFFFF",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2393.svg`,
                    },
                  },
                  {
                    value: "Blue",
                    label: "Blue",
                    metadata: {
                      hex: "#0000FF",
                      imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2394.svg`,
                    },
                  },
                ],
              },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["bZ"] },
              ],
            },
          },
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [
            { key: "bodyStyle", values: ["SUV"] },
            { key: "price", max: 35_000 },
            { key: "year", min: 2022 },
            { key: "fuelType", values: ["Hybrid"] },
          ],
        },
      },
    },
  },
];

export const AGENT_OPTION_TRIM_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are available RAV4 Hybrid trim levels." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary: "Here are available RAV4 Hybrid trim levels.",
        totalCount: 3,
        optionLevel: "Trim",
        results: [
          {
            id: "opt-le",
            title: "LE",
            subtitle:
              "The smart starting point with everything you actually need to hit the road, and nothing you don't.",
            image: `${IMAGE_BASE_URL}/images/search/le-trim.png`,
            availableCount: 124,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "wheels", label: "Wheels", value: '17"' },
              { key: "display", label: "Display", value: '8"' },
              { key: "interior", label: "Interior", value: "Fabric" },
              { key: "averagePrice", label: "Average price", value: "$28k avg" },
              { key: "tech", label: "Tech", value: '8" display, Toyota Safety Sense 3.0' },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "trim", values: ["LE"] }],
            },
          },
          {
            id: "opt-se",
            title: "SE",
            subtitle:
              "A sportier take with 18-inch wheels and sport-tuned suspension — more fun without losing efficiency.",
            image: `${IMAGE_BASE_URL}/images/search/se-trim.png`,
            availableCount: 124,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "wheels", label: "Wheels", value: '18" sport' },
              { key: "display", label: "Display", value: '8"' },
              { key: "interior", label: "Interior", value: "SofTex" },
              { key: "averagePrice", label: "Average price", value: "$29k avg" },
              { key: "tech", label: "Tech", value: '8" display, bi-LED projector headlights' },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "trim", values: ["SE"] }],
            },
          },
          {
            id: "opt-xle-premium",
            title: "XLE Premium",
            subtitle:
              "Comfort upgrades families love, like a power moonroof, SofTex seats, and a power liftgate.",
            image: `${IMAGE_BASE_URL}/images/search/xle-premium-trim.png`,
            availableCount: 124,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "wheels", label: "Wheels", value: '18"' },
              { key: "display", label: "Display", value: '10.5"' },
              { key: "interior", label: "Interior", value: "SofTex heated" },
              { key: "averagePrice", label: "Average price", value: "$32k avg" },
              { key: "tech", label: "Tech", value: '10.25" display, wireless charging' },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "trim", values: ["XLE Premium"] }],
            },
          },
        ],
      },
    },
  },
];

export const AGENT_OPTION_PACKAGE_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are popular packages for the RAV4 Hybrid." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary: "Here are popular packages for the RAV4 Hybrid.",
        totalCount: 2,
        optionLevel: "Package",
        results: [
          {
            id: "opt-pkg-weather",
            title: "Weather Package",
            subtitle: "Heated steering wheel and heated front seats.",
            availableCount: 47,
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "features", values: ["comfort.heated_steering_wheel"] }],
            },
          },
          {
            id: "opt-pkg-tow",
            title: "Tow Package",
            subtitle: "Tow hitch receiver and wiring harness.",
            availableCount: 29,
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "features", values: ["towing.hitch_receiver"] }],
            },
          },
        ],
      },
    },
  },
];

export const AGENT_OPTION_FALLBACK_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are some options that might interest you." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary: "Here are some options that might interest you.",
        totalCount: 2,
        optionLevel: "Fallback",
        results: [
          {
            id: "opt-hybrid-suvs",
            title: "Hybrid SUVs",
            subtitle: "Best fuel economy in the SUV category.",
            availableCount: 195,
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "fuelType", values: ["Hybrid"] },
                { key: "bodyStyle", values: ["SUV"] },
              ],
            },
          },
          {
            id: "opt-gas-suvs",
            title: "Gas SUVs",
            subtitle: "Wide selection, proven reliability.",
            availableCount: 284,
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "fuelType", values: ["Gas"] },
                { key: "bodyStyle", values: ["SUV"] },
              ],
            },
          },
        ],
      },
    },
  },
];

export const AGENT_COMPARISON_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here's how these SUVs compare on cargo space." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "ComparisonCards",
        summary:
          "The Highlander Hybrid takes it — that 3rd row folds flat into a much bigger trunk. The RAV4 Hybrid still beats the bZ for everyday hauls; the bZ's battery pack eats into trunk depth.",
        totalCount: 213,
        results: [
          {
            id: "cmp-highlander-hybrid",
            title: "Highlander Hybrid",
            subtitle:
              "A 3rd row that folds flat means a much bigger trunk when you don't need the seats.",
            image: `${IMAGE_BASE_URL}/images/search/highlander-hybrid-2024.png`,
            availableCount: 124,
            highlights: ["Most space"],
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "maxCargo", label: "Max cargo", value: "84.3 cu. ft." },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["Highlander Hybrid"] },
              ],
            },
          },
          {
            id: "cmp-rav4-hybrid",
            title: "RAV4 Hybrid",
            subtitle: "Plenty for groceries, strollers, and weekend trips.",
            image: `${IMAGE_BASE_URL}/images/search/rav4-hybrid-2024.png`,
            availableCount: 186,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "maxCargo", label: "Max cargo", value: "69.8 cu. ft." },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["RAV4 Hybrid"] },
              ],
            },
          },
          {
            id: "cmp-bz",
            title: "bZ4X",
            subtitle: "The battery pack takes up most of the trunk depth.",
            image: `${IMAGE_BASE_URL}/images/search/bz-2024.png`,
            availableCount: 54,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "maxCargo", label: "Max cargo", value: "27.7 cu. ft." },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["bZ4X"] },
              ],
            },
          },
        ],
      },
    },
  },
];

export const AGENT_ERROR_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "ToolCall", toolName: "search", toolCallId: "tc-err-001" },
  { type: "ToolResult", toolCallId: "tc-err-001", status: "Error" },
  { type: "Error", error: { code: "AgentAborted", message: "Tool failure caused agent to abort" } },
];

// ─── Beats checklist demo (keyword: "beats") ─────────────────────────────────
// Mirrors the real beat/message shape (resolve → inventory → options) so
// the search-page loader's checklist can be exercised end to end offline.
// See PEDX01-2831.

export const AGENT_BEATS_DEMO_STREAM_FIXTURE: MockAgentEvent[] = [
  {
    type: "Status",
    searchId: SEARCH_ID,
    stage: "Resolving",
    beat: "resolve",
    message: "Looking for Tacoma, red near you…",
  },
  {
    type: "ToolCall",
    toolName: "get_dimension_stats",
    toolCallId: "tc-beats-001",
    beat: "inventory",
    message: "Checking nearby inventory…",
  },
  {
    type: "ToolResult",
    toolCallId: "tc-beats-001",
    status: "Ok",
    beat: "inventory",
    totalCount: 20,
    message: "About 20 red Tacomas near you",
  },
  {
    type: "ToolCall",
    toolName: "execute_search_plan",
    toolCallId: "tc-beats-002",
    beat: "options",
    message: "Building your options…",
  },
  {
    type: "ToolResult",
    toolCallId: "tc-beats-002",
    status: "Ok",
    beat: "options",
    totalCount: 9,
    message: "9 options ready",
  },
  { type: "Delta", text: "Here are the best red Tacoma matches near you." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary: "Here are the best red Tacoma matches near you.",
        totalCount: 4,
        results: [
          {
            vin: "3TMCZ5AN0PM000101",
            vehicleId: 91_000_001,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Tacoma",
              trim: "TRD Sport",
              bodyStyle: "Truck",
              fuelType: "Gas",
              exteriorColor: "Red",
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 41_800, listPrice: 39_500 },
            status: { mileage: 3400, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-01.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "3TMCZ5AN2PM000102",
            vehicleId: 91_000_002,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Tacoma",
              trim: "SR5",
              bodyStyle: "Truck",
              fuelType: "Gas",
              exteriorColor: "Red",
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 36_200, listPrice: 34_100 },
            status: { mileage: 6100, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-02.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [
            { key: "model", values: ["Tacoma"] },
            { key: "exteriorColor", values: ["Red"] },
          ],
        },
      },
    },
  },
];

/**
 * Same happy-path lead-in as AGENT_BEATS_DEMO_STREAM_FIXTURE, but the stream
 * ends after the inventory ToolResult reports an error — no ToolCall for
 * "options", no Complete/Error frame. Mirrors a V1 timeout: the connection
 * just stops. Exercises the client's trailing-beat-error fallback in
 * agent-search-service.ts (the "inventory" row should show the warning icon,
 * frozen there, since no later event ever arrives to close it).
 */
export const AGENT_BEATS_ERROR_STREAM_FIXTURE: MockAgentEvent[] = [
  {
    type: "Status",
    searchId: SEARCH_ID,
    stage: "Resolving",
    beat: "resolve",
    message: "Looking for Tacoma, red near you…",
  },
  {
    type: "ToolCall",
    toolName: "get_dimension_stats",
    toolCallId: "tc-beats-err-001",
    beat: "inventory",
    message: "Checking nearby inventory…",
  },
  {
    type: "ToolResult",
    toolCallId: "tc-beats-err-001",
    status: "Error",
    beat: "inventory",
    message: "Inventory lookup timed out",
  },
  // Stream ends here — no further frames, no Complete/Error event.
];

// ─── Text-only / no-media fixtures ───────────────────────────────────────────
// Each keyword gets its own response so demos reflect distinct agent behaviour.

export const AGENT_TEXT_ONLY_OFF_TOPIC_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  {
    type: "Delta",
    text: "Turtles are great!",
  },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary:
          "Turtles are great! I share their passion for slow and steady progress and their commitment to continuous improvement, which is a core tenet of our brand. Can I help you find a vehicle that\u2019s built for the long-haul, much like our turtle friends?",
        totalCount: 0,
        optionLevel: "Fallback",
        results: [],
      },
    },
  },
];

export const AGENT_TEXT_ONLY_NEGATIVE_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  {
    type: "Delta",
    text: "I\u2019m sorry to hear that.",
  },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary:
          "I\u2019m sorry to hear that. Do you want to tell me where we\u2019ve fallen short in the past? Toyota is always committed to improving the customer experience.\n\nIf you\u2019d rather speak with someone directly, you can reach our Brand Engagement Center at 1-800-331-4331 (Mon\u2013Fri 8am\u20138pm ET, Sat 9am\u20137pm ET) or visit toyota.com/support.",
        totalCount: 0,
        optionLevel: "Fallback",
        results: [],
      },
    },
  },
];

export const AGENT_TEXT_ONLY_COMPETITOR_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  {
    type: "Delta",
    text: "The vast majority of my inventory is certified pre-owned Toyota vehicles.",
  },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary:
          "The vast majority of my inventory is certified pre-owned Toyota vehicles. I would be happy to help you find a vehicle that is comparable to some iconic Fords such as the F 150, the Explorer, and the Bronco.\n\nBut if you\u2019re only considering Fords, I do have a small selection of pre-owned Fords in your area. Would you like to see what\u2019s available?",
        totalCount: 0,
        optionLevel: "Fallback",
        results: [],
      },
    },
  },
];

export const AGENT_TEXT_ONLY_NO_MATCH_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  {
    type: "Delta",
    text: "I couldn\u2019t find an exact color match for that.",
  },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary:
          "I couldn\u2019t find an exact color match for that, but I can broaden the search. Would you like me to show similar options in a different color, trim, or model year? Just let me know what\u2019s flexible and I\u2019ll find the closest fit.",
        totalCount: 0,
        optionLevel: "Fallback",
        results: [],
      },
    },
  },
];

function makeHighlanderCard(
  vin: string,
  index: number,
  trim: string,
  price: number,
  mileage: number
): InventoryCard {
  return {
    vin,
    vehicleId: 90_000_000 + index,
    vehicleInfo: {
      year: 2024 - (index % 3),
      make: "Toyota",
      model: "Highlander",
      trim: `Hybrid ${trim}`,
      bodyStyle: "SUV",
      fuelType: "Hybrid",
    },
    dealerInfo: { dealerCode: "6001", dealerName: "Grid Demo Dealer", zipCode: "90210" },
    pricing: { listPrice: price },
    status: { mileage, vehicleStatus: "In Stock" },
    media: {
      photos: [
        {
          url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-${String(index + 1).padStart(2, "0")}.png`,
          displayOrder: 1,
        },
      ],
      videos: [],
    },
  };
}

export const AGENT_INVENTORY_8_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary:
          "Here are the top matches for Highlander Hybrids with the lowest mileage and price that don't sacrifice any of the top rated features.",
        totalCount: 8,
        results: [
          makeHighlanderCard("5TDHBRFH2PS012345", 0, "XLE", 45_990, 4500),
          makeHighlanderCard("5TDHBRFH4PS023456", 1, "Limited", 49_500, 2100),
          makeHighlanderCard("5TDHBRFH6NS034567", 2, "LE", 39_900, 13_200),
          makeHighlanderCard("5TDHBRFH8PS045678", 3, "Platinum", 53_200, 980),
          makeHighlanderCard("5TDHBRFH0PS056789", 4, "XLE AWD", 43_750, 9100),
          makeHighlanderCard("5TDHBRFH2NS067890", 5, "Bronze Edition", 38_800, 21_400),
          makeHighlanderCard("5TDHBRFH4PS078901", 6, "Nightshade", 47_100, 3400),
          makeHighlanderCard("5TDHBRFH6PS089012", 7, "Limited AWD", 46_300, 7600),
        ],
        nextSearchPlan: { searchId: SEARCH_ID, filters: [] },
      },
    },
  },
];

export const AGENT_INVENTORY_6_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary:
          "Here are the top matches for Highlander Hybrids with the lowest mileage and price that don't sacrifice any of the top rated features.",
        totalCount: 6,
        results: [
          makeHighlanderCard("5TDHBRFH2PS012345", 0, "XLE", 45_990, 4500),
          makeHighlanderCard("5TDHBRFH4PS023456", 1, "Limited", 49_500, 2100),
          makeHighlanderCard("5TDHBRFH6NS034567", 2, "LE", 39_900, 13_200),
          makeHighlanderCard("5TDHBRFH8PS045678", 3, "Platinum", 53_200, 980),
          makeHighlanderCard("5TDHBRFH0PS056789", 4, "XLE AWD", 43_750, 9100),
          makeHighlanderCard("5TDHBRFH2NS067890", 5, "Bronze Edition", 38_800, 21_400),
        ],
        nextSearchPlan: { searchId: SEARCH_ID, filters: [] },
      },
    },
  },
];

export const AGENT_INVENTORY_14_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary:
          "Here are 14 Highlander Hybrids across multiple trims and model years — sorted by value.",
        totalCount: 14,
        results: [
          makeHighlanderCard("5TDHBRFH2PS012345", 0, "XLE", 45_990, 4500),
          makeHighlanderCard("5TDHBRFH4PS023456", 1, "Limited", 49_500, 2100),
          makeHighlanderCard("5TDHBRFH6NS034567", 2, "LE", 39_900, 13_200),
          makeHighlanderCard("5TDHBRFH8PS045678", 3, "Platinum", 53_200, 980),
          makeHighlanderCard("5TDHBRFH0PS056789", 4, "XLE AWD", 43_750, 9100),
          makeHighlanderCard("5TDHBRFH2NS067890", 5, "Bronze Edition", 38_800, 21_400),
          makeHighlanderCard("5TDHBRFH4PS078901", 6, "Nightshade", 47_100, 3400),
          makeHighlanderCard("5TDHBRFH6PS089012", 7, "Limited AWD", 46_300, 7600),
          makeHighlanderCard("5TDHBRFH8NS090123", 8, "XSE", 48_200, 5200),
          makeHighlanderCard("5TDHBRFH0PS101234", 9, "LE AWD", 41_500, 11_800),
          makeHighlanderCard("5TDHBRFH2PS112345", 10, "Platinum AWD", 54_900, 1200),
          makeHighlanderCard("5TDHBRFH4NS123456", 11, "XLE Premium", 44_800, 6700),
          makeHighlanderCard("5TDHBRFH6PS134567", 12, "Limited Nightshade", 50_100, 4100),
          makeHighlanderCard("5TDHBRFH8PS145678", 13, "Bronze Edition AWD", 40_200, 18_900),
        ],
        nextSearchPlan: { searchId: SEARCH_ID, filters: [] },
      },
    },
  },
];

// ─── Hybrid Model Cards (keyword: "hybrid") ──────────────────────────────────

export const AGENT_OPTION_HYBRID_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are the best hybrid options near you." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary:
          "For hybrid options, the Toyota Prius leads with up to 57 mpg combined. The Camry Hybrid and RAV4 Hybrid offer more space without sacrificing efficiency. All three qualify for reduced emissions incentives in most states.",
        totalCount: 5,
        optionLevel: "Model",
        results: [
          {
            id: "opt-prius",
            title: "Prius",
            subtitle: "The most fuel-efficient Toyota with up to 57 mpg combined.",
            image: `${IMAGE_BASE_URL}/images/search/toyota-camry-2024.png`,
            availableCount: 94,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "fuelEfficiency", label: "Fuel efficiency", value: "57/56 MPG" },
              { key: "capacity", label: "Capacity", value: "5 passengers" },
              { key: "averagePrice", label: "Average price", value: "$28,545" },
              {
                key: "colors",
                label: "Colors",
                options: [
                  {
                    value: "Electric Storm Blue",
                    label: "Electric Storm Blue",
                    metadata: { imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2392.svg` },
                  },
                  {
                    value: "Wind Chill Pearl",
                    label: "Wind Chill Pearl",
                    metadata: { imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2393.svg` },
                  },
                  {
                    value: "Supersonic Red",
                    label: "Supersonic Red",
                    metadata: { imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2394.svg` },
                  },
                ],
              },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["Prius"] },
              ],
            },
          },
          {
            id: "opt-camry-hybrid",
            title: "Camry Hybrid",
            subtitle: "Midsize sedan with hybrid efficiency and a refined driving experience.",
            image: `${IMAGE_BASE_URL}/images/search/toyota-camry-2024.png`,
            availableCount: 112,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "fuelEfficiency", label: "Fuel efficiency", value: "51/53 MPG" },
              { key: "capacity", label: "Capacity", value: "5 passengers" },
              { key: "averagePrice", label: "Average price", value: "$30,450" },
              {
                key: "colors",
                label: "Colors",
                options: [
                  {
                    value: "Midnight Black",
                    label: "Midnight Black",
                    metadata: { imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2392.svg` },
                  },
                  {
                    value: "Celestial Silver",
                    label: "Celestial Silver",
                    metadata: { imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2395.svg` },
                  },
                ],
              },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["Camry Hybrid"] },
              ],
            },
          },
          {
            id: "opt-rav4-hybrid-2",
            title: "RAV4 Hybrid",
            subtitle: "Compact SUV with standard AWD and excellent hybrid fuel economy.",
            image: `${IMAGE_BASE_URL}/images/search/rav4-hybrid-2024.png`,
            availableCount: 186,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "fuelEfficiency", label: "Fuel efficiency", value: "41/38 MPG" },
              { key: "capacity", label: "Capacity", value: "5 passengers" },
              { key: "averagePrice", label: "Average price", value: "$33,980" },
              {
                key: "colors",
                label: "Colors",
                options: [
                  {
                    value: "Blueprint",
                    label: "Blueprint",
                    metadata: { imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2392.svg` },
                  },
                  {
                    value: "Lunar Rock",
                    label: "Lunar Rock",
                    metadata: { imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2394.svg` },
                  },
                  {
                    value: "Ice Cap",
                    label: "Ice Cap",
                    metadata: { imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2393.svg` },
                  },
                ],
              },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["RAV4 Hybrid"] },
              ],
            },
          },
          {
            id: "opt-corolla-hybrid",
            title: "Corolla Hybrid",
            subtitle: "The efficient compact sedan with hybrid power and low ownership cost.",
            image: `${IMAGE_BASE_URL}/images/search/toyota-camry-2024.png`,
            availableCount: 78,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "fuelEfficiency", label: "Fuel efficiency", value: "53/46 MPG" },
              { key: "capacity", label: "Capacity", value: "5 passengers" },
              { key: "averagePrice", label: "Average price", value: "$24,450" },
              {
                key: "colors",
                label: "Colors",
                options: [
                  {
                    value: "Wind Chill Pearl",
                    label: "Wind Chill Pearl",
                    metadata: { imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2393.svg` },
                  },
                  {
                    value: "Midnight Black",
                    label: "Midnight Black",
                    metadata: { imageUrl: `${IMAGE_BASE_URL}/images/search/Ellipse 2392.svg` },
                  },
                ],
              },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["Corolla Hybrid"] },
              ],
            },
          },
          {
            id: "opt-crown",
            title: "Crown",
            subtitle: "Premium hybrid sedan with bold design and all-wheel drive.",
            image: `${IMAGE_BASE_URL}/images/search/toyota-camry-2024.png`,
            availableCount: 45,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "fuelEfficiency", label: "Fuel efficiency", value: "42/41 MPG" },
              { key: "capacity", label: "Capacity", value: "5 passengers" },
              { key: "averagePrice", label: "Average price", value: "$41,550" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["Crown"] },
              ],
            },
          },
        ],
      },
    },
  },
];

// ─── Truck Inventory Cards (keyword: "truck") ────────────────────────────────

export const AGENT_INVENTORY_TRUCK_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "ToolCall", toolName: "search", toolCallId: "tc-truck-001" },
  { type: "ToolResult", toolCallId: "tc-truck-001", status: "Ok" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are trucks available near you." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary:
          "If you're looking for trucks, the Toyota Tacoma is a mid-size favorite with excellent off-road capability. The Tundra handles full-size duties with a powerful twin-turbo V6. Both offer TRD Pro variants for serious adventure.",
        totalCount: 4,
        results: [
          {
            vin: "3TMDZ5BN8NM126690",
            vehicleId: 83_000_001,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Highlander",
              trim: "XLE",
              bodyStyle: "Truck",
              fuelType: "Hybrid",
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 55_800, listPrice: 52_300 },
            status: { mileage: 3200, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-01.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "5TFBY5F19NX000002",
            vehicleId: 83_000_002,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Tundra",
              trim: "Limited",
              bodyStyle: "Truck",
              fuelType: "Gas",
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 61_400, listPrice: 58_900 },
            status: { mileage: 8400, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-02.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "2T1BURHE8JC039175",
            vehicleId: 83_000_003,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "RAV4 Hybrid",
              trim: "XSE",
              bodyStyle: "SUV",
              fuelType: "Hybrid",
            },
            dealerInfo: { dealerCode: "5015", dealerName: "Peninsula Toyota", zipCode: "94401" },
            pricing: { listPrice: 34_500 },
            status: { mileage: 18_900, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-03.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "5TFBY5F17NX000004",
            vehicleId: 83_000_004,
            vehicleInfo: {
              year: 2023,
              make: "Toyota",
              model: "Tundra",
              trim: "TRD Off-Road",
              bodyStyle: "Truck",
              fuelType: "Gas",
            },
            dealerInfo: { dealerCode: "5018", dealerName: "Marin Toyota", zipCode: "94901" },
            pricing: { listPrice: 51_200 },
            status: { mileage: 22_100, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-04.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [{ key: "bodyStyle", values: ["Truck"] }],
        },
      },
    },
  },
];

// ─── Trucks in Dallas (keyword: "dallas") ─────────────────────────────────────

export const AGENT_INVENTORY_DALLAS_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "ToolCall", toolName: "search", toolCallId: "tc-dallas-001" },
  { type: "ToolResult", toolCallId: "tc-dallas-001", status: "Ok" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are trucks available near Dallas." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary:
          "I found trucks near Dallas, TX. These include a certified Sienna and a Tundra — both great options depending on whether you need hauling power or family versatility.",
        totalCount: 4,
        results: [
          {
            vin: "5TDKZ3DC5PS000001",
            vehicleId: 85_000_001,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Sienna",
              trim: "XSE",
              bodyStyle: "Minivan",
              fuelType: "Hybrid",
            },
            dealerInfo: { dealerCode: "7201", dealerName: "Claremont Toyota", zipCode: "75001" },
            pricing: { msrp: 48_200, listPrice: 45_900 },
            status: { mileage: 6200, vehicleStatus: "In Stock", isCertified: true },
            media: {
              photos: [
                {
                  url: "https://cdnrs.inventoryrsc.com/640x480/535461654_6a5565de5e7cb9e3525facaa.jpg",
                  displayOrder: 1,
                },
              ],
              videos: [],
            },
          },
          {
            vin: "5TFBY5F11PX000002",
            vehicleId: 85_000_002,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Tundra",
              trim: "SR5",
              bodyStyle: "Truck",
              fuelType: "Gas",
            },
            dealerInfo: { dealerCode: "7201", dealerName: "Claremont Toyota", zipCode: "75001" },
            pricing: { msrp: 44_500, listPrice: 42_100 },
            status: { mileage: 11_800, vehicleStatus: "In Stock" },
            media: {
              photos: [
                {
                  url: "https://cdn.inventoryrsc.com/536181448_6a56f84c52559cd94ce9fd7e.jpg",
                  displayOrder: 1,
                },
              ],
              videos: [],
            },
          },
          {
            vin: "3TMCZ5AN7PM000003",
            vehicleId: 85_000_003,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Tacoma",
              trim: "TRD Sport",
              bodyStyle: "Truck",
              fuelType: "Gas",
            },
            dealerInfo: { dealerCode: "7205", dealerName: "Dallas Toyota", zipCode: "75202" },
            pricing: { msrp: 41_800, listPrice: 39_500 },
            status: { mileage: 3400, vehicleStatus: "In Stock" },
            media: {
              photos: [
                {
                  url: "https://cdnrs.inventoryrsc.com/640x480/535461654_6a5565de5e7cb9e3525facaa.jpg",
                  displayOrder: 1,
                },
              ],
              videos: [],
            },
          },
          {
            vin: "5TFBY5F15NX000004",
            vehicleId: 85_000_004,
            vehicleInfo: {
              year: 2023,
              make: "Toyota",
              model: "Tundra",
              trim: "Limited",
              bodyStyle: "Truck",
              fuelType: "Gas",
            },
            dealerInfo: { dealerCode: "7205", dealerName: "Dallas Toyota", zipCode: "75202" },
            pricing: { listPrice: 54_700 },
            status: { mileage: 19_200, vehicleStatus: "In Stock" },
            media: {
              photos: [
                {
                  url: "https://cdn.inventoryrsc.com/536181448_6a56f84c52559cd94ce9fd7e.jpg",
                  displayOrder: 1,
                },
              ],
              videos: [],
            },
          },
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [{ key: "bodyStyle", values: ["Truck"] }],
          location: { zipCode: "75001", latitude: 32.7767, longitude: -96.797 },
        },
      },
    },
  },
];

// ─── Electric Inventory Cards (keyword: "electric") ───────────────────────────

export const AGENT_INVENTORY_ELECTRIC_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "ToolCall", toolName: "search", toolCallId: "tc-ev-001" },
  { type: "ToolResult", toolCallId: "tc-ev-001", status: "Ok" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are electric and plug-in hybrid options." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary:
          "The Toyota bZ4X is a fully electric SUV with up to 252 miles of range. It features all-wheel drive, fast charging capability, and a spacious interior. Solar panels on the roof help extend range in sunny conditions.",
        totalCount: 5,
        results: [
          {
            vin: "JTMAB3FV5PD000001",
            vehicleId: 84_000_001,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "bZ4X",
              trim: "XLE",
              bodyStyle: "SUV",
              fuelType: "Electric",
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 45_400, listPrice: 43_070 },
            status: { mileage: 2800, vehicleStatus: "In Stock" },
            media: {
              photos: [{ url: `${IMAGE_BASE_URL}/images/model/bz.png`, displayOrder: 1 }],
              videos: [],
            },
          },
          {
            vin: "JTMAB3FV7PD000002",
            vehicleId: 84_000_002,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "bZ4X",
              trim: "Limited",
              bodyStyle: "SUV",
              fuelType: "Electric",
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 50_250, listPrice: 48_780 },
            status: { mileage: 5100, vehicleStatus: "In Stock" },
            media: {
              photos: [{ url: `${IMAGE_BASE_URL}/images/model/bz.png`, displayOrder: 1 }],
              videos: [],
            },
          },
          {
            vin: "JTMAB3FV1ND000003",
            vehicleId: 84_000_003,
            vehicleInfo: {
              year: 2023,
              make: "Toyota",
              model: "bZ4X",
              trim: "XLE AWD",
              bodyStyle: "SUV",
              fuelType: "Electric",
            },
            dealerInfo: { dealerCode: "5015", dealerName: "Peninsula Toyota", zipCode: "94401" },
            pricing: { listPrice: 39_900 },
            status: { mileage: 12_400, vehicleStatus: "In Stock", isCertified: true },
            media: {
              photos: [{ url: `${IMAGE_BASE_URL}/images/model/bz.png`, displayOrder: 1 }],
              videos: [],
            },
          },
          {
            vin: "JTDKN3DP5E0000004",
            vehicleId: 84_000_004,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Prius Prime",
              trim: "SE",
              bodyStyle: "Sedan",
              fuelType: "Plug-in Hybrid",
            },
            dealerInfo: { dealerCode: "5015", dealerName: "Peninsula Toyota", zipCode: "94401" },
            pricing: { listPrice: 33_445 },
            status: { mileage: 4600, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/images/search/toyota-camry-2024.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "JTDKN3DP7E0000005",
            vehicleId: 84_000_005,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Prius Prime",
              trim: "XSE",
              bodyStyle: "Sedan",
              fuelType: "Plug-in Hybrid",
            },
            dealerInfo: { dealerCode: "5018", dealerName: "Marin Toyota", zipCode: "94901" },
            pricing: { listPrice: 39_070 },
            status: { mileage: 1800, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/images/search/toyota-camry-2024.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [{ key: "fuelType", values: ["Electric", "Plug-in Hybrid"] }],
        },
      },
    },
  },
];

// ─── Budget Inventory Cards (keyword: "budget") ──────────────────────────────

export const AGENT_INVENTORY_BUDGET_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "ToolCall", toolName: "search", toolCallId: "tc-budget-001" },
  { type: "ToolResult", toolCallId: "tc-budget-001", status: "Ok" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are great options under $30K." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary:
          "Under $30K, the Corolla, Corolla Cross, and RAV4 all deliver strong value. The Corolla starts around $22K with excellent fuel economy. The Corolla Cross adds SUV versatility for about $24K. The RAV4 base model offers AWD near $30K.",
        totalCount: 5,
        results: [
          {
            vin: "2T1BURHE0PC000001",
            vehicleId: 85_000_001,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Corolla",
              trim: "LE",
              bodyStyle: "Sedan",
              fuelType: "Gas",
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 23_400, listPrice: 22_050, originalPrice: 23_400 },
            status: { mileage: 5400, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-01.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "JTDEPRAE5PJ000002",
            vehicleId: 85_000_002,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Corolla Cross",
              trim: "L",
              bodyStyle: "SUV",
              fuelType: "Gas",
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 24_950, listPrice: 23_610, originalPrice: 24_950 },
            status: { mileage: 8200, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-02.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "2T1BURHE2NC000003",
            vehicleId: 85_000_003,
            vehicleInfo: {
              year: 2023,
              make: "Toyota",
              model: "Corolla",
              trim: "Hybrid LE",
              bodyStyle: "Sedan",
              fuelType: "Hybrid",
            },
            dealerInfo: { dealerCode: "5015", dealerName: "Peninsula Toyota", zipCode: "94401" },
            pricing: { listPrice: 24_800 },
            status: { mileage: 14_200, vehicleStatus: "In Stock", isCertified: true },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-03.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "2T3P1RFV9PW000004",
            vehicleId: 85_000_004,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "RAV4",
              trim: "LE",
              bodyStyle: "SUV",
              fuelType: "Gas",
            },
            dealerInfo: { dealerCode: "5018", dealerName: "Marin Toyota", zipCode: "94901" },
            pricing: { listPrice: 29_800 },
            status: { mileage: 9700, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-04.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "JTDEPRAE3NJ000005",
            vehicleId: 85_000_005,
            vehicleInfo: {
              year: 2023,
              make: "Toyota",
              model: "Corolla Cross",
              trim: "LE AWD",
              bodyStyle: "SUV",
              fuelType: "Gas",
            },
            dealerInfo: { dealerCode: "5015", dealerName: "Peninsula Toyota", zipCode: "94401" },
            pricing: { listPrice: 26_500 },
            status: { mileage: 18_300, vehicleStatus: "In Stock", isCertified: true },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-05.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [{ key: "price", values: ["30000"] }],
        },
      },
    },
  },
];

// ─── City Inventory Cards (keyword: "city") ──────────────────────────────────

export const AGENT_INVENTORY_CITY_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "ToolCall", toolName: "search", toolCallId: "tc-city-001" },
  { type: "ToolResult", toolCallId: "tc-city-001", status: "Ok" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are the best options for city driving." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary:
          "For city driving, compact size and fuel efficiency matter most. The Corolla Hybrid gets 53 mpg city and fits easily in tight parking spots. The Prius offers even better efficiency with a slightly larger hatchback profile.",
        totalCount: 4,
        results: [
          {
            vin: "2T1BURHE4PC000001",
            vehicleId: 86_000_001,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Corolla",
              trim: "Hybrid LE",
              bodyStyle: "Sedan",
              fuelType: "Hybrid",
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 26_100, listPrice: 24_800 },
            status: { mileage: 5400, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-01.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "JTDKN3DP9P0000002",
            vehicleId: 86_000_002,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Prius",
              trim: "XLE",
              bodyStyle: "Hatchback",
              fuelType: "Hybrid",
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 34_100, listPrice: 32_350 },
            status: { mileage: 3100, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-02.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "JTDEPRAE1PJ000003",
            vehicleId: 86_000_003,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Corolla Cross",
              trim: "Hybrid S",
              bodyStyle: "SUV",
              fuelType: "Hybrid",
            },
            dealerInfo: { dealerCode: "5015", dealerName: "Peninsula Toyota", zipCode: "94401" },
            pricing: { listPrice: 28_500 },
            status: { mileage: 7800, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-03.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
          {
            vin: "JTDKN3DP1N0000004",
            vehicleId: 86_000_004,
            vehicleInfo: {
              year: 2023,
              make: "Toyota",
              model: "Prius",
              trim: "LE",
              bodyStyle: "Hatchback",
              fuelType: "Hybrid",
            },
            dealerInfo: { dealerCode: "5018", dealerName: "Marin Toyota", zipCode: "94901" },
            pricing: { listPrice: 28_200 },
            status: { mileage: 15_400, vehicleStatus: "In Stock", isCertified: true },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-04.png`, displayOrder: 1 },
              ],
              videos: [],
            },
          },
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [
            { key: "fuelType", values: ["Hybrid"] },
            { key: "bodyStyle", values: ["Sedan", "Hatchback", "SUV"] },
          ],
        },
      },
    },
  },
];

// ─── Low Mileage Inventory Cards (keyword: "low mileage") ────────────────────

export const AGENT_INVENTORY_LOW_MILEAGE_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "ToolCall", toolName: "search", toolCallId: "tc-low-001" },
  { type: "ToolResult", toolCallId: "tc-low-001", status: "Ok" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are low-mileage options near you." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary:
          "Here are the top matches for Highlander Hybrids with the lowest mileage, priced without sacrificing any top rated features so they will be perfect for you and your family.",
        totalCount: 3,
        results: [
          {
            vin: "5TDDZRAH5PS000001",
            vehicleId: 87_000_001,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "Highlander",
              trim: "Hybrid XLE",
              bodyStyle: "SUV",
              fuelType: "Hybrid",
            },
            dealerInfo: { dealerCode: "5012", dealerName: "Bay Area Toyota", zipCode: "94105" },
            pricing: { msrp: 46_900, listPrice: 45_000 },
            status: { mileage: 15_243, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-01.png`, displayOrder: 1 },
              ],
              videos: [],
            },
            surface: "light",
            aiDescription: "Midnight Edition Package",
          } as InventoryCard & { surface?: string; aiDescription?: string },
          {
            vin: "4T1BZ1HK5NU000002",
            vehicleId: 87_000_002,
            vehicleInfo: {
              year: 2023,
              make: "Toyota",
              model: "Camry",
              trim: "SE",
              bodyStyle: "Sedan",
              fuelType: "Gas",
            },
            dealerInfo: { dealerCode: "5015", dealerName: "Peninsula Toyota", zipCode: "94401" },
            pricing: { listPrice: 28_500 },
            status: { mileage: 22_500, vehicleStatus: "In Stock", isCertified: true },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-02.png`, displayOrder: 1 },
              ],
              videos: [],
            },
            surface: "light",
            aiDescription: "The barely-driven. 6K miles",
          } as InventoryCard & { surface?: string; aiDescription?: string },
          {
            vin: "2T3P1RFV3PW000003",
            vehicleId: 87_000_003,
            vehicleInfo: {
              year: 2024,
              make: "Toyota",
              model: "RAV4",
              trim: "Prime",
              bodyStyle: "SUV",
              fuelType: "Plug-in Hybrid",
            },
            dealerInfo: { dealerCode: "5018", dealerName: "Marin Toyota", zipCode: "94901" },
            pricing: { listPrice: 42_000 },
            status: { mileage: 8120, vehicleStatus: "In Stock" },
            media: {
              photos: [
                { url: `${IMAGE_BASE_URL}/inventory-card/inventory-card-03.png`, displayOrder: 1 },
              ],
              videos: [],
            },
            surface: "light",
            aiDescription: "Midnight Edition Package",
          } as InventoryCard & { surface?: string; aiDescription?: string },
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [{ key: "mileage", values: ["25000"] }],
        },
      },
    },
  },
];

// ─── Long Trip Comparison Cards (keyword: "long trip") ────────────────────────

export const AGENT_COMPARISON_LONG_TRIP_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here's how these compare for long road trips." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "ComparisonCards",
        summary:
          "The Highlander Hybrid wins — 615 miles on a single tank means one fewer fuel stop on a long drive. The RAV4 Hybrid is close behind with slightly better highway MPG but a smaller tank. The bZ tops out around 250 miles before needing a charging stop, which adds real time on a road trip.",
        totalCount: 213,
        results: [
          {
            id: "cmp-highlander-trip",
            title: "Highlander Hybrid",
            subtitle:
              "A 3rd row that folds flat means a much bigger trunk when you don't need the seats.",
            image: `${IMAGE_BASE_URL}/images/search/highlander-hybrid-2024.png`,
            availableCount: 124,
            highlights: ["Best for road trips"],
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "range", label: "Range", value: "615 mi" },
              { key: "highwayMpg", label: "Highway MPG", value: "35" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["Highlander Hybrid"] },
              ],
            },
          },
          {
            id: "cmp-rav4-trip",
            title: "RAV4 Hybrid",
            subtitle: "Plenty for groceries, strollers, and weekend trips.",
            image: `${IMAGE_BASE_URL}/images/search/rav4-hybrid-2024.png`,
            availableCount: 186,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "range", label: "Range", value: "580 mi" },
              { key: "highwayMpg", label: "Highway MPG", value: "38" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["RAV4 Hybrid"] },
              ],
            },
          },
          {
            id: "cmp-bz-trip",
            title: "bZ4X",
            subtitle: "The battery pack takes up most of the trunk depth.",
            image: `${IMAGE_BASE_URL}/images/search/bz-2024.png`,
            availableCount: 54,
            attributes: [
              { key: "year", label: "Year", value: "2024" },
              { key: "range", label: "Range", value: "250 mi" },
              { key: "chargingTime", label: "Charging time", value: "30 min (80%)" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "make", values: ["Toyota"] },
                { key: "model", values: ["bZ4X"] },
              ],
            },
          },
        ],
      },
    },
  },
];

// ─── No-Matching / Editorial Fallback (keyword: "no-matching", "no matching") ─

export const AGENT_OPTION_NO_MATCHING_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "ToolCall", toolName: "search", toolCallId: "tc-nomatch-001" },
  { type: "ToolResult", toolCallId: "tc-nomatch-001", status: "Ok" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "No exact match, but here are some alternatives." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary:
          "There are currently no black 2025 Highlanders that are a perfect match, but we have identified a few options below that you may be interested in.\n\nIf none of these are quite right, we can alert you when one becomes available.",
        totalCount: 4,
        optionLevel: "Fallback",
        results: [
          {
            id: "nomatch-close",
            title: "2025 Highlander XLE",
            subtitle: "Midnight black metallic — close match",
            image: `${IMAGE_BASE_URL}/editorial-card/search-editorial.png`,
            availableCount: 1,
            attributes: [
              {
                key: "href",
                label: "Link",
                value: "/search?model=highlander&year=2025&color=midnight-black",
              },
              { key: "iconName", label: "Icon", value: "binocular" },
              { key: "matches", label: "Matches", value: "1" },
              { key: "surface", label: "Surface", value: "dark" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "model", values: ["Highlander"] },
                { key: "year", values: ["2025"] },
              ],
            },
          },
          {
            id: "nomatch-similar",
            title: "2025 Highlander Hybrid XSE",
            subtitle: "Black — similar model",
            image: `${IMAGE_BASE_URL}/editorial-card/search-editorial1.png`,
            availableCount: 1,
            attributes: [
              {
                key: "href",
                label: "Link",
                value: "/search?model=highlander-hybrid&year=2025&color=black",
              },
              { key: "matches", label: "Matches", value: "1" },
              { key: "surface", label: "Surface", value: "dark" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "model", values: ["Highlander Hybrid"] },
                { key: "year", values: ["2025"] },
              ],
            },
          },
          {
            id: "nomatch-nearby",
            title: "2024 Highlander Limited",
            subtitle: "Black, low mileage — nearby inventory",
            image: `${IMAGE_BASE_URL}/editorial-card/search-editorial.png`,
            availableCount: 1,
            attributes: [
              {
                key: "href",
                label: "Link",
                value: "/search?model=highlander&year=2024&color=black&mileage=low",
              },
              { key: "iconName", label: "Icon", value: "location" },
              { key: "matches", label: "Matches", value: "1" },
              { key: "surface", label: "Surface", value: "dark" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "model", values: ["Highlander"] },
                { key: "year", values: ["2024"] },
              ],
            },
          },
          {
            id: "nomatch-alternative",
            title: "2025 Sequoia",
            subtitle: "Spacious, available in black — explore alternatives",
            image: `${IMAGE_BASE_URL}/editorial-card/search-editorial1.png`,
            availableCount: 1,
            attributes: [
              { key: "href", label: "Link", value: "/search?model=sequoia&year=2025&color=black" },
              { key: "matches", label: "Matches", value: "1" },
              { key: "surface", label: "Surface", value: "dark" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [
                { key: "model", values: ["Sequoia"] },
                { key: "year", values: ["2025"] },
              ],
            },
          },
        ],
      },
    },
  },
];

// ─── Long Text Inventory (keyword: "long text") ──────────────────────────────
// Demonstrates scrolling behavior with an intentionally long summary.

export const AGENT_INVENTORY_LONG_TEXT_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Executing" },
  { type: "ToolCall", toolName: "search", toolCallId: "tc-long-001" },
  { type: "ToolResult", toolCallId: "tc-long-001", status: "Ok" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  {
    type: "Delta",
    text: "Only the Highlander has a third row of seating.",
  },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Inventory",
      response: {
        responseMode: "InventoryCards",
        summary:
          "Only the Highlander has a third row of seating. It\u2019s roomy without feeling oversized, which makes it ideal for getting around Brooklyn.\n\nThe third row folds flat when you don\u2019t need it, so you\u2019re not sacrificing cargo space on the days it\u2019s just you running errands. When you do need it, it seats two comfortably and is easy enough to access that you won\u2019t have to coax anyone into climbing back there.\n\nIt\u2019s the kind of flexibility that makes the Highlander work as both an everyday car and a vehicle that\u2019s ready when you need to haul the whole crew.\n\nOur best option for the combination of fuel efficiency and cargo space is the Hybrid model. Would you like to narrow your results to the Highlander Hybrid?",
        totalCount: 4,
        results: [
          makeHighlanderCard("5TDHBRFH2PS012345", 0, "XLE", 45_990, 4500),
          makeHighlanderCard("5TDHBRFH4PS023456", 1, "Limited", 49_500, 2100),
          makeHighlanderCard("5TDHBRFH6NS034567", 2, "LE", 39_900, 13_200),
          makeHighlanderCard("5TDHBRFH8PS045678", 3, "Platinum", 53_200, 980),
        ],
        nextSearchPlan: {
          searchId: SEARCH_ID,
          filters: [
            { key: "make", values: ["Toyota"] },
            { key: "model", values: ["Highlander"] },
          ],
        },
      },
    },
  },
];

/** Representative entry-state response sample */
export const SEARCH_SUGGESTIONS_ENTRY_FIXTURE: SearchSuggestionsResponse = {
  section: {
    ariaLabel: "Suggestions to get started",
    headline: "Suggestions to get started",
  },
  suggestions: [
    {
      id: "entry-trending-nearby",
      title: "Our most popular models in Brooklyn",
      subtitle: "Near you  •  11201",
      image: {
        alt: "Our most popular models in Brooklyn",
        src: `${IMAGE_BASE_URL}/editorial-card/carousel2.png`,
      },
      action: {
        id: "seed-entry-trending-nearby",
        type: "seed-search",
        label: "Explore trending vehicles",
        value: "popular models in Brooklyn",
        href: "/search?q=popular+models+in+Brooklyn",
      },
      metadata: {
        category: "trending",
        locationLabel: "Brooklyn, NY",
      },
    },
    {
      id: "entry-family-suv",
      title: "Family friendly SUVs with top rated safety",
      subtitle: "Ample cargo space that flexes to all your different needs",
      image: {
        alt: "Family friendly SUVs with top rated safety",
        src: `${IMAGE_BASE_URL}/editorial-card/carousel1.png`,
      },
      action: {
        id: "seed-entry-family-suv",
        type: "seed-search",
        label: "See family SUVs",
        value: "family friendly SUV",
        href: "/search?q=family+friendly+SUV",
      },
      metadata: {
        category: "family",
      },
    },
    {
      id: "entry-budget-city",
      title: "Fuel efficient hybrids and EVs",
      subtitle: "Maximize your savings with a hybrid or electric vehicle",
      image: {
        alt: "Fuel efficient hybrids and EVs",
        src: `${IMAGE_BASE_URL}/search/search-promotional-card3.png`,
      },
      action: {
        id: "seed-entry-budget-city",
        type: "seed-search",
        label: "Browse budget options",
        value: "fuel efficient hybrids and EVs",
        href: "/search?q=fuel+efficient+hybrids+and+EVs",
      },
      metadata: {
        category: "budget",
      },
    },
  ],
};

/** Raw upstream response shape for entry state. Used by mapper tests and upstream integration tests. */
export const SEARCH_SUGGESTIONS_UPSTREAM_ENTRY_FIXTURE: SearchSuggestionsUpstreamResponse = {
  section: {
    ariaLabel: "Suggestions to get started",
    headline: "Suggestions to get started",
  },
  suggestions: [
    {
      id: "entry-trending-nearby",
      title: "Our most popular models in Brooklyn",
      subtitle: "Trending near you",
      image: {
        alt: "Our most popular models in Brooklyn",
        src: "/editorial-card/carousel2.png",
      },
      action: {
        id: "seed-entry-trending-nearby",
        type: "seed-search",
        label: "Explore trending vehicles",
        value: "popular models in Brooklyn",
        href: "/search?q=popular+models+in+Brooklyn",
      },
      metadata: {
        category: "trending",
        locationLabel: "Brooklyn, NY",
      },
    },
    {
      id: "entry-family-suv",
      title: "Family-friendly SUVs with top-rated safety",
      subtitle: "Roomy and practical for everyday driving",
      image: {
        alt: "Family-friendly SUVs with top-rated safety",
        src: "/editorial-card/carousel1.png",
      },
      action: {
        id: "seed-entry-family-suv",
        type: "seed-search",
        label: "See family SUVs",
        value: "family-friendly SUV",
        href: "/search?q=family-friendly+SUV",
      },
      metadata: {
        category: "family",
      },
    },
    {
      id: "entry-budget-city",
      title: "Fuel-efficient options under $30,000",
      subtitle: "Great for city driving and weekend trips",
      action: {
        id: "seed-entry-budget-city",
        type: "seed-search",
        label: "Browse budget options",
        value: "fuel efficient suv under 30000",
        href: "/search?q=fuel+efficient+suv+under+30000",
      },
      metadata: {
        category: "budget",
      },
    },
  ],
};

// ─── Spec card demo fixtures (1–4 specs) ──────────────────────────────────────

export const AGENT_SPEC_1_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here's the cargo comparison you asked about." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary: "Here's the cargo comparison you asked about.",
        totalCount: 3,
        optionLevel: "Category",
        results: [
          {
            id: "spec1-highlander",
            title: "HIGHLANDER HYBRID",
            subtitle:
              "A 3rd row that folds flat means a much bigger trunk when you don't need the seats.",
            image: `${IMAGE_BASE_URL}/images/search/highlander-hybrid-2024.png`,
            availableCount: 98,
            attributes: [{ key: "maxCargo", label: "Max cargo", value: "84.3" }],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "model", values: ["Highlander Hybrid"] }],
            },
          },
          {
            id: "spec1-rav4",
            title: "RAV4 HYBRID",
            subtitle: "Plenty for groceries, strollers, and weekend trips.",
            image: `${IMAGE_BASE_URL}/images/model/rav4_hybrid.png`,
            availableCount: 124,
            attributes: [{ key: "maxCargo", label: "Max cargo", value: "69.8" }],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "model", values: ["RAV4 Hybrid"] }],
            },
          },
          {
            id: "spec1-bz",
            title: "BZ",
            subtitle: "The battery pack takes up most of the trunk depth.",
            image: `${IMAGE_BASE_URL}/images/search/bz-2024.png`,
            availableCount: 67,
            attributes: [{ key: "maxCargo", label: "Max cargo", value: "27.7" }],
            nextSearchPlan: { searchId: SEARCH_ID, filters: [{ key: "model", values: ["bZ4X"] }] },
          },
        ],
      },
    },
  },
];

export const AGENT_SPEC_2_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here's the range and highway efficiency comparison." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary: "Here's the range and highway efficiency comparison.",
        totalCount: 3,
        optionLevel: "Category",
        results: [
          {
            id: "spec2-highlander",
            title: "HIGHLANDER HYBRID",
            subtitle:
              "Goes the farthest on a single tank, plus space for 7 passengers and their luggage.",
            image: `${IMAGE_BASE_URL}/images/search/highlander-hybrid-2024.png`,
            availableCount: 98,
            attributes: [
              { key: "range", label: "Range", value: "615" },
              { key: "highwayMpg", label: "Highway MPG", value: "35" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "model", values: ["Highlander Hybrid"] }],
            },
          },
          {
            id: "spec2-rav4",
            title: "RAV4 HYBRID",
            subtitle: "Slightly shorter range, but the best highway MPG of the three.",
            image: `${IMAGE_BASE_URL}/images/model/rav4_hybrid.png`,
            availableCount: 124,
            attributes: [
              { key: "range", label: "Range", value: "580" },
              { key: "highwayMpg", label: "Highway MPG", value: "35" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "model", values: ["RAV4 Hybrid"] }],
            },
          },
          {
            id: "spec2-bz",
            title: "BZ",
            subtitle:
              "Range works for daily driving but means real charging stops on longer trips.",
            image: `${IMAGE_BASE_URL}/images/search/bz-2024.png`,
            availableCount: 67,
            attributes: [
              { key: "range", label: "Range", value: "252" },
              { key: "highwayMpge", label: "Highway MPGe", value: "94" },
            ],
            nextSearchPlan: { searchId: SEARCH_ID, filters: [{ key: "model", values: ["bZ4X"] }] },
          },
        ],
      },
    },
  },
];

export const AGENT_SPEC_3_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here are the key specs for our top picks." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary: "Here are the key specs for our top picks.",
        totalCount: 3,
        optionLevel: "Segment",
        results: [
          {
            id: "spec3-rav4",
            title: "TOYOTA RAV4 HYBRID",
            subtitle:
              "Best on gas for city driving and the easiest to whip into a tight spot if you ever do have to street park.",
            image: `${IMAGE_BASE_URL}/images/model/rav4_hybrid.png`,
            availableCount: 124,
            attributes: [
              { key: "mpg", label: "City / Hwy MPG", value: "41 / 38" },
              { key: "capacity", label: "Capacity", value: "5 passengers" },
              { key: "averagePrice", label: "Average price", value: "$28K avg" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "model", values: ["RAV4 Hybrid"] }],
            },
          },
          {
            id: "spec3-highlander",
            title: "TOYOTA HIGHLANDER HYBRID",
            subtitle: "Great for small families that need a little more space.",
            image: `${IMAGE_BASE_URL}/images/search/highlander-hybrid-2024.png`,
            availableCount: 98,
            attributes: [
              { key: "mpg", label: "City / Hwy MPG", value: "35 / 34" },
              { key: "capacity", label: "Capacity", value: "7 passengers" },
              { key: "averagePrice", label: "Average price", value: "$31K avg" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "model", values: ["Highlander Hybrid"] }],
            },
          },
          {
            id: "spec3-bz",
            title: "TOYOTA BZ",
            subtitle:
              "A cost saving, fully electric option — a great option for stop-and-go driving around the city.",
            image: `${IMAGE_BASE_URL}/images/search/bz-2024.png`,
            availableCount: 67,
            attributes: [
              { key: "mpg", label: "City / Hwy MPGe", value: "131 MPGe / 107 MPGe" },
              { key: "capacity", label: "Capacity", value: "5 passengers" },
              { key: "averagePrice", label: "Average price", value: "$24K avg" },
            ],
            nextSearchPlan: { searchId: SEARCH_ID, filters: [{ key: "model", values: ["bZ4X"] }] },
          },
        ],
      },
    },
  },
];

export const AGENT_SPEC_4_STREAM_FIXTURE: MockAgentEvent[] = [
  { type: "Status", searchId: SEARCH_ID, stage: "Planning" },
  { type: "Status", searchId: SEARCH_ID, stage: "Summarizing" },
  { type: "Delta", text: "Here's the full breakdown of our top models." },
  {
    type: "Complete",
    payload: {
      searchId: SEARCH_ID,
      searchMode: "Exploration",
      response: {
        responseMode: "OptionCards",
        summary: "Here's the full breakdown of our top models.",
        totalCount: 3,
        optionLevel: "Package",
        results: [
          {
            id: "spec4-rav4",
            title: "TOYOTA RAV4 HYBRID",
            subtitle:
              "Best on gas for city driving and the easiest to whip into a tight spot if you ever do have to street park.",
            image: `${IMAGE_BASE_URL}/images/model/rav4_hybrid.png`,
            availableCount: 124,
            attributes: [
              { key: "mpg", label: "City / Hwy MPG", value: "41 / 38" },
              { key: "color", label: "Colors", value: "Gray,Red,White,Blue" },
              { key: "capacity", label: "Capacity", value: "5 passengers" },
              { key: "averagePrice", label: "Average price", value: "$28K avg" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "model", values: ["RAV4 Hybrid"] }],
            },
          },
          {
            id: "spec4-highlander",
            title: "TOYOTA HIGHLANDER HYBRID",
            subtitle: "Great for small families that need a little more space.",
            image: `${IMAGE_BASE_URL}/images/search/highlander-hybrid-2024.png`,
            availableCount: 98,
            attributes: [
              { key: "mpg", label: "City / Hwy MPG", value: "35 / 34" },
              { key: "color", label: "Colors", value: "Gray,Red,White,Blue" },
              { key: "capacity", label: "Capacity", value: "7 passengers" },
              { key: "averagePrice", label: "Average price", value: "$31K avg" },
            ],
            nextSearchPlan: {
              searchId: SEARCH_ID,
              filters: [{ key: "model", values: ["Highlander Hybrid"] }],
            },
          },
          {
            id: "spec4-bz",
            title: "TOYOTA BZ",
            subtitle:
              "A cost saving, fully electric option — a great option for stop-and-go driving around the city.",
            image: `${IMAGE_BASE_URL}/images/search/bz-2024.png`,
            availableCount: 67,
            attributes: [
              { key: "mpg", label: "City / Hwy MPGe", value: "131 MPGe / 107 MPGe" },
              { key: "color", label: "Colors", value: "Gray,Red,White,Blue" },
              { key: "capacity", label: "Capacity", value: "5 passengers" },
              { key: "averagePrice", label: "Average price", value: "$24K avg" },
            ],
            nextSearchPlan: { searchId: SEARCH_ID, filters: [{ key: "model", values: ["bZ4X"] }] },
          },
        ],
      },
    },
  },
];

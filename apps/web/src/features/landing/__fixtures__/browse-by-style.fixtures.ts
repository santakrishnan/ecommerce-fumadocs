import type {
  BrowseByStyleSuccessResponse,
  BrowseByStyleValidationErrorResponse,
} from "~/features/landing/contracts/browse-by-style.schema";

export const BROWSE_BY_STYLE_SUCCESS_RESPONSE: BrowseByStyleSuccessResponse = {
  title: "BROWSE BY STYLE",
  subtitle: "Get started with what matters most to you",
  items: [
    {
      id: "style-cars-minivans",
      cardType: "style-category",
      categoryKey: "car",
      title: "CARS & MINIVANS",
      description:
        "Designed for everyday driving with the comfort, efficiency, and style you want.",
      image: {
        src: "/images/categories/sedan.png",
        alt: "Toyota sedan side view",
      },
      cta: {
        label: "Shop CARS & MINIVANS",
      },
      action: {
        id: "action-cars-minivans",
        type: "navigate-to-search",
        target: "/search",
        seed: {
          categoryKey: "car",
          label: "CARS & MINIVANS",
        },
      },
    },
    {
      id: "style-trucks",
      cardType: "style-category",
      categoryKey: "truck",
      title: "TRUCKS",
      description: "Ready for hard work with the strength and capability to handle more.",
      image: {
        src: "/images/categories/truck.png",
        alt: "Toyota truck side view",
      },
      cta: {
        label: "Shop TRUCKS",
      },
      action: {
        id: "action-trucks",
        type: "navigate-to-search",
        target: "/search",
        seed: {
          categoryKey: "truck",
          label: "TRUCKS",
        },
      },
    },
    {
      id: "style-crossovers-suvs",
      cardType: "style-category",
      categoryKey: "suv",
      title: "CROSSOVERS & SUVs",
      description:
        "Built for space and versatility with room for people, gear, and everything in between.",
      image: {
        src: "/images/categories/suv.png",
        alt: "Toyota SUV side view",
      },
      cta: {
        label: "Shop CROSSOVERS & SUVs",
      },
      action: {
        id: "action-crossovers-suvs",
        type: "navigate-to-search",
        target: "/search",
        seed: {
          categoryKey: "suv",
          label: "CROSSOVERS & SUVs",
        },
      },
    },
    {
      id: "style-electric",
      cardType: "style-category",
      categoryKey: "electric",
      title: "ELECTRIC",
      description:
        "Designed for everyday driving with the comfort, efficiency, and style you want.",
      image: {
        src: "/images/categories/electric.png",
        alt: "Toyota electric vehicle side view",
      },
      cta: {
        label: "Shop ELECTRIC",
      },
      action: {
        id: "action-electric",
        type: "navigate-to-search",
        target: "/search",
        seed: {
          categoryKey: "electric",
          label: "ELECTRIC",
        },
      },
    },
  ],
  meta: {
    source: "static",
  },
};

export const BROWSE_BY_STYLE_EMPTY_RESPONSE: BrowseByStyleSuccessResponse = {
  title: "BROWSE BY STYLE",
  subtitle: "Get started with what matters most to you",
  items: [],
  meta: {
    source: "static",
  },
};

export const BROWSE_BY_STYLE_VALIDATION_ERROR_RESPONSE: BrowseByStyleValidationErrorResponse = {
  error: {
    code: "BROWSE_BY_STYLE_VALIDATION_FAILED",
    message: "Browse by style payload did not match contract.",
    details: {
      source: "getBrowseByStyleResponse",
    },
  },
};

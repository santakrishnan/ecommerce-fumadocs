import type { ModelCardContentProps } from "@shared/components/model-card";

/** Mock model card data for the conversational search results. */
export const MOCK_MODEL_CARDS: ModelCardContentProps[] = [
  {
    carImage: "/images/search/toyota-camry-2024.png",
    title: "Camry",
    year: 2024,
    averagePrice: "$28,855",
    capacity: "5 Passengers",
    colors: [
      { label: "Midnight Black Metallic", svgSrc: "/images/search/Ellipse 2392.svg" },
      { label: "Wind Chill Pearl", svgSrc: "/images/search/Ellipse 2393.svg" },
      { label: "Supersonic Red", svgSrc: "/images/search/Ellipse 2394.svg" },
      { label: "Celestial Silver Metallic", svgSrc: "/images/search/Ellipse 2395.svg" },
    ],
    description:
      "A refined midsize sedan with impressive fuel economy, advanced safety features, and a comfortable ride.",
    fuelEfficiency: "28/39 MPG",
  },
  {
    carImage: "/images/search/rav4-2024.png",
    title: "RAV4",
    year: 2024,
    averagePrice: "$30,325",
    capacity: "5 Passengers",
    colors: [
      { label: "Blueprint", svgSrc: "/images/search/Ellipse 2392.svg" },
      { label: "Ice Cap", svgSrc: "/images/search/Ellipse 2393.svg" },
      { label: "Lunar Rock", svgSrc: "/images/search/Ellipse 2394.svg" },
    ],
    description:
      "A versatile compact SUV with available all-wheel drive, generous cargo space, and rugged capability.",
    fuelEfficiency: "27/35 MPG",
  },
  {
    carImage: "/images/search/corolla-2024.png",
    title: "Corolla",
    year: 2024,
    capacity: "5 Passengers",
    description: "An efficient and reliable compact sedan that's perfect for everyday driving.",
    fuelEfficiency: "32/41 MPG",
  },
];

import type { ModelCardContentProps } from "@shared/components/model-card";

export const modelCardFullFixture: ModelCardContentProps = {
  carImage: "/mock/vehicles/highlander.png",
  title: "Highlander",
  year: 2024,
  averagePrice: "$38,000",
  capacity: "8 passengers",
  colors: [
    { label: "Midnight Black", svgSrc: "/mock/colors/midnight-black.svg" },
    { label: "Wind Chill Pearl", svgSrc: "/mock/colors/wind-chill-pearl.svg" },
    { label: "Blueprint", svgSrc: "/mock/colors/blueprint.svg" },
  ],
  description: "A mid-size SUV with three rows and premium comfort.",
  fuelEfficiency: "31 MPG combined",
};

export const modelCardMinimalFixture: ModelCardContentProps = {
  carImage: "/mock/vehicles/camry.png",
  title: "Camry",
  year: 2025,
};

export const modelCardPartialFixture: ModelCardContentProps = {
  carImage: "/mock/vehicles/rav4.png",
  title: "RAV4",
  year: 2023,
  fuelEfficiency: "33 MPG combined",
  capacity: "5 passengers",
};

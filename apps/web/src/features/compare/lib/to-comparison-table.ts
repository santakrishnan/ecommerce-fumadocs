import type { Vehicle } from "@shared/components/inventory-card";
import { formatPrice } from "utils";
import type { CompareVehicle, ComparisonAttribute, ComparisonVehicle } from "../types";

function toComparisonVehicles(vehicles: CompareVehicle[]): ComparisonVehicle[] {
  return vehicles.map((vehicle) => ({
    id: vehicle.vin,
    name: `${vehicle.make} ${vehicle.model} ${vehicle.trim}`,
  }));
}

function toPriceAndValueAttributes(vehicles: CompareVehicle[]): ComparisonAttribute[] {
  return [
    {
      id: "selling-price",
      cells: vehicles.map((vehicle) => ({
        label: "Selling price",
        value: formatPrice(vehicle.pricing.sellingPrice),
      })),
    },
    {
      id: "monthly-payment",
      cells: vehicles.map((vehicle) => ({
        label: "Monthly payment (est.)",
        value: `${formatPrice(vehicle.pricing.monthlyPaymentEstimate)} / mo`,
      })),
    },
    {
      id: "price-tag",
      cells: vehicles.map((vehicle) => ({
        label: "Price Tag",
        value: vehicle.pricing.priceTag,
      })),
    },
    {
      id: "annual-fuel-cost",
      cells: vehicles.map((vehicle) => ({
        label: "Est. annual fuel cost",
        value: formatPrice(vehicle.pricing.annualFuelCostEstimate),
      })),
    },
    {
      id: "net-cost",
      cells: vehicles.map((vehicle) => ({
        label: "Net cost out-of-pocket*",
        value: formatPrice(vehicle.pricing.netCostOutOfPocket),
      })),
    },
  ];
}

function toPerformanceAttributes(vehicles: CompareVehicle[]): ComparisonAttribute[] {
  return [
    {
      id: "drivetrain",
      cells: vehicles.map((vehicle) => ({
        label: "Drivetrain",
        value: vehicle.performance.drivetrain,
      })),
    },
    {
      id: "fuel-economy",
      cells: vehicles.map((vehicle) => ({
        label: "Fuel economy",
        value: `${vehicle.performance.fuelEconomyMpg} mpg`,
      })),
    },
    {
      id: "horsepower",
      cells: vehicles.map((vehicle) => ({
        label: "Horsepower",
        value: `${vehicle.performance.horsepower} hp`,
      })),
    },
    {
      id: "towing-capacity",
      cells: vehicles.map((vehicle) => ({
        label: "Towing capacity",
        value: vehicle.performance.towingCapacityLb
          ? `${vehicle.performance.towingCapacityLb} lb`
          : "Not available",
      })),
    },
  ];
}

function toInteriorAndComfortAttributes(vehicles: CompareVehicle[]): ComparisonAttribute[] {
  return [
    {
      id: "seating-capacity",
      cells: vehicles.map((vehicle) => ({
        label: "Seating capacity",
        value: vehicle.interior.seatingCapacity.toString(),
      })),
    },
    {
      id: "cargo-volume",
      cells: vehicles.map((vehicle) => ({
        label: "Cargo volume",
        value: vehicle.interior.cargoVolumeCuFt
          ? `${vehicle.interior.cargoVolumeCuFt} cu ft`
          : "Not available",
      })),
    },
    {
      id: "key-equipment",
      cells: vehicles.map((vehicle) => ({
        label: "Key equipment",
        value: vehicle.interior.keyEquipment || "Not available",
      })),
    },
  ];
}

function toSafetyAttributes(vehicles: CompareVehicle[]): ComparisonAttribute[] {
  return [
    {
      id: "nhtsa-overall-stars",
      cells: vehicles.map((vehicle) => ({
        label: "NHTSA Overall Stars",
        value: vehicle.safety.nhtsaOverallStars.toString(),
      })),
    },
    {
      id: "iihs-rating",
      cells: vehicles.map((vehicle) => ({
        label: "IIHS Rating",
        value: vehicle.safety.iihsRating,
      })),
    },
    {
      id: "driver-assistance",
      cells: vehicles.map((vehicle) => ({
        label: "Driver Assistance",
        value: vehicle.safety.driverAssistance || "Not available",
      })),
    },
  ];
}

function toHistoryAndConditionAttributes(vehicles: CompareVehicle[]): ComparisonAttribute[] {
  return [
    {
      id: "accident-history",
      cells: vehicles.map((vehicle) => ({
        label: "Accident History",
        value: vehicle.history.accidentHistory,
      })),
    },
    {
      id: "owner-count",
      cells: vehicles.map((vehicle) => ({
        label: "Owner Count",
        value: vehicle.history.ownerCount.toString(),
      })),
    },
    {
      id: "certification",
      cells: vehicles.map((vehicle) => ({
        label: "Certification",
        value: vehicle.history.certification,
      })),
    },
    {
      id: "days-on-lot",
      cells: vehicles.map((vehicle) => ({
        label: "Days on Lot",
        value: vehicle.history.daysOnLot.toString(),
      })),
    },
  ];
}

/** Map CompareVehicle to the flat Vehicle shape used by VehicleSelector. */
function toSelectorVehicle(v: CompareVehicle): Vehicle {
  return {
    id: v.vin,
    make: v.make,
    model: v.model,
    trim: v.trim,
    year: v.year,
    mileage: v.mileage,
    price: v.pricing.sellingPrice,
    imageUrl: v.imageUrl,
  };
}

export {
  toComparisonVehicles,
  toHistoryAndConditionAttributes,
  toInteriorAndComfortAttributes,
  toPerformanceAttributes,
  toPriceAndValueAttributes,
  toSafetyAttributes,
  toSelectorVehicle,
};

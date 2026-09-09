import { IMAGE_BASE_URL } from "@config/images";
import type {
  NewTodaySuccessResponse,
  NewTodayValidationErrorResponse,
} from "@features/landing/data/schemas";

export const NEW_TODAY_SUCCESS_RESPONSE: NewTodaySuccessResponse = {
  vehicles: [
    {
      VehicleInfo: {
        VehicleID: 174_021_857,
        Year: 2024,
        Make: "Toyota",
        Model: "Highlander",
        Trim: "Hybrid XLE",
        Mileage: 15_243,
        VDPLink:
          "https://www.toyotaofhb.com/viewdetails/used/3tmdz5bn8nm126690/2024-toyota-highlander-hybrid-xle",
        Vin: "3TMDZ5BN8NM126690",
        Surface: "dark",
      },
      ListOfPhotos: [
        {
          VehiclePhotoID: "69df7c2ff82ca0a181f18d70",
          PhotoUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card1.png`,
          Order: 1,
          PhotoTimestamp: "2026-04-15T07:53:22.212-04:00",
        },
      ],
      Pricing: {
        Cost: 40_715,
        List: 45_000,
        Special: 40_715,
        ExtraPrice1: 0,
        ExtraPrice2: 0,
        ExtraPrice3: 0,
      },
    },
    {
      VehicleInfo: {
        VehicleID: 131_123_092,
        Year: 2023,
        Make: "Toyota",
        Model: "Camry",
        Trim: "SE",
        Mileage: 22_500,
        VDPLink: null,
        Vin: "2T1BURHE0JC048817",
        Surface: "light",
      },
      ListOfPhotos: [
        {
          VehiclePhotoID: "609cdcdcac89c928f0a0a6d5",
          PhotoUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card2.png`,
          Order: 1,
          PhotoTimestamp: "2021-05-12T18:57:34-04:00",
        },
      ],
      Pricing: {
        Cost: 0,
        List: 28_500,
        Special: 28_500,
        ExtraPrice1: 0,
        ExtraPrice2: 0,
        ExtraPrice3: 0,
      },
    },
    {
      VehicleInfo: {
        VehicleID: 513_174_383,
        Year: 2024,
        Make: "Toyota",
        Model: "RAV4",
        Trim: "Prime",
        Mileage: 8120,
        VDPLink: null,
        Vin: "JTMRJREV5HD107836",
        Surface: "light",
      },
      ListOfPhotos: [
        {
          VehiclePhotoID: "69f2db96522e7b0f8da023a2",
          PhotoUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card3.png`,
          Order: 1,
          PhotoTimestamp: "2026-04-29T10:43:53-04:00",
        },
      ],
      Pricing: {
        Cost: 38_000,
        List: 42_000,
        Special: 0,
        ExtraPrice1: 0,
        ExtraPrice2: 0,
        ExtraPrice3: 0,
      },
    },
    {
      VehicleInfo: {
        VehicleID: 459_246_392,
        Year: 2023,
        Make: "Toyota",
        Model: "Highlander",
        Trim: "Limited",
        Mileage: 36_435,
        VDPLink: null,
        Vin: "5TDYZ3DC3PS058712",
        Surface: "dark",
      },
      ListOfPhotos: [
        {
          VehiclePhotoID: "69b8ba05bf4b0c43c6c7722c",
          PhotoUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card7.png`,
          Order: 1,
          PhotoTimestamp: "2026-03-16T16:21:48-04:00",
        },
      ],
      Pricing: {
        Cost: 27_000,
        List: 29_245,
        Special: 29_245,
        ExtraPrice1: 0,
        ExtraPrice2: 0,
        ExtraPrice3: 0,
      },
    },
    {
      VehicleInfo: {
        VehicleID: 513_174_384,
        Year: 2023,
        Make: "Toyota",
        Model: "Land Cruiser",
        Trim: null,
        Mileage: 36_435,
        VDPLink: null,
        Vin: "JTEBR3FJ5PK012345",
        Surface: "light",
      },
      ListOfPhotos: [
        {
          VehiclePhotoID: "69f2db96522e7b0f8da023a3",
          PhotoUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card5.png`,
          Order: 1,
          PhotoTimestamp: "2026-04-29T10:43:53-04:00",
        },
      ],
      Pricing: {
        Cost: 27_000,
        List: 29_245,
        Special: 0,
        ExtraPrice1: 0,
        ExtraPrice2: 0,
        ExtraPrice3: 0,
      },
    },
    {
      VehicleInfo: {
        VehicleID: 174_021_858,
        Year: 2023,
        Make: "Toyota",
        Model: "bZ Limited",
        Trim: null,
        Mileage: 36_435,
        VDPLink: null,
        Vin: "JTDKN3DU5A0789012",
        Surface: "light",
      },
      ListOfPhotos: [
        {
          VehiclePhotoID: "69df7c2ff82ca0a181f18d71",
          PhotoUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card6.png`,
          Order: 1,
          PhotoTimestamp: "2026-04-15T07:53:22.212-04:00",
        },
      ],
      Pricing: {
        Cost: 27_000,
        List: 29_245,
        Special: 29_245,
        ExtraPrice1: 0,
        ExtraPrice2: 0,
        ExtraPrice3: 0,
      },
    },
  ],
};

export const NEW_TODAY_EMPTY_RESPONSE: NewTodaySuccessResponse = {
  vehicles: [],
};

export const NEW_TODAY_VALIDATION_ERROR_RESPONSE: NewTodayValidationErrorResponse = {
  error: {
    code: "UPSTREAM_SCHEMA_VALIDATION_FAILED",
    message: "New Today payload did not match contract.",
    details: {
      endpoint: "/api/v1/recommendations/today",
    },
  },
};

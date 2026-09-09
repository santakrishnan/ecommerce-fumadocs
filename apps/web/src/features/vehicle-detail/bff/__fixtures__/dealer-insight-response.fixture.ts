import type { DealerInsightResponse } from "../contracts/dealer-insight-response.schema";

// ─── Dealer Insight Modal Fixtures ───────────────────────────────────────────

/** Primary fixture: Toyota of Bay Ridge — full data, matches Figma handoff. */
export const DEALER_INSIGHT_DEFAULT_FIXTURE: DealerInsightResponse = {
  dealer: {
    dealerCode: "5012",
    dealerName: "Toyota of Bay Ridge",
    city: "Brooklyn",
    state: "NY",
    zipCode: "11220",
    latitude: 40.6386,
    longitude: -74.0259,
    rating: {
      value: 4.2,
      maxValue: 5,
      reviewCount: 2140,
      reviewSource: "Google",
    },
    address: {
      line1: "6401 6th Ave",
      city: "Brooklyn",
      state: "NY",
      postalCode: "11220",
    },
    phone: "(929) 538-3803",
    hours: {
      statusText: "Open till 8 PM",
      today: "monday",
      weeklySchedule: [
        { day: "Sunday", hours: "11:00 AM - 5:00 PM", isToday: false },
        { day: "Mon - Thu", hours: "9:00 AM - 9:00 PM", isToday: true },
        { day: "Friday", hours: "9:00 AM - 7:00 PM", isToday: false },
        { day: "Saturday", hours: "9:00 AM - 6:00 PM", isToday: false },
      ],
    },
    media: {
      photos: [
        {
          url: "/images/dealer/dealer-1.png",
          alt: "Toyota dealership exterior",
          displayOrder: 1,
        },
        {
          url: "/images/dealer/dealer-5.png",
          alt: "Toyota dealership vehicle lot",
          displayOrder: 2,
        },
      ],
      mapThumbnail: {
        url: "/images/dealer/dealer-info-map-img.png",
        alt: "Map showing Toyota of Bay Ridge location",
      },
    },
  },
};

/** Edge fixture: Dealer with no rating or reviews (Google data unavailable). */
export const DEALER_INSIGHT_NO_RATING_FIXTURE: DealerInsightResponse = {
  dealer: {
    ...DEALER_INSIGHT_DEFAULT_FIXTURE.dealer,
    dealerCode: "5013",
    dealerName: "Toyota of Manhattan",
    rating: null,
  },
};

/** Edge fixture: Dealer with no photos (map thumbnail only). */
export const DEALER_INSIGHT_NO_PHOTOS_FIXTURE: DealerInsightResponse = {
  dealer: {
    ...DEALER_INSIGHT_DEFAULT_FIXTURE.dealer,
    dealerCode: "5014",
    dealerName: "Toyota of Queens",
    media: {
      photos: [],
      mapThumbnail: {
        url: "/images/dealer/dealer-info-map-img.png",
        alt: "Map showing Toyota of Queens location",
      },
    },
  },
};

/** Edge fixture: Dealer currently closed, no phone available. */
export const DEALER_INSIGHT_CLOSED_NO_PHONE_FIXTURE: DealerInsightResponse = {
  dealer: {
    ...DEALER_INSIGHT_DEFAULT_FIXTURE.dealer,
    dealerCode: "5015",
    dealerName: "Toyota of Staten Island",
    phone: null,
    hours: {
      statusText: "Closed",
      today: "sunday",
      weeklySchedule: [
        { day: "Sunday", hours: "Closed", isToday: true },
        { day: "Mon - Thu", hours: "9:00 AM - 9:00 PM", isToday: false },
        { day: "Friday", hours: "9:00 AM - 7:00 PM", isToday: false },
        { day: "Saturday", hours: "9:00 AM - 6:00 PM", isToday: false },
      ],
    },
  },
};

/** Edge fixture: Dealer with no hours data (upstream unavailable). */
export const DEALER_INSIGHT_NO_HOURS_FIXTURE: DealerInsightResponse = {
  dealer: {
    ...DEALER_INSIGHT_DEFAULT_FIXTURE.dealer,
    dealerCode: "5016",
    dealerName: "Toyota of Bronx",
    hours: null,
  },
};

/** Edge fixture: Minimal data — no rating, no hours, no photos, no phone. */
export const DEALER_INSIGHT_MINIMAL_FIXTURE: DealerInsightResponse = {
  dealer: {
    dealerCode: "5017",
    dealerName: "Toyota of Yonkers",
    city: "Yonkers",
    state: "NY",
    zipCode: "10701",
    rating: null,
    address: {
      line1: "100 Main St",
      city: "Yonkers",
      state: "NY",
      postalCode: "10701",
    },
    phone: null,
    hours: null,
    media: {
      photos: [],
      mapThumbnail: null,
    },
  },
};

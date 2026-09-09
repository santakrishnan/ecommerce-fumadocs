// Availability context for the scheduling screen — bookable days and their
// 30-minute time slots. In the real flow this comes from a GET on the
// origination application; until that endpoint lands, this fixture seeds the
// demo directly. When the GET arrives, this becomes the mock response, not a
// removal.

export interface SchedulingTimeSlot {
  available: boolean;
  time: string;
}

export interface SchedulingDay {
  date: string;
  label: string;
  timeSlots: SchedulingTimeSlot[];
}

export interface SchedulingContext {
  days: SchedulingDay[];
  dealershipName: string;
}

// 30-minute increments from 11:00 AM to 4:00 PM.
const TIME_SLOTS = [
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
] as const;

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  // Build YYYY-MM-DD from local date parts — toISOString() serializes in UTC,
  // which can shift the date by a day in non-UTC time zones and desync the day
  // label (computed in local time) from the date heading.
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayLabel(daysFromNow: number): string {
  if (daysFromNow === 1) {
    return "Tomorrow";
  }
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

// Up to 5 bookable days, starting tomorrow. A couple of slots are marked
// unavailable to exercise the disabled state.
export const SCHEDULING_CONTEXT_FIXTURE: SchedulingContext = {
  dealershipName: "Toyota of Sunnyvale",
  days: Array.from({ length: 5 }, (_, index) => {
    const daysFromNow = index + 1;
    return {
      date: futureDate(daysFromNow),
      label: dayLabel(daysFromNow),
      timeSlots: TIME_SLOTS.map((time, slotIndex) => ({
        time,
        // Mark one midday slot on the first two days as unavailable.
        available: !(daysFromNow <= 2 && slotIndex === 4),
      })),
    };
  }),
};

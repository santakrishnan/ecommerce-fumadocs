import { describe, expect, it } from "vitest";
import {
  addDaysDateOnly,
  dayLabelFor,
  diffInDays,
  formatAppointmentDateTime,
  todayDateOnly,
} from "../format-appointment";

const YEAR_RE = /\d{4}/;
const TOMORROW_PREFIX_RE = /^Tomorrow, /;
const TIME_SUFFIX_RE = /at 12:00 PM$/;

describe("format-appointment", () => {
  it("labels today as 'Today'", () => {
    expect(dayLabelFor(todayDateOnly())).toBe("Today");
  });

  it("labels the next day as 'Tomorrow'", () => {
    expect(dayLabelFor(addDaysDateOnly(1))).toBe("Tomorrow");
  });

  it("labels far-out dates with weekday and date", () => {
    const label = dayLabelFor(addDaysDateOnly(10));
    expect(label).not.toBe("Today");
    expect(label).not.toBe("Tomorrow");
    expect(label).toMatch(YEAR_RE);
  });

  it("computes day difference from today", () => {
    expect(diffInDays(todayDateOnly())).toBe(0);
    expect(diffInDays(addDaysDateOnly(2))).toBe(2);
  });

  it("formats a datetime with the day prefix and time", () => {
    const formatted = formatAppointmentDateTime(addDaysDateOnly(1), "12:00 PM");
    expect(formatted).toMatch(TOMORROW_PREFIX_RE);
    expect(formatted).toMatch(TIME_SUFFIX_RE);
  });
});

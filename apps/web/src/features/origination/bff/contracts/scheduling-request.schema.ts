import { z } from "zod";

// ISO calendar date, e.g. "2026-08-21".
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Matches the fixture's slot format, e.g. "11:00 AM" / "4:30 PM".
const TIME_PATTERN = /^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/;

export const schedulingRequestSchema = z.object({
  date: z.string().regex(DATE_PATTERN, "Please select a day"),
  time: z.string().regex(TIME_PATTERN, "Please select a time"),
});

export type SchedulingRequest = z.infer<typeof schedulingRequestSchema>;

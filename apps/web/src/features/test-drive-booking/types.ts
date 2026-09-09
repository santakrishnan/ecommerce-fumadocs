type BookingStep =
  | "identity"
  | "verification"
  | "same-day-reminder"
  | "replace-conflict"
  | "confirmation"
  | "added";

type BookingIntent = "book" | "add-car";

export type { BookingIntent, BookingStep };

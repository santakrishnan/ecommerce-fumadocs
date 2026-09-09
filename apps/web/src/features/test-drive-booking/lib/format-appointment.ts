const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayDateOnly(): string {
  return toDateOnly(new Date());
}

function addDaysDateOnly(days: number): string {
  return toDateOnly(new Date(Date.now() + days * DAY_MS));
}

function diffInDays(dateOnly: string): number {
  const target = parseDateOnly(dateOnly).getTime();
  const today = parseDateOnly(todayDateOnly()).getTime();
  return Math.round((target - today) / DAY_MS);
}

function dayLabelFor(dateOnly: string): string {
  const delta = diffInDays(dateOnly);
  if (delta === 0) {
    return "Today";
  }
  if (delta === 1) {
    return "Tomorrow";
  }
  return parseDateOnly(dateOnly).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAppointmentDateTime(dateOnly: string, timeSlot: string): string {
  const label = dayLabelFor(dateOnly);
  const fullDate = parseDateOnly(dateOnly).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const prefix = label === "Today" || label === "Tomorrow" ? `${label}, ` : "";
  return `${prefix}${fullDate} at ${timeSlot}`;
}

export { addDaysDateOnly, dayLabelFor, diffInDays, formatAppointmentDateTime, todayDateOnly };

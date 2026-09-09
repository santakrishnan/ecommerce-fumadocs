"use server";

import { VDP_BOOKING_COOKIE } from "@config/vdp-booking-state";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import {
  bookTestDriveInputSchema,
  type TestDriveAppointment,
  testDriveAppointmentListSchema,
} from "../schemas";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type BookTestDriveResult =
  | { success: true; appointmentId: string }
  | { success: false; error: string };

function readList(raw: string | undefined): TestDriveAppointment[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = testDriveAppointmentListSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

// Dedupes only when the caller reuses an existing id. performBook mints a fresh
// UUID so a normal booking always appends; performReplace/performAdd reuse the id
// to overwrite. Growth per distinct appointment is intended — Reset in
// /demo-settings is the cleanup path.
function upsertById(
  list: TestDriveAppointment[],
  appointment: TestDriveAppointment
): TestDriveAppointment[] {
  const index = list.findIndex((item) => item.id === appointment.id);
  if (index === -1) {
    return [...list, appointment];
  }
  const next = [...list];
  next[index] = appointment;
  return next;
}

async function bookTestDriveAction(input: unknown): Promise<BookTestDriveResult> {
  const parsed = bookTestDriveInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid booking details" };
  }

  const appointment = parsed.data;

  // TODO: replace with POST /appointments when the Arrow endpoint is available.
  const cookieStore = await cookies();
  const nextList = upsertById(readList(cookieStore.get(VDP_BOOKING_COOKIE)?.value), appointment);
  cookieStore.set(VDP_BOOKING_COOKIE, JSON.stringify(nextList), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  // TODO: no cached reader is tagged "profile-appointments" yet — the profile mock
  // reads cookies and is not a "use cache" function, so this is a no-op today. It
  // pre-wires the invalidation path for when the real cached API read lands.
  // (The Profile refresh is currently driven by router.refresh() in the hook.)
  revalidateTag("profile-appointments", "max");

  return { success: true, appointmentId: appointment.id };
}

export type { BookTestDriveResult };
export { bookTestDriveAction };

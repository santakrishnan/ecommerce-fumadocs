"use client";

import { setProfileTier } from "@features/demo-settings/actions/set-profile-tier";
import { formatContactDisplay } from "@shared/lib/contact";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { bookTestDriveAction } from "../actions/book-test-drive";
import { dayLabelFor } from "../lib/format-appointment";
import type { BookingContact, TestDriveAppointment, TestDriveVehicle } from "../schemas";
import type { BookingIntent, BookingStep } from "../types";

interface UseTestDriveBookingArgs {
  currentVehicle: TestDriveVehicle;
  dealerAddress: string;
  dealerCode: string;
  dealerName: string;
  initialAppointment: TestDriveAppointment | null;
  requiresSignup: boolean;
  viewedDate: string;
}

interface UseTestDriveBookingResult {
  appointment: TestDriveAppointment | null;
  close: () => void;
  contactDisplay: string;
  currentVehicle: TestDriveVehicle;
  dealerName: string;
  includesThisVin: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onAddThisCar: () => void;
  onKeepExisting: () => void;
  onOpenManage: () => void;
  onProceedSameDay: () => void;
  onReplace: () => void;
  onSelectSlot: (slot: string) => void;
  onSubmitIdentity: (contact: BookingContact) => void;
  onVerify: () => void;
  selectedDate: string;
  selectedSlot: string | null;
  step: BookingStep;
}

function appointmentIncludesVin(appointment: TestDriveAppointment | null, vin: string): boolean {
  return appointment?.vehicles.some((vehicle) => vehicle.vin === vin) ?? false;
}

function noop() {
  return;
}

function useTestDriveBooking({
  currentVehicle,
  dealerAddress,
  dealerCode,
  dealerName,
  initialAppointment,
  requiresSignup,
  viewedDate,
}: UseTestDriveBookingArgs): UseTestDriveBookingResult {
  const router = useRouter();
  const [appointment, setAppointment] = useState<TestDriveAppointment | null>(initialAppointment);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<BookingStep>("confirmation");
  const [intent, setIntent] = useState<BookingIntent>("book");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [contact, setContact] = useState<BookingContact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthed, setIsAuthed] = useState(!requiresSignup);

  const includesThisVin = appointmentIncludesVin(appointment, currentVehicle.vin);

  function close() {
    setIsOpen(false);
    setSelectedSlot(null);
    setIsSubmitting(false);
  }

  async function persist(next: TestDriveAppointment, nextStep: BookingStep) {
    setIsSubmitting(true);
    const result = await bookTestDriveAction(next);
    setIsSubmitting(false);
    if (result.success) {
      setAppointment(next);
      setStep(nextStep);
      setIsOpen(true);
      // Refresh server components so the persisted booking is re-read on this
      // and subsequent navigations (defeats the client Router Cache).
      router.refresh();
    }
  }

  async function performBook(slot: string) {
    await persist(
      {
        id: `td-${crypto.randomUUID()}`,
        dealerCode,
        dealerName,
        dealerAddress,
        date: viewedDate,
        dayLabel: dayLabelFor(viewedDate),
        timeSlot: slot,
        vehicles: [currentVehicle],
      },
      "confirmation"
    );
  }

  async function performAdd() {
    if (!appointment) {
      return;
    }
    const alreadyIncluded = appointmentIncludesVin(appointment, currentVehicle.vin);
    await persist(
      {
        ...appointment,
        vehicles: alreadyIncluded
          ? appointment.vehicles
          : [...appointment.vehicles, currentVehicle],
      },
      "added"
    );
  }

  async function performReplace(slot: string) {
    if (!appointment) {
      await performBook(slot);
      return;
    }
    // Reuse the conflicting appointment's id so the upsert overwrites it
    // instead of appending a duplicate.
    await persist(
      {
        id: appointment.id,
        dealerCode,
        dealerName,
        dealerAddress,
        date: viewedDate,
        dayLabel: dayLabelFor(viewedDate),
        timeSlot: slot,
        vehicles: [currentVehicle],
      },
      "confirmation"
    );
  }

  function onSelectSlot(slot: string) {
    setIntent("book");
    setSelectedSlot(slot);
    setIsOpen(true);

    // Anonymous visitors must sign up before a booking can be created.
    if (!isAuthed) {
      setStep("identity");
      return;
    }

    const sameDay = appointment?.date === viewedDate;
    if (sameDay && appointment?.timeSlot === slot) {
      setStep("replace-conflict");
      return;
    }
    if (sameDay && appointment && appointment.dealerCode !== dealerCode) {
      setStep("same-day-reminder");
      return;
    }
    performBook(slot).catch(noop);
  }

  function onAddThisCar() {
    setIntent("add-car");
    setIsOpen(true);
    if (!isAuthed) {
      setStep("identity");
      return;
    }
    performAdd().catch(noop);
  }

  function onOpenManage() {
    if (!appointment) {
      return;
    }
    setIntent("book");
    setStep("confirmation");
    setIsOpen(true);
  }

  function onSubmitIdentity(nextContact: BookingContact) {
    setContact(nextContact);
    setStep("verification");
  }

  async function onVerify() {
    await setProfileTier("t1");
    setIsAuthed(true);
    if (intent === "add-car") {
      await performAdd();
      return;
    }
    if (selectedSlot) {
      await performBook(selectedSlot);
    }
  }

  async function onProceedSameDay() {
    if (selectedSlot) {
      await performBook(selectedSlot);
    }
  }

  async function onReplace() {
    if (selectedSlot) {
      await performReplace(selectedSlot);
    }
  }

  function onKeepExisting() {
    close();
  }

  return {
    appointment,
    close,
    contactDisplay: contact ? formatContactDisplay(contact.contact) : "",
    currentVehicle,
    dealerName,
    includesThisVin,
    isOpen,
    isSubmitting,
    onAddThisCar,
    onKeepExisting,
    onOpenManage,
    onProceedSameDay,
    onReplace,
    onSelectSlot,
    onSubmitIdentity,
    onVerify,
    selectedDate: viewedDate,
    selectedSlot,
    step,
  };
}

export type { UseTestDriveBookingResult };
export { useTestDriveBooking };

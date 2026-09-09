"use client";

import { formatPhoneInput, isValidContact, looksLikePhone } from "@shared/lib/contact";
import { Button, Field, FieldGroup, FloatingInput, FloatingLabel } from "@ucmp/ui";
import { useState } from "react";
import type { BookingContact } from "../../schemas";

interface IdentityStepProps {
  onContinue: (contact: BookingContact) => void;
}

function IdentityStep({ onContinue }: IdentityStepProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");

  const isValid = firstName.trim() !== "" && lastName.trim() !== "" && isValidContact(contact);

  function handleContactChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    setContact(looksLikePhone(raw) ? formatPhoneInput(raw) : raw);
  }

  function handleSubmit() {
    if (!isValid) {
      return;
    }
    onContinue({ firstName: firstName.trim(), lastName: lastName.trim(), contact: contact.trim() });
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="h3 text-text-primary">Book your test drive appointment</h2>
        <p className="body-md text-text-secondary">
          Don&apos;t worry, we&apos;ll only use your info to confirm your appointment and send you a
          reminder.
        </p>
        <p className="body-sm text-text-secondary">Already a member? Sign in below</p>
      </div>

      <FieldGroup>
        <FieldGroup orientation="horizontal">
          <Field className="relative flex-1">
            <FloatingInput
              id="td-first-name"
              name="firstName"
              onChange={(event) => setFirstName(event.target.value)}
              type="text"
              value={firstName}
            />
            <FloatingLabel htmlFor="td-first-name">First name</FloatingLabel>
          </Field>
          <Field className="relative flex-1">
            <FloatingInput
              id="td-last-name"
              name="lastName"
              onChange={(event) => setLastName(event.target.value)}
              type="text"
              value={lastName}
            />
            <FloatingLabel htmlFor="td-last-name">Last name</FloatingLabel>
          </Field>
        </FieldGroup>
        <Field className="relative">
          <FloatingInput
            id="td-contact"
            name="contact"
            onChange={handleContactChange}
            type="text"
            value={contact}
          />
          <FloatingLabel htmlFor="td-contact">Phone number or email</FloatingLabel>
        </Field>
      </FieldGroup>

      <Button
        className="h-14 w-full"
        disabled={!isValid}
        fullWidth
        onClick={handleSubmit}
        size="lg"
        variant="primary"
      >
        Continue
      </Button>
    </div>
  );
}

export { IdentityStep };

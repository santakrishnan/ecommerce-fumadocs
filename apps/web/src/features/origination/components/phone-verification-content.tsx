"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Field, FieldError, FloatingInput, FloatingLabel } from "@ucmp/ui";
import { useController, useForm } from "react-hook-form";
import type { PhoneVerificationRequest } from "../bff/contracts";
import { formatPhone } from "../lib/format-phone";
import { type PhoneFormValues, phoneFormSchema } from "../lib/phone-form-schema";

const PHONE_INPUT_ID = "origination-phone";
const PHONE_ERROR_ID = "origination-phone-error";
const PHONE_PLACEHOLDER = "(xxx) xxx-xxxx";
const PHONE_VALIDATION_ERROR = "Enter a valid 10-digit phone number";

interface PhoneVerificationContentProps {
  initialData?: Partial<PhoneVerificationRequest>;
}

export const PHONE_VERIFICATION_TITLE = "Let's verify your phone number";
export const PHONE_VERIFICATION_DESCRIPTION =
  "We'll send a verification code to your phone number.";

export function PhoneVerificationContent({ initialData }: PhoneVerificationContentProps) {
  const { control } = useForm<PhoneFormValues>({
    defaultValues: { phone: formatPhone(initialData?.phone ?? "") },
    mode: "onChange",
    resolver: standardSchemaResolver(phoneFormSchema),
  });

  const { field, fieldState } = useController<PhoneFormValues>({
    control,
    name: "phone",
  });

  const showError = fieldState.isTouched && !!fieldState.error;

  return (
    <Field
      aria-describedby={showError ? PHONE_ERROR_ID : undefined}
      className="relative"
      data-invalid={showError}
    >
      <FloatingInput
        aria-describedby={showError ? PHONE_ERROR_ID : undefined}
        aria-invalid={showError}
        autoComplete="tel-national"
        id={PHONE_INPUT_ID}
        inputMode="numeric"
        name={field.name}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(formatPhone(event.target.value, false))}
        onPaste={(event) => {
          event.preventDefault();
          field.onChange(formatPhone(event.clipboardData.getData("text")));
        }}
        placeholder={PHONE_PLACEHOLDER}
        ref={field.ref}
        type="tel"
        value={field.value ?? ""}
      />
      <FloatingLabel htmlFor={PHONE_INPUT_ID}>Phone number</FloatingLabel>
      {showError && (
        <FieldError className="body-md" id={PHONE_ERROR_ID}>
          {PHONE_VALIDATION_ERROR}
        </FieldError>
      )}
    </Field>
  );
}

"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useController, useForm } from "react-hook-form";
import type { z } from "zod";
import type { DownPaymentPreset } from "../bff/__fixtures__/down-payment.fixture";
import {
  type DownPaymentRequest,
  downPaymentRequestSchema,
} from "../bff/contracts/down-payment-request.schema";
import { InputWithSuggestionsBase } from "./base/input-with-suggestions-base";

// z.coerce.number() accepts unknown input, so the raw field values don't
// match DownPaymentRequest directly. Use the three-generic form of useForm:
//   TFieldValues       = raw form state (unknown values, from coerce schema)
//   TContext           = unknown (not used)
//   TTransformedValues = DownPaymentRequest (validated output — what handleSubmit provides)
type DownPaymentFormInput = z.input<typeof downPaymentRequestSchema>;

// Integration note: when wired into XState, the machine footer's Continue
// button must be disabled until `downPaymentAmount` is valid.
interface DownPaymentContentProps {
  initialData?: Partial<DownPaymentRequest>;
  presets: DownPaymentPreset[];
  vehiclePrice?: number;
}

export const DOWN_PAYMENT_TITLE = "What is your down payment?";
export const DOWN_PAYMENT_DESCRIPTION =
  "This helps us give you an accurate offer by letting us know how much you can afford.";

// Formats a number as a US dollar string without cents: 5200 → "$5,200"
function formatDollars(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DownPaymentContent({ initialData, presets }: DownPaymentContentProps) {
  const { control } = useForm<DownPaymentFormInput, unknown, DownPaymentRequest>({
    resolver: standardSchemaResolver(downPaymentRequestSchema),
    defaultValues: initialData as DownPaymentFormInput,
    mode: "onChange",
  });

  const { field, fieldState } = useController<DownPaymentFormInput>({
    name: "downPaymentAmount",
    control,
  });

  const showError = fieldState.isTouched && !!fieldState.error;
  const selectedValue =
    field.value !== undefined && field.value !== null ? Number(field.value) : undefined;

  const suggestions = presets.map((preset) => ({
    label: (
      <>
        <span className="font-semibold">{formatDollars(preset.amount)}</span>{" "}
        <span className="font-normal text-text-secondary">({preset.percentage}%)</span>
      </>
    ),
    value: preset.amount,
  }));

  return (
    <InputWithSuggestionsBase
      errorMessage={fieldState.error?.message}
      id="down-payment-amount"
      inputLabel="Down payment"
      name={field.name}
      onBlur={field.onBlur}
      onChange={(v) => field.onChange(v)}
      onSuggestionSelect={(v) => field.onChange(v)}
      ref={field.ref}
      selectedValue={selectedValue}
      showError={showError}
      suggestions={suggestions}
      value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
    />
  );
}

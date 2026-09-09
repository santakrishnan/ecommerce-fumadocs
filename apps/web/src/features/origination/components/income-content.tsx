"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Button, Field, FieldError, FloatingInput, FloatingLabel } from "@ucmp/ui";
import { IconArrowRight } from "@ucmp/ui/icons";
import { useController, useForm } from "react-hook-form";
import type { z } from "zod";
import { type IncomeRequest, incomeRequestSchema } from "../bff/contracts/income-request.schema";

// z.coerce.number() accepts unknown input, so the raw field values don't
// match IncomeRequest directly. Use the three-generic form of useForm:
//   TFieldValues       = raw form state (unknown values, from coerce schema)
//   TContext           = unknown (not used)
//   TTransformedValues = IncomeRequest (validated output — what handleSubmit provides)
type IncomeFormInput = z.input<typeof incomeRequestSchema>;

// Integration note: when wired into XState, the machine footer's Continue
// button must be disabled until `annualGrossIncome` is valid.
interface IncomeContentProps {
  initialData?: Partial<IncomeRequest>;
}

export const INCOME_TITLE = "What's your annual gross income before taxes?";
export const INCOME_DESCRIPTION =
  "This is the total amount you earn in a year before taxes and deductions are taken out — not your take-home pay.";
export const INCOME_MULTIPLE_ACCOUNTS_NOTE =
  "If you have multiple accounts, add each one so we can get a complete picture of your finances.";
export const ADD_NON_TAXABLE_INCOME_LABEL = "Add additional non-taxable income sources";

// The `$` and thousand separators this component adds for display — stripped
// back off on input so the stored value stays close to what the user typed.
const DISPLAY_FORMATTING_PATTERN = /[$,]/g;
// A value that is purely digits (and non-empty) is safe to format as currency.
const DIGITS_ONLY_PATTERN = /^\d+$/;

// Removes the display-only `$`/commas so the raw value round-trips cleanly.
// Letters are intentionally kept so they stay visible and trip validation.
function stripDisplayFormatting(rawValue: string): string {
  return rawValue.replace(DISPLAY_FORMATTING_PATTERN, "");
}

// Formats an all-digit value as "$1,234" as the user types; any non-digit
// content (e.g. letters) is shown raw so the validation error can surface.
function formatForDisplay(value: string): string {
  if (value === "") {
    return "";
  }
  if (!DIGITS_ONLY_PATTERN.test(value)) {
    return value;
  }
  return `$${new Intl.NumberFormat("en-US").format(Number(value))}`;
}

export function IncomeContent({ initialData }: IncomeContentProps) {
  const { control } = useForm<IncomeFormInput, unknown, IncomeRequest>({
    resolver: standardSchemaResolver(incomeRequestSchema),
    defaultValues: initialData as IncomeFormInput,
    mode: "onChange",
  });
  const { field, fieldState } = useController<IncomeFormInput>({
    name: "annualGrossIncome",
    control,
  });
  const showError = fieldState.isTouched && !!fieldState.error;

  return (
    <div className="flex flex-col gap-8">
      <p className="body-md text-text-secondary">{INCOME_MULTIPLE_ACCOUNTS_NOTE}</p>

      <Field className="relative" data-invalid={showError}>
        <FloatingInput
          id="annual-gross-income"
          inputMode="numeric"
          name={field.name}
          onBlur={field.onBlur}
          onChange={(e) => {
            const next = stripDisplayFormatting(e.target.value);
            field.onChange(next === "" ? undefined : next);
          }}
          placeholder=" "
          ref={field.ref}
          value={formatForDisplay(
            field.value !== undefined && field.value !== null ? String(field.value) : ""
          )}
        />
        <FloatingLabel htmlFor="annual-gross-income">Annual gross income</FloatingLabel>
        {showError && <FieldError>{fieldState.error?.message}</FieldError>}
      </Field>

      <Button className="self-start" size="sm" trailingIcon={IconArrowRight} variant="text">
        {ADD_NON_TAXABLE_INCOME_LABEL}
      </Button>
    </div>
  );
}

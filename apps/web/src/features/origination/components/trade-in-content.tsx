"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FloatingInput,
  FloatingLabel,
  FloatingSelectTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@ucmp/ui";
import { IconCaretDown } from "@ucmp/ui/icons";
import { useController, useForm } from "react-hook-form";
import { z } from "zod";
import type { TradeInRequest } from "../bff/contracts/trade-in-request.schema";
import { US_STATES } from "../data/us-states";

/** Title copy for the trade-in step, passed to the OriginationPanel layout. */
export const TRADE_IN_TITLE = "Would you like to trade in your vehicle?";
/** Description copy for the trade-in step, passed to the OriginationPanel layout. */
export const TRADE_IN_DESCRIPTION =
  "Your estimate is based on standard vehicle condition and may change after inspection.";

const PLATE_VIN_LABEL = "License plate or VIN";
const STATE_LABEL = "State";
const VIN_HELP_LABEL = "Need help finding your VIN?";

const PLATE_VIN_FIELD_ID = "trade-in-plate-vin";
const STATE_FIELD_ID = "trade-in-state";

/** A full VIN is exactly 17 characters — the discriminator between the two lookup branches. */
const VIN_LENGTH = 17;
const STATE_CODE_LENGTH = 2;

export const tradeInFormSchema = z
  .object({
    plateOrVin: z.string(),
    state: z.string(),
  })
  .superRefine((value, ctx) => {
    const plateOrVin = value.plateOrVin.trim();

    if (plateOrVin.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["plateOrVin"],
        message: "Enter a license plate or VIN",
      });
      return;
    }

    // A 17-character entry is treated as a VIN and needs no state.
    if (plateOrVin.length === VIN_LENGTH) {
      return;
    }

    if (value.state.trim().length !== STATE_CODE_LENGTH) {
      ctx.addIssue({
        code: "custom",
        path: ["state"],
        message: "Select your state",
      });
    }
  })
  // On success, map the raw fields to the BFF wire contract so `handleSubmit`
  // yields a ready-to-send `TradeInRequest` (mirrors DownPayment's z.input →
  // validated-output flow). superRefine has already guaranteed a valid
  // combination, so the branch below is exhaustive.
  .transform((value): TradeInRequest => {
    const plateOrVin = value.plateOrVin.trim();
    if (plateOrVin.length === VIN_LENGTH) {
      return { vin: plateOrVin.toUpperCase() };
    }
    return { plate: plateOrVin, state: value.state.trim().toUpperCase() };
  });

// Raw form-field values (what the inputs hold), distinct from the transformed
// `TradeInRequest` output `handleSubmit` provides.
export type TradeInFormValues = z.input<typeof tradeInFormSchema>;

interface TradeInContentProps {
  /** Pre-fills the form (e.g. when returning to the step). */
  initialData?: Partial<TradeInFormValues>;
}

/**
 * Trade-in entry form content — the piece passed as `children` to
 * {@link OriginationPanel} (and shown standalone on the demo page).
 *
 * Mirrors `DownPaymentContent`: owns a `react-hook-form` form validated by
 * `standardSchemaResolver(tradeInFormSchema)` in `onChange` mode. Validity lives in
 * `formState.isValid` rather than being wired up through callbacks.
 *
 * Integration note: when wired into XState, the machine footer's Continue
 * button must be disabled until the form's `formState.isValid` is true;
 * `handleSubmit` then yields the validated `TradeInRequest` (the schema maps the
 * fields to the wire contract).
 */
export function TradeInContent({ initialData }: TradeInContentProps) {
  const { control } = useForm<TradeInFormValues, unknown, TradeInRequest>({
    resolver: standardSchemaResolver(tradeInFormSchema),
    defaultValues: {
      plateOrVin: initialData?.plateOrVin ?? "",
      state: initialData?.state ?? "",
    },
    mode: "onChange",
  });

  const { field: plateField, fieldState: plateState } = useController({
    name: "plateOrVin",
    control,
  });
  const { field: stateField, fieldState: stateFieldState } = useController({
    name: "state",
    control,
  });

  const showPlateError = plateState.isTouched && !!plateState.error;
  const showStateError = stateFieldState.isTouched && !!stateFieldState.error;

  return (
    <div className="flex flex-col gap-10">
      {/* Trade-in step override of the base FieldGroup gap/alignment (per Figma). */}
      <FieldGroup className="gap-2">
        <Field data-invalid={showPlateError ? "true" : undefined}>
          <FloatingInput
            aria-invalid={showPlateError || undefined}
            autoComplete="off"
            id={PLATE_VIN_FIELD_ID}
            name={plateField.name}
            onBlur={plateField.onBlur}
            onChange={(event) => plateField.onChange(event.target.value)}
            placeholder=" "
            ref={plateField.ref}
            value={plateField.value}
            variant="outlined"
          />
          <FloatingLabel htmlFor={PLATE_VIN_FIELD_ID}>{PLATE_VIN_LABEL}</FloatingLabel>
          {showPlateError && <FieldError>{plateState.error?.message}</FieldError>}
        </Field>

        <Field data-invalid={showStateError ? "true" : undefined}>
          <Select
            onValueChange={(value) => stateField.onChange(value ?? "")}
            value={stateField.value}
          >
            <FloatingSelectTrigger id={STATE_FIELD_ID} variant="outlined">
              <SelectValue placeholder={STATE_LABEL} />
            </FloatingSelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="max-h-60">
              {US_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FloatingLabel htmlFor={STATE_FIELD_ID}>{STATE_LABEL}</FloatingLabel>
          {showStateError && <FieldError>{stateFieldState.error?.message}</FieldError>}
        </Field>
      </FieldGroup>

      {/* VIN help — text button with a trailing icon. No action wired yet. */}
      <Button className="self-start" size="sm" trailingIcon={IconCaretDown} variant="text">
        {VIN_HELP_LABEL}
      </Button>
    </div>
  );
}

export type { TradeInContentProps };

"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@ucmp/ui";
import { type Control, type FieldPath, useController, useForm } from "react-hook-form";
import type { z } from "zod";
import {
  EXTRA_SAVINGS_CONTEXT_FIXTURE,
  type ExtraSavingsOption,
} from "../../bff/__fixtures__/extra-savings.fixture";
import {
  type ExtraSavingsRequest,
  extraSavingsRequestSchema,
} from "../../bff/contracts/extra-savings-request.schema";

export type { ExtraSavingsOption } from "../../bff/__fixtures__/extra-savings.fixture";

/**
 * Header copy for the extra-savings step, exported so the demo harness and the
 * step screen share a single source of truth. Values mirror the Figma handoff
 * for the "Let's check for extra savings" page.
 */
export const EXTRA_SAVINGS_TITLE = "Let's check for extra savings";
export const EXTRA_SAVINGS_DESCRIPTION =
  "You may qualify for additional offers. Select all that apply.";

// The schema keys are fixed booleans, so the raw form state matches the
// validated output directly. Use the three-generic form of useForm to keep the
// contract identical to down-payment-content:
//   TFieldValues       = raw form state
//   TContext           = unknown (not used)
//   TTransformedValues = ExtraSavingsRequest (validated output)
type ExtraSavingsFormInput = z.input<typeof extraSavingsRequestSchema>;

/** Selection state: which extra-savings options the user has opted in to. */
export type ExtraSavingsSelection = ExtraSavingsRequest;

// Integration note: when wired into XState, the step screen subscribes to the
// exposed react-hook-form `control` (via `watch`/`useWatch`) rather than
// receiving `onToggle` callbacks — the same reactive contract as down-payment.
interface ExtraSavingsContentProps {
  /** Pre-checked options, keyed by option `value`. */
  initialData?: Partial<ExtraSavingsRequest>;
  /**
   * The options to render. Fixture/BFF-sourced data, passed as props. Defaults
   * to the extra-savings fixture options for standalone/demo usage.
   */
  options?: readonly ExtraSavingsOption[];
}

/**
 * A single field-choice checkbox card wired to react-hook-form via
 * `useController`. Kept as its own component so each option owns one hook call
 * (hooks can't run in a loop), mirroring down-payment's `useController` usage.
 */
function ExtraSavingsOptionField({
  control,
  option,
}: {
  control: Control<ExtraSavingsFormInput>;
  option: ExtraSavingsOption;
}) {
  // Field names are data-driven (one per option value), so the name is cast to
  // the form's field-path type. The fixture/BFF option values are the schema keys.
  const { field } = useController<ExtraSavingsFormInput>({
    control,
    name: option.value as FieldPath<ExtraSavingsFormInput>,
  });

  const id = `extra-savings-${option.value}`;

  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>{option.title}</FieldTitle>
          <FieldDescription>{option.description}</FieldDescription>
        </FieldContent>
        <Checkbox
          checked={Boolean(field.value)}
          id={id}
          name={field.name}
          onBlur={field.onBlur}
          onCheckedChange={(checked) => field.onChange(checked)}
          ref={field.ref}
        />
      </Field>
    </FieldLabel>
  );
}

/**
 * The extra-savings form body: independent field-choice checkbox cards.
 *
 * Owns a react-hook-form instance and exposes reactive form state through its
 * `control` (the same pattern as down-payment). The step screen reads the
 * selection via `watch`/`useWatch` and gates Continue on validity, rather than
 * being wired through `onToggle` callbacks.
 */
export function ExtraSavingsContent({
  initialData,
  options = EXTRA_SAVINGS_CONTEXT_FIXTURE.options,
}: ExtraSavingsContentProps) {
  const { control } = useForm<ExtraSavingsFormInput, unknown, ExtraSavingsRequest>({
    resolver: standardSchemaResolver(extraSavingsRequestSchema),
    defaultValues: initialData as ExtraSavingsFormInput,
    mode: "onChange",
  });

  return (
    <FieldGroup className="w-full">
      <FieldSet>
        {options.map((option) => (
          <ExtraSavingsOptionField control={control} key={option.value} option={option} />
        ))}
      </FieldSet>
    </FieldGroup>
  );
}

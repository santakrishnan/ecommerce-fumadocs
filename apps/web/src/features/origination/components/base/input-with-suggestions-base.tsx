"use client";

import { Field, FieldError, FloatingInput, FloatingLabel } from "@ucmp/ui";
import type { FocusEventHandler, ReactNode, Ref } from "react";
import { cn } from "utils";

export interface Suggestion {
  label: ReactNode;
  value: number;
}

export interface InputWithSuggestionsBaseProps {
  errorMessage?: string;
  id: string;
  inputLabel: string;
  name?: string;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onChange: (value: string | undefined) => void;
  onSuggestionSelect: (value: number) => void;
  ref?: Ref<HTMLInputElement>;
  selectedValue?: number;
  showError: boolean;
  suggestions: Suggestion[];
  value: string;
}

export function InputWithSuggestionsBase({
  errorMessage,
  id,
  inputLabel,
  name,
  onBlur,
  onChange,
  onSuggestionSelect,
  ref,
  selectedValue,
  showError,
  suggestions,
  value,
}: InputWithSuggestionsBaseProps) {
  return (
    <div className="flex flex-col gap-8">
      <Field className="relative" data-invalid={showError}>
        <FloatingInput
          id={id}
          inputMode="numeric"
          name={name}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
          placeholder=" "
          ref={ref}
          value={value}
        />
        <FloatingLabel htmlFor={id}>{inputLabel}</FloatingLabel>
        {showError && <FieldError>{errorMessage}</FieldError>}
      </Field>

      <div className="flex flex-wrap gap-3">
        {suggestions.map((suggestion) => {
          const isSelected = selectedValue === suggestion.value;
          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                "rounded-full border px-6 py-3 text-sm text-text-primary transition-colors",
                isSelected
                  ? "border-neutral-500 bg-surface-primary"
                  : "border-neutral-200 bg-surface-primary/70 hover:border-neutral-400"
              )}
              key={suggestion.value}
              onClick={() => onSuggestionSelect(suggestion.value)}
              type="button"
            >
              {suggestion.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

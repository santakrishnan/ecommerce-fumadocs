"use client";

import { matchesRangeFilterKey } from "@features/search/lib/filter-keys";
import {
  Field,
  FieldGroup,
  FieldTitle,
  FloatingInput,
  FloatingLabel,
  FloatingSelectTrigger,
  Pill,
  PillGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@ucmp/ui";
import { useState } from "react";
import type { SelectedFilter } from "./filter-content-panel";
import type { FilterRangeField, FilterSectionMockData } from "./filter-mock-data";
import {
  formatCombinedRangeLabel,
  formatRangeValue,
  getRangeValuesFromActiveFilters,
} from "./filter-utils";

interface FilterSectionContentProps {
  data: FilterSectionMockData;
  onFilterSelectionChange: (filter: SelectedFilter, isSelected: boolean) => void;
  sectionKey: string;
  selectedFilters: SelectedFilter[];
}

/**
 * A selectable pill that leverages the Pill component's built-in toggle behavior.
 * Uses hideClose to allow click-to-deselect (avoids nested button HTML violation).
 * Selection state is controlled by the parent PillGroup's `value` prop.
 */
function SelectablePill({
  hex,
  label,
  onPressedChange,
  value,
}: {
  hex?: string;
  label: string;
  onPressedChange: (next: boolean) => void;
  value: string;
}) {
  return (
    <Pill hideClose onPressedChange={onPressedChange} value={value}>
      {hex && (
        <div
          className="size-4 rounded-full"
          data-icon="inline-start"
          style={{ backgroundColor: hex }}
        />
      )}
      {label}
    </Pill>
  );
}

/** Year-range options for dropdown */
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return String(year);
});

/**
 * Floating-label select for Year range fields (From / To).
 * Uses the FloatingSelectTrigger pattern from @ucmp/ui.
 */
function YearSelect({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: string) => void;
  value: string;
}) {
  return (
    <Field>
      <Select onValueChange={(v) => onValueChange(v ?? "")} value={value}>
        <FloatingSelectTrigger>
          <SelectValue placeholder={value} />
        </FloatingSelectTrigger>
        <SelectContent alignItemWithTrigger={false} className="max-h-60">
          {YEAR_OPTIONS.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
          <SelectItem value="Newest">Newest</SelectItem>
        </SelectContent>
      </Select>
      <FloatingLabel>{label}</FloatingLabel>
    </Field>
  );
}

interface RangeFieldsProps {
  onFilterSelectionChange: (filter: SelectedFilter, isSelected: boolean) => void;
  rangeFields: readonly FilterRangeField[];
  rangeType: "input" | "select";
  sectionKey: string;
  selectedFilters: SelectedFilter[];
}

function RangeFields({
  onFilterSelectionChange,
  rangeFields,
  rangeType,
  sectionKey,
  selectedFilters,
}: RangeFieldsProps) {
  const [rangeValues, setRangeValues] = useState<Record<string, string>>(() =>
    getRangeValuesFromActiveFilters(rangeFields, sectionKey, selectedFilters)
  );

  const startFieldLabel = rangeFields[0]?.label ?? "Min";
  const endFieldLabel = rangeFields[1]?.label ?? "Max";

  function handleRangeChange(fieldLabel: string, newValue: string) {
    setRangeValues((prev) => ({ ...prev, [fieldLabel]: newValue }));
  }

  function commitRangeSelection(nextRangeValues: Record<string, string>): void {
    const startValue = nextRangeValues[startFieldLabel] || "";
    const endValue = nextRangeValues[endFieldLabel] || "";

    if (startValue === "" && endValue === "") {
      const existingFilter = selectedFilters.find((filter) =>
        matchesRangeFilterKey(filter.key, sectionKey)
      );

      if (existingFilter) {
        onFilterSelectionChange(existingFilter, false);
      }
      return;
    }

    const startDisplay = startValue ? formatRangeValue(startValue, sectionKey) : "";
    const endDisplay = endValue ? formatRangeValue(endValue, sectionKey) : "";

    onFilterSelectionChange(
      {
        key: sectionKey,
        label: formatCombinedRangeLabel(startDisplay, endDisplay),
        value: `${startValue}-${endValue}`,
      },
      true
    );
  }

  function handleRangeBlur(): void {
    commitRangeSelection(rangeValues);
  }

  function handleRangeSelectChange(fieldLabel: string, newValue: string): void {
    const nextRangeValues = {
      ...rangeValues,
      [fieldLabel]: newValue,
    };

    setRangeValues(nextRangeValues);
    commitRangeSelection(nextRangeValues);
  }

  if (rangeType === "input") {
    return (
      <FieldGroup className="*:flex-1" orientation="horizontal">
        {rangeFields.map((field) => {
          const fieldId = `filter-range-${field.label.toLowerCase()}`;
          return (
            <Field key={field.label}>
              <FloatingInput
                id={fieldId}
                onBlur={handleRangeBlur}
                onChange={(e) => handleRangeChange(field.label, e.target.value)}
                type="text"
                value={rangeValues[field.label] ?? ""}
              />
              <FloatingLabel htmlFor={fieldId}>{field.label}</FloatingLabel>
            </Field>
          );
        })}
      </FieldGroup>
    );
  }

  return (
    <FieldGroup className="*:flex-1" orientation="horizontal">
      {rangeFields.map((field) => (
        <YearSelect
          key={field.label}
          label={field.label}
          onValueChange={(value) => handleRangeSelectChange(field.label, value)}
          value={rangeValues[field.label] ?? field.value}
        />
      ))}
    </FieldGroup>
  );
}

/**
 * Renders the content for a filter section based on mock data.
 *
 * Model and Features sections delegate to TabbedFilterSection for the
 * reusable tab + pill grid pattern. All other section types (range inputs,
 * quick pills, color swatches, radio options) are handled inline here.
 */
export function FilterSectionContent({
  data,
  onFilterSelectionChange,
  sectionKey,
  selectedFilters,
}: FilterSectionContentProps) {
  const { rangeFields, rangeType = "input", quickFilters, colorGroups } = data;

  const activeRangeFilterValue = selectedFilters.find((filter) => filter.key === sectionKey)?.value;

  return (
    <div className="flex flex-col gap-6">
      {rangeFields && (
        <RangeFields
          key={`${sectionKey}:${activeRangeFilterValue ?? "default"}`}
          onFilterSelectionChange={onFilterSelectionChange}
          rangeFields={rangeFields}
          rangeType={rangeType}
          sectionKey={sectionKey}
          selectedFilters={selectedFilters}
        />
      )}

      {/* Quick filter pills (Fuel Type, Drivetrain, Transmission) */}
      {quickFilters && quickFilters.length > 0 && (
        <PillGroup
          className="flex-wrap gap-2"
          multiple
          value={quickFilters
            .filter((filter) =>
              selectedFilters.some((sf) => sf.key === sectionKey && sf.value === filter.value)
            )
            .map((filter) => filter.value)}
        >
          {quickFilters.map((filter) => (
            <SelectablePill
              hex={filter.hex}
              key={filter.value}
              label={filter.label}
              onPressedChange={(next) =>
                onFilterSelectionChange(
                  { key: sectionKey, label: filter.label, value: filter.value },
                  next
                )
              }
              value={filter.value}
            />
          ))}
        </PillGroup>
      )}

      {/* Color groups (Exterior / Interior) */}
      {colorGroups?.map((group) => {
        const colorKey =
          group.label.trim().toLowerCase() === "interior" ? "int-color" : "ext-color";
        return (
          <div className="flex flex-col gap-6" key={group.label}>
            <FieldTitle className="body-sm">{group.label}</FieldTitle>
            <PillGroup
              className="flex-wrap gap-2"
              multiple
              value={group.colors
                .filter((color) =>
                  selectedFilters.some((sf) => sf.key === colorKey && sf.value === color.value)
                )
                .map((color) => color.value)}
            >
              {group.colors.map((color) => (
                <SelectablePill
                  hex={color.hex}
                  key={color.value}
                  label={color.label}
                  onPressedChange={(next) =>
                    onFilterSelectionChange(
                      { key: colorKey, label: color.label, value: color.value },
                      next
                    )
                  }
                  value={color.value}
                />
              ))}
            </PillGroup>
          </div>
        );
      })}
    </div>
  );
}

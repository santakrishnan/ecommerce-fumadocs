/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { Field, FieldGroup } from "../field";

function renderNestedFieldGroups(
  outerOrientation: "vertical" | "horizontal",
  innerOrientation: "vertical" | "horizontal"
) {
  return render(
    <FieldGroup data-testid="outer-group" orientation={outerOrientation}>
      <FieldGroup data-testid="inner-group" orientation={innerOrientation}>
        <Field>
          <span>Nested field</span>
        </Field>
      </FieldGroup>
    </FieldGroup>
  );
}

describe("FieldGroup", () => {
  it.each([
    ["vertical", "horizontal"],
    ["horizontal", "vertical"],
  ] as const)("supports nested %s -> %s groups", (outerOrientation, innerOrientation) => {
    renderNestedFieldGroups(outerOrientation, innerOrientation);

    const outerGroup = screen.getByTestId("outer-group");
    const innerGroup = screen.getByTestId("inner-group");

    expect(outerGroup).toHaveAttribute("data-orientation", outerOrientation);
    expect(innerGroup).toHaveAttribute("data-orientation", innerOrientation);
    expect(outerGroup).toHaveClass("*:data-[slot=field-group]:gap-4");
    expect(innerGroup).toHaveClass(innerOrientation === "vertical" ? "gap-6" : "gap-2");
  });
});

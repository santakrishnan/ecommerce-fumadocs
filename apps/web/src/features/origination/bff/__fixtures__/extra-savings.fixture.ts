// Extra-savings opt-in options. Copy mirrors the Figma "Let's check for extra
// savings" handoff. Sourced from the BFF/fixture layer and passed as props.

/** A single extra-savings opt-in, data-driven so title/description come from the BFF. */
export interface ExtraSavingsOption {
  description: string;
  title: string;
  /** Stable key used for the checkbox id and the selection-state map. */
  value: string;
}

export interface ExtraSavingsContext {
  options: ExtraSavingsOption[];
}

export const EXTRA_SAVINGS_CONTEXT_FIXTURE: ExtraSavingsContext = {
  options: [
    {
      value: "military",
      title: "Active duty military or veteran",
      description:
        "Active, reserve, or retired service members and their spouses may qualify. Proof of service required.",
    },
    {
      value: "graduate",
      title: "Recent college graduate",
      description:
        "Graduated in the last 2 years or graduating soon. Proof of enrollment or degree required.",
    },
  ],
};

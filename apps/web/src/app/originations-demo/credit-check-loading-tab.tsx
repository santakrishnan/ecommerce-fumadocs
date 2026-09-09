import { CreditCheckLoading } from "@features/origination";

/**
 * Demo tab for the credit-check full-screen loading screen.
 *
 * CreditCheckLoading owns `min-h-dvh` and renders outside the shell chrome in
 * production. The `relative overflow-hidden` container here constrains it to
 * the tab surface so it can be previewed without taking over the browser
 * viewport.
 */
export function CreditCheckLoadingTab() {
  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">
        ⬇ Full-screen in production (min-h-dvh, no shell chrome). Constrained here for preview.
      </p>
      <div className="relative h-96 overflow-hidden rounded-lg border-2 border-surface-muted border-dashed *:[[role=status]]:min-h-full">
        <CreditCheckLoading />
      </div>
    </div>
  );
}

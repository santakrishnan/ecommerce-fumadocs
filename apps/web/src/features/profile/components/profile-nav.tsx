import { Button } from "@ucmp/ui";
import { IconCaretRight } from "@ucmp/ui/icons";

const NAV_ITEMS = [
  { label: "Account Information" },
  { label: "Notification Preferences" },
  { label: "Privacy & Data" },
] as const;

/**
 * Profile sidebar navigation links.
 *
 * Renders the three account-level links shown in the wireframe.
 * Links are non-functional stubs — destinations are a follow-up ticket.
 *
 * Uses Button variant="text" from @ucmp/ui for consistent design-system styling.
 */
export function ProfileNav() {
  return (
    <nav aria-label="Profile navigation" className="flex flex-col">
      {NAV_ITEMS.map((item) => (
        <Button
          aria-disabled="true"
          className="w-full justify-between lg:w-auto lg:justify-start"
          key={item.label}
          variant="text"
        >
          <span>{item.label}</span>
          <IconCaretRight aria-hidden="true" className="size-5 shrink-0" />
        </Button>
      ))}
    </nav>
  );
}

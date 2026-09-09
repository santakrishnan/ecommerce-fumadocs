import { ScrollArea, Skeleton } from "@ucmp/ui";
import type { ReactNode } from "react";

/**
 * Profile route group layout.
 *
 * Mobile/tablet (< xl): Member ID card above content, ProfileNav below content.
 * Desktop (xl+, ≥1280px): two-column grid with sticky left sidebar + scrollable right column.
 *
 * Sticky offset uses the --nav-height token so it stays in sync if the
 * header height ever changes.
 *
 * Vertical padding (38px top, 120px bottom) is applied at the layout container
 * so both sidebar and main content share the same vertical rhythm.
 */
export default function ProfileComparisonLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* sidebar */}
      <div className="hidden lg:col-span-2 lg:block">
        <aside className="hidden lg:sticky lg:top-(--nav-height,7.5rem) lg:block lg:h-[calc(100dvh-var(--nav-height,7.5rem))]">
          <ScrollArea className="h-full">
            {/*TODO Add left rail content here*/}
            <Skeleton className="h-58.5" />
          </ScrollArea>
        </aside>
      </div>

      {/* body */}
      <section className="col-span-full lg:col-span-9 lg:col-start-4">{children}</section>
    </>
  );
}

import { COMPARE_SECTIONS, CompareNavigation } from "@features/compare";
import type { ReactNode } from "react";

export default function ProfileWatchlistLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* no self-start — grid area = full content column height so position:sticky has room to work */}
      <aside className="hidden lg:sticky lg:top-(--nav-height,7.5rem) lg:col-span-3 lg:flex lg:h-[calc(100dvh-var(--nav-height,7.5rem))] lg:flex-col lg:gap-6 lg:overflow-y-auto">
        <h1 className="h1">Compare</h1>
        <CompareNavigation sections={COMPARE_SECTIONS} />
      </aside>

      <section className="col-span-full lg:col-span-9 lg:col-start-4">{children}</section>
    </>
  );
}

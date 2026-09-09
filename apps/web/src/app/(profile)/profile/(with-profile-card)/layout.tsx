import { MemberIdCard, MemberIdCardWrapper, ProfileNav, ProfileSidebar } from "@features/profile";
import { ScrollArea } from "@ucmp/ui";
import type { ReactNode } from "react";
import { Suspense } from "react";

/**
 * Profile route group layout.
 *
 * Mobile/tablet (< lg): Member ID card above content, ProfileNav below content.
 * Desktop (lg+, >= 1024px): sticky left sidebar + right content rail.
 */
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Left rail sidebar (desktop only). */}
      <aside className="hidden lg:sticky lg:top-(--nav-height,7.5rem) lg:col-span-3 lg:block lg:h-[calc(100dvh-var(--nav-height,7.5rem))]">
        <ScrollArea className="h-full">
          <ProfileSidebar />
        </ScrollArea>
      </aside>

      {/* Right rail content uses parent PageGrid columns via subgrid. */}
      <section className="col-span-full grid grid-cols-subgrid lg:col-span-8 lg:col-start-5">
        {/* Mobile/tablet: Member ID card above content */}
        <div className="col-span-full mb-12 md:col-span-4 md:col-start-3 md:mb-14 lg:hidden">
          <Suspense fallback={<MemberIdCard />}>
            <MemberIdCardWrapper />
          </Suspense>
        </div>

        <section className="col-span-full grid grid-cols-subgrid gap-y-12 md:gap-y-14 lg:gap-y-18">
          {children}
        </section>

        {/* Mobile/tablet: Profile nav below content, above footer */}
        <div className="col-span-full mt-12 md:mt-14 lg:hidden">
          <ProfileNav />
        </div>
      </section>
    </>
  );
}

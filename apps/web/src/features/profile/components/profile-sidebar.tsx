import { Suspense } from "react";
import { MemberIdCard } from "./member-id-card";
import { MemberIdCardWrapper } from "./member-id-card-wrapper";
import { ProfileNav } from "./profile-nav";

/**
 * Profile left sidebar composition.
 *
 * Combines the Member ID card and the profile navigation links.
 * Desktop height: 631px (39.4375rem) per Figma wireframe.
 * Height is inherited from parent on mobile/tablet (h-full fallback).
 */
export function ProfileSidebar() {
  return (
    <div className="flex h-full flex-col justify-between lg:h-157.75">
      <Suspense fallback={<MemberIdCard />}>
        <MemberIdCardWrapper />
      </Suspense>
      <ProfileNav />
    </div>
  );
}

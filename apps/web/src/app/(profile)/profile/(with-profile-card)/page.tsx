import { ProfilePageContent } from "@features/profile";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfilePageSkeleton } from "./profile-page-skeleton";

/**
 * Profile page.
 *
 * Synchronous page export (PPR shell pattern). Each section is wrapped
 * in a <ProfileSection> container and a <Suspense> boundary with a
 * section-specific skeleton fallback.
 *
 * The AppointmentSection returns null for T1 visitors (no appointments).
 *
 * 32px gap between all sections (gap-8) for all screen resolutions.
 */
export const metadata: Metadata = {
  title: "Profile",
};

interface ProfilePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function ProfilePage({ searchParams }: ProfilePageProps) {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePageContent searchParams={searchParams} />
    </Suspense>
  );
}

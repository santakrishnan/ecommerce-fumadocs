import { LegalPage, PRIVACY_NOTICE } from "@features/legal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Privacy Rights | Toyota",
  description:
    "Learn how Toyota collects, uses, and protects your personal information. Read our complete Privacy Notice and understand your privacy rights.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      lastUpdated={PRIVACY_NOTICE.lastUpdated}
      sectionHeading={PRIVACY_NOTICE.sectionHeading}
      sections={PRIVACY_NOTICE.sections}
      title={PRIVACY_NOTICE.title}
      updatedLabel={PRIVACY_NOTICE.updatedLabel}
    />
  );
}

import { Footer } from "@layout/footer";
import { Header } from "@layout/header";
import { PageGrid } from "@/components";

export default function ProfileGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr_auto] bg-surface-secondary"
      style={{ gridTemplateAreas: '"header" "body" "footer"' }}
    >
      <Header locationSlot={null} />
      <PageGrid
        as="main"
        className="w-full bg-surface-secondary pt-24 pb-18 lg:pt-30 lg:pb-30"
        style={{ gridArea: "body" }}
      >
        {children}
      </PageGrid>
      <Footer />
    </div>
  );
}

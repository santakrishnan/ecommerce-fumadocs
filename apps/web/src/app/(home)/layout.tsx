import { Footer } from "@layout/footer";
import { Header } from "@layout/header";
import { PageGrid } from "@/components";

export default function HomeGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr_auto] bg-surface-secondary"
      style={{ gridTemplateAreas: '"header" "body" "footer"' }}
    >
      <Header />
      <PageGrid
        as="main"
        className="w-full gap-y-16 overflow-x-clip bg-surface-secondary pt-24 pb-16 lg:gap-y-20 lg:pt-30 lg:pb-20"
        style={{ gridArea: "body" }}
      >
        {children}
      </PageGrid>
      <Footer />
    </div>
  );
}

import { Footer } from "@layout/footer";

export default function SearchResultsAllLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-surface-secondary"
      />

      <div className="relative w-full bg-surface-secondary">
        {children}
        <div className="animate-srp-footer-in">
          <Footer />
        </div>
      </div>
    </>
  );
}

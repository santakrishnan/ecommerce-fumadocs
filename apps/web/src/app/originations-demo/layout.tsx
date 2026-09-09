export default function OriginationsDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-secondary">
      <div className="mx-auto max-w-3xl px-6 py-12">{children}</div>
    </div>
  );
}

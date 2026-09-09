/**
 * Welcome-back sub-layout — passthrough.
 *
 * The group-level (home)/layout.tsx now provides the full structural context
 * (grid + PageGrid + Header/Footer), so this layout simply renders children.
 */
export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

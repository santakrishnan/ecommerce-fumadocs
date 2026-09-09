import type { ComponentType, ReactNode } from "react";

type Provider = ComponentType<{ children: ReactNode }>;

/**
 * Composes multiple context providers into a single wrapper component,
 * eliminating deep nesting in layout files.
 *
 * Providers are applied outermost-first (left-to-right):
 *   composeProviders(A, B, C) → <A><B><C>{children}</C></B></A>
 */
export function composeProviders(...providers: Provider[]) {
  return function ComposedProviders({ children }: { children: ReactNode }) {
    return providers.reduceRight<ReactNode>(
      (acc, Provider) => <Provider key={Provider.displayName ?? Provider.name}>{acc}</Provider>,
      children
    );
  };
}

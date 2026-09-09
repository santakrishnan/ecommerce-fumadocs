import { Card, CardContent } from "@ucmp/ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "utils";

export interface PanelCardProps extends Omit<ComponentProps<typeof Card>, "children"> {
  children: ReactNode;
  className?: string;
}

/**
 * PanelCard — a translucent dark card shell built on the Card primitive.
 *
 * Provides:
 * - Rounded corners (rounded-2xl)
 * - Dark translucent background via `bg-card-dark` (black @ 70%)
 * - Always dark surface (`data-surface="dark"`) for descendant token resolution
 *
 * Use this as the base for any floating overlay card that needs a
 * frosted-glass appearance (e.g. PurchaseCard, SoldCtaCard).
 */
export function PanelCard({ children, className, ...rest }: PanelCardProps) {
  return (
    <Card
      className={cn("rounded-2xl bg-card-dark text-text-primary shadow-none ring-0", className)}
      data-slot="panel-card"
      data-surface="dark"
      {...rest}
    >
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

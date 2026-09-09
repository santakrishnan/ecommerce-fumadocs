import type Link from "next/link";
import type { ComponentProps } from "react";

/**
 * All valid Next.js `<Link>` props except `children` (managed by the card).
 *
 * Passed as the `linkProps` bag to any card that supports navigation.
 * The bag is spread directly onto the underlying `<Link>` element.
 *
 * `href` is required — it's what makes the card navigable.
 */
export type CardLinkProps = Omit<ComponentProps<typeof Link>, "children">;

/**
 * All valid HTML `<button>` props except `children` and `type`
 * (managed by the card, always `"button"`).
 *
 * Passed as the `buttonProps` bag to any card that supports click actions.
 * The bag is spread directly onto the underlying `<button>` element.
 *
 * Use when clicking the card should trigger an action (e.g. submit a search
 * turn, open a modal) without navigating to a new page.
 *
 * Mutually exclusive with `linkProps` — a card is either navigable or
 * interactive, not both.
 */
export type CardButtonProps = Omit<ComponentProps<"button">, "children" | "type">;

/**
 * @deprecated Use `CardButtonProps` instead. Will be removed in a future release.
 */
export type CardActionProps = CardButtonProps;

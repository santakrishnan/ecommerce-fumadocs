import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@ucmp/ui";
import { IconCaretRight, IconToyotaX } from "@ucmp/ui/icons";
import Image from "next/image";
import Link from "next/link";

/** Props for a single prompt suggestion card. */
export interface PromptSuggestionCardProps {
  /** Route the card navigates to when clicked. */
  href: string;
  /** Unique identifier used as the React key. */
  id: string;
  /** Alt text for the thumbnail image. */
  imageAlt?: string;
  /** URL for the thumbnail image. If omitted, a gray placeholder renders. */
  imageSrc?: string;
  /** Click handler — when provided, intercepts default link navigation. */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Show the Toyota spark icon before the subtitle. */
  showSpark?: boolean;
  /** Muted subtitle text displayed below the title. */
  subtitle: string;
  /** Primary bold title text. */
  title: string;
}

/**
 * Prompt suggestion card — renders a clickable, routable card
 * with a thumbnail, title, subtitle, and chevron.
 *
 * Built on the shadcn `<Item>` primitive with Base UI's `render` prop
 * for polymorphic link rendering.
 *
 * - Server Component — no "use client" directive.
 * - Keyboard accessible via the underlying `<a>` tag (Tab + Enter).
 * - Uses `next/link` for client-side navigation.
 * - `role="listitem"` is required because `<ItemGroup>` (role="list")
 *   does not automatically assign listitem role to its children.
 */
export function PromptSuggestionCard({
  href,
  imageSrc,
  imageAlt = "",
  onClick,
  showSpark = false,
  title,
  subtitle,
}: PromptSuggestionCardProps) {
  return (
    <Item
      className="[a]:transition-none [a]:hover:bg-white/20"
      render={<Link href={href} onClick={onClick} />}
      role="listitem"
    >
      <ItemMedia className="relative" variant="image">
        {imageSrc ? (
          <>
            <Image
              alt={imageAlt}
              className="size-full object-cover"
              height={72}
              src={imageSrc}
              width={72}
            />
            <div aria-hidden="true" className="absolute inset-0 rounded-lg bg-black/20" />
          </>
        ) : (
          <div aria-hidden="true" className="size-full rounded-lg bg-neutral-600" />
        )}
      </ItemMedia>
      <ItemContent className="gap-2">
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription className="gap-2">
          {showSpark && <IconToyotaX className="size-3.5" />}
          <span>{subtitle}</span>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <IconCaretRight className="size-5" />
      </ItemActions>
    </Item>
  );
}

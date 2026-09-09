"use client";

import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@ucmp/ui";
import { IconCaretRight } from "@ucmp/ui/icons";
import Image from "next/image";

/**
 * An Item element rendered using the @ucmp/ui Item compound component.
 * Mirrors the Item component props needed for the originations context.
 */
export interface ItemElement {
  description?: string;
  id: string;
  mediaAlt?: string;
  mediaUrl?: string;
  /** Optional click handler — e.g. to submit the selection / advance the step. */
  onClick?: () => void;
  title: string;
  type: "item";
}

type OptionItemProps = Omit<ItemElement, "type">;

/**
 * Standalone option Item element for origination steps.
 *
 * Wraps @ucmp/ui Item compound component to render selectable options
 * in the origination flow (e.g. "Finance" vs "Pay in full").
 */
export function OptionItem({
  id,
  title,
  description,
  mediaUrl,
  mediaAlt,
  onClick,
}: OptionItemProps) {
  return (
    <Item
      className="px-8 py-10"
      data-element-id={id}
      onClick={onClick}
      render={<button type="button" />}
      surface="light"
    >
      {mediaUrl && (
        <ItemMedia variant="image">
          <Image alt={mediaAlt ?? title} height={72} src={mediaUrl} width={72} />
        </ItemMedia>
      )}
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        {description && <ItemDescription>{description}</ItemDescription>}
      </ItemContent>
      <ItemActions>
        <IconCaretRight className="size-5" />
      </ItemActions>
    </Item>
  );
}

"use client";

import { ItemGroup } from "@ucmp/ui";
import type { ItemElement } from "./option-item";
import { OptionItem } from "./option-item";

interface OptionItemGroupProps {
  items: ItemElement[];
}

/**
 * Standalone ItemGroup element for origination steps.
 * Wraps multiple OptionItem components in an @ucmp/ui ItemGroup
 * for consistent spacing and logical grouping.
 */
export function OptionItemGroup({ items }: OptionItemGroupProps) {
  return (
    <ItemGroup className="gap-2">
      {items.map((item) => (
        <OptionItem
          description={item.description}
          id={item.id}
          key={item.id}
          mediaAlt={item.mediaAlt}
          mediaUrl={item.mediaUrl}
          onClick={item.onClick}
          title={item.title}
        />
      ))}
    </ItemGroup>
  );
}
